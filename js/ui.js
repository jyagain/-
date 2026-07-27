/**
 * ui.js
 * 화면 인터랙션, 뷰 탭 전환, 동적 문제 카드 빌더,
 * 그리고 외부 라이브러리 없는 Canvas API 차트 드로잉을 전담합니다.
 */

const UIManager = {
  activeView: 'view-entry',
  currentAnalysis: null, // 최근 분석 결과 저장용 임시 상태
  currentTwins: [],      // 최근 생성된 쌍둥이 문제 임시 상태

  /**
   * UI 모듈 초기화 및 이벤트 연결
   */
  init() {
    this.bindNavigation();
    this.bindSubjectGradeLogic();
    this.bindDraftAutoSave();
    this.bindFormActions();
    this.bindSearchAndSavedList();
    this.bindSettings();
    this.restoreDraft();
    
    // 모바일 사이드바 토글 바인딩
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });
      
      // 메뉴 클릭시 사이드바 닫기 (모바일 환경)
      document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
          sidebar.classList.remove('active');
        });
      });
    }

    // 초기화 시 배지 세팅
    this.updateStudentHeaderBadge();
  },

  // ==========================================
  // 1. 네비게이션 및 뷰 스위칭
  // ==========================================
  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = item.getAttribute('data-target');
        if (!target) return;

        // 메뉴 활성화 상태 관리
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // 섹션 스위칭
        document.querySelectorAll('.view-section').forEach(sec => {
          sec.classList.add('hidden');
        });
        const activeSection = document.getElementById(target);
        if (activeSection) {
          activeSection.classList.remove('hidden');
        }

        this.activeView = target;

        // 특정 뷰 활성화 시 추가 로직 실행
        if (target === 'view-saved') {
          this.renderSavedProblems();
        } else if (target === 'view-stats') {
          this.renderStatistics();
        } else if (target === 'view-settings') {
          this.loadSettingsForm();
        }
      });
    });
  },

  updateStudentHeaderBadge() {
    const settings = StorageManager.getSettings();
    const badgeText = document.querySelector('.student-badge span');
    if (badgeText) {
      badgeText.textContent = `${settings.studentName} 학생 (${settings.schoolLevel})`;
    }
  },

  // ==========================================
  // 2. 학년 드롭다운 동적 구성
  // ==========================================
  bindSubjectGradeLogic() {
    const subjectSelect = document.getElementById('subject');
    const gradeSelect = document.getElementById('grade');

    if (subjectSelect && gradeSelect) {
      subjectSelect.addEventListener('change', () => {
        this.updateGradeDropdown(subjectSelect.value, '1');
      });
    }
  },

  updateGradeDropdown(subject, selectedValue) {
    const gradeSelect = document.getElementById('grade');
    if (!gradeSelect) return;

    gradeSelect.innerHTML = '';
    
    let maxGrade = 3;
    let labelSuffix = '학년';
    
    if (subject === '초등수학') {
      maxGrade = 6;
    }

    for (let i = 1; i <= maxGrade; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${i}${labelSuffix}`;
      if (String(i) === String(selectedValue)) {
        opt.selected = true;
      }
      gradeSelect.appendChild(opt);
    }
  },

  // ==========================================
  // 3. 실시간 자동 저장 (Draft) 핸들러
  // ==========================================
  bindDraftAutoSave() {
    const form = document.getElementById('entry-form');
    if (!form) return;

    // input, change, keyup 감지하여 자동 임시저장 수행
    const triggerSave = () => {
      const draftData = this.getFormData();
      StorageManager.saveDraft(draftData);
      this.showAutoSaveIndicator();
    };

    form.querySelectorAll('.input-control').forEach(el => {
      el.addEventListener('input', triggerSave);
      el.addEventListener('change', triggerSave);
    });

    form.querySelectorAll('input[type="checkbox"]').forEach(el => {
      el.addEventListener('change', (e) => {
        // 체크박스 클릭 디자인 토글
        const label = e.target.closest('.checkbox-label');
        if (label) {
          label.classList.toggle('checked', e.target.checked);
        }
        triggerSave();
      });
    });

    // 난이도 슬라이더 실시간 배지 피드백
    const diffSlider = document.getElementById('difficulty');
    const diffBadge = document.getElementById('difficulty-badge-text');
    if (diffSlider && diffBadge) {
      diffSlider.addEventListener('input', () => {
        diffBadge.textContent = `${diffSlider.value}단계`;
        triggerSave();
      });
    }
  },

  getFormData() {
    const subject = document.getElementById('subject')?.value || '초등수학';
    const grade = document.getElementById('grade')?.value || '1';
    const chapter = document.getElementById('chapter')?.value || '';
    const difficulty = document.getElementById('difficulty')?.value || '3';
    const originalText = document.getElementById('originalText')?.value || '';
    const myAnswer = document.getElementById('myAnswer')?.value || '';
    const correctAnswer = document.getElementById('correctAnswer')?.value || '';
    
    const reasons = [];
    document.querySelectorAll('input[name="reasons"]:checked').forEach(cb => {
      reasons.push(cb.value);
    });

    return { subject, grade, chapter, difficulty, originalText, myAnswer, correctAnswer, reasons };
  },

  restoreDraft() {
    const draft = StorageManager.getDraft();
    if (!draft) {
      // 기본 드롭다운 설정
      this.updateGradeDropdown('초등수학', '1');
      return;
    }

    if (document.getElementById('subject')) document.getElementById('subject').value = draft.subject;
    
    // 과목 복구에 따른 학년 리스트 동적 구성 후 복구
    this.updateGradeDropdown(draft.subject, draft.grade);

    if (document.getElementById('chapter')) document.getElementById('chapter').value = draft.chapter;
    
    const diffSlider = document.getElementById('difficulty');
    const diffBadge = document.getElementById('difficulty-badge-text');
    if (diffSlider) {
      diffSlider.value = draft.difficulty;
      if (diffBadge) diffBadge.textContent = `${draft.difficulty}단계`;
    }

    if (document.getElementById('originalText')) document.getElementById('originalText').value = draft.originalText;
    if (document.getElementById('myAnswer')) document.getElementById('myAnswer').value = draft.myAnswer;
    if (document.getElementById('correctAnswer')) document.getElementById('correctAnswer').value = draft.correctAnswer;

    // 체크박스 복원
    document.querySelectorAll('input[name="reasons"]').forEach(cb => {
      const isChecked = draft.reasons && draft.reasons.includes(cb.value);
      cb.checked = isChecked;
      const label = cb.closest('.checkbox-label');
      if (label) {
        label.classList.toggle('checked', isChecked);
      }
    });
  },

  showAutoSaveIndicator() {
    const indicator = document.getElementById('autosave-text');
    if (!indicator) return;

    indicator.textContent = '작성 중 실시간 저장 중...';
    indicator.parentElement.classList.remove('saved');

    // 디바운싱 효과 가미
    if (this.autosaveTimeout) clearTimeout(this.autosaveTimeout);
    this.autosaveTimeout = setTimeout(() => {
      indicator.textContent = '작성 내용 자동 저장 완료';
      indicator.parentElement.classList.add('saved');
    }, 800);
  },

  // ==========================================
  // 4. 오답 분석 및 쌍둥이 문제 생성 폼 상호작용
  // ==========================================
  bindFormActions() {
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnGenerate = document.getElementById('btn-generate');
    const btnSaveProblem = document.getElementById('btn-save-problem');
    const btnResetForm = document.getElementById('btn-reset-form');

    if (btnAnalyze) {
      btnAnalyze.addEventListener('click', () => {
        const data = this.getFormData();
        if (!data.originalText.trim()) {
          alert('원본 문제를 입력해 주세요.');
          return;
        }
        
        // 규칙 기반 분석 수행
        const analysis = ProblemAnalyzer.analyze(data);
        this.currentAnalysis = analysis;

        // 분석 결과 렌더링
        document.getElementById('res-concept').textContent = analysis.concept;
        document.getElementById('res-cause').textContent = analysis.cause;
        document.getElementById('res-recommendation').textContent = analysis.recommendation;

        const resultBox = document.getElementById('analysis-result-box');
        if (resultBox) {
          resultBox.classList.remove('hidden');
          // 부드러운 스크롤 이동
          resultBox.scrollIntoView({ behavior: 'smooth' });
        }

        // 쌍둥이 생성 제어판 보이기
        const twinBox = document.getElementById('twin-options-box');
        if (twinBox) twinBox.classList.remove('hidden');

        // 대기 상태 플레이스홀더 숨기기
        const placeholder = document.getElementById('generation-placeholder');
        if (placeholder) placeholder.classList.add('hidden');
      });
    }

    // 생성 개수 버튼 제어
    const countBtns = document.querySelectorAll('.count-btn');
    countBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        countBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    if (btnGenerate) {
      btnGenerate.addEventListener('click', () => {
        if (!this.currentAnalysis) {
          alert('먼저 오답 분석을 진행해 주세요.');
          return;
        }

        const data = this.getFormData();
        const activeCountBtn = document.querySelector('.count-btn.active');
        const count = activeCountBtn ? parseInt(activeCountBtn.getAttribute('data-value')) : 3;

        const options = {
          changeNumbers: document.getElementById('opt-num')?.checked || false,
          changeConditions: document.getElementById('opt-cond')?.checked || false,
          changeSentence: document.getElementById('opt-sentence')?.checked || false,
          difficultyUp: document.getElementById('opt-diff-up')?.checked || false,
          difficultyDown: document.getElementById('opt-diff-down')?.checked || false,
          random: document.getElementById('opt-random')?.checked || false,
          count: count
        };

        // 분석된 개념을 데이터 객체에 합산해 넘김
        const problemForGenerator = {
          ...data,
          concept: this.currentAnalysis.concept
        };

        // 쌍둥이 문제 생성
        const twins = TwinGenerator.generate(problemForGenerator, options);
        this.currentTwins = twins;

        // 문제 렌더링
        this.renderGeneratedTwins(twins);
      });
    }

    // 최하단 통합 저장 버튼
    if (btnSaveProblem) {
      btnSaveProblem.addEventListener('click', () => {
        if (!this.currentAnalysis) {
          alert('분석을 먼저 완료해야 저장이 가능합니다.');
          return;
        }

        const data = this.getFormData();
        const problemToSave = {
          ...data,
          concept: this.currentAnalysis.concept,
          analysis: this.currentAnalysis,
          twins: this.currentTwins
        };

        StorageManager.saveProblem(problemToSave);
        StorageManager.clearDraft(); // 저장 시 Draft 초기화
        
        alert('오답 데이터와 쌍둥이 문제가 성공적으로 저장되었습니다!');
        
        // 입력 폼 초기화 및 탭 이동
        this.resetEntryForm();
        document.querySelector('[data-target="view-saved"]').click();
      });
    }

    if (btnResetForm) {
      btnResetForm.addEventListener('click', () => {
        if (confirm('작성 중인 내용을 모두 지우고 초기화하시겠습니까?')) {
          this.resetEntryForm();
        }
      });
    }
  },

  resetEntryForm() {
    const form = document.getElementById('entry-form');
    if (form) form.reset();
    
    // 임시 저장 삭제
    StorageManager.clearDraft();
    this.restoreDraft(); // 빈 상태로 리셋

    // 분석 박스 및 생성 제어판 숨김
    document.getElementById('analysis-result-box')?.classList.add('hidden');
    document.getElementById('twin-options-box')?.classList.add('hidden');
    document.getElementById('generation-placeholder')?.classList.remove('hidden');
    document.getElementById('twin-results-container').innerHTML = '';
    
    this.currentAnalysis = null;
    this.currentTwins = [];
  },

  /**
   * 생성된 쌍둥이 문제 카드 렌더링
   */
  renderGeneratedTwins(twins) {
    const container = document.getElementById('twin-results-container');
    container.innerHTML = '';

    if (!twins || twins.length === 0) {
      container.innerHTML = '<div class="no-data"><p>생성된 문제가 없습니다.</p></div>';
      return;
    }

    // 헤더 타이틀 생성
    const title = document.createElement('h4');
    title.className = 'chart-title';
    title.style.margin = '20px 0 16px 0';
    title.textContent = `생성 완료된 쌍둥이 문제 (${twins.length}개)`;
    container.appendChild(title);

    twins.forEach((twin, idx) => {
      const card = document.createElement('div');
      card.className = 'card problem-card';
      
      card.innerHTML = `
        <div class="problem-header">
          <span class="problem-num">쌍둥이 문제 ${idx + 1}</span>
        </div>
        <div class="problem-text">${this.escapeHTML(twin.question)}</div>
        
        <div class="collapsible-container">
          <button class="collapsible-btn" onclick="UIManager.toggleCollapse(this)">
            정답 보기
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div class="collapsible-content">
            <pre style="font-weight:700;color:var(--primary);">${this.escapeHTML(twin.answer)}</pre>
          </div>
          
          <button class="collapsible-btn" onclick="UIManager.toggleCollapse(this)">
            풀이 과정 보기
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div class="collapsible-content">
            <pre>${this.escapeHTML(twin.solution)}</pre>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // 전체 저장 박스 노출
    document.getElementById('save-action-box')?.classList.remove('hidden');
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  /**
   * 접기/펼치기 제어 헬퍼
   */
  toggleCollapse(btn) {
    const content = btn.nextElementSibling;
    content.classList.toggle('expanded');
    
    // 아이콘 회전 연출
    const svg = btn.querySelector('svg');
    if (svg) {
      if (content.classList.contains('expanded')) {
        svg.style.transform = 'rotate(180deg)';
      } else {
        svg.style.transform = 'rotate(0deg)';
      }
      svg.style.transition = 'transform 0.2s';
    }
  },

  // ==========================================
  // 5. 저장한 문제 검색 & 로드 & 삭제
  // ==========================================
  bindSearchAndSavedList() {
    const searchInput = document.getElementById('search-query');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderSavedProblems(searchInput.value);
      });
    }
  },

  renderSavedProblems(query = '') {
    const container = document.getElementById('saved-problems-list');
    if (!container) return;

    container.innerHTML = '';
    const problems = StorageManager.getProblems();

    // 필터링 적용
    const filtered = problems.filter(p => {
      const q = query.toLowerCase().trim();
      if (!q) return true;
      return (
        p.chapter.toLowerCase().includes(q) ||
        p.concept.toLowerCase().includes(q) ||
        p.originalText.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q)
      );
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="no-data">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25v-4.5a2.25 2.25 0 012.25-2.25z" />
          </svg>
          <p>${query ? '검색 결과에 맞는 문제가 없습니다.' : '저장된 오답 문제가 없습니다. 첫 오답 문제를 입력해 보세요!'}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(p => {
      const item = document.createElement('div');
      item.className = 'saved-problem-item';
      
      const reasonsFormatted = p.reasons && p.reasons.length > 0 ? p.reasons.join(', ') : '미지정';
      const dateFormatted = new Date(p.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      item.innerHTML = `
        <div class="saved-item-header">
          <div class="saved-badges">
            <span class="badge badge-subject">${p.subject} (${p.grade}학년)</span>
            <span class="badge badge-chapter">${p.concept || p.chapter}</span>
            <span class="badge badge-difficulty">난이도 ${p.difficulty}단계</span>
          </div>
          <span class="saved-date">${dateFormatted}</span>
        </div>
        <div class="saved-item-body">
          <div class="saved-item-text" style="font-weight:700;margin-bottom:6px;">[원본 문제]</div>
          <div class="saved-item-text" style="color:var(--text-main);">${this.escapeHTML(p.originalText)}</div>
          <div class="saved-item-text" style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">
            <strong>틀린 오답:</strong> ${this.escapeHTML(p.myAnswer || '없음')} | 
            <strong>실제 정답:</strong> ${this.escapeHTML(p.correctAnswer || '없음')} | 
            <strong>원인:</strong> ${reasonsFormatted}
          </div>
        </div>
        <div class="saved-item-actions">
          <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="UIManager.loadIntoGenerator('${p.id}')">쌍둥이 재생성</button>
          <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="UIManager.openEditModal('${p.id}')">수정</button>
          <button class="btn btn-danger" style="padding: 6px 12px; font-size: 0.8rem; background-color:#fee2e2; color:#ef4444; border:1px solid #fecaca;" onclick="UIManager.deleteProblem('${p.id}')">삭제</button>
        </div>
      `;
      container.appendChild(item);
    });
  },

  deleteProblem(id) {
    if (confirm('이 오답 데이터와 생성된 쌍둥이 기록을 정말 삭제하시겠습니까?')) {
      StorageManager.deleteProblem(id);
      this.renderSavedProblems(document.getElementById('search-query')?.value || '');
    }
  },

  /**
   * 저장된 오답 데이터를 다시 생성기 탭으로 불러오기
   */
  loadIntoGenerator(id) {
    const p = StorageManager.getProblem(id);
    if (!p) return;

    // 오답 입력 폼에 바인딩
    if (document.getElementById('subject')) document.getElementById('subject').value = p.subject;
    this.updateGradeDropdown(p.subject, p.grade);
    
    if (document.getElementById('chapter')) document.getElementById('chapter').value = p.chapter;
    const diffSlider = document.getElementById('difficulty');
    const diffBadge = document.getElementById('difficulty-badge-text');
    if (diffSlider) {
      diffSlider.value = p.difficulty;
      if (diffBadge) diffBadge.textContent = `${p.difficulty}단계`;
    }

    if (document.getElementById('originalText')) document.getElementById('originalText').value = p.originalText;
    if (document.getElementById('myAnswer')) document.getElementById('myAnswer').value = p.myAnswer;
    if (document.getElementById('correctAnswer')) document.getElementById('correctAnswer').value = p.correctAnswer;

    document.querySelectorAll('input[name="reasons"]').forEach(cb => {
      const isChecked = p.reasons && p.reasons.includes(cb.value);
      cb.checked = isChecked;
      const label = cb.closest('.checkbox-label');
      if (label) label.classList.toggle('checked', isChecked);
    });

    // 탭을 '오답 입력'으로 강제 전환 후 분석 자동 실행
    document.querySelector('[data-target="view-entry"]').click();
    document.getElementById('btn-analyze').click();
  },

  // ==========================================
  // 6. 저장 데이터 수정 모달
  // ==========================================
  openEditModal(id) {
    const p = StorageManager.getProblem(id);
    if (!p) return;

    const overlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body-content');
    
    if (!overlay || !modalBody) return;

    // 모달 내부에 입력 폼 동적 렌더링
    modalBody.innerHTML = `
      <form id="modal-edit-form" onsubmit="event.preventDefault();">
        <input type="hidden" id="edit-id" value="${p.id}">
        <div class="form-grid" style="grid-template-columns: 1fr; gap: 14px;">
          <div class="form-group">
            <label>단원명</label>
            <input type="text" id="edit-chapter" class="input-control" value="${this.escapeHTML(p.chapter)}">
          </div>
          <div class="form-group">
            <label>원본 문제</label>
            <textarea id="edit-originalText" class="input-control" rows="3">${this.escapeHTML(p.originalText)}</textarea>
          </div>
          <div class="form-group">
            <label>작성한 오답</label>
            <input type="text" id="edit-myAnswer" class="input-control" value="${this.escapeHTML(p.myAnswer || '')}">
          </div>
          <div class="form-group">
            <label>실제 정답</label>
            <input type="text" id="edit-correctAnswer" class="input-control" value="${this.escapeHTML(p.correctAnswer || '')}">
          </div>
        </div>
        <div class="btn-group" style="justify-content: flex-end; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="UIManager.closeEditModal()">취소</button>
          <button type="button" class="btn btn-primary" onclick="UIManager.saveModalChanges()">변경사항 저장</button>
        </div>
      </form>
    `;

    overlay.classList.add('active');
  },

  closeEditModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  saveModalChanges() {
    const id = document.getElementById('edit-id')?.value;
    const chapter = document.getElementById('edit-chapter')?.value || '';
    const originalText = document.getElementById('edit-originalText')?.value || '';
    const myAnswer = document.getElementById('edit-myAnswer')?.value || '';
    const correctAnswer = document.getElementById('edit-correctAnswer')?.value || '';

    if (!id || !originalText.trim()) {
      alert('필수값을 올바르게 채워주세요.');
      return;
    }

    // 스토리지 업데이트 및 모달 분석 개념도 재평가
    const originalProb = StorageManager.getProblem(id);
    
    // 수정 데이터 바탕으로 AI 피드백 재분석
    const updatedData = {
      ...originalProb,
      chapter,
      originalText,
      myAnswer,
      correctAnswer
    };
    const newAnalysis = ProblemAnalyzer.analyze(updatedData);

    StorageManager.updateProblem(id, {
      chapter,
      originalText,
      myAnswer,
      correctAnswer,
      concept: newAnalysis.concept,
      analysis: newAnalysis
    });

    this.closeEditModal();
    this.renderSavedProblems(document.getElementById('search-query')?.value || '');
  },

  // ==========================================
  // 7. HTML5 Canvas API 커스텀 차트 드로잉 (학습 통계)
  // ==========================================
  renderStatistics() {
    const stats = StorageManager.getStatistics();

    // 메트릭 숫자 바인딩
    if (document.getElementById('stat-total-entered')) {
      document.getElementById('stat-total-entered').textContent = `${stats.totalEntered}개`;
    }
    if (document.getElementById('stat-total-generated')) {
      document.getElementById('stat-total-generated').textContent = `${stats.totalGenerated}개`;
    }
    if (document.getElementById('stat-most-concept')) {
      document.getElementById('stat-most-concept').textContent = stats.mostIncorrectConcept;
    }
    if (document.getElementById('stat-last-active')) {
      document.getElementById('stat-last-active').textContent = stats.lastActiveDate;
    }

    // 차트 그리기
    this.drawDifficultyBarChart(stats.difficultyDist);
    this.drawReasonPieChart(stats.reasonDist);
  },

  /**
   * 난이도 분포 막대그래프 드로잉
   */
  drawDifficultyBarChart(dist) {
    const canvas = document.getElementById('bar-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // 반응형 크기 최적화
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 280 * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 280;

    ctx.clearRect(0, 0, width, height);

    const values = Object.values(dist);
    const maxVal = Math.max(...values, 3); // 최소 눈금 3으로 기준선 설정

    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 45;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // 1. 그리드 수평선 및 라벨 그리기
    const gridLines = 4;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridLines; i++) {
      const yVal = Math.round((maxVal / gridLines) * i);
      const yPos = height - paddingBottom - (yVal / maxVal) * graphHeight;
      
      // 선 그리기
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(width - paddingRight, yPos);
      ctx.stroke();

      // y축 숫자 렌더링
      ctx.fillText(String(yVal), paddingLeft - 8, yPos + 4);
    }

    // 2. 난이도 막대 그리기
    const keys = Object.keys(dist);
    const barCount = keys.length;
    const barGap = 24;
    const barWidth = (graphWidth - barGap * (barCount - 1)) / barCount;

    keys.forEach((key, index) => {
      const val = dist[key];
      const barHeight = (val / maxVal) * graphHeight;
      const xPos = paddingLeft + index * (barWidth + barGap);
      const yPos = height - paddingBottom - barHeight;

      // 막대 그라데이션 적용
      const grad = ctx.createLinearGradient(xPos, yPos, xPos, height - paddingBottom);
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(1, '#60a5fa');

      ctx.fillStyle = grad;
      
      // 모서리가 둥근 막대 그리기 (둥근 직사각형 기능 커스텀 구현)
      const radius = 6;
      ctx.beginPath();
      if (barHeight > radius) {
        ctx.moveTo(xPos, yPos + radius);
        ctx.quadraticCurveTo(xPos, yPos, xPos + radius, yPos);
        ctx.lineTo(xPos + barWidth - radius, yPos);
        ctx.quadraticCurveTo(xPos + barWidth, yPos, xPos + barWidth, yPos + radius);
        ctx.lineTo(xPos + barWidth, height - paddingBottom);
        ctx.lineTo(xPos, height - paddingBottom);
      } else {
        ctx.rect(xPos, yPos, barWidth, Math.max(barHeight, 1));
      }
      ctx.closePath();
      ctx.fill();

      // 3. 막대 위 수치값 표시
      if (val > 0) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(val), xPos + barWidth / 2, yPos - 8);
      }

      // X축 라벨 렌더링
      ctx.fillStyle = '#475569';
      ctx.font = '600 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${key}단계`, xPos + barWidth / 2, height - paddingBottom + 20);
    });
  },

  /**
   * 오답 요인 원형그래프(Donut Chart) 드로잉
   */
  drawReasonPieChart(dist) {
    const canvas = document.getElementById('pie-chart');
    const legendContainer = document.getElementById('pie-legend-container');
    if (!canvas || !legendContainer) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 280 * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 280;

    ctx.clearRect(0, 0, width, height);

    const entries = Object.entries(dist);
    const total = entries.reduce((sum, [_, val]) => sum + val, 0);

    // 데이터가 없는 경우 플레이스홀더 출력
    if (total === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('오답 통계 데이터가 충분하지 않습니다.', width / 2, height / 2);
      legendContainer.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;text-align:center;">저장된 오답 사유가 없습니다.</div>';
      return;
    }

    // 도넛 레이아웃 세부 수치 설정
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = 90;
    const innerRadius = 55;

    // 카테고리별 테마 색상 맵
    const colors = {
      '계산실수': '#3b82f6',
      '공식암기 부족': '#f59e0b',
      '개념 이해 부족': '#10b981',
      '문제 해석 실패': '#8b5cf6',
      '단순 실수': '#ec4899',
      '기타': '#64748b'
    };

    let startAngle = -Math.PI / 2; // 12시 방향에서 시작
    
    // HTML 범례 구성을 위한 임시 HTML 배열
    const legendItems = [];

    entries.forEach(([key, val]) => {
      if (val === 0) return;

      const percentage = (val / total) * 100;
      const sliceAngle = (val / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      // 도넛 외각 호 채우기
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      
      ctx.fillStyle = colors[key] || '#94a3b8';
      ctx.fill();

      // 경계선 처리
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle = endAngle;

      // 범례 데이터 가공
      legendItems.push(`
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:0.85rem;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:12px;height:12px;border-radius:3px;background-color:${colors[key]};display:inline-block;"></span>
            <span style="font-weight:600;color:var(--text-main);">${key}</span>
          </div>
          <span style="color:var(--text-muted);font-weight:500;">${val}회 (${percentage.toFixed(0)}%)</span>
        </div>
      `);
    });

    // 도넛 한가운데 흰색 배경 원 및 텍스트 렌더링
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('총 오답 원인', centerX, centerY - 8);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#2563eb';
    ctx.fillText(`${total}건`, centerX, centerY + 12);

    // HTML Legend 빌드업
    legendContainer.innerHTML = legendItems.join('');
  },

  // ==========================================
  // 8. 설정 관리 기능
  // ==========================================
  bindSettings() {
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const studentName = document.getElementById('setting-name')?.value || '학생';
        const schoolLevel = document.getElementById('setting-schoolLevel')?.value || '중등수학';
        const grade = document.getElementById('setting-grade')?.value || '1';
        const dailyGoal = document.getElementById('setting-dailyGoal')?.value || '3';

        StorageManager.saveSettings({ studentName, schoolLevel, grade, dailyGoal });
        this.updateStudentHeaderBadge();
        alert('사용자 설정이 성공적으로 저장되었습니다!');
      });
    }
  },

  loadSettingsForm() {
    const settings = StorageManager.getSettings();
    if (document.getElementById('setting-name')) document.getElementById('setting-name').value = settings.studentName;
    if (document.getElementById('setting-schoolLevel')) document.getElementById('setting-schoolLevel').value = settings.schoolLevel;
    if (document.getElementById('setting-grade')) document.getElementById('setting-grade').value = settings.grade;
    if (document.getElementById('setting-dailyGoal')) document.getElementById('setting-dailyGoal').value = settings.dailyGoal;
  },

  // ==========================================
  // 9. 텍스트 안전화 및 인코딩 방지용 헬퍼
  // ==========================================
  escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
