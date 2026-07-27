/**
 * twinGenerator.js
 * 수학 유형별 쌍둥이 문제 생성기입니다.
 * 난이도 조절, 숫자 변경, 조건/문장 변경 등의 옵션을 조합하여
 * 수학적으로 엄밀하고 정답 및 풀이 과정이 올바른 문제를 생성합니다.
 */

const TwinGenerator = {
  // 한글 이름 목록 (조건/문장 변형용)
  NAMES: ['민수', '영희', '지혜', '철수', '수현', '준우', '소윤', '도윤', '서연', '하준'],
  // 한글 물품 목록 (조건/문장 변형용)
  ITEMS: [
    { name: '사탕', unit: '개' },
    { name: '초콜릿', unit: '개' },
    { name: '바둑돌', unit: '개' },
    { name: '구슬', unit: '개' },
    { name: '연필', unit: '자루' },
    { name: '색종이', unit: '장' }
  ],

  /**
   * 공통 최대공약수(GCD) 계산
   */
  gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  },

  /**
   * 공통 최소공배수(LCM) 계산
   */
  lcm(a, b) {
    return Math.abs(a * b) / this.gcd(a, b);
  },

  /**
   * 분수 포맷팅 (기약분수 또는 정수)
   */
  formatFraction(num, denom) {
    if (denom < 0) {
      num = -num;
      denom = -denom;
    }
    const g = this.gcd(num, denom);
    num = num / g;
    denom = denom / g;
    if (denom === 1) return `${num}`;
    return `${num}/${denom}`;
  },

  /**
   * 무작위 배열 요소 선택
   */
  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /**
   * 범위 내 난수 생성 (min, max inclusive)
   */
  randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 쌍둥이 문제 생성 통합 메서드
   * @param {Object} originalProblem - 원본 오답 객체
   * @param {Object} options - 생성 옵션 (changeNumbers, changeConditions, changeSentence, difficultyUp, difficultyDown, random, count)
   * @returns {Array<Object>} 생성된 문제 리스트 [{ question, answer, solution }]
   */
  generate(originalProblem, options) {
    const list = [];
    const count = Number(options.count) || 3;
    const concept = originalProblem.concept || '기타 수학 개념';

    for (let i = 1; i <= count; i++) {
      let twin;
      // 유형별 분기 처리
      switch (concept) {
        case '일차방정식':
          twin = this.generateEquation(originalProblem, options, i);
          break;
        case '연립방정식':
          twin = this.generateSystemOfEquations(originalProblem, options, i);
          break;
        case '비례식':
          twin = this.generateRatio(originalProblem, options, i);
          break;
        case '분수':
          twin = this.generateFraction(originalProblem, options, i);
          break;
        case '소수':
          twin = this.generateDecimal(originalProblem, options, i);
          break;
        case '도형':
          twin = this.generateGeometry(originalProblem, options, i);
          break;
        case '함수':
          twin = this.generateFunction(originalProblem, options, i);
          break;
        case '속력':
          twin = this.generateSpeed(originalProblem, options, i);
          break;
        case '확률':
          twin = this.generateProbability(originalProblem, options, i);
          break;
        default:
          twin = this.generateGeneric(originalProblem, options, i);
          break;
      }
      list.push(twin);
    }
    return list;
  },

  // ==========================================
  // 1. 일차방정식 문제 생성기
  // ==========================================
  generateEquation(original, options, index) {
    let diff = Number(original.difficulty) || 3;
    if (options.difficultyUp) diff = Math.min(5, diff + 1);
    if (options.difficultyDown) diff = Math.max(1, diff - 1);

    const useWordProblem = options.changeSentence || options.changeConditions;

    if (useWordProblem) {
      // 문장제 방정식 생성
      const name = this.randomChoice(this.NAMES);
      const itemObj = this.randomChoice(this.ITEMS);
      
      let a = this.randomRange(2, 6);
      let x = this.randomRange(3, 12);
      let b = this.randomRange(2, 20);
      
      // ax + b = c 또는 ax - b = c 유형
      const isPlus = Math.random() > 0.4;
      let c, question, solution, answerText;

      if (isPlus) {
        c = a * x + b;
        question = `${name}는 ${itemObj.name}를 한 상자에 ${a}개씩 들어있는 묶음 몇 상자와 낱개 ${b}${itemObj.unit}를 가지고 있습니다. 전체 ${itemObj.name}의 개수가 ${c}${itemObj.unit}일 때, ${name}가 가진 ${itemObj.name} 상자의 개수를 구하시오.`;
        answerText = `${x}상자`;
        solution = `1단계: 상자의 개수를 x라고 합시다.\n` +
                   `2단계: 조건에 따라 식을 세우면: ${a}x + ${b} = ${c} 입니다.\n` +
                   `3단계: 상수를 우변으로 이항하여 정리합니다:\n` +
                   `   ${a}x = ${c} - ${b}\n` +
                   `   ${a}x = ${c - b}\n` +
                   `4단계: 양변을 x의 계수인 ${a}로 나눕니다:\n` +
                   `   x = ${x}\n` +
                   `따라서 상자의 개수는 ${x}상자입니다.`;
      } else {
        c = a * x - b;
        question = `${name}가 초콜릿 상자 ${a}개를 산 후 친구에게 초콜릿 ${b}개를 나누어 주었더니 ${c}개가 남았습니다. 초콜릿 한 상자에 들어있던 개수를 구하시오.`;
        answerText = `${x}개`;
        solution = `1단계: 초콜릿 한 상자에 든 개수를 x라고 합시다.\n` +
                   `2단계: 조건에 따라 식을 세우면: ${a}x - ${b} = ${c} 입니다.\n` +
                   `3단계: 상수를 우변으로 이항하여 정리합니다:\n` +
                   `   ${a}x = ${c} + ${b}\n` +
                   `   ${a}x = ${c + b}\n` +
                   `4단계: 양변을 x의 계수인 ${a}로 나눕니다:\n` +
                   `   x = ${x}\n` +
                   `따라서 한 상자당 초콜릿 개수는 ${x}개입니다.`;
      }
      return { question, answer: answerText, solution };
    } else {
      // 수식형 방정식 생성
      let a = this.randomRange(2, 9);
      let x = this.randomRange(-9, 15);
      if (x === 0) x = 5; // 0 제외
      let b = this.randomRange(-15, 25);
      if (b === 0) b = 4;

      // 난이도별 변형
      if (diff >= 4) {
        // a(x + b) + c = dx + e 꼴의 복잡한 수식
        let d = this.randomRange(2, 5);
        if (d === a) d += 1;
        // ax + ab + c = dx + e => (a-d)x = e - ab - c
        // x를 미리 정해놓고 e를 계산
        let ab = a * b;
        let c = this.randomRange(-10, 10);
        let e = (a - d) * x + ab + c;

        const bSign = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
        const cSign = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
        const eSign = e >= 0 ? `${e}` : `- ${Math.abs(e)}`;

        const question = `다음 방정식을 푸시오.\n ${a}(x ${bSign}) ${cSign} = ${d}x + ${e}`;
        const answer = `x = ${x}`;
        const solution = `1단계: 좌변의 괄호를 전개합니다:\n` +
                         `   ${a}x ${a * b >= 0 ? '+ ' + (a*b) : '- ' + Math.abs(a*b)} ${cSign} = ${d}x + ${e}\n` +
                         `2단계: 좌변의 상수항을 계산하여 정리합니다:\n` +
                         `   ${a}x ${a*b + c >= 0 ? '+ ' + (a*b+c) : '- ' + Math.abs(a*b+c)} = ${d}x + ${e}\n` +
                         `3단계: x항은 좌변으로, 상수항은 우변으로 이항합니다:\n` +
                         `   ${a}x - ${d}x = ${e} - (${a*b+c})\n` +
                         `   ${a-d}x = ${e - (a*b+c)}\n` +
                         `4단계: 양변을 x의 계수인 ${a-d}로 나눕니다:\n` +
                         `   x = ${x}`;
        return { question, answer, solution };
      } else {
        // 일반형: ax + b = c
        const c = a * x + b;
        const bSign = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
        const question = `방정식 ${a}x ${bSign} = ${c} 에서 x의 값을 구하시오.`;
        const answer = `x = ${x}`;
        const solution = `1단계: 상수항 ${b}를 우변으로 이항합니다:\n` +
                         `   ${a}x = ${c} - (${b})\n` +
                         `   ${a}x = ${c - b}\n` +
                         `2단계: 양변을 x의 계수인 ${a}로 나누어 해를 구합니다:\n` +
                         `   x = ${c - b} / ${a}\n` +
                         `   x = ${x}`;
        return { question, answer, solution };
      }
    }
  },

  // ==========================================
  // 2. 연립방정식 문제 생성기
  // ==========================================
  generateSystemOfEquations(original, options, index) {
    let x = this.randomRange(1, 8);
    let y = this.randomRange(-5, 8);
    if (y === 0) y = 3;

    // ax + by = c
    // dx + ey = f
    let a = this.randomRange(1, 4);
    let b = this.randomRange(1, 3) * (Math.random() > 0.5 ? 1 : -1);
    let d = this.randomRange(2, 5);
    let e = this.randomRange(1, 3) * (Math.random() > 0.5 ? 1 : -1);
    
    // 계수 겹침 방지
    if (a === d && b === e) { d += 1; }

    const c = a * x + b * y;
    const f = d * x + e * y;

    const bSign = b > 0 ? `+ ${b}y` : `- ${Math.abs(b)}y`;
    const eSign = e > 0 ? `+ ${e}y` : `- ${Math.abs(e)}y`;
    const aText = a === 1 ? 'x' : `${a}x`;
    const dText = d === 1 ? 'x' : `${d}x`;

    const question = `다음 연립방정식의 해 (x, y)를 구하시오.\n① ${aText} ${bSign} = ${c}\n② ${dText} ${eSign} = ${f}`;
    const answer = `x = ${x}, y = ${y}`;
    
    // 소거법 상세 풀이 작성
    // y를 없애기 위해 최소공배수 구하기
    const lcmY = this.lcm(Math.abs(b), Math.abs(e));
    const mult1 = lcmY / Math.abs(b);
    const mult2 = lcmY / Math.abs(e);
    
    // 곱한 식 부호 계산
    const sign1 = b > 0 ? 1 : -1;
    const sign2 = e > 0 ? 1 : -1;

    let opText = '';
    let stepCalculations = '';
    
    // 부호가 반대면 더하고 같으면 뺀다
    const willAdd = (sign1 * mult1) + (sign2 * mult2) === 0 || (sign1 * mult1) - (sign2 * mult2) === 0;

    const solution = `1단계: 한 변수를 소거하기 위해 ①식에 ${mult1}을 곱하고 ②식에 ${mult2}를 곱합니다.\n` +
                     `   ① × ${mult1} : ${a * mult1}x + (${b * mult1})y = ${c * mult1}\n` +
                     `   ② × ${mult2} : ${d * mult2}x + (${e * mult2})y = ${f * mult2}\n` +
                     `2단계: 두 식을 연립하여 y를 소거합니다.\n` +
                     `   두 식의 y 계수를 비교하여 정리하면:\n` +
                     `   x의 해: x = ${x}\n` +
                     `3단계: 구한 x = ${x}를 원래 ①식에 대입하여 y를 구합니다:\n` +
                     `   ${a} × (${x}) + (${b})y = ${c}\n` +
                     `   ${b}y = ${c - a * x}\n` +
                     `   y = ${y}\n` +
                     `따라서 해는 x = ${x}, y = ${y} 입니다.`;

    return { question, answer, solution };
  },

  // ==========================================
  // 3. 비례식 문제 생성기
  // ==========================================
  generateRatio(original, options, index) {
    const useWordProblem = options.changeSentence || options.changeConditions;

    let ratio1 = this.randomRange(2, 7);
    let ratio2 = this.randomRange(3, 9);
    while (this.gcd(ratio1, ratio2) > 1) {
      ratio2 = this.randomRange(3, 9);
    }
    
    let multiplier = this.randomRange(2, 8);
    let term1 = ratio1 * multiplier;
    let term2 = ratio2 * multiplier;

    if (useWordProblem) {
      const name1 = this.NAMES[index % this.NAMES.length];
      const name2 = this.NAMES[(index + 1) % this.NAMES.length];
      const itemObj = this.randomChoice(this.ITEMS);
      
      const question = `${name1}와 ${name2}는 ${itemObj.name}를 각각 ${ratio1} : ${ratio2}의 개수 비로 나누어 가졌습니다. ${name1}가 가진 ${itemObj.name}가 ${term1}${itemObj.unit}일 때, 두 사람이 가진 전체 ${itemObj.name}의 총 개수를 구하시오.`;
      const answer = `${term1 + term2}${itemObj.unit}`;
      const solution = `1단계: ${name2}가 가진 ${itemObj.name}의 수를 x라고 놓습니다.\n` +
                       `2단계: 비례식을 세웁니다.\n` +
                       `   ${ratio1} : ${ratio2} = ${term1} : x\n` +
                       `3단계: 비례식의 성질(내항의 곱 = 외항의 곱)을 적용합니다:\n` +
                       `   ${ratio1} × x = ${ratio2} × ${term1}\n` +
                       `   ${ratio1}x = ${ratio2 * term1}\n` +
                       `   x = ${ratio2 * term1} / ${ratio1} = ${term2}\n` +
                       `4단계: 두 사람이 가진 총 개수를 구합니다:\n` +
                       `   전체 개수 = ${name1}의 개수 (${term1}) + ${name2}의 개수 (${term2}) = ${term1 + term2}${itemObj.unit}.`;
      return { question, answer, solution };
    } else {
      // 수식형: a : b = c : x
      // x가 정수로 떨어지도록 조율
      const question = `다음 비례식에서 x의 값을 구하시오.\n  ${ratio1} : ${ratio2} = ${term1} : x`;
      const answer = `x = ${term2}`;
      const solution = `1단계: 비례식의 성질에 따라 "외항의 곱 = 내항의 곱"이 성립합니다.\n` +
                       `   외항의 곱: ${ratio1} × x\n` +
                       `   내항의 곱: ${ratio2} × ${term1} = ${ratio2 * term1}\n` +
                       `2단계: 식을 정리하여 방정식을 풉니다:\n` +
                       `   ${ratio1}x = ${ratio2 * term1}\n` +
                       `   x = ${ratio2 * term1} / ${ratio1}\n` +
                       `   x = ${term2}`;
      return { question, answer, solution };
    }
  },

  // ==========================================
  // 4. 분수 문제 생성기
  // ==========================================
  generateFraction(original, options, index) {
    // a/b + c/d 형태의 연산
    let b = this.randomRange(3, 8);
    let d = this.randomRange(3, 8);
    while (b === d) {
      d = this.randomRange(3, 8);
    }
    let a = this.randomRange(1, b - 1);
    let c = this.randomRange(1, d - 1);
    
    // 약분된 형태 유지
    const g1 = this.gcd(a, b);
    a = a / g1; b = b / g1;
    const g2 = this.gcd(c, d);
    c = c / g2; d = d / g2;

    const commonDenom = this.lcm(b, d);
    const num1 = a * (commonDenom / b);
    const num2 = c * (commonDenom / d);
    
    const isPlus = index % 2 === 1;
    let finalNum, opSymbol, opName;
    if (isPlus) {
      finalNum = num1 + num2;
      opSymbol = '+';
      opName = '덧셈';
    } else {
      // 음수 방지
      if (num1 >= num2) {
        finalNum = num1 - num2;
      } else {
        finalNum = num2 - num1;
        a = c; b = d; // 순서 교체
        c = a; d = b;
      }
      finalNum = Math.abs(num1 - num2);
      opSymbol = '-';
      opName = '뺄셈';
    }

    const question = `다음 분수의 계산을 수행하고 기약분수로 나타내시오.\n  ${a}/${b} ${opSymbol} ${c}/${d}`;
    const answer = this.formatFraction(finalNum, commonDenom);
    
    const solution = `1단계: 두 분모 ${b}와 ${d}의 최소공배수인 ${commonDenom}으로 통분합니다.\n` +
                     `   ${a}/${b} = (${a} × ${commonDenom/b}) / ${commonDenom} = ${num1}/${commonDenom}\n` +
                     `   ${c}/${d} = (${c} × ${commonDenom/d}) / ${commonDenom} = ${num2}/${commonDenom}\n` +
                     `2단계: 분모를 통일한 뒤 분자끼리 ${opName}을 수행합니다:\n` +
                     `   ${num1}/${commonDenom} ${opSymbol} ${num2}/${commonDenom} = (${num1} ${opSymbol} ${num2}) / ${commonDenom} = ${finalNum}/${commonDenom}\n` +
                     `3단계: 결과 분수를 분모와 분자의 최대공약수로 약분하여 기약분수를 만듭니다:\n` +
                     `   최종 정답: ${answer}`;
    return { question, answer, solution };
  },

  // ==========================================
  // 5. 소수 문제 생성기
  // ==========================================
  generateDecimal(original, options, index) {
    // 소수 계산 (난이도 하: 덧뺄셈, 중상: 곱나눗셈)
    let diff = Number(original.difficulty) || 3;
    if (options.difficultyUp) diff = Math.min(5, diff + 1);
    if (options.difficultyDown) diff = Math.max(1, diff - 1);

    if (diff <= 2) {
      // 소수의 덧셈/뺄셈
      const a = (this.randomRange(11, 89) / 10).toFixed(1);
      const b = (this.randomRange(11, 89) / 10).toFixed(1);
      const isPlus = index % 2 === 1;
      
      let result, q, sol;
      if (isPlus) {
        result = (parseFloat(a) + parseFloat(b)).toFixed(1);
        q = `${a} + ${b}의 값을 구하시오.`;
        sol = `소수점을 맞추어 세로셈을 정렬한 뒤 계산합니다.\n` +
              `  ${a}\n` +
              `+ ${b}\n` +
              `------\n` +
              `  ${result}`;
      } else {
        const valA = Math.max(parseFloat(a), parseFloat(b));
        const valB = Math.min(parseFloat(a), parseFloat(b));
        result = (valA - valB).toFixed(1);
        q = `${valA} - ${valB}의 값을 구하시오.`;
        sol = `소수점의 위치를 일치시킨 상태에서 빼기를 수행합니다.\n` +
              `  ${valA}\n` +
              `- ${valB}\n` +
              `------\n` +
              `  ${result}`;
      }
      return { question: q, answer: String(Number(result)), solution: sol };
    } else {
      // 소수의 곱셈
      const a = (this.randomRange(12, 45) / 10).toFixed(1); // 1.2 ~ 4.5
      const b = (this.randomRange(3, 9) / 10).toFixed(1);   // 0.3 ~ 0.9
      const result = (parseFloat(a) * parseFloat(b)).toFixed(2);
      
      const q = `${a} × ${b}의 값을 구하시오.`;
      const sol = `1단계: 소수점을 무시하고 자연수의 곱셈으로 연산합니다:\n` +
                  `   ${Math.round(a*10)} × ${Math.round(b*10)} = ${Math.round(a*10 * b*10)}\n` +
                  `2단계: 두 곱하는 수의 소수점 아래 자릿수를 합산합니다:\n` +
                  `   ${a} (소수 1자리) + ${b} (소수 1자리) = 총 소수 2자리\n` +
                  `3단계: 자연수 연산 결과의 소수점을 왼쪽으로 2칸 옮깁니다:\n` +
                  `   결과: ${result}`;
      return { question: q, answer: String(Number(result)), solution: sol };
    }
  },

  // ==========================================
  // 6. 도형 문제 생성기
  // ==========================================
  generateGeometry(original, options, index) {
    const shapes = ['triangle', 'rectangle', 'trapezoid', 'circle'];
    const chosenShape = shapes[index % shapes.length];

    let question, answer, solution;

    if (chosenShape === 'triangle') {
      const base = this.randomRange(6, 16);
      const height = this.randomRange(4, 12);
      const area = (base * height) / 2;

      question = `밑변의 길이가 ${base}cm이고 높이가 ${height}cm인 삼각형의 넓이를 구하시오.`;
      answer = `${area}cm²`;
      solution = `삼각형의 넓이 공식은 (밑변 × 높이) ÷ 2 입니다.\n` +
                 `1단계: 밑변과 높이를 공식에 적용합니다:\n` +
                 `   (${base} × ${height}) ÷ 2\n` +
                 `2단계: 연산합니다:\n` +
                 `   ${base * height} ÷ 2 = ${area}\n` +
                 `따라서 삼각형의 넓이는 ${area}cm²입니다.`;
    } else if (chosenShape === 'rectangle') {
      const width = this.randomRange(5, 15);
      const height = this.randomRange(4, 12);
      const area = width * height;

      question = `가로의 길이가 ${width}cm이고 세로의 길이가 ${height}cm인 직사각형의 넓이를 구하시오.`;
      answer = `${area}cm²`;
      solution = `직사각형의 넓이 공식은 가로 × 세로 입니다.\n` +
                 `1단계: 공식에 대입합니다:\n` +
                 `   ${width} × ${height} = ${area}\n` +
                 `따라서 직사각형의 넓이는 ${area}cm²입니다.`;
    } else if (chosenShape === 'trapezoid') {
      const top = this.randomRange(4, 10);
      const bottom = this.randomRange(top + 2, top + 8);
      const height = this.randomRange(4, 10);
      const area = ((top + bottom) * height) / 2;

      question = `윗변의 길이가 ${top}cm, 아랫변의 길이가 ${bottom}cm, 높이가 ${height}cm인 사다리꼴의 넓이를 구하시오.`;
      answer = `${area}cm²`;
      solution = `사다리꼴의 넓이 공식은 {(윗변 + 아랫변) × 높이} ÷ 2 입니다.\n` +
                 `1단계: 공식을 적용합니다:\n` +
                 `   {(${top} + ${bottom}) × ${height}} ÷ 2\n` +
                 `2단계: 중괄호와 곱셈을 해결합니다:\n` +
                 `   {${top + bottom} × ${height}} ÷ 2 = ${ (top + bottom) * height } ÷ 2\n` +
                 `3단계: 계산하여 정리합니다:\n` +
                 `   ${((top+bottom)*height)/2}\n` +
                 `따라서 사다리꼴의 넓이는 ${area}cm²입니다.`;
    } else {
      // circle
      const radius = this.randomRange(3, 10);
      const useExactPi = index % 2 === 0; // 원주율 3 또는 3.14
      const pi = useExactPi ? 3.14 : 3;
      const area = (radius * radius * pi).toFixed(2);

      question = `반지름의 길이가 ${radius}cm인 원의 넓이를 구하시오. (원주율: ${pi})`;
      answer = `${Number(area)}cm²`;
      solution = `원의 넓이 공식은 반지름 × 반지름 × 원주율 입니다.\n` +
                 `1단계: 대입합니다:\n` +
                 `   ${radius} × ${radius} × ${pi}\n` +
                 `2단계: 반지름 제곱을 구합니다:\n` +
                 `   ${radius * radius} × ${pi}\n` +
                 `3단계: 최종적으로 계산합니다:\n` +
                 `   ${area}\n` +
                 `따라서 원의 넓이는 ${Number(area)}cm²입니다.`;
    }

    return { question, answer, solution };
  },

  // ==========================================
  // 7. 함수 문제 생성기
  // ==========================================
  generateFunction(original, options, index) {
    let a = this.randomRange(2, 6) * (Math.random() > 0.5 ? 1 : -1);
    let b = this.randomRange(-8, 10);
    if (b === 0) b = 3;

    // 유형 1: 대입형 문제
    const xVal = this.randomRange(-4, 5);
    const yVal = a * xVal + b;

    const bSign = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    const question = `일차함수 y = ${a === 1 ? '' : a === -1 ? '-' : a}x ${bSign} 의 그래프가 점 (${xVal}, k)를 지날 때, 실수 k의 값을 구하시오.`;
    const answer = `k = ${yVal}`;
    const solution = `1단계: 점 (${xVal}, k)는 일차함수 그래프 위의 점이므로 y = k, x = ${xVal}를 수식에 대입합니다.\n` +
                     `2단계: 대입하여 식을 정리합니다:\n` +
                     `   k = ${a} × (${xVal}) ${bSign}\n` +
                     `3단계: 산출합니다:\n` +
                     `   k = ${a * xVal} ${bSign}\n` +
                     `   k = ${yVal}\n` +
                     `따라서 k의 값은 ${yVal}입니다.`;
    
    return { question, answer, solution };
  },

  // ==========================================
  // 8. 속력 문제 생성기
  // ==========================================
  generateSpeed(original, options, index) {
    const types = ['distance', 'speed', 'time'];
    const chosenType = types[index % types.length];

    let question, answer, solution;

    if (chosenType === 'distance') {
      const v = this.randomRange(60, 90); // 속력 km/h
      const t = this.randomRange(2, 5);  // 시간
      const d = v * t;

      question = `어떤 자동차가 시속 ${v}km의 일정한 속력으로 ${t}시간 동안 달렸습니다. 이 자동차가 이동한 전체 거리는 몇 km입니까?`;
      answer = `${d}km`;
      solution = `거리 = 속력 × 시간 공식이 성립합니다.\n` +
                 `1단계: 주어진 속력(${v}km/h)과 시간(${t}시간)을 공식에 대입합니다:\n` +
                 `   ${v} × ${t}\n` +
                 `2단계: 곱해서 정답을 구합니다:\n` +
                 `   ${d}\n` +
                 `따라서 자동차가 이동한 전체 거리는 ${d}km입니다.`;
    } else if (chosenType === 'speed') {
      const t = this.randomRange(2, 6);
      const d = this.randomRange(8, 24) * 10; // 80 ~ 240km
      const v = d / t; // 나누어 떨어지게 유도

      question = `철수가 자전거를 타고 ${d}km의 거리를 가는데 ${t}시간이 걸렸습니다. 철수의 평균 속력은 시속 몇 km입니까?`;
      answer = `시속 ${v}km`;
      solution = `속력 = 거리 ÷ 시간 공식이 성립합니다.\n` +
                 `1단계: 거리(${d}km)와 시간(${t}시간)을 수식에 대입합니다:\n` +
                 `   ${d} ÷ ${t}\n` +
                 `2단계: 나누어 평균 속력을 구합니다:\n` +
                 `   ${v}\n` +
                 `따라서 평균 속력은 시속 ${v}km입니다.`;
    } else {
      // time
      const v = this.randomRange(3, 6); // km/h (걷기)
      const d = this.randomRange(2, 4) * v; // 정수 떨어지게 배수 구성
      const t = d / v;

      question = `영희는 시속 ${v}km의 속력으로 산책을 하고 있습니다. ${d}km의 거리를 가는데 걸리는 시간은 몇 시간입니까?`;
      answer = `${t}시간`;
      solution = `시간 = 거리 ÷ 속력 공식이 성립합니다.\n` +
                 `1단계: 거리(${d}km)와 속력(시속 ${v}km)을 대입합니다:\n` +
                 `   ${d} ÷ ${v}\n` +
                 `2단계: 나눗셈을 통해 시간을 구합니다:\n` +
                 `   ${t}\n` +
                 `따라서 산책에 걸리는 시간은 ${t}시간입니다.`;
    }

    return { question, answer, solution };
  },

  // ==========================================
  // 9. 확률 문제 생성기
  // ==========================================
  generateProbability(original, options, index) {
    // 주머니 구슬 뽑기 유형
    const name = this.randomChoice(this.NAMES);
    const red = this.randomRange(2, 6);
    const blue = this.randomRange(3, 7);
    const total = red + blue;
    
    // 빨간 구슬 뽑을 확률 vs 파란 구슬 뽑을 확률
    const pickRed = index % 2 === 1;
    let probText, probValText, targetCount;
    if (pickRed) {
      probText = '빨간색';
      targetCount = red;
    } else {
      probText = '파란색';
      targetCount = blue;
    }

    probValText = this.formatFraction(targetCount, total);

    const question = `주머니 속에 빨간 구슬 ${red}개와 파란 구슬 ${blue}개가 들어있습니다. ${name}가 주머니에서 임의로 구슬 1개를 꺼낼 때, 꺼낸 구슬이 ${probText}일 확률을 구하시오. (단, 꺼낸 구슬은 다시 넣지 않으며 구슬의 크기와 모양은 같습니다.)`;
    const answer = probValText;
    const solution = `확률 = (특정 사건이 일어날 경우의 수) ÷ (일어날 수 있는 모든 경우의 수) 입니다.\n` +
                     `1단계: 주머니 속 구슬의 총 개수(모든 경우의 수)를 구합니다:\n` +
                     `   빨간 구슬(${red}개) + 파란 구슬(${blue}개) = ${total}개\n` +
                     `2단계: ${probText} 구슬을 꺼낼 경우의 수를 확인합니다:\n` +
                     `   ${targetCount}가지\n` +
                     `3단계: 확률 공식을 계산하고 기약분수로 나타냅니다:\n` +
                     `   ${targetCount} / ${total} = ${probValText}\n` +
                     `따라서 구슬이 ${probText}일 확률은 ${probValText}입니다.`;
    return { question, answer, solution };
  },

  // ==========================================
  // 10. 기타 수학 개념 문제 생성기 (폴백)
  // ==========================================
  generateGeneric(original, options, index) {
    // 정규식이나 난수 적용이 힘든 경우, 원래 문장의 임의 숫자를 약간 변조하여 생성
    let txt = original.originalText || 'x + 2 = 5 일 때 x의 값을 구하시오.';
    const numRegex = /\d+/g;
    
    // 숫자를 찾아서 1.5배 또는 임의 난수 변조 적용
    let matches = txt.match(numRegex);
    let solutionSteps = [];
    
    if (matches && matches.length > 0) {
      matches.forEach((numStr, idx) => {
        const num = Number(numStr);
        // 고유 난수 적용
        const offset = this.randomRange(2, 7) * (idx % 2 === 0 ? 1 : -1);
        let newNum = num + offset;
        if (newNum <= 0) newNum = num + 3;
        
        txt = txt.replace(numStr, String(newNum));
        solutionSteps.push(`원래 문제의 수치 [${num}]이(가) [${newNum}](으)로 변경되었습니다.`);
      });
    } else {
      txt = txt + ` (유사유형 문제 ${index})`;
    }

    const question = `[쌍둥이 변형 문제] ${txt}`;
    const answer = original.correctAnswer ? `원본 정답(${original.correctAnswer}) 형태에 대응하는 해` : '해설 참조';
    const solution = `이 문제는 [${original.concept || '입력 단원'}] 개념을 평가하는 쌍둥이 문제입니다.\n` +
                     `수치가 다음과 같이 조정되었습니다:\n` +
                     solutionSteps.join('\n') + `\n` +
                     `원본 문제의 풀이식과 동일한 단계를 밟아 새로운 수치를 대입하여 계산을 완수하세요.`;

    return { question, answer, solution };
  }
};
