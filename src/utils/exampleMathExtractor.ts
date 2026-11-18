// ============================================================================
// مستخرج الأرقام والقياسات الرياضية لسبورة الأمثلة التطبيقية (الجبر والهندسة)
// ============================================================================

export interface GeometryMeasurementLabels {
  /** e.g. { AB: '6 cm', AD: '4 cm', AC: '14 cm', BC: '12' } */
  namedLengths: Record<string, string>;
  /** Segment length e.g. "7 cm" */
  segLen?: string;
  /** Translation distance e.g. "12 cm" */
  shiftLen?: string;
  /** Square / shape side length e.g. "5 cm" */
  sideLen?: string;
  /** Area value e.g. "25 cm²" or "32 cm²" */
  areaVal?: string;
  /** Radius e.g. "6 cm" */
  radiusVal?: string;
  /** Diameter e.g. "8 cm" */
  diameterVal?: string;
  /** Height e.g. "7 cm" */
  heightVal?: string;
  /** Slant / generator L e.g. "10 cm" */
  slantVal?: string;
  /** Volume e.g. "80 cm³" */
  volumeVal?: string;
  /** Angle e.g. "70°" or "90°" */
  angleVal?: string;
  /** Perimeter e.g. "24 cm" */
  perimeterVal?: string;
  /** Ordered loose numeric values with optional units (e.g. ['8 cm', '15 cm', '17 cm']) */
  numberList: string[];
  /** Resulting half/computed value e.g. "12 cm" or "7 cm" */
  resultVal?: string;
}

/**
 * Extracts explicit geometric measurements & side lengths from Arabic math problems/solutions
 * so the teacher's SVG diagram displays the exact numbers of the active example.
 */
export function extractGeometryMeasurements(text: string): GeometryMeasurementLabels {
  const namedLengths: Record<string, string> = {};
  const clean = (text || '')
    .replace(/cm\^2/gi, 'cm²')
    .replace(/cm\^3/gi, 'cm³')
    .replace(/m\^2/gi, 'm²')
    .replace(/m\^3/gi, 'm³');

  // 1. Handle chained equalities like "BA' = A'C = 4 cm" or "AO = R = 6.5 cm" or "MM' = AB = 5 cm"
  const chainRegex =
    /\b([A-Za-z]['′″]?[A-Za-z0-9]?['′″]?)\s*=\s*([A-Za-z]['′″]?[A-Za-z0-9]?['′″]?)\s*=\s*([0-9]+(?:\.[0-9]+)?(?:\s*√[0-9]+)?(?:\s*π)?(?:\s*(?:cm²|cm³|m²|m³|cm|m|°))?)/g;
  let chainMatch: RegExpExecArray | null;
  while ((chainMatch = chainRegex.exec(clean)) !== null) {
    const k1 = chainMatch[1].trim();
    const k2 = chainMatch[2].trim();
    const val = chainMatch[3].trim().replace(/\s+/g, ' ');
    if (k1 && val && !namedLengths[k1]) namedLengths[k1] = val;
    if (k2 && val && !namedLengths[k2]) namedLengths[k2] = val;
  }

  // 2. Handle "KEY = <numeric math expr> = VALUE" first (e.g. "BC = (5 × 4) / 2 = 10", "CC' = 10 + 5 = 15 cm")
  let match: RegExpExecArray | null;
  const exprResultRegex =
    /\b([A-Za-zθ]['′″]?[A-Za-z0-9]?['′″]?)\s*=\s*[0-9()+\-×÷/*.π√\s]{1,36}=\s*([0-9]+(?:\.[0-9]+)?(?:\s*√[0-9]+)?(?:\s*π)?(?:\s*(?:cm²|cm³|m²|m³|cm|m|°))?)/g;
  while ((match = exprResultRegex.exec(clean)) !== null) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/\s+/g, ' ');
    if (key && val && !namedLengths[key]) {
      namedLengths[key] = val;
    }
  }

  // 2b. Named segments/values like "AB = 5 cm", "AM = 2", "r = 3 cm", "V = 48 π cm³", "h = 3√3 cm"
  const namedRegex =
    /\b([A-Za-zθ]['′″]?[A-Za-z0-9]?['′″]?)\s*=\s*([0-9]+(?:\.[0-9]+)?(?:\s*√[0-9]+)?(?:\s*π)?(?:\s*(?:cm²|cm³|m²|m³|cm|m|°))?)/g;
  while ((match = namedRegex.exec(clean)) !== null) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/\s+/g, ' ');
    if (key && val && !namedLengths[key]) {
      namedLengths[key] = val;
    }
  }

  // 3. Arabic phrase aliases ("يساوي" / "طوله") for key geometric labels
  const yusawiRegex =
    /\b([A-Za-zθ]['′″]?[A-Za-z0-9]?['′″]?)\s+(?:يساوي|تساوي|طوله|طولها)\s+([0-9]+(?:\.[0-9]+)?(?:\s*√[0-9]+)?(?:\s*π)?(?:\s*(?:cm²|cm³|m²|m³|cm|m|°))?)/g;
  while ((match = yusawiRegex.exec(clean)) !== null) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/\s+/g, ' ');
    if (key && val && !namedLengths[key]) {
      namedLengths[key] = val;
    }
  }

  // Segment length ("قطعة مستقيمة [..] طولها 7 cm")
  const segMatch = clean.match(/قطعة\s+مستقيمة(?:\s+\[[A-Za-z'′]+\])?\s+طولها\s+([0-9.]+\s*(?:cm|m)?)/i);
  const segLen = segMatch?.[1]?.trim();

  // Translation distance ("ينقل A إلى B مسافة 12 cm" or "بانسحاب ... مسافة 5 cm" or "بانسحاب 8 cm")
  const shiftMatch =
    clean.match(/مساف(?:ة|ته)\s+([0-9.]+\s*(?:cm|m)?)/i) ||
    clean.match(/بانسحاب(?:\s+ينقل[^0-9]+)?\s+([0-9.]+\s*(?:cm|m)?)/i) ||
    clean.match(/ينقل[^0-9]+([0-9.]+\s*(?:cm|m)?)\s*(?:يميناً|يساراً|أعلى|أسفل)?/i);
  const shiftLen = shiftMatch?.[1]?.trim();

  // Side / edge length ("ضلعه 5 cm" / "ضلع قاعدته 6 cm" / "طول حرفه 4 cm")
  const sideMatch = clean.match(/(?:ضلع(?:ه|ها|قاعدته)?|حرف(?:ه|ها)?)\s+(?:يساوي|=)?\s*([0-9.]+\s*(?:cm|m)?)/i);
  const sideLen = sideMatch?.[1]?.trim();

  // Area ("مساحته 32 cm²" / "= 25 cm²" / "S = 24 cm²")
  const areaMatch =
    clean.match(/مساحت(?:ه|ها)\s*(?:تبقى|يساوي|=)?\s*([0-9.]+\s*(?:π\s*)?(?:cm²|m²))/i) ||
    clean.match(/([0-9.]+\s*(?:π\s*)?(?:cm²|m²))/i);
  const areaVal = namedLengths['S'] || areaMatch?.[1]?.trim();

  // Volume ("حجمه ... cm³" / V = 80 cm³)
  const volMatch = clean.match(/([0-9.]+\s*(?:π\s*)?(?:cm³|m³))/i);
  const volumeVal = namedLengths['V'] || volMatch?.[1]?.trim();

  // Diameter ("قطره 8 cm") vs Radius ("R = 6 cm" / "r = 3 cm" / "نصف قطرها 6 cm")
  const diamMatch = clean.match(/(?<!نصف\s)قطر(?:ه|ها)\s+(?:يساوي|=)?\s*([0-9.]+\s*(?:cm|m)?)/i);
  const diameterVal = diamMatch?.[1]?.trim();

  const radiusVal =
    namedLengths['R'] ||
    namedLengths["R'"] ||
    namedLengths['r'] ||
    clean.match(/نصف\s+قطر(?:ها|ه)?\s*(?:يساوي|=)?\s*([0-9.]+\s*(?:cm|m)?)/i)?.[1]?.trim();

  // Height ("ارتفاعه 9 cm" / "h = 7 cm")
  const heightVal =
    namedLengths['h'] ||
    clean.match(/ارتفاع(?:ه|ها|الشجرة)?\s*(?:يساوي|=)?\s*([0-9.]+(?:\s*√[0-9]+)?\s*(?:cm|m)?)/i)?.[1]?.trim();

  // Slant / Generator L
  const slantVal = namedLengths['L'] || namedLengths['SM'];

  // Angle ("70°" or "90°" or "120 درجة")
  const angleVal =
    clean.match(/([0-9.]+\s*°)/)?.[1]?.trim() ||
    (clean.match(/([0-9.]+)\s*درجة/)?.[1] ? `${clean.match(/([0-9.]+)\s*درجة/)?.[1]}°` : undefined);

  // Perimeter ("محيطه 24 cm" or "محيطها 12π cm")
  const perimMatch = clean.match(/محيط(?:ه|ها)\s*(?:يساوي|=)?\s*([0-9.]+\s*π?\s*(?:cm|m)?)/i);
  const perimeterVal = perimMatch?.[1]?.trim();

  // Ordered loose numeric values (helpful for lists like "8 cm و 15 cm و 17 cm" or "3 و 4" and "5")
  const numberList: string[] = [];
  const numTokens = clean.matchAll(/([0-9]+(?:\.[0-9]+)?(?:\s*√[0-9]+)?(?:\s*π)?(?:\s*(?:cm²|cm³|m²|m³|cm|m|°))?)/g);
  for (const nt of numTokens) {
    const item = nt[1].trim().replace(/\s+/g, ' ');
    if (item && !numberList.includes(item)) {
      numberList.push(item);
    }
  }

  return {
    namedLengths,
    segLen,
    shiftLen,
    sideLen,
    areaVal,
    radiusVal,
    diameterVal,
    heightVal,
    slantVal,
    volumeVal,
    angleVal,
    perimeterVal,
    numberList,
  };
}

export interface SmartDiagramInsight {
  formulaHint: string;
  computedNote?: string;
  ratioK?: string;
}

/**
 * Generates an insightful pedagogical summary strip tailored to the numbers
 * and theorem inside the current geometry figure.
 */
export function buildSmartDiagramInsights(
  variant: string,
  text: string,
  m: GeometryMeasurementLabels
): SmartDiagramInsight | null {
  const nl = m.namedLengths;

  // 1. Thales / Three Ratios insight (shows scale factor k and cross multiplication!)
  if (variant === 'thales' || variant === 'three-ratios') {
    const amNum = parseFloat(nl['AM'] || '');
    const abNum = parseFloat(nl['AB'] || '');
    const acNum = parseFloat(nl['AC'] || '');
    const mnNum = parseFloat(nl['MN'] || '');
    if (!isNaN(amNum) && !isNaN(abNum) && abNum > 0) {
      const ratioStr = `${amNum}/${abNum}`;
      const computedParts: string[] = [];
      if (!isNaN(acNum)) {
        const anCalc = Number(((amNum * acNum) / abNum).toFixed(2));
        computedParts.push(`AN = (${amNum} × ${acNum}) ÷ ${abNum} = ${anCalc}`);
      }
      if (!isNaN(mnNum)) {
        const bcCalc = Number(((abNum * mnNum) / amNum).toFixed(2));
        computedParts.push(`BC = (${abNum} × ${mnNum}) ÷ ${amNum} = ${bcCalc}`);
      }
      return {
        formulaHint: `معامل التناسب k = AM / AB = ${ratioStr}`,
        computedNote: computedParts.join('  |  ') || undefined,
        ratioK: ratioStr,
      };
    }
    if (text.includes('ظل')) {
      return {
        formulaHint: 'أشعة الشمس المتوازية تُشكّل مثلثين متناسبين: ظل_العصا / ظل_الشجرة = طول_العصا / الارتفاع',
        computedNote: m.heightVal ? `الارتفاع المحسوب h = ${m.heightVal}` : undefined,
      };
    }
  }

  // 2. Pythagoras live verification a² + b² = c²
  if (variant === 'pythagoras' || variant === 'pythagoras-converse') {
    const nums = m.numberList
      .map((s) => parseFloat(s))
      .filter((n) => !isNaN(n) && n > 0 && n < 200);
    // Look for classic triple or 2 values
    if (nums.length >= 3) {
      const sorted = [...nums.slice(0, 3)].sort((a, b) => a - b);
      const [a, b, c] = sorted;
      if (Math.abs(a * a + b * b - c * c) < 0.01) {
        return {
          formulaHint: `التحقق العددي: ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c} = ${c}²`,
          computedNote: 'الوتر هو الضلع الأطول المقابل للزاوية القائمة (90°)',
        };
      }
    }
  }

  // 3. Centroid 2/3 & 1/3 visual split
  if (variant === 'medians-centroid') {
    const medVal = parseFloat(nl["BB'"] || nl["AA'"] || nl["CC'"] || '');
    if (!isNaN(medVal)) {
      return {
        formulaHint: `نقطة الثقل G تقسم المتوسط بنسبة 2 : 1 من جهة الرأس`,
        computedNote: `${Number(((2 / 3) * medVal).toFixed(2))} نحو الرأس  +  ${Number(((1 / 3) * medVal).toFixed(2))} نحو القاعدة = ${medVal}`,
      };
    }
  }

  // 4. Right triangle circumcircle midpoint
  if (variant === 'right-triangle-circle') {
    const hyp = parseFloat(nl['BC'] || nl['EF'] || '');
    if (!isNaN(hyp)) {
      return {
        formulaHint: `الوتر هو قطر الدائرة المحيطة ⇐ نصف القطر R = المتوسط المتعلق بالوتر`,
        computedNote: `R = AO = ${hyp} ÷ 2 = ${Number((hyp / 2).toFixed(2))} cm`,
      };
    }
  }

  // 5. Cone / Pyramid volume quick breakdown
  if (variant === 'cone' || variant === 'pyramid-volume' || variant === 'pyramid') {
    if (m.radiusVal && m.heightVal) {
      return {
        formulaHint: 'لاحظ العلاقة بين نصف القطر r والارتفاع h في المثلث القائم الداخلي',
        computedNote: m.volumeVal ? `الحجم V = ${m.volumeVal}` : undefined,
      };
    }
    if (m.volumeVal && m.areaVal && m.heightVal) {
      return {
        formulaHint: `الهرم ثلث الموشور المشترك معه بالقاعدة والارتفاع: V = ⅓ × S × h`,
        computedNote: `S = ${m.areaVal}  ·  h = ${m.heightVal}  ·  V = ${m.volumeVal}`,
      };
    }
  }

  return null;
}

/**
 * Produces a tokenizable chalkboard equation string containing the REAL numbers
 * from an Applied Example + Solution so the chalkboard writes exact numerical steps.
 */
export function buildExampleChalkboardEquation(
  problem: string,
  solution: string,
  fallbackEq?: string
): string {
  const m = extractGeometryMeasurements(`${problem} ${solution}`);

  // 1. Check if solution already contains a clean multi-step formula with '=' (e.g. "5 × 5 = 25 cm^2", "2πR = 12π", "(-9/7) + (5/7) = -4/7")
  const explicitChains: string[] = [];
  const eqMatches = `${solution}`.match(
    /(?:[A-Za-z0-9()+\-×÷/^.'′π√]+\s*)+(?:=\s*(?:[A-Za-z0-9()+\-×÷/^.'′π√]+\s*(?:cm\^2|cm\^3|cm²|cm³|cm|m|°)?\s*)+)/g
  );
  if (eqMatches) {
    eqMatches.forEach((frag) => {
      const cleaned = frag.trim().replace(/\s+/g, ' ');
      if (cleaned.length >= 4 && cleaned.length <= 52 && !explicitChains.includes(cleaned)) {
        explicitChains.push(cleaned);
      }
    });
  }

  // 2. Special rich synthesis for geometry translation & measurement examples lacking explicit '=' in prose
  const parts: string[] = [];
  if (m.segLen) parts.push(`MN = ${m.segLen}`);
  if (m.sideLen) parts.push(`a = ${m.sideLen}`);
  if (m.perimeterVal) parts.push(`P = ${m.perimeterVal}`);

  // Add top 3 named lengths (avoiding repeating ones already included)
  const namedEntries = Object.entries(m.namedLengths).slice(0, 3);
  namedEntries.forEach(([k, v]) => {
    const token = `${k} = ${v}`;
    if (!parts.includes(token)) parts.push(token);
  });

  if (m.shiftLen) parts.push(`الانسحاب = ${m.shiftLen}`);
  if (m.angleVal && !namedEntries.some(([, v]) => v.includes('°'))) {
    parts.push(`∠ = ${m.angleVal}`);
  }

  // Combine extracted givens with explicit solution calculation!
  if (explicitChains.length > 0 && parts.length > 0) {
    const joinedGiven = parts.slice(0, 2).join(' | ');
    const solChain = explicitChains.slice(0, 2).join(' | ');
    if (!solChain.includes(parts[0])) {
      return `${joinedGiven} ➔ ${solChain}`;
    }
    return explicitChains.slice(0, 2).join(' | ');
  }

  if (explicitChains.length > 0) {
    return explicitChains.slice(0, 2).join(' | ');
  }

  if (m.segLen && m.shiftLen) {
    return `MN = ${m.segLen} | AB = ${m.shiftLen} ➔ M'N' = MN = ${m.segLen}`;
  }
  if (m.segLen) {
    return `MN = ${m.segLen} ➔ M'N' = ${m.segLen}`;
  }
  if (m.areaVal && m.shiftLen) {
    return `S = ${m.areaVal} | الانسحاب = ${m.shiftLen} ➔ S' = ${m.areaVal}`;
  }
  if (parts.length > 0) {
    return parts.join(' | ');
  }

  const probEq = `${problem}`.match(/([A-Za-z0-9()+\-×÷/^.'′]+\s*=\s*[A-Za-z0-9()+\-×÷/^.'′]+)/);
  if (probEq?.[1]) {
    return probEq[1].trim();
  }

  return (fallbackEq || '').split('|')[0]?.trim() || '';
}
