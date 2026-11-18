import React from 'react';

interface FormattedMathTextProps {
  text: string;
  className?: string;
  theme?: 'chalkboard' | 'paper' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Regex to detect fractions in any text string:
 * 1. (num) / (den) - e.g. (a × c) / (b × c)
 * 2. (num / den) - e.g. (-9/7), (5/7), (1/4)
 * 3. (num) / den - e.g. (-9 + 5) / 7, (x + 1) / 2
 * 4. num / (den) - e.g. 42 / (-210), 1 / (-5)
 * 5. num / den - e.g. 15/24, -4/7, 5/8, 1/6, a/b, c/d, y/x, 1/1000000
 */
const FRACTION_REGEX = /(\/\/|\([^()]+\)\s*\/(?!\/)\s*\([^()]+\)|\(\s*[^()\/]+\s*\/(?!\/)\s*[^()\/]+\s*\)|\([^()]+\)\s*\/(?!\/)\s*-?[a-zA-Z0-9]+(?:\.[0-9]+)?|-?[a-zA-Z0-9]+(?:\.[0-9]+)?\s*\/(?!\/)\s*\([^()]+\)|-?[a-zA-Z0-9]+(?:\.[0-9]+)?\s*\/(?!\/)\s*-?[a-zA-Z0-9]+(?:\.[0-9]+)?)/g;
const EXACT_FRACTION_TEST = /^(?:\([^()]+\)\s*\/(?!\/)\s*\([^()]+\)|\(\s*[^()\/]+\s*\/(?!\/)\s*[^()\/]+\s*\)|\([^()]+\)\s*\/(?!\/)\s*-?[a-zA-Z0-9]+(?:\.[0-9]+)?|-?[a-zA-Z0-9]+(?:\.[0-9]+)?\s*\/(?!\/)\s*\([^()]+\)|-?[a-zA-Z0-9]+(?:\.[0-9]+)?\s*\/(?!\/)\s*-?[a-zA-Z0-9]+(?:\.[0-9]+)?)$/;

/**
 * Clean outer parenthesis if they wrap the entire string
 */
function stripOuterParens(s: string): { content: string; hasParens: boolean } {
  const trimmed = s.trim();
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    // Verify it's a matching outer pair
    let depth = 0;
    let isOuter = true;
    for (let i = 0; i < trimmed.length - 1; i++) {
      if (trimmed[i] === '(') depth++;
      else if (trimmed[i] === ')') depth--;
      if (depth === 0) {
        isOuter = false;
        break;
      }
    }
    if (isOuter) {
      return { content: trimmed.slice(1, -1).trim(), hasParens: true };
    }
  }
  return { content: trimmed, hasParens: false };
}

/**
 * Parse a fraction string into numerator, denominator, and paren state
 */
function parseFractionString(raw: string): { num: string; den: string; hasParens: boolean } | null {
  const { content, hasParens } = stripOuterParens(raw);
  const slashIdx = content.indexOf('/');
  if (slashIdx === -1) return null;

  let num = content.slice(0, slashIdx).trim();
  let den = content.slice(slashIdx + 1).trim();

  // Clean parens from simple num or den: e.g. (-7) -> -7
  if (num.startsWith('(') && num.endsWith(')')) {
    const stripped = stripOuterParens(num);
    if (stripped.hasParens) num = stripped.content;
  }
  if (den.startsWith('(') && den.endsWith(')')) {
    const stripped = stripOuterParens(den);
    if (stripped.hasParens) den = stripped.content;
  }

  if (!num || !den) return null;
  return { num, den, hasParens };
}

/**
 * StackedFraction: Renders a Syrian math textbook fraction vertically
 * with numerator vertically on top of denominator and a solid horizontal line.
 * NO SLASHES (/) ARE USED!
 */
export const StackedFraction: React.FC<{
  num: string;
  den: string;
  hasParens?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ num, den, hasParens = false, className = '', size = 'md' }) => {
  const textSize = size === 'lg' ? 'text-lg sm:text-xl md:text-2xl' : size === 'sm' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base md:text-lg';
  const barHeight = size === 'lg' ? 'h-[2.5px]' : 'h-[2px]';

  return (
    <span 
      className={`inline-flex items-center align-middle mx-1.5 font-sans font-extrabold select-text ${textSize} ${className}`} 
      dir="ltr"
    >
      {hasParens && <span className="text-slate-500 select-none mr-0.5 font-normal text-lg sm:text-xl leading-none">(</span>}
      <span className="inline-flex flex-col items-center justify-center text-center leading-none">
        <span className="px-1.5 text-center leading-tight pb-0.5 whitespace-nowrap">{num}</span>
        <span className={`w-full ${barHeight} bg-current my-0.5 min-w-[18px] rounded-full`} />
        <span className="px-1.5 text-center leading-tight pt-0.5 whitespace-nowrap">{den}</span>
      </span>
      {hasParens && <span className="text-slate-500 select-none ml-0.5 font-normal text-lg sm:text-xl leading-none">)</span>}
    </span>
  );
};

/**
 * FormattedMathText: Parses any text containing math/fractions and renders all fractions
 * using the Syrian curriculum stacked layout with horizontal line.
 * Converts any remaining division slashes into the proper division sign (÷).
 */
export const FormattedMathText: React.FC<FormattedMathTextProps> = ({
  text,
  className = '',
  theme = 'default',
  size = 'md'
}) => {
  if (!text) return null;

  // Split text by fraction patterns while keeping delimiters
  const parts = text.split(FRACTION_REGEX);

  return (
    <span className={`math-content inline leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part === '//') {
          return (
            <span key={index} dir="ltr" className="mx-1 font-extrabold inline-block">
              //
            </span>
          );
        }

        // Check if this part is strictly a genuine fraction (never parallel // or plain prose)
        if (part.includes('/') && !part.includes('//') && EXACT_FRACTION_TEST.test(part.trim())) {
          const frac = parseFractionString(part);
          if (frac) {
            return (
              <StackedFraction
                key={index}
                num={frac.num}
                den={frac.den}
                hasParens={frac.hasParens}
                size={size}
              />
            );
          }
          return <span key={index}>{part.replace(/\//g, ' ÷ ')}</span>;
        }

        // Regular text or numbers
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
