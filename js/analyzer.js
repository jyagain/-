/**
 * analyzer.js
 * 규칙 기반(Rule Engine) 오답 분석기입니다.
 * 사용자가 입력한 데이터(단원, 문제 내용, 오답/정답, 선택한 틀린 이유 등)를 분석하여
 * 구체적인 학습 개념, 오답 원인, 맞춤형 추천 학습 가이드를 출력합니다.
 */

const ProblemAnalyzer = {
  // 수학 단원/개념 판별용 키워드 및 정규식 정의
  CONCEPTS: [
    { name: '연립방정식', keywords: [/연립/i, /방정식.*방정식/i, /x.*y.*=/i] },
    { name: '일차방정식', keywords: [/방정식/i, /x\s*[+\-*/]/i, /=\s*\d+/i, /의 값을 구/i] },
    { name: '비례식', keywords: [/비례/i, /비율/i, /:\s*\d+/i, /비와 비율/i] },
    { name: '분수', keywords: [/분수/i, /통분/i, /약분/i, /\/\d+/i, /부모/i, /분자/i] },
    { name: '소수', keywords: [/소수/i, /\d+\.\d+/i] },
    { name: '도형', keywords: [/도형/i, /넓이/i, /삼각형/i, /사각형/i, /직사각형/i, /원/i, /반지름/i, /둘레/i, /각도/i, /부피/i] },
    { name: '함수', keywords: [/함수/i, /y\s*=\s*/i, /기울기/i, /y절편/i, /그래프/i, /좌표/i] },
    { name: '속력', keywords: [/속력/i, /거리/i, /시간/i, /거속시/i, /시속/i, /분속/i, /초속/i, /왕복/i] },
    { name: '확률', keywords: [/확률/i, /경우의 수/i, /경우/i, /주사위/i, /동전/i, /제비/i, /바둑돌/i, /뽑는/i] }
  ],

  /**
   * 오답 입력을 기반으로 규칙 분석을 수행합니다.
   * @param {Object} problemData - 사용자 입력 데이터 객체
   * @returns {Object} { concept, cause, recommendation }
   */
  analyze(problemData) {
    const { subject, grade, chapter, originalText, myAnswer, correctAnswer, reasons } = problemData;

    // 1. 학습 개념(Concept) 식별
    let concept = this.detectConcept(chapter, originalText);

    // 2. 오답 원인(Cause) 분석
    let cause = this.analyzeCause(reasons, myAnswer, correctAnswer, concept);

    // 3. 추천 학습(Recommendation) 생성
    let recommendation = this.generateRecommendation(concept, problemData.difficulty);

    return {
      concept,
      cause,
      recommendation
    };
  },

  /**
   * 단원명 및 문제 텍스트에서 키워드를 찾아 학습 개념을 식별합니다.
   * @param {string} chapter - 사용자가 입력한 단원명
   * @param {string} originalText - 원본 문제 내용
   * @returns {string} 식별된 개념명
   */
  detectConcept(chapter, originalText) {
    const textToSearch = `${chapter || ''} ${originalText || ''}`.trim();
    
    if (!textToSearch) {
      return '일반 산수 및 연산';
    }

    for (const item of this.CONCEPTS) {
      for (const regex of item.keywords) {
        if (regex.test(textToSearch)) {
          return item.name;
        }
      }
    }

    // 매칭되는 키워드가 없으면 사용자가 직접 입력한 단원명을 기반으로 설정
    if (chapter && chapter.trim().length > 0) {
      return chapter.trim();
    }

    return '기타 수학 개념';
  },

  /**
   * 체크한 체크박스 원인과 오답 상태에 따른 분석 피드백을 구성합니다.
   * @param {Array<string>} reasons - 체크한 틀린 이유 리스트
   * @param {string} myAnswer - 오답 내용
   * @param {string} correctAnswer - 정답 내용
   * @param {string} concept - 판별된 개념
   * @returns {string} 오답 원인 설명문
   */
  analyzeCause(reasons, myAnswer, correctAnswer, concept) {
    let causes = [];

    // 체크박스 기반 매핑
    if (reasons && reasons.length > 0) {
      reasons.forEach(reason => {
        switch (reason) {
          case '계산실수':
            causes.push(`연산 및 계산 과정(부호 처리, 이항, 소수점 위치 등)에서의 단순 실수`);
            break;
          case '공식암기 부족':
            causes.push(`${concept} 관련 공식을 정확히 암기하지 못했거나 오용함`);
            break;
          case '개념 이해 부족':
            causes.push(`${concept} 개념의 근본 원리(작동 원리, 조건 정의 등)에 대한 이해 부족`);
            break;
          case '문제 해석 실패':
            causes.push(`문제가 요구하는 미지수나 핵심 조건을 수식으로 옮기는 해석 과정의 한계`);
            break;
          case '단순 실수':
            causes.push(`문제의 특정 조건(단위, 미지수 범위 등)을 읽지 않고 건너뛴 부주의`);
            break;
          case '기타':
            causes.push(`복합적 원인 또는 풀이 방식 설정 오류`);
            break;
        }
      });
    }

    // 오답과 정답을 정밀 분석하는 가상의 규칙 (예: 분수 형태, 음수 부호 유무 판별)
    const cleanMy = (myAnswer || '').replace(/\s+/g, '');
    const cleanCorrect = (correctAnswer || '').replace(/\s+/g, '');

    if (cleanMy && cleanCorrect && cleanMy !== cleanCorrect) {
      // 부호 실수 패턴 감지
      if (cleanMy.includes('-') && !cleanCorrect.includes('-')) {
        causes.push('음수 부호가 포함되지 않아야 하는 연산에 음수를 붙임');
      } else if (!cleanMy.includes('-') && cleanCorrect.includes('-')) {
        causes.push('연산 결과 최종 부호가 음수(-)여야 하나 양수로 처리함');
      }
      
      // 분수 오차 감지
      if (cleanMy.includes('/') && cleanCorrect.includes('/')) {
        causes.push('분수 계산 시 약분 또는 통분 단계에서 분모/분자 처리가 바르지 못함');
      }
    }

    if (causes.length === 0) {
      return '명확한 오답 요인을 파악하기 어렵습니다. 풀이 과정을 처음부터 적으며 조건 누락이나 단순 연산 오류가 있었는지 재점검해 보세요.';
    }

    // 중복 제거 후 문장 합치기
    const uniqueCauses = [...new Set(causes)];
    return uniqueCauses.join(', ') + '이(가) 주요 오답 요인으로 분석됩니다.';
  },

  /**
   * 개념과 난이도에 따른 최적의 추천 학습 가이드를 출력합니다.
   * @param {string} concept - 판별된 개념
   * @param {number} difficulty - 난이도 (1~5)
   * @returns {string} 추천 학습 문구
   */
  generateRecommendation(concept, difficulty) {
    const diff = Number(difficulty) || 3;
    let baseGuide = '';
    
    // 개념별 커스텀 피드백
    switch (concept) {
      case '일차방정식':
        baseGuide = '등식의 양변에 같은 수를 더하거나 빼도 성질이 변하지 않는다는 점을 기억하세요. 미지수 x가 있는 항을 좌변으로, 상수를 우변으로 깔끔히 모으는 이항 연습을 최우선으로 해야 합니다.';
        break;
      case '연립방정식':
        baseGuide = '가감법과 대입법 중 문제 구조에 맞는 방식을 선정한 후, 하나의 변수를 소거하는 풀이를 집중 점검해야 합니다. 계수가 분수/소수인 경우 양변에 곱해 정수로 만들어 시작하세요.';
        break;
      case '비례식':
        baseGuide = '비례식의 핵심 정리인 "내항의 곱 = 외항의 곱" 공식을 유도하는 능력이 중요합니다. 문장제 문제의 경우 비율 관계를 변수 x를 사용해 1:1식으로 작성하는 연습을 하세요.';
        break;
      case '분수':
        baseGuide = '덧셈과 뺄셈 시 최소공배수를 이용한 통분이 정확해야 합니다. 곱셈/나눗셈 시 대분수를 가분수로 바꾸고, 나눗셈은 역수의 곱셈으로 고쳐 계산하는 속도를 기르세요.';
        break;
      case '소수':
        baseGuide = '곱셈 시에는 소수점 아래 자릿수의 합만큼 소수점을 왼쪽으로 이동시키고, 나눗셈 시에는 나누는 수를 자연수로 만들기 위해 소수점을 오른쪽으로 이동시키는 원리를 재학습하세요.';
        break;
      case '도형':
        baseGuide = '도형 문제는 기본 공식을 외운 상태에서, 직접 직사각형이나 삼각형을 그리고 수치를 표시하는 시각화 습관을 들여야 합니다. 구하고자 하는 것이 넓이인지, 둘레인지 반드시 체크하세요.';
        break;
      case '함수':
        baseGuide = 'y = ax + b 등 기본 식에서 x의 계수인 기울기의 개념(x증가량 분의 y증가량)과 상수항인 y절편의 기하학적 그래프 특징을 머릿속에 그리고 대입법을 적용해야 합니다.';
        break;
      case '속력':
        baseGuide = '"거속시" 무당벌레 그림 공식을 완벽히 복기하세요. 특히 거리 단위(km, m)와 시간 단위(시간, 분, 초)가 통일되어 있는지 문제 조건에서 가장 먼저 확인하는 습관이 필수적입니다.';
        break;
      case '확률':
        baseGuide = '전체 경우의 수 분의 특정 사건이 일어나는 경우의 수를 구할 때 빠짐없이 세거나 중복해서 세지 않는 것이 핵심입니다. 표를 그리거나 수형도를 활용해 나열해 보세요.';
        break;
      default:
        baseGuide = `해당 단원(${concept})의 기초 교재 정의 부분을 5분간 소리내어 읽고, 핵심 증명 과정을 필사해 보는 것이 좋습니다.`;
        break;
    }

    // 난이도에 따른 강도 보완
    let countSuggest = 5;
    if (diff <= 2) {
      countSuggest = 3;
      return `${baseGuide} [난이도 하] 쉬운 기초 문제를 ${countSuggest}회 반복하여 완벽한 계산력을 체득하는 것이 필수입니다.`;
    } else if (diff === 3) {
      countSuggest = 5;
      return `${baseGuide} [난이도 중] 대표 유형 쌍둥이 문제 ${countSuggest}개를 집중해서 차근차근 손으로 직접 풀이 과정을 적으며 완성도를 극대화하세요.`;
    } else {
      countSuggest = 10;
      return `${baseGuide} [난이도 상] 심화 문장 및 조건이 변형된 쌍둥이 문제 ${countSuggest}문제를 풀며, 개념을 응용하는 유연한 사고력을 길러야 도약할 수 있습니다.`;
    }
  }
};
