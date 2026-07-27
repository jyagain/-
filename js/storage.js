/**
 * storage.js
 * 로컬 스토리지를 관리하는 모듈입니다.
 * 입력 작성 중 자동 저장(Draft), 완료된 오답 문제 CRUD, 그리고 학습 통계를 위한 데이터 집계를 담당합니다.
 */

const StorageManager = {
  KEYS: {
    DRAFT: 'twin_portal_draft',
    PROBLEMS: 'twin_portal_problems',
    SETTINGS: 'twin_portal_settings'
  },

  // --- 작성 중 임시 저장 (Draft) 관련 ---
  
  /**
   * 입력 폼의 상태를 실시간으로 저장합니다.
   * @param {Object} draftData - 폼 입력 값 객체
   */
  saveDraft(draftData) {
    try {
      localStorage.setItem(this.KEYS.DRAFT, JSON.stringify(draftData));
    } catch (e) {
      console.error('임시 저장 중 오류가 발생했습니다:', e);
    }
  },

  /**
   * 저장되어 있는 임시 데이터를 가져옵니다.
   * @returns {Object|null}
   */
  getDraft() {
    try {
      const draft = localStorage.getItem(this.KEYS.DRAFT);
      return draft ? JSON.parse(draft) : null;
    } catch (e) {
      console.error('임시 저장을 불러오는 중 오류가 발생했습니다:', e);
      return null;
    }
  },

  /**
   * 임시 데이터를 삭제합니다. (오답 저장이 완료되었을 때 호출)
   */
  clearDraft() {
    localStorage.removeItem(this.KEYS.DRAFT);
  },

  // --- 저장된 오답 문제 CRUD 관련 ---

  /**
   * 저장된 모든 오답 문제 목록을 가져옵니다. (기본값: 최신순 정렬)
   * @returns {Array<Object>}
   */
  getProblems() {
    try {
      const data = localStorage.getItem(this.KEYS.PROBLEMS);
      if (!data) return [];
      const problems = JSON.parse(data);
      // 생성일(createdAt) 기준 역순 정렬
      return problems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('오답 목록을 불러오는 중 오류가 발생했습니다:', e);
      return [];
    }
  },

  /**
   * 특정 ID의 오답 문제를 조회합니다.
   * @param {string} id 
   * @returns {Object|null}
   */
  getProblem(id) {
    const problems = this.getProblems();
    return problems.find(p => p.id === id) || null;
  },

  /**
   * 새로운 오답 문제를 저장합니다.
   * @param {Object} problemData - 저장할 오답 정보
   * @returns {Object} 저장 완료된 데이터 객체
   */
  saveProblem(problemData) {
    const problems = this.getProblems();
    
    const newProblem = {
      id: 'prob_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...problemData
    };
    
    problems.push(newProblem);
    localStorage.setItem(this.KEYS.PROBLEMS, JSON.stringify(problems));
    return newProblem;
  },

  /**
   * 특정 ID의 오답 문제를 수정합니다.
   * @param {string} id 
   * @param {Object} updatedFields - 수정할 필드들
   * @returns {boolean} 성공 여부
   */
  updateProblem(id, updatedFields) {
    const problems = this.getProblems();
    const index = problems.findIndex(p => p.id === id);
    if (index === -1) return false;

    problems[index] = {
      ...problems[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.KEYS.PROBLEMS, JSON.stringify(problems));
    return true;
  },

  /**
   * 특정 ID의 오답 문제를 삭제합니다.
   * @param {string} id 
   * @returns {boolean} 성공 여부
   */
  deleteProblem(id) {
    let problems = this.getProblems();
    const initialLength = problems.length;
    problems = problems.filter(p => p.id !== id);
    
    if (problems.length === initialLength) return false;
    
    localStorage.setItem(this.KEYS.PROBLEMS, JSON.stringify(problems));
    return true;
  },

  // --- 학습 통계 계산 ---

  /**
   * 로컬 스토리지 데이터를 바탕으로 대시보드 통계 값을 집계합니다.
   * @returns {Object} 통계 결과 객체
   */
  getStatistics() {
    const problems = this.getProblems();
    
    let totalEntered = problems.length;
    let totalGenerated = 0;
    let conceptCounts = {};
    let lastActiveDate = '학습 기록 없음';
    let difficultyDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let reasonDist = {
      '계산실수': 0,
      '공식암기 부족': 0,
      '개념 이해 부족': 0,
      '문제 해석 실패': 0,
      '단순 실수': 0,
      '기타': 0
    };

    if (problems.length > 0) {
      // 1. 최근 학습일 구하기 (가장 최근에 생성/수정한 날짜)
      const dates = problems.map(p => new Date(p.updatedAt || p.createdAt));
      const latestDate = new Date(Math.max(...dates));
      
      const year = latestDate.getFullYear();
      const month = String(latestDate.getMonth() + 1).padStart(2, '0');
      const day = String(latestDate.getDate()).padStart(2, '0');
      lastActiveDate = `${year}-${month}-${day}`;

      problems.forEach(p => {
        // 2. 쌍둥이 문제 생성 횟수 누적
        if (p.twins && Array.isArray(p.twins)) {
          totalGenerated += p.twins.length;
        }

        // 3. 단원별 오답 횟수 집계
        const concept = p.concept || p.chapter || '미지정 단원';
        conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;

        // 4. 난이도 분포 집계
        const diff = Number(p.difficulty) || 3;
        if (difficultyDist[diff] !== undefined) {
          difficultyDist[diff]++;
        }

        // 5. 틀린 이유 분포 집계
        if (p.reasons && Array.isArray(p.reasons)) {
          p.reasons.forEach(r => {
            if (reasonDist[r] !== undefined) {
              reasonDist[r]++;
            } else {
              // 기타 카테고리에 포함되거나 신규 카테고리인 경우 처리
              reasonDist['기타']++;
            }
          });
        }
      });
    }

    // 6. 가장 많이 틀린 단원 추출
    let mostIncorrectConcept = '기록 없음';
    let maxConceptCount = 0;
    for (const [concept, count] of Object.entries(conceptCounts)) {
      if (count > maxConceptCount) {
        maxConceptCount = count;
        mostIncorrectConcept = concept;
      }
    }
    if (maxConceptCount > 0) {
      mostIncorrectConcept = `${mostIncorrectConcept} (${maxConceptCount}회)`;
    }

    return {
      totalEntered,
      totalGenerated,
      mostIncorrectConcept,
      lastActiveDate,
      difficultyDist,
      reasonDist,
      conceptCounts
    };
  },

  // --- 설정 관련 ---
  
  /**
   * 사용자 설정 정보를 저장합니다.
   * @param {Object} settings 
   */
  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  /**
   * 사용자 설정 정보를 가져옵니다.
   * @returns {Object}
   */
  getSettings() {
    const defaultSettings = {
      studentName: '학생',
      schoolLevel: '중등수학',
      grade: '1',
      dailyGoal: '3'
    };
    try {
      const data = localStorage.getItem(this.KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  }
};
