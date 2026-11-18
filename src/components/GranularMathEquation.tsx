import React from 'react';

interface GranularMathEquationProps {
  equation: string;
  equationKey?: string;
  activeTokenKey?: string | null;
  currentSentence?: string;
  isSpeaking?: boolean;
  theme?: 'chalkboard' | 'paper';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  visibleTokenCount?: number;
  activeWriteIndex?: number | null;
  animateEntrance?: boolean;
}

// Arabic words mapping for numbers & terms used in Syrian 8th grade math
const NUM_WORDS_MAP: Record<string, string[]> = {
  '-9': ['ناقص تسعة', 'ناقص 9', '9-'],
  '9': ['تسعة', '9', 'أتساع'],
  '5': ['خمسة', '5', 'خمس', 'أخماس'],
  '1': ['واحد', '1', 'نصف', 'سدس', 'ثلث', 'خمس'],
  '4': ['أربعة', '4', 'أرباع'],
  '-4': ['ناقص أربعة', 'ناقص 4', '4-'],
  '-1': ['ناقص واحد', 'ناقص 1', 'ناقص نصف', 'ناقص سدس'],
  '-7': ['ناقص سبعة', 'ناقص 7'],
  '7': ['سبعة', '7', 'أسباع'],
  '0.5': ['نصف', '0.5', 'فاصل خمسة'],
  '-6.5': ['ستة ونصف', 'ناقص ستة ونصف', '6.5', '6.5-'],
  '3': ['ثلاثة', '3', 'أثلاث', 'ثلث'],
  '-2': ['ناقص اثنين', 'ناقص خمسان', '2-'],
  '-3': ['ناقص ثلاثة', 'ناقص 3', '3-'],
  '-10': ['ناقص عشرة', 'ناقص 10', '10-'],
  '-18': ['ناقص ثمانية عشر', '-18', '18-'],
  '-5': ['ناقص خمسة', '-5', '5-'],
  '10': ['عشرة', '10'],
  '19': ['تسعة عشر', '19'],
  '40': ['أربعون', 'أربعين', '40'],
  '28': ['ثمانية وعشرين', 'ثمانية وعشرون', '28'],
  '21': ['واحد وعشرون', 'واحد وعشرين', '21'],
  '8': ['ثمانية', '8', 'أثمان'],
  '11': ['أحد عشر', '11'],
  '15': ['خمسة عشر', '15'],
  '20': ['عشرون', 'عشرين', '20'],
  '6': ['ستة', '6', 'أسداس', 'سدس'],
  '12': ['اثنا عشر', 'اثني عشر', '12'],
  '24': ['أربعة وعشرين', 'أربعة وعشرون', '24'],
  '13': ['ثلاثة عشر', '13'],
  '3.9': ['3.9', 'ثلاثة فاصل تسعة'],
  '0.1': ['0.1', 'عُشر']
};

const DEN_WORDS_MAP: Record<string, string[]> = {
  '7': ['سبعة', 'أسباع', '7'],
  '8': ['ثمانية', 'أثمان', '8'],
  '2': ['اثنين', '2', 'نصف'],
  '3': ['ثلاثة', 'أثلاث', '3'],
  '6': ['ستة', 'أسداس', 'سدس', '6'],
  '-6': ['ناقص ستة', 'ستة', '6'],
  '5': ['خمسة', 'أخماس', '5'],
  '12': ['اثنا عشر', 'اثني عشر', '12'],
  '24': ['أربعة وعشرين', 'أربعة وعشرون', '24'],
  '9': ['تسعة', 'أتساع', '9'],
  '4': ['أربعة', 'أرباع', '4']
};

export const isMathTokenActiveInAudio = (token: string, sentence: string): boolean => {
  if (!sentence || !token) return false;
  const s = sentence.toLowerCase();
  const clean = token.replace(/[\(\)\s]/g, '');

  // Exact fraction matching: e.g. -9/7, 5/8, 0.5/3, (-7)/3, a/b
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 2) {
      const rawNum = parts[0].replace(/[\(\)]/g, '');
      const rawDen = parts[1].replace(/[\(\)]/g, '');

      // Check symbolic representation (e.g. "9/7", "-9/7")
      if (s.includes(clean) || s.includes(`${rawNum}/${rawDen}`) || s.includes(`${rawNum} / ${rawDen}`)) {
        return true;
      }
      if (s.includes(`${rawNum} على ${rawDen}`)) {
        return true;
      }

      // Check composite numerator e.g. (-9+5)/7, (1*4)/(2*4), (10+9)/12
      if (rawNum.includes('+') || rawNum.includes('-') || rawNum.includes('×') || rawNum.includes('÷')) {
        if (rawNum.includes('-9+5') && (s.includes('ناقص تسعة زائد خمسة') || s.includes('جمع البسطين') || s.includes('بسطين'))) return true;
        if (rawNum.includes('-7+0.5') && s.includes('ناقص سبعة زائد نصف')) return true;
        if (rawNum.includes('1-3') && (s.includes('واحد ناقص ثلاثة') || s.includes('1 ناقص 3'))) return true;
        if (rawNum.includes('10+9') && (s.includes('عشرة زائد تسعة') || s.includes('10 زائد 9'))) return true;
        if (rawNum.includes('4+5') && (s.includes('أربعة زائد خمسة') || s.includes('4 زائد 5'))) return true;
        if (rawNum.includes('-3+10') && (s.includes('ناقص ثلاثة زائد عشرة') || s.includes('جمع البسطين'))) return true;
        if (rawNum.includes('1×4') || rawNum.includes('1*4')) return s.includes('ضرب') || s.includes('أربعة') || s.includes('بسط ومقام النصف');
        if (rawNum.includes('21÷3') || rawNum.includes('21/3')) return s.includes('نختصر') || s.includes('قسمة على ثلاثة') || s.includes('ثلاثة');
        if (rawNum.includes('a+c')) return s.includes('a زائد c') || s.includes('جمع بسوط') || s.includes('الخاصة 1') || s.includes('الخاصة الأولى');
        if (rawNum.includes('a-c')) return s.includes('a ناقص c') || s.includes('طرح بسوط') || s.includes('الخاصة 1') || s.includes('الخاصة الأولى');
      }

      // Variable fraction: a/b, c/b
      if (rawNum === 'a' && rawDen === 'b' && (s.includes('a على b') || s.includes('الخاصة الأولى') || s.includes('الخاصة 1') || s.includes('a/b'))) return true;
      if (rawNum === 'c' && rawDen === 'b' && (s.includes('c على b') || s.includes('الخاصة الأولى') || s.includes('الخاصة 1') || s.includes('c/b'))) return true;

      // Special Arabic combined fraction expressions
      if (rawNum === '1' && rawDen === '2' && (s.includes('نصف') || s.includes('النصف') || s.includes('1/2'))) return true;
      if (rawNum === '-1' && rawDen === '2' && (s.includes('ناقص نصف') || s.includes('-1/2'))) return true;
      if (rawNum === '1' && rawDen === '3' && (s.includes('ثلث') || s.includes('الRest') || s.includes('1/3'))) return true;
      if (rawNum === '1' && rawDen === '6' && (s.includes('سدس') || s.includes('السدس') || s.includes('1/6'))) return true;
      if (rawNum === '1' && rawDen === '5' && (s.includes('خمس') || s.includes('الخمس') || s.includes('1/5'))) return true;
      if (rawNum === '2' && rawDen === '5' && (s.includes('خمسان') || s.includes('خمسي') || s.includes('2/5'))) return true;
      if (rawNum === '-2' && rawDen === '5' && (s.includes('ناقص خمسان') || s.includes('ناقص اثنين على خمسة') || s.includes('-2/5'))) return true;
      if (rawNum === '3' && rawDen === '5' && (s.includes('ثلاثة أخماس') || s.includes('3/5') || s.includes('تفاح'))) return true;
      if (rawNum === '6' && rawDen === '5' && (s.includes('ستة أخماس') || s.includes('6/5') || s.includes('عنب'))) return true;
      if (rawNum === '9' && rawDen === '5' && (s.includes('تسعة أخماس') || s.includes('9/5') || s.includes('مجموع'))) return true;
      if (rawNum === '10' && rawDen === '5' && (s.includes('عشرة أخماس') || s.includes('10/5') || s.includes('سعة الوعاء'))) return true;
      if (rawNum === '5' && rawDen === '8' && (s.includes('خمسة أثمان') || s.includes('5/8') || s.includes('5 على 8'))) return true;
      if (rawNum === '9' && rawDen === '8' && (s.includes('تسعة أثمان') || s.includes('9/8') || s.includes('9 على 8'))) return true;
      if (rawNum === '4' && rawDen === '8' && (s.includes('أربعة أثمان') || s.includes('4/8') || s.includes('4 على 8'))) return true;
      if (rawNum === '7' && rawDen === '8' && (s.includes('سبعة أثمان') || s.includes('7/8') || s.includes('7 على 8'))) return true;
      if (rawNum === '5' && rawDen === '3' && (s.includes('خمسة أثلاث') || s.includes('5/3') || s.includes('5 على 3'))) return true;
      if (rawNum === '5' && rawDen === '6' && (s.includes('خمسة أسداس') || s.includes('5/6') || s.includes('5 على 6'))) return true;
      if (rawNum === '3' && rawDen === '4' && (s.includes('ثلاثة أرباع') || s.includes('3/4') || s.includes('3 على 4'))) return true;
      if (rawNum === '7' && rawDen === '4' && (s.includes('سبعة أرباع') || s.includes('7/4') || s.includes('7 على 4'))) return true;
      if (rawNum === '8' && rawDen === '9' && (s.includes('ثمانية أتساع') || s.includes('8/9') || s.includes('8 على 9'))) return true;
      if (rawNum === '5' && rawDen === '9' && (s.includes('خمسة أتساع') || s.includes('5/9') || s.includes('5 على 9'))) return true;
      if (rawNum === '3' && rawDen === '9' && (s.includes('ثلاثة أتساع') || s.includes('3/9') || s.includes('3 على 9'))) return true;
      if (rawNum === '10' && rawDen === '12' && (s.includes('عشرة على اثني عشر') || s.includes('10/12'))) return true;
      if (rawNum === '9' && rawDen === '12' && (s.includes('تسعة على اثني عشر') || s.includes('9/12'))) return true;
      if (rawNum === '19' && rawDen === '12' && (s.includes('تسعة عشر على اثني عشر') || s.includes('19/12'))) return true;
      if (rawNum === '20' && rawDen === '12' && (s.includes('عشرين على اثني عشر') || s.includes('20/12'))) return true;
      if (rawNum === '21' && rawDen === '12' && (s.includes('واحد وعشرين على اثني عشر') || s.includes('21/12'))) return true;
      if (rawNum === '-1' && rawDen === '12' && (s.includes('ناقص واحد على اثني عشر') || s.includes('-1/12'))) return true;
      if (rawNum === '11' && rawDen === '24' && (s.includes('أحد عشر على أربعة وعشرين') || s.includes('11/24'))) return true;
      if (rawNum === '15' && rawDen === '24' && (s.includes('خمسة عشر على أربعة وعشرين') || s.includes('15/24'))) return true;
      if (rawNum === '4' && rawDen === '24' && (s.includes('أربعة على أربعة وعشرين') || s.includes('4/24'))) return true;
      if (rawNum === '40' && rawDen === '24' && (s.includes('أربعين على أربعة وعشرين') || s.includes('40/24'))) return true;
      if (rawNum === '28' && rawDen === '24' && (s.includes('ثمانية وعشرين على أربعة وعشرين') || s.includes('28/24'))) return true;
      if (rawNum === '21' && rawDen === '24' && (s.includes('واحد وعشرين على أربعة وعشرين') || s.includes('21/24'))) return true;
      if (rawNum === '-4' && rawDen === '7' && (s.includes('ناقص أربعة على سبعة') || s.includes('-4/7') || s.includes('الناتج'))) return true;
      if (rawNum === '-9' && rawDen === '7' && (s.includes('ناقص تسعة على سبعة') || s.includes('-9/7'))) return true;
      if (rawNum === '5' && rawDen === '7' && (s.includes('خمسة على سبعة') || s.includes('5/7'))) return true;
      if (rawNum === '-7' && rawDen === '3' && (s.includes('ناقص سبعة على ثلاثة') || s.includes('-7/3'))) return true;
      if (rawNum === '0.5' && rawDen === '3' && (s.includes('نصف على ثلاثة') || s.includes('0.5/3'))) return true;
      if (rawNum === '-6.5' && rawDen === '3' && (s.includes('ستة ونصف على ثلاثة') || s.includes('-6.5/3') || s.includes('6.5'))) return true;
      if (rawNum === '7' && rawDen === '6' && (s.includes('سبعة على ستة') || s.includes('7/6'))) return true;
      if (rawNum === '-3' && rawDen === '6' && (s.includes('ناقص ثلاثة على ستة') || s.includes('-3/6'))) return true;
      if (rawNum === '10' && rawDen === '6' && (s.includes('عشرة على ستة') || s.includes('10/6'))) return true;
      if (rawNum === '-10' && rawDen === '5' && (s.includes('ناقص عشرة على خمسة') || s.includes('-10/5'))) return true;
      if (rawNum === '-18' && rawDen === '6' && (s.includes('ناقص ثمانية عشر على ستة') || s.includes('-18/6'))) return true;

      // Check Arabic spoken word parts
      const nList = NUM_WORDS_MAP[rawNum] || [rawNum];
      const dList = DEN_WORDS_MAP[rawDen] || [rawDen];
      const nMatched = nList.some(w => s.includes(w));
      const dMatched = dList.some(w => s.includes(w));
      if (nMatched && dMatched) return true;
    }
  }

  // Parentheses or sub-expression matching: e.g. (-9 + 5), (a + c), (1 × 4), (-7 + 0.5)
  if (clean.includes('+') || clean.includes('-') || clean.includes('×') || clean.includes('÷')) {
    if (clean.includes('-9+5') && (s.includes('ناقص تسعة زائد خمسة') || s.includes('جمع البسطين') || s.includes('بسطين'))) return true;
    if (clean.includes('-7+0.5') && s.includes('ناقص سبعة زائد نصف')) return true;
    if (clean.includes('1-3') && (s.includes('واحد ناقص ثلاثة') || s.includes('1 ناقص 3'))) return true;
    if (clean.includes('10+9') && (s.includes('عشرة زائد تسعة') || s.includes('10 زائد 9'))) return true;
    if (clean.includes('40-28+9') && (s.includes('أربعين ناقص ثمانية وعشرين') || s.includes('40 ناقص 28'))) return true;
    if (clean.includes('1×4') && (s.includes('ضرب') || s.includes('أربعة') || s.includes('بسط ومقام النصف'))) return true;
    if (clean.includes('2×4') && (s.includes('ضرب') || s.includes('أربعة') || s.includes('ثمانية'))) return true;
    if (clean.includes('a+c') && (s.includes('a زائد c') || s.includes('جمع بسوط') || s.includes('الخاصة 1'))) return true;
    if (clean.includes('a-c') && (s.includes('a ناقص c') || s.includes('طرح بسوط') || s.includes('الخاصة 1'))) return true;
    if (clean.includes('21÷3') && (s.includes('نختصر') || s.includes('قسمة على ثلاثة') || s.includes('ثلاثة'))) return true;
    if (clean.includes('24÷3') && (s.includes('نختصر') || s.includes('قسمة على ثلاثة') || s.includes('ثمانية'))) return true;
  }

  // Standalone numbers and symbols
  if (clean === '-2' && (s.includes('ناقص اثنين') || s.includes('ناقص 2') || s.includes('يساوي -2'))) return true;
  if (clean === '3' && (s.includes('يساوي 3') || s.includes('الناتج 3'))) return true;
  if (clean === '-3' && (s.includes('يساوي -3') || s.includes('الناتج -3') || s.includes('ناقص ثلاثة'))) return true;
  if (clean === '24' && (s.includes('المضاعف المشترك') && s.includes('أربعة وعشرون'))) return true;
  if (clean === '12' && (s.includes('المقام المشترك') && s.includes('اثنا عشر'))) return true;
  if (clean === '6' && (s.includes('المضاعف المشترك') && s.includes('ستة'))) return true;
  if (clean === '2L' && (s.includes('2 ليتر') || s.includes('وعاء'))) return true;
  if (clean === 'A' && (s.includes('العبارة a') || s.includes('a تساوي') || s.includes('احسب a'))) return true;

  return false;
};

const MATH_OPERATORS = new Set(['+', '-', '=', '×', '÷', '|', '➔', '≈', '<', '>', '≤', '≥', '≠']);

// Split equation into granular atomic spans (numbers, fractions, expressions, operators)
// Uses a balanced-parenthesis scanner so (k × c) / d, (a × c) / (b × d), 7/(-3), (5 / -4),
// and nested-paren expressions always tokenize cleanly into vertical stacked fractions.
export const tokenizeEquation = (eq: string): string[] => {
  if (!eq || !eq.trim()) return [eq];

  const raw: string[] = [];
  let i = 0;
  const n = eq.length;

  const isBinaryOp = (tok: string) => MATH_OPERATORS.has(tok) || tok === '/';

  while (i < n) {
    const ch = eq[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Two-char arrow -> or =>
    if ((ch === '-' || ch === '=') && eq[i + 1] === '>') {
      raw.push('➔');
      i += 2;
      continue;
    }

    // Single-char operators & slash
    if (
      ch === '+' || ch === '=' || ch === '×' || ch === '÷' ||
      ch === '|' || ch === '➔' || ch === '≈' || ch === '<' ||
      ch === '>' || ch === '≤' || ch === '≥' || ch === '≠' || ch === '/'
    ) {
      raw.push(ch);
      i++;
      continue;
    }

    // Minus sign: unary negative if attached to operand (no space) AND at start or after an operator
    if (ch === '-') {
      const prev = raw.length > 0 ? raw[raw.length - 1] : null;
      const atExprStart = prev === null || isBinaryOp(prev);
      const nextCh = eq[i + 1] || '';
      if (!atExprStart || /\s/.test(nextCh) || nextCh === '') {
        raw.push('-');
        i++;
        continue;
      }
      // Unary minus attached cleanly to next operand (e.g. -2, -5, -(-2), -x)
      if (nextCh === '(') {
        raw.push('-');
        i++;
        continue;
      }
    }

    // Balanced parentheses or brackets group: (...) or [...]
    if (ch === '(' || ch === '[') {
      const openCh = ch;
      const closeCh = ch === '(' ? ')' : ']';
      let depth = 0;
      const start = i;
      while (i < n) {
        if (eq[i] === openCh) depth++;
        else if (eq[i] === closeCh) {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      let group = eq.slice(start, i);
      // Consume optional power suffix like ^2, ^(-n), ^(n)
      while (i < n && eq[i] === '^') {
        if (eq[i + 1] === '(') {
          let pDepth = 0;
          const pStart = i;
          i++; // move to '('
          while (i < n) {
            if (eq[i] === '(') pDepth++;
            else if (eq[i] === ')') {
              pDepth--;
              if (pDepth === 0) {
                i++;
                break;
              }
            }
            i++;
          }
          group += eq.slice(pStart, i);
        } else {
          const pStart = i;
          i++;
          while (i < n && /[a-zA-Z0-9+\-]/.test(eq[i])) i++;
          group += eq.slice(pStart, i);
        }
      }
      raw.push(group);
      continue;
    }

    // Stray/unmatched closing bracket or paren (e.g. "1)" list label or mismatched pair)
    if (ch === ')' || ch === ']') {
      raw.push(ch);
      i++;
      continue;
    }

    // Operand token: signed numbers, identifiers, radicals, units (L / ليتر / kg), powers (10^4, 10^(-7))
    const start = i;
    if (ch === '-') i++;
    while (i < n) {
      const c = eq[i];
      if (/\s/.test(c) || c === '/' || MATH_OPERATORS.has(c)) break;
      if (c === '^') {
        i++;
        if (eq[i] === '(') {
          let pDepth = 0;
          while (i < n) {
            if (eq[i] === '(') pDepth++;
            else if (eq[i] === ')') {
              pDepth--;
              if (pDepth === 0) {
                i++;
                break;
              }
            }
            i++;
          }
          continue;
        }
        if (eq[i] === '-') i++;
        while (i < n && /[a-zA-Z0-9]/.test(eq[i])) i++;
        continue;
      }
      if (c === '(' || c === '[') {
        // Function-like radical/call e.g. √(a/b), E(x)
        const closeCh = c === '(' ? ')' : ']';
        let pDepth = 0;
        while (i < n) {
          if (eq[i] === c) pDepth++;
          else if (eq[i] === closeCh) {
            pDepth--;
            if (pDepth === 0) {
              i++;
              break;
            }
          }
          i++;
        }
        continue;
      }
      if (c === ')' || c === ']') break;
      i++;
    }
    // Safety guarantee: always advance at least 1 char if nothing consumed
    if (i === start) {
      raw.push(eq[i]);
      i++;
    } else {
      const word = eq.slice(start, i);
      if (word) raw.push(word);
    }
  }

  // Pass 2: combine numerator / denominator pairs around '/' into stacked fraction tokens
  const combined: string[] = [];
  for (let idx = 0; idx < raw.length; idx++) {
    const tok = raw[idx];
    if (
      tok === '/' &&
      combined.length > 0 &&
      idx + 1 < raw.length &&
      !isBinaryOp(combined[combined.length - 1]) &&
      !isBinaryOp(raw[idx + 1])
    ) {
      const numTok = combined.pop()!;
      const denTok = raw[idx + 1];
      let frac = `${numTok} / ${denTok}`;
      if (idx + 2 < raw.length && (raw[idx + 2] === 'L' || raw[idx + 2] === 'ليتر')) {
        frac += ` ${raw[idx + 2]}`;
        idx++;
      }
      combined.push(frac);
      idx++;
    } else if (
      /^-?\d+(?:\.\d+)?$/.test(tok) &&
      idx + 1 < raw.length &&
      (raw[idx + 1] === 'L' || raw[idx + 1] === 'ليتر')
    ) {
      combined.push(`${tok} ${raw[idx + 1]}`);
      idx++;
    } else {
      combined.push(tok);
    }
  }

  return combined.length > 0 ? combined : [eq];
};

// Returns arrays of non-operator token indices grouped by top-level '|' separator
export const getEquationPartTokenIndices = (eq: string): number[][] => {
  const tokens = tokenizeEquation(eq);
  const parts: number[][] = [[]];
  tokens.forEach((t, idx) => {
    const trimmed = t.trim();
    if (trimmed === '|') {
      parts.push([]);
      return;
    }
    if (!MATH_OPERATORS.has(trimmed) && trimmed !== '/' && trimmed !== '') {
      parts[parts.length - 1].push(idx);
    }
  });
  return parts;
};

export interface ParsedFraction {
  num: string;
  den: string;
  unit: string;
  hasOuterParens: boolean;
}

export function parseFraction(raw: string): ParsedFraction | null {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();

  // Strip wrapping outer parentheses e.g. "(-9 / 7)" or "(5 / 7)"
  let hasOuterParens = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let fullWrap = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      if (depth === 0) {
        fullWrap = false;
        break;
      }
    }
    if (fullWrap) {
      s = s.slice(1, -1).trim();
      hasOuterParens = true;
    }
  }

  // Check optional trailing unit like L or ليتر
  let unit = '';
  const unitMatch = s.match(/\s*(L|ليتر)$/);
  if (unitMatch) {
    unit = unitMatch[1];
    s = s.slice(0, -unitMatch[0].length).trim();
  }

  // Find the division slash at top-level (depth === 0) that separates numerator and denominator
  let slashIdx = -1;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (s[i] === '/' && depth === 0) {
      slashIdx = i;
      break;
    }
  }

  if (slashIdx === -1) {
    // Only fall back when the string didn't already have outer parens stripped around multiple terms
    slashIdx = s.indexOf('/');
  }

  if (slashIdx === -1) return null;

  let num = s.slice(0, slashIdx).trim();
  let den = s.slice(slashIdx + 1).trim();

  // Clean parens from simple num or den: e.g. (-7) -> -7, (k × c) -> k × c
  const stripParens = (str: string): string => {
    let t = str.trim();
    if (t.startsWith('(') && t.endsWith(')')) {
      let d = 0;
      let ok = true;
      for (let i = 0; i < t.length - 1; i++) {
        if (t[i] === '(') d++;
        else if (t[i] === ')') d--;
        if (d === 0) {
          ok = false;
          break;
        }
      }
      if (ok) return t.slice(1, -1).trim();
    }
    return t;
  };

  num = stripParens(num);
  den = stripParens(den);

  if (!num || !den) return null;

  return { num, den, unit, hasOuterParens };
}

export const GranularMathEquation: React.FC<GranularMathEquationProps> = ({
  equation,
  equationKey,
  activeTokenKey,
  currentSentence = '',
  isSpeaking = false,
  theme = 'chalkboard',
  className = '',
  size = 'md',
  visibleTokenCount,
  activeWriteIndex = null,
  animateEntrance = false
}) => {
  const tokens = tokenizeEquation(equation);
  const limitCount = visibleTokenCount === undefined ? tokens.length : Math.max(0, Math.min(tokens.length, visibleTokenCount));
  const displayedTokens = tokens.slice(0, limitCount);

  const textSize = size === 'lg' ? 'text-lg sm:text-xl md:text-2xl' : size === 'sm' ? 'text-sm md:text-base' : 'text-base md:text-lg';
  const fracNumDenSize = size === 'lg' ? 'text-base sm:text-lg md:text-xl' : size === 'sm' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base md:text-lg';

  return (
    <span 
      dir="ltr" 
      className={`math-content inline-flex flex-wrap items-center justify-center gap-1.5 font-sans select-text font-extrabold unicode-bidi-isolate ${textSize} ${className}`}
      style={{ unicodeBidi: 'isolate' }}
    >
      {displayedTokens.map((token, i) => {
        const trimmed = token.trim();
        const isOperator = MATH_OPERATORS.has(trimmed);
        const tokenKey = equationKey ? `${equationKey}-${i}` : undefined;
        const isCurrentlyWriting = activeWriteIndex !== null && i === activeWriteIndex;
        const entranceClass = animateEntrance
          ? isOperator
            ? 'animate-chalk-op'
            : 'animate-chalk-write'
          : '';

        // Check if token is a mathematical fraction (e.g. (-9 / 7), 5/7, (a+c)/b, 4/8, etc.)
        const fraction = !isOperator && trimmed.includes('/') ? parseFraction(trimmed) : null;

        if (isOperator) {
          return (
            <span 
              key={tokenKey || i} 
              data-token-key={tokenKey}
              className={`px-1 select-none transition-colors self-center ${entranceClass} ${
                isCurrentlyWriting
                  ? 'text-amber-300 font-black scale-110'
                  : theme === 'chalkboard' ? 'text-slate-300 font-normal' : 'text-slate-500 font-normal'
              }`}
            >
              {token}
            </span>
          );
        }

        // =========================================================================
        // PROPER SYRIAN TEXTBOOK VERTICAL STACKED FRACTION RENDERER (NO SLASHES!)
        // =========================================================================
        if (fraction) {
          // Strictly highlight only the specific active token being read by the teacher
          const wholeActive =
            isCurrentlyWriting ||
            (isSpeaking && Boolean(activeTokenKey && tokenKey && activeTokenKey === tokenKey));

          const numActive =
            wholeActive ||
            (isSpeaking && Boolean(activeTokenKey && tokenKey && activeTokenKey === `${tokenKey}-num`));

          const denActive =
            wholeActive ||
            (isSpeaking && Boolean(activeTokenKey && tokenKey && activeTokenKey === `${tokenKey}-den`));

          const barActive = wholeActive;

          return (
            <span
              key={tokenKey || i}
              data-token-key={tokenKey}
              className={`inline-flex items-center align-middle mx-1 my-0.5 ${entranceClass}`}
            >
              {fraction.hasOuterParens && (
                <span className={`text-base font-normal select-none px-0.5 ${theme === 'chalkboard' ? 'text-slate-400' : 'text-slate-400'}`}>
                  (
                </span>
              )}

              {/* Vertical Stack: Numerator / Solid Horizontal Line / Denominator */}
              <span className={`inline-flex flex-col items-center justify-center leading-none text-center ${fracNumDenSize}`}>
                {/* Numerator */}
                <span
                  data-token-key={tokenKey ? `${tokenKey}-num` : undefined}
                  className={`px-1 py-0.5 transition-all duration-200 select-text ${
                    numActive
                      ? theme === 'paper'
                        ? 'text-amber-900 bg-amber-200 font-black scale-110 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-math-glow rounded ring-1 ring-amber-400'
                        : 'text-yellow-300 font-black scale-110 drop-shadow-[0_0_14px_rgba(253,224,71,1)] animate-math-glow'
                      : theme === 'chalkboard'
                        ? 'text-emerald-200 font-bold hover:text-emerald-100'
                        : 'text-slate-950 font-extrabold hover:text-teal-900'
                  }`}
                  style={{
                    textShadow: numActive
                      ? theme === 'paper'
                        ? '0 0 8px rgba(245,158,11,0.4)'
                        : '0 0 16px rgba(253,224,71,0.95), 0 0 28px rgba(250,204,21,0.7)'
                      : 'none'
                  }}
                >
                  {fraction.num}
                </span>

                {/* Clean, solid horizontal fraction line (vinculum) */}
                <span
                  data-token-key={tokenKey ? `${tokenKey}-bar` : undefined}
                  className={`w-full min-w-[1.25rem] transition-all duration-200 my-[3px] block rounded-full ${
                    barActive
                      ? 'bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,1)] h-[3px]'
                      : theme === 'chalkboard'
                        ? 'bg-emerald-400/90 h-[2px]'
                        : 'bg-slate-800 h-[2.5px]'
                  }`}
                />

                {/* Denominator */}
                <span
                  data-token-key={tokenKey ? `${tokenKey}-den` : undefined}
                  className={`px-1 py-0.5 transition-all duration-200 select-text ${
                    denActive
                      ? theme === 'paper'
                        ? 'text-amber-900 bg-amber-200 font-black scale-110 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-math-glow rounded ring-1 ring-amber-400'
                        : 'text-yellow-300 font-black scale-110 drop-shadow-[0_0_14px_rgba(253,224,71,1)] animate-math-glow'
                      : theme === 'chalkboard'
                        ? 'text-emerald-200 font-bold hover:text-emerald-100'
                        : 'text-slate-950 font-extrabold hover:text-teal-900'
                  }`}
                  style={{
                    textShadow: denActive
                      ? theme === 'paper'
                        ? '0 0 8px rgba(245,158,11,0.4)'
                        : '0 0 16px rgba(253,224,71,0.95), 0 0 28px rgba(250,204,21,0.7)'
                      : 'none'
                  }}
                >
                  {fraction.den}
                </span>
              </span>

              {fraction.hasOuterParens && (
                <span className={`text-base font-normal select-none px-0.5 ${theme === 'chalkboard' ? 'text-slate-400' : 'text-slate-400'}`}>
                  )
                </span>
              )}

              {fraction.unit && (
                <span className="mr-1 text-xs font-sans text-amber-300">{fraction.unit}</span>
              )}
            </span>
          );
        }

        // Standard Atomic Number or Symbol (non-fraction): strictly matches active token key
        const active =
          isCurrentlyWriting ||
          (isSpeaking && Boolean(activeTokenKey && tokenKey && activeTokenKey === tokenKey));

        return (
          <span
            key={tokenKey || i}
            data-token-key={tokenKey}
            className={`transition-all duration-200 inline-block px-1.5 py-0.5 rounded self-center ${entranceClass} ${
              active
                ? theme === 'paper'
                  ? 'text-amber-900 bg-amber-200/90 font-black scale-110 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-math-glow ring-1 ring-amber-400'
                  : 'text-yellow-300 font-black scale-110 drop-shadow-[0_0_14px_rgba(253,224,71,1)] animate-math-glow'
                : theme === 'chalkboard'
                  ? 'text-emerald-300 font-bold hover:text-emerald-200'
                  : 'text-slate-950 font-extrabold hover:text-teal-900'
            }`}
            style={{
              textShadow: active 
                ? theme === 'paper'
                  ? '0 0 8px rgba(245,158,11,0.4)'
                  : '0 0 16px rgba(253,224,71,0.95), 0 0 28px rgba(250,204,21,0.7)' 
                : 'none'
            }}
          >
            {token.replace(/\//g, ' ÷ ')}
          </span>
        );
      })}
      {visibleTokenCount !== undefined && limitCount > 0 && limitCount < tokens.length && (
        <span
          aria-hidden="true"
          className="inline-block w-1.5 h-6 sm:h-7 bg-amber-300 rounded-full animate-chalk-cursor mx-1 self-center shadow-[0_0_8px_rgba(253,224,71,0.9)]"
        />
      )}
    </span>
  );
};
