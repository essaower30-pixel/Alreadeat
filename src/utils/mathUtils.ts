// Math helpers for rational numbers and Syrian Grade 8 curriculum

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / gcd(a, b));
}

export interface FractionCalculationResult {
  n1: number;
  d1: number;
  n2: number;
  d2: number;
  operation: '+' | '-';
  commonDenominator: number;
  scale1: number;
  scale2: number;
  scaledN1: number;
  scaledN2: number;
  resultNumerator: number;
  resultDenominator: number;
  reducedNumerator: number;
  reducedDenominator: number;
  steps: string[];
}

export function calculateFractions(
  n1: number,
  d1: number,
  n2: number,
  d2: number,
  operation: '+' | '-'
): FractionCalculationResult {
  if (d1 === 0 || d2 === 0) {
    throw new Error('المقام لا يمكن أن يكون صفراً!');
  }

  // Common denominator via LCM
  const commonDenom = lcm(d1, d2);
  const scale1 = commonDenom / d1;
  const scale2 = commonDenom / d2;

  const scaledN1 = n1 * scale1;
  const scaledN2 = n2 * scale2;

  const rawNum = operation === '+' ? scaledN1 + scaledN2 : scaledN1 - scaledN2;
  const rawDenom = commonDenom;

  const commonDivisor = gcd(rawNum, rawDenom);
  let redNum = rawNum / commonDivisor;
  let redDen = rawDenom / commonDivisor;

  // Keep denominator positive
  if (redDen < 0) {
    redNum = -redNum;
    redDen = -redDen;
  }

  const steps: string[] = [
    `الكسر الأول: ${n1}/${d1} والكسر الثاني: ${n2}/${d2}`,
    d1 === d2
      ? `المقامات متساوية بالفعل (${d1})، نطبق الخاصة 1 مباشرة.`
      : `المقامات مختلفة (${d1} و ${d2}). أصغر مضاعف مشترك للمقامين هو ${commonDenom}.`,
    d1 !== d2
      ? `نوحد المقامات: نضرب الكسر الأول في ${scale1} ليصبح ${scaledN1}/${commonDenom}، ونضرب الكسر الثاني في ${scale2} ليصبح ${scaledN2}/${commonDenom}.`
      : `نحتفظ بالمقام ${d1} ونجمع/نطرح البسطين.`,
    `العملية بعد توحيد المقامات: (${scaledN1} ${operation} ${scaledN2}) / ${commonDenom} = ${rawNum}/${commonDenom}`,
  ];

  if (commonDivisor > 1) {
    steps.push(`نختصر الناتج بقسمة البسط والمقام على القاسم المشترك الأكبر (${commonDivisor}) فنحصل على: ${redNum}/${redDen}`);
  } else {
    steps.push(`الكسر بأبسط صيغة بالفعل: ${redNum}/${redDen}`);
  }

  return {
    n1,
    d1,
    n2,
    d2,
    operation,
    commonDenominator: commonDenom,
    scale1,
    scale2,
    scaledN1,
    scaledN2,
    resultNumerator: rawNum,
    resultDenominator: rawDenom,
    reducedNumerator: redNum,
    reducedDenominator: redDen,
    steps,
  };
}
