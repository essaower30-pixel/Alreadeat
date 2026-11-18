import React, { useState, useEffect, useRef } from 'react';
import { PenTool, CheckCircle2, Sparkles, Play } from 'lucide-react';
import { GeometryDiagram } from './GeometryDiagram';
import { GranularMathEquation, tokenizeEquation } from './GranularMathEquation';
import { FormattedMathText } from './FormattedMathText';
import { buildExampleChalkboardEquation } from '../utils/exampleMathExtractor';

interface ExampleVisualBoardProps {
  lessonId: string;
  sectionTitle: string;
  mathEquation?: string;
  exampleProblem: string;
  exampleSolution: string;
  theme?: 'paper' | 'chalkboard';
  /** Controlled continuous animation progress (0..1) inside the example phase */
  animProgress?: number;
  showSolution?: boolean;
}

/**
 * Visual Fraction Bars / Equation Number Line SVG for Algebra Examples
 * so Algebra applied examples also have visual blackboard drawings alongside text.
 */
export const AlgebraExampleVisualSvg: React.FC<{
  lessonId: string;
  problem: string;
  solution: string;
  equation: string;
  isDark: boolean;
  animProgress: number;
}> = ({ lessonId, problem, solution, equation, isDark, animProgress }) => {
  const textCombined = `${problem} ${solution} ${equation}`.toLowerCase();
  const isPower = lessonId.includes('u2') || textCombined.includes('^');
  const isInequalityOrEquation =
    lessonId.includes('u4') ||
    lessonId.includes('u5') ||
    textCombined.includes('x =') ||
    textCombined.includes('x >') ||
    textCombined.includes('x <') ||
    textCombined.includes('معادلة');

  const p = Math.min(1, Math.max(0, animProgress));
  const strokePrimary = isDark ? '#7dd3fc' : '#1d4ed8';
  const strokeSecondary = isDark ? '#34d399' : '#0f766e';
  const strokeAccent = isDark ? '#fbbf24' : '#d97706';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#cbd5e1' : '#334155';

  // Detect any fraction like a/b in problem/equation for visual bar representation
  const fracMatches = `${problem} ${equation}`.match(/(-?\d+)\s*\/\s*(\d+)/g) || [];
  const parsedFracs = fracMatches
    .slice(0, 2)
    .map((f) => {
      const [nStr, dStr] = f.split('/').map((s) => s.trim());
      const num = Math.abs(parseInt(nStr, 10));
      const den = Math.max(1, Math.min(12, parseInt(dStr, 10)));
      return { raw: f, num: Math.min(num, den), den };
    });

  if (isInequalityOrEquation) {
    const dotX = 75 + 195 * Math.min(1, p * 1.15);
    return (
      <svg viewBox="0 0 360 118" className="w-full max-w-[400px] h-auto block mx-auto select-none">
        <line x1="35" y1="68" x2="325" y2="68" stroke={strokePrimary} strokeWidth="2.8" />
        {[65, 125, 185, 245, 305].map((tx, idx) => (
          <g key={idx}>
            <line x1={tx} y1="62" x2={tx} y2="74" stroke={strokePrimary} strokeWidth="2" />
            <text x={tx} y="90" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>
              {idx - 1}
            </text>
          </g>
        ))}
        <line x1="75" y1="68" x2={dotX} y2="68" stroke={strokeAccent} strokeWidth="4.5" strokeLinecap="round" />
        <circle cx={dotX} cy="68" r="7" fill={strokeSecondary} stroke="#fef08a" strokeWidth="2.2" />
        <text x="180" y="28" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>
          تمثيل خطوات الحل على المستقيم العددي
        </text>
        <text x={dotX} y="52" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMain}>
          نقطة الحل
        </text>
      </svg>
    );
  }

  if (isPower) {
    return (
      <svg viewBox="0 0 360 115" className="w-full max-w-[400px] h-auto block mx-auto select-none">
        <rect x="26" y="34" width="90" height="44" rx="8" fill="rgba(56,189,248,0.16)" stroke={strokePrimary} strokeWidth="2" />
        <text x="71" y="61" fontSize="13" fontWeight="bold" textAnchor="middle" fill={textMain}>المعطى الأسّي</text>

        <line
          x1="120"
          y1="56"
          x2={120 + 62 * Math.min(1, p * 1.4)}
          y2="56"
          stroke={strokeAccent}
          strokeWidth="2.6"
        />
        {p < 0.72 && (
          <circle cx={120 + 62 * Math.min(1, p * 1.4)} cy="56" r="4.5" fill="#fef08a" stroke={strokeAccent} strokeWidth="2" />
        )}
        {p > 0.35 && (
          <>
            <rect x="188" y="34" width="146" height="44" rx="8" fill="rgba(52,211,153,0.16)" stroke={strokeSecondary} strokeWidth="2.2" />
            <text x="261" y="61" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
              تطبيق قواعد القوى
            </text>
          </>
        )}
      </svg>
    );
  }

  if (parsedFracs.length >= 1) {
    return (
      <svg viewBox="0 0 360 128" className="w-full max-w-[400px] h-auto block mx-auto select-none">
        <text x="180" y="20" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>
          التمثيل البصري للكسور على السبورة
        </text>
        {parsedFracs.map((fr, rowIdx) => {
          const y = 34 + rowIdx * 44;
          const totalW = 240;
          const cellW = totalW / fr.den;
          const visibleCells = Math.ceil(fr.num * Math.min(1, p * 1.25));
          return (
            <g key={rowIdx}>
              <text x="38" y={y + 18} fontSize="13" fontWeight="bold" textAnchor="middle" fill={textMain}>
                {fr.raw}
              </text>
              {Array.from({ length: fr.den }).map((_, cIdx) => {
                const filled = cIdx < visibleCells;
                const fill = filled
                  ? rowIdx === 0
                    ? 'rgba(56, 189, 248, 0.55)'
                    : 'rgba(52, 211, 153, 0.55)'
                  : isDark
                    ? 'rgba(30, 41, 59, 0.7)'
                    : 'rgba(241, 245, 249, 0.9)';
                return (
                  <rect
                    key={cIdx}
                    x={74 + cIdx * cellW}
                    y={y}
                    width={Math.max(4, cellW - 2)}
                    height="26"
                    rx="3"
                    fill={fill}
                    stroke={rowIdx === 0 ? strokePrimary : strokeSecondary}
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  }

  const arrowX = 152 + 54 * Math.min(1, p * 1.4);
  return (
    <svg viewBox="0 0 360 100" className="w-full max-w-[400px] h-auto block mx-auto select-none">
      <rect x="20" y="28" width="128" height="44" rx="10" fill="rgba(56,189,248,0.16)" stroke={strokePrimary} strokeWidth="2" />
      <text x="84" y="55" fontSize="13" fontWeight="bold" textAnchor="middle" fill={textMain}>1. المعطيات</text>
      <line x1="152" y1="50" x2={arrowX} y2="50" stroke={strokeAccent} strokeWidth="2.8" />
      {p < 0.72 && (
        <circle cx={arrowX} cy="50" r="4.5" fill="#fef08a" stroke={strokeAccent} strokeWidth="2" />
      )}
      <rect x="210" y="28" width="130" height="44" rx="10" fill="rgba(52,211,153,0.18)" stroke={strokeSecondary} strokeWidth="2" opacity={p > 0.3 ? 1 : 0.3} />
      <text x="275" y="55" fontSize="13" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>2. النتيجة والحل</text>
    </svg>
  );
};

export const ExampleVisualBoard: React.FC<ExampleVisualBoardProps> = ({
  lessonId,
  sectionTitle,
  mathEquation,
  exampleProblem,
  exampleSolution,
  theme = 'chalkboard',
  animProgress,
  showSolution = true
}) => {
  const isGeometry = lessonId.startsWith('g-');
  const isDark = theme === 'chalkboard';
  const [localReplayP, setLocalReplayP] = useState<number | null>(null);
  const replayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalReplayP(null);
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  }, [lessonId, sectionTitle, exampleProblem]);

  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, []);

  const triggerReplay = () => {
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    const start = performance.now();
    const duration = 2800;
    setLocalReplayP(0.02);
    replayTimerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / duration);
      setLocalReplayP(p);
      if (p >= 1) {
        if (replayTimerRef.current) clearInterval(replayTimerRef.current);
        replayTimerRef.current = null;
        setLocalReplayP(null);
      }
    }, 32);
  };

  const effectiveProgress = animProgress !== undefined ? animProgress : (localReplayP ?? 1);
  const effectiveDiagramProgress = animProgress !== undefined ? animProgress : localReplayP ?? undefined;

  const boardCalc = buildExampleChalkboardEquation(exampleProblem, exampleSolution, mathEquation);
  const calcTokensCount = boardCalc ? tokenizeEquation(boardCalc).length : 0;
  const visibleCalcTokens =
    effectiveProgress >= 0.99
      ? calcTokensCount
      : showSolution
        ? Math.max(1, Math.ceil(effectiveProgress * calcTokensCount))
        : Math.max(1, Math.ceil(effectiveProgress * Math.max(1, Math.floor(calcTokensCount / 2))));

  return (
    <div
      dir="rtl"
      className={`rounded-2xl border-2 p-3 sm:p-4 space-y-3 shadow-md ${
        isDark
          ? 'bg-[#0b1c15]/95 border-emerald-500/45 text-slate-100'
          : 'bg-white border-teal-600/35 text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 pb-2 border-b ${
          isDark ? 'border-emerald-800/60' : 'border-slate-200'
        }`}
      >
        <span
          className={`text-xs sm:text-sm font-black flex items-center gap-1.5 ${
            isDark ? 'text-amber-300' : 'text-teal-900'
          }`}
        >
          <PenTool className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-teal-700'}`} />
          <span>سبورة رسم وحل المثال التطبيقي خطوة بخطوة:</span>
        </span>
        <div className="flex items-center gap-2">
          {animProgress === undefined && (
            <button
              type="button"
              onClick={triggerReplay}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 border ${
                isDark
                  ? 'bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 border-emerald-500/40'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300'
              }`}
              title="تشغيل حركة الرسم والحل على السبورة"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>شاهد حركة المثال</span>
            </button>
          )}
          <span
            className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
              isDark
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            تطبيق بالرسم والمعادلات
          </span>
        </div>
      </div>

      {/* Live Visual Drawing for BOTH Geometry & Algebra Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-center">
        <div>
          {isGeometry ? (
            <GeometryDiagram
              lessonId={lessonId}
              sectionTitle={sectionTitle}
              sectionText={`${exampleProblem} ${exampleSolution} ${mathEquation || ''}`}
              theme={isDark ? 'chalkboard' : 'paper'}
              caption="رسم وحركة المثال التطبيقي"
              animProgress={effectiveDiagramProgress}
            />
          ) : (
            <div
              className={`rounded-xl border p-3 ${
                isDark
                  ? 'border-emerald-700/50 bg-slate-950/65'
                  : 'border-slate-300 bg-slate-50'
              }`}
            >
              <div
                className={`text-[11px] font-bold mb-1.5 flex items-center gap-1.5 ${
                  isDark ? 'text-amber-300' : 'text-teal-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>التمثيل البصري للمثال:</span>
              </div>
              <AlgebraExampleVisualSvg
                lessonId={lessonId}
                problem={exampleProblem}
                solution={exampleSolution}
                equation={boardCalc}
                isDark={isDark}
                animProgress={effectiveProgress}
              />
            </div>
          )}
        </div>

        {/* Step-by-Step Chalkboard Solution Equations & Reasoning */}
        <div className="space-y-2.5">
          <div
            className={`rounded-xl p-3 border ${
              isDark
                ? 'bg-slate-950/80 border-sky-500/40'
                : 'bg-sky-50/70 border-sky-300'
            }`}
          >
            <div className={`text-xs font-black mb-1 ${isDark ? 'text-sky-300' : 'text-sky-900'}`}>
              📝 المعطيات والمطلوب:
            </div>
            <div className={`text-xs sm:text-sm font-bold leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
              <FormattedMathText text={exampleProblem} size="md" />
            </div>
          </div>

          {boardCalc && (
            <div
              dir="ltr"
              className={`rounded-xl p-3 text-center border ${
                isDark
                  ? 'bg-[#081510] border-amber-400/45'
                  : 'bg-amber-50/70 border-amber-300'
              }`}
            >
              <div dir="rtl" className={`text-[11px] font-bold mb-1.5 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                ✍️ حساب الخطوات على السبورة:
              </div>
              <GranularMathEquation
                equation={boardCalc}
                theme={isDark ? 'chalkboard' : 'paper'}
                size="md"
                visibleTokenCount={visibleCalcTokens}
                activeWriteIndex={visibleCalcTokens > 0 && effectiveProgress < 0.99 ? visibleCalcTokens - 1 : null}
                animateEntrance={true}
              />
            </div>
          )}

          {showSolution && (
            <div
              className={`rounded-xl p-3 border ${
                isDark
                  ? 'bg-emerald-950/75 border-emerald-400/50'
                  : 'bg-emerald-50/85 border-emerald-400'
              }`}
            >
              <div className={`text-xs font-black mb-1 flex items-center gap-1 ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>النتيجة والاستنتاج:</span>
              </div>
              <div className={`text-xs sm:text-sm font-bold leading-relaxed ${isDark ? 'text-white' : 'text-emerald-950'}`}>
                <FormattedMathText text={exampleSolution} size="md" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
