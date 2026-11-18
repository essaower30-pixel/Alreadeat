import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Compass } from 'lucide-react';
import {
  extractGeometryMeasurements,
  buildSmartDiagramInsights,
} from '../utils/exampleMathExtractor';

export type GeometryDiagramVariant =
  | 'parallelogram'
  | 'quads-special'
  | 'translation-pavement-ab'
  | 'translation-pavement-am'
  | 'translation-tile'
  | 'translation-point'
  | 'translation-segment'
  | 'translation-triangle'
  | 'translation-circle'
  | 'congruent-sas'
  | 'congruent-asa'
  | 'congruent-sss'
  | 'midsegment'
  | 'midsegment-mnp'
  | 'quad-midpoints'
  | 'midline-converse'
  | 'thales'
  | 'three-ratios'
  | 'trapezoid-mid'
  | 'perpendicular-bisectors'
  | 'altitudes'
  | 'medians-centroid'
  | 'angle-bisectors'
  | 'right-triangle-circle'
  | 'pythagoras'
  | 'pythagoras-converse'
  | 'point-line-distance'
  | 'circle-tangent'
  | 'pyramid'
  | 'pyramid-volume'
  | 'cone'
  | 'cylinder';

interface GeometryDiagramProps {
  lessonId: string;
  sectionTitle?: string;
  sectionText?: string;
  /** Optional raw problem statement so givens appear immediately & solution values reveal progressively. */
  problemText?: string;
  theme?: 'paper' | 'chalkboard';
  caption?: string;
  className?: string;
  /** Controlled continuous animation progress (0 = start state, 1 = destination arrived). */
  animProgress?: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const segProgress = (p: number, start: number, end: number) =>
  clamp01((p - start) / Math.max(0.0001, end - start));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export function resolveGeometryDiagramVariant(
  lessonId: string,
  sectionTitle = '',
  sectionText = ''
): GeometryDiagramVariant | null {
  if (!lessonId.startsWith('g-')) return null;

  const combined = `${sectionTitle} ${sectionText}`.toLowerCase();

  if (
    combined.includes('c -> p') ||
    combined.includes('a -> m') ||
    combined.includes('الحجر 4') ||
    combined.includes('من a إلى m') ||
    combined.includes('انسحاب آخر')
  ) {
    return 'translation-pavement-am';
  }
  if (
    combined.includes('الحجر 1') ||
    combined.includes('الحجر 2') ||
    combined.includes('abdc') ||
    combined.includes('ab // cd') ||
    combined.includes('ترصيف')
  ) {
    return 'translation-pavement-ab';
  }

  if (combined.includes('معين') || combined.includes('مستطيل') || combined.includes('مربع')) {
    if (lessonId === 'g-u1-launch' || lessonId === 'g-u1-rev') return 'quads-special';
  }
  if (combined.includes('متوازي أضلاع') && (combined.includes('ab =') || combined.includes('ad =') || combined.includes('قياس الزاوية'))) {
    if (lessonId === 'g-u1-launch') return 'parallelogram';
  }
  if (
    combined.includes("abc'c") ||
    combined.includes("abm'm") ||
    combined.includes("[cc']") ||
    combined.includes('صورة نقطة') ||
    combined.includes('صورة c')
  ) {
    return 'translation-point';
  }
  if (
    combined.includes("m'n'") ||
    combined.includes('منتصف قطعة مستقيمة') ||
    combined.includes('صورة قطعة مستقيمة') ||
    combined.includes('قطعة مستقيمة')
  ) {
    return 'translation-segment';
  }
  if (
    combined.includes("a'b'c'") ||
    combined.includes('نقل المثلث') ||
    ((combined.includes('مثلث abc قائم') || combined.includes('مثلث قائم')) && lessonId.startsWith('g-u1'))
  ) {
    return 'translation-triangle';
  }
  if (combined.includes('ز-ض-ز') || combined.includes('زاويتان وضلع') || combined.includes('الحالة الثانية')) {
    return 'congruent-asa';
  }
  if (combined.includes('ض-ض-ض') || combined.includes('ثلاثة أضلاع') || combined.includes('الأضلاع الثلاثة') || combined.includes('الحالة الثالثة')) {
    return 'congruent-sss';
  }
  if (combined.includes('ض-ز-ض') || combined.includes('ضلعان وزاوية') || combined.includes('محصورة') || (combined.includes('abc') && combined.includes('def'))) {
    return 'congruent-sas';
  }
  if (combined.includes('دائرة') && (lessonId === 'g-u1-l3' || combined.includes('مماس'))) {
    return lessonId === 'g-u4-l4' || combined.includes('مماس') ? 'circle-tangent' : 'translation-circle';
  }

  if (combined.includes('mnp') || combined.includes('p منتصف') || combined.includes('منتصفات أضلاعه الثلاثة')) {
    return 'midsegment-mnp';
  }
  if (combined.includes('ij') && combined.includes('kl')) return 'quad-midpoints';
  if (combined.includes('شبه منحرف')) return 'trapezoid-mid';
  if (combined.includes('هرم') && combined.includes('حجم')) return 'pyramid-volume';
  if (combined.includes('هرم')) return 'pyramid';
  if (combined.includes('مخروط')) return 'cone';
  if (combined.includes('أسطوانة')) return 'cylinder';
  if (combined.includes('فيثاغورث') && combined.includes('عكس')) return 'pythagoras-converse';
  if (combined.includes('فيثاغورث')) return 'pythagoras';

  const map: Record<string, GeometryDiagramVariant> = {
    'g-u1-launch': 'parallelogram',
    'g-u1-l1': 'translation-tile',
    'g-u1-l2': 'translation-point',
    'g-u1-l3': 'translation-circle',
    'g-u1-l4': 'congruent-sas',
    'g-u1-rev': 'quads-special',
    'g-u2-launch': 'midsegment',
    'g-u2-l1': 'midsegment',
    'g-u2-l2': 'midline-converse',
    'g-u2-l3': 'thales',
    'g-u2-l4': 'three-ratios',
    'g-u2-rev': 'trapezoid-mid',
    'g-u3-launch': 'medians-centroid',
    'g-u3-l1': 'perpendicular-bisectors',
    'g-u3-l2': 'altitudes',
    'g-u3-l3': 'medians-centroid',
    'g-u3-l4': 'angle-bisectors',
    'g-u3-rev': 'perpendicular-bisectors',
    'g-u4-launch': 'right-triangle-circle',
    'g-u4-l1': 'right-triangle-circle',
    'g-u4-l2': 'pythagoras',
    'g-u4-l3': 'point-line-distance',
    'g-u4-l4': 'circle-tangent',
    'g-u4-rev': 'pythagoras-converse',
    'g-u5-launch': 'cylinder',
    'g-u5-l1': 'pyramid',
    'g-u5-l2': 'pyramid-volume',
    'g-u5-l3': 'cone',
    'g-u5-l4': 'cone',
    'g-u5-rev': 'pyramid-volume',
  };

  return map[lessonId] || 'parallelogram';
}

const VARIANT_TITLES: Record<GeometryDiagramVariant, string> = {
  parallelogram: 'متوازي الأضلاع ABCD وخواص أضلاعه وقطراه',
  'quads-special': 'متوازيات الأضلاع الخاصة: المستطيل والمعين والمربع',
  'translation-pavement-ab': 'الترصيف: انتقال الحجر ① إلى الحجر ② عبر A ➔ B و C ➔ D و E ➔ F',
  'translation-pavement-am': 'الترصيف: حركة انتقال A ➔ M و C ➔ P (الحجر ① ➔ ④ و ⑥ ➔ ⑨)',
  'translation-tile': 'حركة الانسحاب الذي ينقل الشكل F إلى F′',
  'translation-point': 'انتقال النقطة M ➔ M′ وفق الشعاع A ➔ B عبر متوازي الأضلاع',
  'translation-segment': 'انتقال القطعة [MN] ومنتصفها I والمستقيم (d) إلى [M′N′]',
  'translation-triangle': 'انتقال المثلث ABC خطوة بخطوة ليصبح المثلث A′B′C′',
  'translation-circle': 'انتقال مركز الدائرة O ➔ O′ مع ثبات نصف القطر R′ = R',
  'congruent-sas': 'انطباق المثلثين بالحالة الأولى (ض-ز-ض)',
  'congruent-asa': 'انطباق المثلثين بالحالة الثانية (ز-ض-ز)',
  'congruent-sss': 'انطباق المثلثين بالحالة الثالثة (ض-ض-ض)',
  midsegment: 'مبرهنة منتصفي ضلعين: (MN) // (BC) و MN = ½ BC',
  'midsegment-mnp': 'مثلث المنتصفات MNP داخل المثلث ABC (محيطه نصف المحيط)',
  'quad-midpoints': 'منتصفات أضلاع الرباعي ABCD تكوّن متوازي الأضلاع IJKL',
  'midline-converse': 'موازٍ لضلع من منتصف ضلع يمر بمنتصف الضلع الثالث',
  thales: 'مستقيمات متوازية وقاطعان (مبرهنة تالس)',
  'three-ratios': 'تساوي ثلاث نسب: AM/AB = AN/AC = MN/BC',
  'trapezoid-mid': 'المستقيم الموازي لقاعدتي شبه المنحرف من منتصف الساق',
  'perpendicular-bisectors': 'تلاقي محاور أضلاع المثلث في مركز الدائرة المارة برؤوسه O',
  altitudes: 'تلاقي ارتفاعات المثلث الثلاثة [AH], [BH′], [CH″] في نقطة واحدة H',
  'medians-centroid': 'المتوسطات ومركز ثقل المثلث G (AG = ⅔ AA′)',
  'angle-bisectors': 'منصفات زوايا المثلث ومركز الدائرة الماسة داخلاً I',
  'right-triangle-circle': 'الدائرة المارة برؤوس المثلث القائم: المتوسط AO = ½ BC',
  pythagoras: 'مبرهنة فيثاغورث: مربع الوتر يساوي مجموع مربعي الضلعين القائمين',
  'pythagoras-converse': 'عكس مبرهنة فيثاغورث لإثبات التعامد والزاوية القائمة',
  'point-line-distance': 'المسقط القائم H: أقصر مسافة بين النقطة A والمستقيم (d)',
  'circle-tangent': 'مماس الدائرة (MT) عمودي على نصف القطر [OT] في نقطة التماس',
  pyramid: 'الهرم المنتظم وعناصره: الرأس S والقاعدة ABCD والمركز O والارتفاع h',
  'pyramid-volume': 'حجم الهرم: V = ⅓ × مساحة القاعدة × الارتفاع',
  cone: 'المخروط الدوراني: نصف القطر r والارتفاع h والمولّد L',
  cylinder: 'المجسمات الدورية والأسطوانة: V = π × r² × h',
};

/**
 * Helper to draw an animated vector arrow from (x1, y1) toward (x2, y2)
 * with a glowing moving tracer bead at the current tip as `t` progresses 0 -> 1.
 */
const AnimatedVector: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  t: number;
  color: string;
  markerId: string;
  strokeWidth?: number;
  dashed?: boolean;
}> = ({ x1, y1, x2, y2, t, color, markerId, strokeWidth = 2.5, dashed = false }) => {
  const eased = easeInOutCubic(t);
  if (eased <= 0.02) return null;
  const cx = x1 + (x2 - x1) * eased;
  const cy = y1 + (y2 - y1) * eased;
  const isMoving = eased > 0.02 && eased < 0.98;

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={cx}
        y2={cy}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashed ? '5,4' : undefined}
        markerEnd={eased >= 0.96 ? `url(#${markerId})` : undefined}
      />
      {isMoving && (
        <g>
          <circle cx={cx} cy={cy} r="7.5" fill={color} opacity="0.28" />
          <circle cx={cx} cy={cy} r="4.5" fill="#fef08a" stroke={color} strokeWidth="2" />
        </g>
      )}
    </g>
  );
};

/**
 * High-contrast, zero-collision SVG measurement badge rendered directly beside segments/vertices.
 */
const SvgMeasureTag: React.FC<{
  x: number;
  y: number;
  label: string;
  color: string;
  isDark: boolean;
  isSolved?: boolean;
  fontSize?: number;
}> = ({ x, y, label, color, isDark, isSolved = false, fontSize = 10.5 }) => {
  if (!label) return null;
  const approxWidth = Math.max(26, label.length * (fontSize * 0.58) + 12);
  const h = fontSize + 7;
  const bgFill = isDark
    ? isSolved
      ? '#064e3b'
      : '#0f172a'
    : isSolved
      ? '#ecfdf5'
      : '#ffffff';

  return (
    <g className="select-none pointer-events-none">
      <rect
        x={x - approxWidth / 2}
        y={y - h / 2}
        width={approxWidth}
        height={h}
        rx="5"
        fill={bgFill}
        fillOpacity="0.95"
        stroke={color}
        strokeWidth={isSolved ? 1.5 : 1.1}
      />
      <text
        x={x}
        y={y + fontSize * 0.34}
        fontSize={fontSize}
        fontWeight="800"
        textAnchor="middle"
        fill={color}
        style={{ fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}
      >
        {label}
      </text>
    </g>
  );
};

/** Draws small double parallel chevrons `>>` along a segment midpoint or offset point */
const ParallelMark: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <g stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={`${x - 6},${y - 3.5} ${x - 1},${y} ${x - 6},${y + 3.5}`} />
    <polyline points={`${x + 1},${y - 3.5} ${x + 6},${y} ${x + 1},${y + 3.5}`} />
  </g>
);

export const GeometryDiagram: React.FC<GeometryDiagramProps> = ({
  lessonId,
  sectionTitle = '',
  sectionText = '',
  problemText,
  theme = 'paper',
  caption,
  className = '',
  animProgress,
}) => {
  const variant = resolveGeometryDiagramVariant(lessonId, sectionTitle, sectionText);

  // Interactive motion replay & optional visual proof markers toggle
  const [localReplayP, setLocalReplayP] = useState<number | null>(null);
  const [showProofAids, setShowProofAids] = useState<boolean>(true);
  const replayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalReplayP(null);
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  }, [lessonId, sectionTitle]);

  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, []);

  if (!variant) return null;

  const triggerReplay = () => {
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    let cur = 0;
    setLocalReplayP(0);
    replayTimerRef.current = window.setInterval(() => {
      cur += 0.025;
      if (cur >= 1) {
        setLocalReplayP(null);
        if (replayTimerRef.current) {
          clearInterval(replayTimerRef.current);
          replayTimerRef.current = null;
        }
      } else {
        setLocalReplayP(cur);
      }
    }, 45);
  };

  // Continuous 0..1 progress driving movement, sliding shapes, and progressive solution reveal
  const p = animProgress !== undefined ? clamp01(animProgress) : localReplayP !== null ? localReplayP : 1;

  const isDark = theme === 'chalkboard';
  const strokePrimary = isDark ? '#7dd3fc' : '#1d4ed8';
  const strokeSecondary = isDark ? '#34d399' : '#0f766e';
  const strokeAccent = isDark ? '#fbbf24' : '#d97706';
  const strokeDanger = isDark ? '#fb7185' : '#dc2626';
  const textMain = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#cbd5e1' : '#334155';
  const fillSoft = isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(59, 130, 246, 0.10)';
  const fillTeal = isDark ? 'rgba(45, 212, 191, 0.18)' : 'rgba(13, 148, 136, 0.12)';
  const fillAmber = isDark ? 'rgba(251, 191, 36, 0.22)' : 'rgba(245, 158, 11, 0.16)';
  const fillDarkTile = isDark ? 'rgba(120, 53, 15, 0.45)' : 'rgba(146, 64, 14, 0.22)';

  const fullText = `${sectionTitle} ${sectionText}`;
  const metrics = extractGeometryMeasurements(fullText);
  const problemMetrics = problemText ? extractGeometryMeasurements(problemText) : metrics;
  const smartInsight = buildSmartDiagramInsights(variant, fullText, metrics);

  // Helper: decides whether a key is a given from the problem vs a calculated answer
  // During animated playback before 62%, calculated answers show '?' then smoothly reveal!
  const solutionRevealed = animProgress === undefined || p >= 0.62;
  const getDynVal = (key: string, fallback = ''): { text: string; isSolved: boolean } => {
    const val = metrics.namedLengths[key];
    if (!val) return { text: fallback, isSolved: false };
    const isGiven = Boolean(problemMetrics.namedLengths[key]);
    if (isGiven) return { text: `${key} = ${val}`, isSolved: false };
    return solutionRevealed
      ? { text: `${key} = ${val}`, isSolved: true }
      : { text: `${key} = ؟`, isSolved: false };
  };

  const segLenLabel = metrics.segLen || metrics.namedLengths['MN'] || metrics.namedLengths['CD'] || '';
  const shiftLenLabel = metrics.shiftLen || metrics.namedLengths['AB'] || '';
  const sideLenLabel = metrics.sideLen || '';
  const areaLabel = metrics.areaVal || '';
  const abLenLabel = metrics.namedLengths['AB'] || '';
  const adLenLabel = metrics.namedLengths['AD'] || '';
  const radiusLabel = metrics.radiusVal || '';

  const labelTitle = caption || VARIANT_TITLES[variant];

  const moveT = easeInOutCubic(segProgress(p, 0.18, 0.86));
  const arrived = p >= 0.84;
  const lineGrowA = segProgress(p, 0.15, 0.55);
  const lineGrowB = segProgress(p, 0.45, 0.85);

  return (
    <div
      dir="rtl"
      className={`w-full rounded-xl border p-2.5 sm:p-3 transition-all ${
        isDark
          ? 'bg-slate-950/75 border-emerald-700/50 text-slate-100'
          : 'bg-sky-50/75 border-sky-200 text-slate-900 shadow-sm'
      } ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 px-1">
        <span className={`text-xs sm:text-sm font-extrabold flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-sky-900'}`}>
          <Compass className="w-4 h-4 shrink-0" />
          <span>الشكل الهندسي التفاعلي</span>
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[11px] font-bold truncate ${isDark ? 'text-emerald-300' : 'text-sky-700'}`}>
            {labelTitle}
          </span>
          <button
            type="button"
            onClick={() => setShowProofAids((v) => !v)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 border transition-colors ${
              showProofAids
                ? isDark
                  ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-sky-100 border-sky-300 text-sky-900'
                : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-500'
            }`}
            title="إظهار أو إخفاء رموز التوازي والقياسات المساعدة"
          >
            {showProofAids ? 'القياسات والرموز ✓' : 'الشكل فقط'}
          </button>
          {animProgress === undefined && (
            <button
              type="button"
              onClick={triggerReplay}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shrink-0 transition-all ${
                isDark
                  ? 'bg-amber-400/20 hover:bg-amber-400/35 text-amber-200 border border-amber-400/40'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
              }`}
              title="تشغيل حركة انتقال النقاط والأشكال"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{localReplayP !== null ? 'جاري التحريك...' : 'شاهد الحركة'}</span>
            </button>
          )}
        </div>
      </div>

      <div className={`w-full rounded-lg overflow-hidden flex items-center justify-center ${isDark ? 'bg-slate-900/90' : 'bg-white border border-sky-100'}`}>
        <svg
          viewBox="0 0 360 198"
          className="w-full max-w-[440px] h-auto block select-none"
          role="img"
          aria-label={labelTitle}
        >
          <defs>
            <marker id={`arrow-${variant}-${theme}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill={strokeAccent} />
            </marker>
            <marker id={`arrow-blue-${variant}-${theme}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill={strokePrimary} />
            </marker>
            <marker id={`arrow-rose-${variant}-${theme}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L7,3 z" fill={strokeDanger} />
            </marker>
          </defs>

          {/* 1. Parallelogram ABCD with diagonals, height h, equal-ticks, and extracted dimensions */}
          {variant === 'parallelogram' && (
            <g>
              <polygon points="95,42 290,42 250,148 55,148" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.8" />
              {showProofAids && (
                <>
                  <ParallelMark x={202} y={42} color={strokePrimary} />
                  <ParallelMark x={152} y={148} color={strokePrimary} />
                </>
              )}
              {lineGrowA > 0.02 && (
                <line
                  x1="95"
                  y1="42"
                  x2={95 + (250 - 95) * easeOutCubic(lineGrowA)}
                  y2={42 + (148 - 42) * easeOutCubic(lineGrowA)}
                  stroke={strokeSecondary}
                  strokeWidth="1.8"
                  strokeDasharray="5,4"
                />
              )}
              {lineGrowA > 0.02 && (
                <line
                  x1="290"
                  y1="42"
                  x2={290 + (55 - 290) * easeOutCubic(lineGrowA)}
                  y2={42 + (148 - 42) * easeOutCubic(lineGrowA)}
                  stroke={strokeSecondary}
                  strokeWidth="1.8"
                  strokeDasharray="5,4"
                />
              )}
              {lineGrowB > 0.02 && (
                <line
                  x1="95"
                  y1="42"
                  x2="95"
                  y2={42 + (148 - 42) * easeOutCubic(lineGrowB)}
                  stroke={strokeDanger}
                  strokeWidth="2.2"
                />
              )}
              {arrived && <polyline points="95,136 107,136 107,148" fill="none" stroke={strokeDanger} strokeWidth="1.8" />}
              <circle cx="172.5" cy="95" r={lineGrowA > 0.5 ? 4.5 : 0} fill={strokeAccent} />
              <text x="86" y="34" fontSize="14" fontWeight="bold" fill={textMain}>A</text>
              <text x="294" y="38" fontSize="14" fontWeight="bold" fill={textMain}>B</text>
              <text x="256" y="164" fontSize="14" fontWeight="bold" fill={textMain}>C</text>
              <text x="40" y="164" fontSize="14" fontWeight="bold" fill={textMain}>D</text>
              {lineGrowA > 0.5 && <text x="172" y="84" fontSize="13" fontWeight="bold" fill={strokeAccent}>O</text>}
              {showProofAids && (
                <>
                  <SvgMeasureTag x={192} y={22} label={abLenLabel ? `AB = ${abLenLabel}` : 'AB = DC'} color={strokePrimary} isDark={isDark} />
                  {abLenLabel && (
                    <SvgMeasureTag x={152} y={168} label={getDynVal('DC', abLenLabel).text} color={strokeSecondary} isDark={isDark} isSolved={getDynVal('DC').isSolved} />
                  )}
                  {adLenLabel && (
                    <SvgMeasureTag x={44} y={96} label={`AD=${adLenLabel}`} color={strokeAccent} isDark={isDark} />
                  )}
                  {metrics.angleVal && (
                    <SvgMeasureTag x={118} y={62} label={metrics.angleVal} color={strokeDanger} isDark={isDark} />
                  )}
                </>
              )}
              {lineGrowB > 0.5 && <text x="102" y="102" fontSize="12" fontWeight="bold" fill={strokeDanger}>h</text>}
            </g>
          )}

          {variant === 'quads-special' && (
            <g>
              <rect x="20" y="36" width="95" height="68" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.5" />
              <line x1="20" y1="36" x2={20 + 95 * moveT} y2={36 + 68 * moveT} stroke={strokeSecondary} strokeWidth="1.6" strokeDasharray="4,3" />
              <line x1="115" y1="36" x2={115 - 95 * moveT} y2={36 + 68 * moveT} stroke={strokeSecondary} strokeWidth="1.6" strokeDasharray="4,3" />
              <polyline points="20,48 32,48 32,36" fill="none" stroke={strokeDanger} strokeWidth="1.6" />
              {showProofAids && (metrics.namedLengths['AC'] || metrics.namedLengths['OB']) && (
                <SvgMeasureTag
                  x={67}
                  y={22}
                  label={metrics.namedLengths['AC'] ? `AC=${metrics.namedLengths['AC']}` : `OB=${metrics.namedLengths['OB']}`}
                  color={strokeSecondary}
                  isDark={isDark}
                />
              )}
              <text x="67" y="128" fontSize="13" fontWeight="bold" textAnchor="middle" fill={textMain}>المستطيل</text>
              <text x="67" y="145" fontSize="10" textAnchor="middle" fill={textMuted}>أقطار متساوية</text>

              <polygon points="185,32 230,70 185,108 140,70" fill={fillTeal} stroke={strokeSecondary} strokeWidth="2.5" />
              <line x1="185" y1="32" x2="185" y2={32 + 76 * moveT} stroke={strokeDanger} strokeWidth="1.6" strokeDasharray="4,3" />
              <line x1="140" y1="70" x2={140 + 90 * moveT} y2="70" stroke={strokeDanger} strokeWidth="1.6" strokeDasharray="4,3" />
              {arrived && <polyline points="185,61 194,61 194,70" fill="none" stroke={strokeDanger} strokeWidth="1.5" />}
              {showProofAids && areaLabel && (
                <SvgMeasureTag x={185} y={168} label={`S = ${areaLabel}`} color={strokeAccent} isDark={isDark} isSolved={solutionRevealed} />
              )}
              <text x="185" y="128" fontSize="13" fontWeight="bold" textAnchor="middle" fill={textMain}>المعين</text>
              <text x="185" y="145" fontSize="10" textAnchor="middle" fill={textMuted}>أقطار متعامدة</text>

              <rect x="262" y="34" width="72" height="72" fill={fillAmber} stroke={strokeAccent} strokeWidth="2.5" />
              <line x1="262" y1="34" x2={262 + 72 * moveT} y2={34 + 72 * moveT} stroke={strokePrimary} strokeWidth="1.6" strokeDasharray="4,3" />
              <line x1="334" y1="34" x2={334 - 72 * moveT} y2={34 + 72 * moveT} stroke={strokePrimary} strokeWidth="1.6" strokeDasharray="4,3" />
              <text x="298" y="128" fontSize="13" fontWeight="bold" textAnchor="middle" fill={textMain}>المربع</text>
              <text x="298" y="145" fontSize="10" textAnchor="middle" fill={textMuted}>متساوية ومتعامدة</text>
            </g>
          )}

          {/* 2. Damascus Pavement AB */}
          {variant === 'translation-pavement-ab' && (
            <g>
              <rect
                x="52"
                y="28"
                width="90"
                height="58"
                rx="6"
                fill={arrived ? fillTeal : 'none'}
                stroke={strokeSecondary}
                strokeWidth={arrived ? 2.4 : 1.5}
                strokeDasharray={arrived ? undefined : '4,4'}
                opacity={arrived ? 1 : 0.45}
              />
              {arrived && (
                <text x="97" y="62" fontSize="15" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                  الحجر 2
                </text>
              )}

              <rect x="214" y="28" width="90" height="58" rx="6" fill={fillAmber} stroke={strokeAccent} strokeWidth="2.6" />
              <text x="259" y="62" fontSize="15" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>
                الحجر 1
              </text>

              {moveT > 0.02 && moveT < 0.98 && (
                <g transform={`translate(${-162 * moveT}, 0)`} opacity="0.88">
                  <rect x="214" y="28" width="90" height="58" rx="6" fill={fillTeal} stroke={strokeAccent} strokeWidth="2.2" strokeDasharray="4,3" />
                  <text x="259" y="62" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#fef08a">
                    الحجر 1
                  </text>
                </g>
              )}

              <AnimatedVector x1={259} y1={28} x2={102} y2={28} t={segProgress(p, 0.12, 0.85)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} />
              <AnimatedVector x1={242} y1={86} x2={85} y2={86} t={segProgress(p, 0.22, 0.88)} color={strokeDanger} markerId={`arrow-rose-${variant}-${theme}`} />
              <AnimatedVector x1={304} y1={57} x2={147} y2={57} t={segProgress(p, 0.30, 0.90)} color={strokePrimary} markerId={`arrow-blue-${variant}-${theme}`} />

              <circle cx="259" cy="28" r="4.5" fill={strokeAccent} />
              <circle cx="242" cy="86" r="4.5" fill={strokeDanger} />
              <circle cx="304" cy="57" r="4.5" fill={strokePrimary} />

              <circle cx="97" cy="28" r={arrived ? 5 : 3} fill={arrived ? strokeAccent : 'none'} stroke={strokeAccent} strokeWidth="1.8" />
              <circle cx="80" cy="86" r={arrived ? 5 : 3} fill={arrived ? strokeDanger : 'none'} stroke={strokeDanger} strokeWidth="1.8" />
              <circle cx="142" cy="57" r={arrived ? 5 : 3} fill={arrived ? strokePrimary : 'none'} stroke={strokePrimary} strokeWidth="1.8" />

              <text x="260" y="19" fontSize="13" fontWeight="bold" textAnchor="middle" fill={textMain}>A</text>
              <text x="97" y="19" fontSize="13" fontWeight="bold" textAnchor="middle" fill={arrived ? strokeAccent : textMuted}>B</text>
              <text x="242" y="103" fontSize="13" fontWeight="bold" textAnchor="middle" fill={strokeDanger}>C</text>
              <text x="80" y="103" fontSize="13" fontWeight="bold" textAnchor="middle" fill={arrived ? strokeDanger : textMuted}>D</text>
              <text x="315" y="61" fontSize="13" fontWeight="bold" fill={strokePrimary}>E</text>
              <text x="150" y="72" fontSize="13" fontWeight="bold" fill={arrived ? strokePrimary : textMuted}>F</text>

              <text x="180" y="142" fontSize="13" fontWeight="bold" textAnchor="middle" fill={strokePrimary}>
                (AB) // (CD) // (EF)
              </text>
              <text x="180" y="164" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                AB = CD = EF
              </text>
              <text x="180" y="186" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>
                الرباعيان ABDC و ABFE متوازيا أضلاع
              </text>
            </g>
          )}

          {/* 3. Damascus Pavement AM */}
          {variant === 'translation-pavement-am' && (
            <g>
              <rect x="234" y="20" width="76" height="44" rx="6" fill={fillAmber} stroke={strokeAccent} strokeWidth="2.4" />
              <text x="272" y="47" fontSize="13" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>الحجر 1</text>

              <rect x="234" y="84" width="70" height="38" rx="6" fill={fillDarkTile} stroke={strokePrimary} strokeWidth="2" />
              <text x="269" y="108" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokePrimary}>الحجر 6</text>

              <rect
                x="136"
                y="74"
                width="76"
                height="44"
                rx="6"
                fill={arrived ? fillTeal : 'none'}
                stroke={strokeSecondary}
                strokeWidth={arrived ? 2.4 : 1.5}
                strokeDasharray={arrived ? undefined : '4,4'}
                opacity={arrived ? 1 : 0.45}
              />
              {arrived && (
                <text x="174" y="101" fontSize="13" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                  الحجر 4
                </text>
              )}

              <rect
                x="136"
                y="138"
                width="70"
                height="38"
                rx="6"
                fill={arrived ? fillSoft : 'none'}
                stroke={strokePrimary}
                strokeWidth={arrived ? 2.2 : 1.5}
                strokeDasharray={arrived ? undefined : '4,4'}
                opacity={arrived ? 1 : 0.45}
              />
              {arrived && (
                <text x="171" y="162" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokePrimary}>
                  الحجر 9
                </text>
              )}

              {moveT > 0.02 && moveT < 0.98 && (
                <>
                  <g transform={`translate(${-98 * moveT}, ${54 * moveT})`} opacity="0.86">
                    <rect x="234" y="20" width="76" height="44" rx="6" fill={fillTeal} stroke={strokeAccent} strokeWidth="2" strokeDasharray="4,3" />
                    <text x="272" y="47" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#fef08a">الحجر 1</text>
                  </g>
                  <g transform={`translate(${-98 * moveT}, ${54 * moveT})`} opacity="0.82">
                    <rect x="234" y="84" width="70" height="38" rx="6" fill={fillSoft} stroke={strokePrimary} strokeWidth="1.8" strokeDasharray="4,3" />
                    <text x="269" y="108" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#fef08a">الحجر 6</text>
                  </g>
                </>
              )}

              <AnimatedVector x1={256} y1={20} x2={161} y2={71} t={segProgress(p, 0.10, 0.82)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} />
              <AnimatedVector x1={234} y1={64} x2={141} y2={115} t={segProgress(p, 0.22, 0.88)} color={strokeDanger} markerId={`arrow-rose-${variant}-${theme}`} />
              <AnimatedVector x1={234} y1={112} x2={206} y2={146} t={segProgress(p, 0.35, 0.92)} color={strokePrimary} markerId={`arrow-blue-${variant}-${theme}`} dashed />

              <circle cx="256" cy="20" r="5" fill={strokeAccent} />
              <circle cx="234" cy="64" r="5" fill={strokeDanger} />
              <circle cx="156" cy="74" r={arrived ? 5.5 : 3.5} fill={arrived ? strokeAccent : 'none'} stroke={strokeAccent} strokeWidth="2" />
              <circle cx="136" cy="118" r={arrived ? 5.5 : 3.5} fill={arrived ? strokeDanger : 'none'} stroke={strokeDanger} strokeWidth="2" />

              <text x="266" y="14" fontSize="14" fontWeight="bold" fill={strokeAccent}>A</text>
              <text x="142" y="70" fontSize="14" fontWeight="bold" fill={arrived ? strokeAccent : textMuted}>M</text>
              <text x="220" y="62" fontSize="14" fontWeight="bold" fill={strokeDanger}>C</text>
              <text x="118" y="122" fontSize="14" fontWeight="bold" fill={arrived ? strokeDanger : textMuted}>P</text>

              <rect x="14" y="24" width="96" height="104" rx="8" fill={fillSoft} stroke={strokePrimary} strokeWidth="1.4" />
              <text x="62" y="46" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>A ➔ M</text>
              <text x="62" y="68" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeDanger}>C ➔ P</text>
              <text x="62" y="92" fontSize="11" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>الحجر 1 ➔ 4</text>
              <text x="62" y="114" fontSize="11" fontWeight="bold" textAnchor="middle" fill={strokePrimary}>الحجر 6 ➔ 9</text>

              <text x="180" y="191" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>
                النقطة M صورة A والنقطة P صورة C وفق الانسحاب نفسه
              </text>
            </g>
          )}

          {/* 4. Polygon / Square Translation */}
          {variant === 'translation-tile' && (
            <g>
              <AnimatedVector x1={55} y1={32} x2={200} y2={32} t={segProgress(p, 0.05, 0.55)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} />
              <circle cx="55" cy="32" r="4" fill={strokeAccent} />
              <circle cx="205" cy="32" r="4" fill={strokeAccent} />
              <text x="44" y="25" fontSize="12" fontWeight="bold" fill={textMain}>A</text>
              <text x="206" y="25" fontSize="12" fontWeight="bold" fill={textMain}>B</text>
              <SvgMeasureTag
                x={130}
                y={18}
                label={shiftLenLabel ? `AB = ${shiftLenLabel}` : 'شعاع الانسحاب'}
                color={strokeAccent}
                isDark={isDark}
              />

              {sideLenLabel || areaLabel ? (
                <g>
                  {arrived && (
                    <polygon points="52,70 202,70 202,138 52,138" fill={fillAmber} opacity="0.22" stroke={strokeAccent} strokeWidth="1.2" strokeDasharray="4,3" />
                  )}

                  <rect x="52" y="70" width="68" height="68" rx="3" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
                  <text x="86" y="108" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokePrimary}>
                    {areaLabel || 'الشكل'}
                  </text>
                  {showProofAids && sideLenLabel && (
                    <>
                      <SvgMeasureTag x={86} y={154} label={sideLenLabel} color={strokePrimary} isDark={isDark} />
                      <SvgMeasureTag x={30} y={104} label={sideLenLabel} color={strokePrimary} isDark={isDark} />
                    </>
                  )}

                  {moveT > 0.02 && moveT < 0.98 && (
                    <g transform={`translate(${150 * moveT}, 0)`} opacity="0.82">
                      <rect x="52" y="70" width="68" height="68" rx="3" fill={fillTeal} stroke={strokeAccent} strokeWidth="2.2" strokeDasharray="4,3" />
                    </g>
                  )}

                  <AnimatedVector x1={120} y1={70} x2={265} y2={70} t={segProgress(p, 0.18, 0.85)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} dashed strokeWidth={1.9} />
                  <AnimatedVector x1={120} y1={138} x2={265} y2={138} t={segProgress(p, 0.25, 0.88)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} dashed strokeWidth={1.9} />

                  <rect
                    x="202"
                    y="70"
                    width="68"
                    height="68"
                    rx="3"
                    fill={arrived ? fillTeal : 'none'}
                    stroke={strokeSecondary}
                    strokeWidth={arrived ? 2.6 : 1.5}
                    strokeDasharray={arrived ? undefined : '4,4'}
                    opacity={arrived ? 1 : 0.45}
                  />
                  {arrived && (
                    <>
                      <text x="236" y="108" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                        {areaLabel || 'الصورة'}
                      </text>
                      {sideLenLabel && <SvgMeasureTag x={236} y={154} label={sideLenLabel} color={strokeSecondary} isDark={isDark} isSolved />}
                    </>
                  )}
                  <text x="180" y="184" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>
                    {sideLenLabel
                      ? `ثبات الأطوال (${sideLenLabel}) يحفظ المساحة: ${areaLabel || `${sideLenLabel} × ${sideLenLabel}`}`
                      : `الانسحاب (${shiftLenLabel || 'AB'}) يحفظ مساحة الشكل: ${areaLabel}`}
                  </text>
                </g>
              ) : (
                <g>
                  {arrived && (
                    <polygon points="55,40 205,40 225,85 75,85" fill={fillAmber} opacity="0.28" stroke={strokeAccent} strokeWidth="1.4" strokeDasharray="4,3" />
                  )}
                  <line x1="55" y1="40" x2="75" y2="85" stroke={strokePrimary} strokeWidth="1.5" strokeDasharray="3,3" opacity={lineGrowA > 0.2 ? 0.8 : 0.2} />
                  {arrived && <line x1="205" y1="40" x2="225" y2="85" stroke={strokeSecondary} strokeWidth="1.5" strokeDasharray="3,3" />}

                  <polygon points="45,148 115,148 75,85" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
                  <text x="77" y="132" fontSize="14" fontWeight="bold" textAnchor="middle" fill={strokePrimary}>F</text>
                  <text x="64" y="83" fontSize="12" fontWeight="bold" fill={textMain}>M</text>

                  {moveT > 0.02 && moveT < 0.98 && (
                    <g transform={`translate(${150 * moveT}, 0)`} opacity="0.85">
                      <polygon points="45,148 115,148 75,85" fill={fillTeal} stroke={strokeAccent} strokeWidth="2.2" strokeDasharray="4,3" />
                    </g>
                  )}

                  <polygon
                    points="195,148 265,148 225,85"
                    fill={arrived ? fillTeal : 'none'}
                    stroke={strokeSecondary}
                    strokeWidth={arrived ? 2.6 : 1.5}
                    strokeDasharray={arrived ? undefined : '4,4'}
                    opacity={arrived ? 1 : 0.4}
                  />
                  {arrived && <text x="227" y="132" fontSize="14" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>F′</text>}
                  <text x="228" y="83" fontSize="12" fontWeight="bold" fill={arrived ? textMain : textMuted}>M′</text>

                  <AnimatedVector x1={75} y1={85} x2={220} y2={85} t={segProgress(p, 0.2, 0.86)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} dashed strokeWidth={2} />
                  <text x="180" y="176" fontSize="11.5" fontWeight="bold" textAnchor="middle" fill={strokePrimary}>
                    الرباعي ABM′M متوازي أضلاع ⇐ MM′ = AB
                  </text>
                </g>
              )}
            </g>
          )}

          {/* 5. Point M -> M' (or C -> C' for ABC'C) via teacher-drawn Parallelogram */}
          {variant === 'translation-point' && (() => {
            const usePointC = /abc['′]c|cc['′]|صورة\s+c/i.test(fullText);
            const pLbl = usePointC ? 'C' : 'M';
            const pImg = usePointC ? 'C′' : 'M′';
            const paraLabel = usePointC ? 'ABC′C' : 'ABM′M';
            const segPair = usePointC ? 'CC′' : 'MM′';
            const diagA = usePointC ? '[AC′]' : '[AM′]';
            const diagB = usePointC ? '[BC]' : '[BM]';
            return (
              <g>
                {lineGrowB > 0.25 && (
                  <polygon points="65,48 225,48 275,138 115,138" fill={fillSoft} opacity={0.75 * easeOutCubic(lineGrowB)} />
                )}
                <AnimatedVector x1={65} y1={48} x2={220} y2={48} t={segProgress(p, 0.04, 0.35)} color={strokePrimary} markerId={`arrow-blue-${variant}-${theme}`} strokeWidth={2.8} />

                {lineGrowA > 0.05 && (
                  <line x1="65" y1="48" x2={65 + (115 - 65) * easeOutCubic(lineGrowA)} y2={48 + (138 - 48) * easeOutCubic(lineGrowA)} stroke={strokeSecondary} strokeWidth="2.2" />
                )}

                <AnimatedVector x1={115} y1={138} x2={270} y2={138} t={segProgress(p, 0.25, 0.84)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} strokeWidth={2.5} />

                {lineGrowB > 0.05 && (
                  <line x1="225" y1="48" x2={225 + (275 - 225) * easeOutCubic(lineGrowB)} y2={48 + (138 - 48) * easeOutCubic(lineGrowB)} stroke={strokeSecondary} strokeWidth="2.2" />
                )}

                {arrived && (
                  <>
                    <line x1="65" y1="48" x2="275" y2="138" stroke={strokeDanger} strokeWidth="1.4" strokeDasharray="4,3" opacity="0.8" />
                    <line x1="225" y1="48" x2="115" y2="138" stroke={strokeDanger} strokeWidth="1.4" strokeDasharray="4,3" opacity="0.8" />
                    <circle cx="170" cy="93" r="4" fill={strokeAccent} />
                    <text x="170" y="83" fontSize="11" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>O</text>
                  </>
                )}

                <circle cx="65" cy="48" r="4.5" fill={strokePrimary} />
                <circle cx="225" cy="48" r="4.5" fill={strokePrimary} />
                <circle cx="115" cy="138" r="4.5" fill={strokeSecondary} />
                <circle cx="275" cy="138" r={arrived ? 5 : 3.5} fill={arrived ? strokeDanger : 'none'} stroke={strokeDanger} strokeWidth="2" />

                <text x="53" y="40" fontSize="14" fontWeight="bold" fill={textMain}>A</text>
                <text x="228" y="40" fontSize="14" fontWeight="bold" fill={textMain}>B</text>
                <text x="102" y="156" fontSize="14" fontWeight="bold" fill={textMain}>{pLbl}</text>
                <text x="280" y="156" fontSize="14" fontWeight="bold" fill={arrived ? strokeDanger : textMuted}>{pImg}</text>

                <SvgMeasureTag x={145} y={28} label={abLenLabel ? `AB = ${abLenLabel}` : 'AB (شعاع الانسحاب)'} color={strokePrimary} isDark={isDark} />
                {arrived && (
                  <SvgMeasureTag
                    x={195}
                    y={156}
                    label={abLenLabel ? `${segPair} = ${abLenLabel}` : `${segPair} = AB`}
                    color={strokeAccent}
                    isDark={isDark}
                    isSolved={Boolean(abLenLabel)}
                  />
                )}

                <text x="180" y="184" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>
                  {`نكمل الشكل فنحصل على متوازي الأضلاع ${paraLabel} (القطران ${diagA} و ${diagB} متناصفان)`}
                </text>
              </g>
            );
          })()}

          {/* 6. Segment [MN] -> [M'N'] forming Parallelogram MNN'M' */}
          {variant === 'translation-segment' && (
            <g>
              <AnimatedVector x1={96} y1={26} x2={244} y2={26} t={segProgress(p, 0.04, 0.38)} color={strokePrimary} markerId={`arrow-blue-${variant}-${theme}`} strokeWidth={2.5} />
              <circle cx="96" cy="26" r="3.8" fill={strokePrimary} />
              <circle cx="248" cy="26" r="3.8" fill={strokePrimary} />
              <text x="84" y="24" fontSize="12" fontWeight="bold" fill={textMain}>A</text>
              <text x="256" y="24" fontSize="12" fontWeight="bold" fill={textMain}>B</text>
              <SvgMeasureTag x={172} y={14} label={shiftLenLabel ? `AB = ${shiftLenLabel}` : 'A ➔ B'} color={strokePrimary} isDark={isDark} />

              {lineGrowB > 0.25 && (
                <polygon points="105,64 252,64 212,146 65,146" fill={fillAmber} opacity={0.28 * easeOutCubic(lineGrowB)} />
              )}

              <line x1="65" y1="146" x2="105" y2="64" stroke={strokePrimary} strokeWidth="3.2" />
              <circle cx="65" cy="146" r="4.5" fill={strokePrimary} />
              <circle cx="85" cy="105" r="4" fill={strokeDanger} />
              <circle cx="105" cy="64" r="4.5" fill={strokePrimary} />
              <text x="51" y="154" fontSize="13" fontWeight="bold" fill={textMain}>M</text>
              <text x="71" y="105" fontSize="11.5" fontWeight="bold" fill={strokeDanger}>I</text>
              <text x="100" y="54" fontSize="13" fontWeight="bold" fill={textMain}>N</text>

              {segLenLabel && <SvgMeasureTag x={42} y={114} label={segLenLabel} color={strokePrimary} isDark={isDark} />}

              {moveT > 0.02 && moveT < 0.98 && (
                <g transform={`translate(${147 * moveT}, 0)`} opacity="0.88">
                  <line x1="65" y1="146" x2="105" y2="64" stroke={strokeAccent} strokeWidth="2.8" strokeDasharray="4,3" />
                  <circle cx="85" cy="105" r="4" fill="#fef08a" />
                </g>
              )}

              <AnimatedVector x1={105} y1={64} x2={248} y2={64} t={segProgress(p, 0.16, 0.84)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} strokeWidth={2.2} />
              <AnimatedVector x1={85} y1={105} x2={228} y2={105} t={segProgress(p, 0.22, 0.87)} color={strokeDanger} markerId={`arrow-rose-${variant}-${theme}`} dashed strokeWidth={1.6} />
              <AnimatedVector x1={65} y1={146} x2={208} y2={146} t={segProgress(p, 0.26, 0.90)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} strokeWidth={2.2} />

              {arrived && shiftLenLabel && (
                <>
                  <SvgMeasureTag x={178} y={53} label={`NN′=${shiftLenLabel}`} color={strokeAccent} isDark={isDark} />
                  <SvgMeasureTag x={138} y={160} label={`MM′=${shiftLenLabel}`} color={strokeAccent} isDark={isDark} />
                </>
              )}

              <line x1="212" y1="146" x2="252" y2="64" stroke={strokeSecondary} strokeWidth={arrived ? 3.2 : 1.5} strokeDasharray={arrived ? undefined : '4,4'} opacity={arrived ? 1 : 0.4} />
              <circle cx="212" cy="146" r={arrived ? 4.5 : 3} fill={arrived ? strokeSecondary : 'none'} stroke={strokeSecondary} strokeWidth="1.6" />
              <circle cx="232" cy="105" r={arrived ? 4 : 2.5} fill={arrived ? strokeDanger : 'none'} stroke={strokeDanger} strokeWidth="1.6" />
              <circle cx="252" cy="64" r={arrived ? 4.5 : 3} fill={arrived ? strokeSecondary : 'none'} stroke={strokeSecondary} strokeWidth="1.6" />
              <text x="214" y="162" fontSize="13" fontWeight="bold" fill={arrived ? textMain : textMuted}>M′</text>
              <text x="242" y="107" fontSize="11.5" fontWeight="bold" fill={arrived ? strokeDanger : textMuted}>I′</text>
              <text x="258" y="56" fontSize="13" fontWeight="bold" fill={arrived ? textMain : textMuted}>N′</text>

              {arrived && segLenLabel && <SvgMeasureTag x={290} y={114} label={segLenLabel} color={strokeSecondary} isDark={isDark} isSolved />}

              <text x="180" y="185" fontSize="11.2" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                {segLenLabel
                  ? `متوازي الأضلاع MNN′M′ ⇐ M′N′ = MN = ${segLenLabel}`
                  : `الشكل MNN′M′ متوازي أضلاع ⇐ M′N′ = MN  |  (M′N′) // (MN)`}
              </text>
            </g>
          )}

          {/* 7. Triangle ABC sliding to A'B'C' */}
          {variant === 'translation-triangle' && (
            <g>
              {arrived && <polygon points="78,48 226,48 288,145 140,145" fill={fillAmber} opacity="0.18" />}
              <polygon points="40,145 140,145 78,48" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.8" />
              <text x="74" y="38" fontSize="13" fontWeight="bold" fill={textMain}>A</text>
              <text x="26" y="154" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
              <text x="144" y="154" fontSize="13" fontWeight="bold" fill={textMain}>C</text>
              {abLenLabel && <SvgMeasureTag x={44} y={96} label={abLenLabel} color={strokePrimary} isDark={isDark} />}
              {metrics.namedLengths['AC'] && <SvgMeasureTag x={116} y={92} label={metrics.namedLengths['AC']} color={strokePrimary} isDark={isDark} />}

              {moveT > 0.02 && moveT < 0.98 && (
                <g transform={`translate(${148 * moveT}, 0)`} opacity="0.85">
                  <polygon points="40,145 140,145 78,48" fill={fillTeal} stroke={strokeAccent} strokeWidth="2.2" strokeDasharray="4,3" />
                </g>
              )}

              <AnimatedVector x1={78} y1={48} x2={222} y2={48} t={segProgress(p, 0.15, 0.85)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} dashed strokeWidth={2} />
              <AnimatedVector x1={140} y1={145} x2={284} y2={145} t={segProgress(p, 0.25, 0.88)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} dashed strokeWidth={2} />

              <polygon points="188,145 288,145 226,48" fill={arrived ? fillTeal : 'none'} stroke={strokeSecondary} strokeWidth={arrived ? 2.8 : 1.5} strokeDasharray={arrived ? undefined : '4,4'} opacity={arrived ? 1 : 0.4} />
              <text x="224" y="38" fontSize="13" fontWeight="bold" fill={arrived ? textMain : textMuted}>A′</text>
              <text x="174" y="154" fontSize="13" fontWeight="bold" fill={arrived ? textMain : textMuted}>B′</text>
              <text x="292" y="154" fontSize="13" fontWeight="bold" fill={arrived ? textMain : textMuted}>C′</text>
              {arrived && metrics.angleVal && (
                <SvgMeasureTag x={226} y={70} label={metrics.angleVal} color={strokeDanger} isDark={isDark} isSolved />
              )}
              <text x="180" y="182" fontSize="11.5" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                {metrics.angleVal
                  ? `A′B′C′ ≡ ABC | حفظ الزوايا (${metrics.angleVal}) والأطوال`
                  : 'A′B′C′ ≡ ABC (تتشكل متوازيات الأضلاع AA′B′B و AA′C′C)'}
              </text>
            </g>
          )}

          {/* 8. Circle O -> O' sliding translation */}
          {variant === 'translation-circle' && (
            <g>
              <circle cx="95" cy="95" r="46" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
              <circle cx="95" cy="95" r="3.5" fill={strokePrimary} />
              <line x1="95" y1="95" x2="128" y2="62" stroke={strokePrimary} strokeWidth="2" />
              <text x="86" y="112" fontSize="13" fontWeight="bold" fill={textMain}>O</text>
              <SvgMeasureTag x={122} y={70} label={radiusLabel ? `R=${radiusLabel}` : 'R'} color={strokePrimary} isDark={isDark} />
              <text x="58" y="62" fontSize="12" fontWeight="bold" fill={strokePrimary}>(C)</text>

              {moveT > 0.02 && moveT < 0.98 && (
                <g transform={`translate(${160 * moveT}, 0)`} opacity="0.82">
                  <circle cx="95" cy="95" r="46" fill={fillTeal} stroke={strokeAccent} strokeWidth="2" strokeDasharray="4,3" />
                </g>
              )}

              <AnimatedVector x1={95} y1={95} x2={250} y2={95} t={segProgress(p, 0.16, 0.86)} color={strokeAccent} markerId={`arrow-${variant}-${theme}`} dashed strokeWidth={2.2} />
              {shiftLenLabel && <SvgMeasureTag x={175} y={84} label={shiftLenLabel} color={strokeAccent} isDark={isDark} />}

              <circle cx="255" cy="95" r="46" fill={arrived ? fillTeal : 'none'} stroke={strokeSecondary} strokeWidth={arrived ? 2.6 : 1.5} strokeDasharray={arrived ? undefined : '4,4'} opacity={arrived ? 1 : 0.4} />
              <circle cx="255" cy="95" r={arrived ? 4 : 2.5} fill={strokeSecondary} />
              {arrived && <line x1="255" y1="95" x2="288" y2="62" stroke={strokeSecondary} strokeWidth="2" />}
              <text x="251" y="112" fontSize="13" fontWeight="bold" fill={arrived ? textMain : textMuted}>O′</text>
              {arrived && <SvgMeasureTag x={282} y={70} label={radiusLabel ? `R′=${radiusLabel}` : 'R′=R'} color={strokeSecondary} isDark={isDark} isSolved />}
              {arrived && <text x="305" y="62" fontSize="12" fontWeight="bold" fill={strokeSecondary}>(C′)</text>}

              <text x="180" y="176" fontSize="11.5" fontWeight="bold" textAnchor="middle" fill={textMuted}>
                {radiusLabel
                  ? `صورة الدائرة دائرة طبوقة مركزها O′ ونصف قطرها R′ = R = ${radiusLabel}`
                  : 'صورة الدائرة دائرة مساوية لها في نصف القطر'}
              </text>
            </g>
          )}

          {/* 9. Congruent Triangles */}
          {variant === 'congruent-sas' && (() => {
            const ang = metrics.angleVal || '50°';
            const s1 = metrics.numberList.find((n) => n.includes('cm') && n !== (metrics.numberList.find((x) => x.includes('cm')))) ? metrics.numberList[0] : '4 cm';
            const s2 = metrics.numberList.filter((n) => n.includes('cm'))[1] || '6 cm';
            return (
              <g>
                <polygon points="35,148 145,148 70,50" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.8" />
                <path d="M 35 128 A 20 20 0 0 1 51 134" fill="none" stroke={strokeDanger} strokeWidth="2.4" />
                <text x="64" y="42" fontSize="14" fontWeight="bold" fill={textMain}>B</text>
                <text x="22" y="156" fontSize="14" fontWeight="bold" fill={textMain}>A</text>
                <text x="149" y="156" fontSize="14" fontWeight="bold" fill={textMain}>C</text>
                <SvgMeasureTag x={58} y={134} label={ang} color={strokeDanger} isDark={isDark} fontSize={9.5} />
                <SvgMeasureTag x={34} y={95} label={s1} color={strokePrimary} isDark={isDark} fontSize={9.5} />
                <SvgMeasureTag x={90} y={165} label={s2} color={strokeSecondary} isDark={isDark} fontSize={9.5} />

                {moveT > 0.02 && moveT < 0.98 && (
                  <g transform={`translate(${177 * moveT}, 0)`} opacity="0.82">
                    <polygon points="35,148 145,148 70,50" fill={fillAmber} stroke={strokeAccent} strokeWidth="2.2" strokeDasharray="4,3" />
                  </g>
                )}

                <text x="180" y="102" fontSize="18" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>≅</text>

                <polygon points="212,148 322,148 247,50" fill={fillTeal} stroke={strokeSecondary} strokeWidth={arrived ? 3 : 2} />
                <path d="M 212 128 A 20 20 0 0 1 228 134" fill="none" stroke={strokeDanger} strokeWidth="2.4" />
                <text x="241" y="42" fontSize="14" fontWeight="bold" fill={textMain}>E</text>
                <text x="199" y="156" fontSize="14" fontWeight="bold" fill={textMain}>D</text>
                <text x="326" y="156" fontSize="14" fontWeight="bold" fill={textMain}>F</text>
                <SvgMeasureTag x={235} y={134} label={ang} color={strokeDanger} isDark={isDark} fontSize={9.5} />
                <SvgMeasureTag x={212} y={95} label={s1} color={strokeSecondary} isDark={isDark} fontSize={9.5} />
                <SvgMeasureTag x={267} y={165} label={s2} color={strokeSecondary} isDark={isDark} fontSize={9.5} />
                <text x="180" y="187" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>
                  ضلع - زاوية محصورة - ضلع (ض-ز-ض)
                </text>
              </g>
            );
          })()}

          {variant === 'congruent-asa' && (
            <g>
              <polygon points="35,148 145,148 92,50" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.8" />
              <path d="M 55 148 A 20 20 0 0 0 46 130" fill="none" stroke={strokeDanger} strokeWidth="2.4" />
              <path d="M 125 148 A 20 20 0 0 1 135 130" fill="none" stroke={strokeAccent} strokeWidth="2.4" />
              <text x="22" y="156" fontSize="14" fontWeight="bold" fill={textMain}>B</text>
              <text x="148" y="156" fontSize="14" fontWeight="bold" fill={textMain}>C</text>
              <text x="89" y="42" fontSize="14" fontWeight="bold" fill={textMain}>A</text>
              {metrics.angleVal && <SvgMeasureTag x={62} y={134} label={metrics.angleVal} color={strokeDanger} isDark={isDark} fontSize={9.5} />}

              {moveT > 0.02 && moveT < 0.98 && (
                <g transform={`translate(${177 * moveT}, 0)`} opacity="0.82">
                  <polygon points="35,148 145,148 92,50" fill={fillAmber} stroke={strokeAccent} strokeWidth="2.2" strokeDasharray="4,3" />
                </g>
              )}

              <text x="180" y="102" fontSize="18" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>≅</text>

              <polygon points="212,148 322,148 269,50" fill={fillTeal} stroke={strokeSecondary} strokeWidth="2.8" />
              <path d="M 232 148 A 20 20 0 0 0 223 130" fill="none" stroke={strokeDanger} strokeWidth="2.4" />
              <path d="M 302 148 A 20 20 0 0 1 312 130" fill="none" stroke={strokeAccent} strokeWidth="2.4" />
              <text x="199" y="156" fontSize="14" fontWeight="bold" fill={textMain}>E</text>
              <text x="325" y="156" fontSize="14" fontWeight="bold" fill={textMain}>F</text>
              <text x="266" y="42" fontSize="14" fontWeight="bold" fill={textMain}>D</text>
              <text x="180" y="180" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>
                زاوية - ضلع واصل - زاوية (ز-ض-ز)
              </text>
            </g>
          )}

          {variant === 'congruent-sss' && (
            <g>
              <polygon points="35,148 145,148 92,48" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.8" />
              <line x1="60" y1="95" x2="68" y2="100" stroke={strokeDanger} strokeWidth="2.2" />
              <line x1="115" y1="95" x2="123" y2="90" stroke={strokeAccent} strokeWidth="2.2" />
              <line x1="118" y1="100" x2="126" y2="95" stroke={strokeAccent} strokeWidth="2.2" />
              <text x="89" y="40" fontSize="14" fontWeight="bold" fill={textMain}>A</text>
              <text x="22" y="156" fontSize="14" fontWeight="bold" fill={textMain}>B</text>
              <text x="148" y="156" fontSize="14" fontWeight="bold" fill={textMain}>C</text>

              {moveT > 0.02 && moveT < 0.98 && (
                <g transform={`translate(${177 * moveT}, 0)`} opacity="0.82">
                  <polygon points="35,148 145,148 92,48" fill={fillAmber} stroke={strokeAccent} strokeWidth="2.2" strokeDasharray="4,3" />
                </g>
              )}

              <text x="180" y="102" fontSize="18" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>≅</text>

              <polygon points="212,148 322,148 269,48" fill={fillTeal} stroke={strokeSecondary} strokeWidth="2.8" />
              <line x1="237" y1="95" x2="245" y2="100" stroke={strokeDanger} strokeWidth="2.2" />
              <line x1="292" y1="95" x2="300" y2="90" stroke={strokeAccent} strokeWidth="2.2" />
              <line x1="295" y1="100" x2="303" y2="95" stroke={strokeAccent} strokeWidth="2.2" />
              <text x="266" y="40" fontSize="14" fontWeight="bold" fill={textMain}>D</text>
              <text x="199" y="156" fontSize="14" fontWeight="bold" fill={textMain}>E</text>
              <text x="325" y="156" fontSize="14" fontWeight="bold" fill={textMain}>F</text>
              <text x="180" y="180" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>
                تساوي أطوال الأضلاع الثلاثة (ض-ض-ض)
              </text>
            </g>
          )}

          {/* 10. Midsegment (MN) with equal-half tick marks + extracted MN & BC */}
          {(variant === 'midsegment' || variant === 'midline-converse') && (() => {
            const bcTag = getDynVal('BC');
            const mnTag = getDynVal('MN');
            return (
              <g>
                <polygon points="180,26 75,150 285,150" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.8" />
                {showProofAids && (
                  <>
                    {/* Tick marks on [AM]=[MB] and [AN]=[NC] */}
                    <line x1="149" y1="53" x2="158" y2="61" stroke={strokeAccent} strokeWidth="2" />
                    <line x1="97" y1="115" x2="106" y2="123" stroke={strokeAccent} strokeWidth="2" />
                    <line x1="202" y1="61" x2="211" y2="53" stroke={strokeSecondary} strokeWidth="2" />
                    <line x1="254" y1="123" x2="263" y2="115" stroke={strokeSecondary} strokeWidth="2" />
                  </>
                )}
                <circle cx="127.5" cy="88" r="4.5" fill={strokeDanger} />
                <line x1="127.5" y1="88" x2={127.5 + (232.5 - 127.5) * moveT} y2="88" stroke={strokeDanger} strokeWidth="2.8" />
                {arrived && <circle cx="232.5" cy="88" r="4.5" fill={strokeDanger} />}
                <text x="176" y="18" fontSize="14" fontWeight="bold" fill={textMain}>A</text>
                <text x="58" y="158" fontSize="14" fontWeight="bold" fill={textMain}>B</text>
                <text x="292" y="158" fontSize="14" fontWeight="bold" fill={textMain}>C</text>
                <text x="108" y="88" fontSize="13" fontWeight="bold" fill={strokeDanger}>M</text>
                <text x="241" y="88" fontSize="13" fontWeight="bold" fill={arrived ? strokeDanger : textMuted}>N</text>

                {showProofAids && (
                  <>
                    <SvgMeasureTag
                      x={180}
                      y={72}
                      label={mnTag.text || 'MN = ½ BC'}
                      color={mnTag.isSolved ? strokeSecondary : strokeDanger}
                      isDark={isDark}
                      isSolved={mnTag.isSolved}
                    />
                    {bcTag.text && (
                      <SvgMeasureTag x={180} y={160} label={bcTag.text} color={strokePrimary} isDark={isDark} isSolved={bcTag.isSolved} />
                    )}
                  </>
                )}
                <text x="180" y="184" fontSize="11.5" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>(MN) // (BC)</text>
              </g>
            );
          })()}

          {/* Midsegment Triangle MNP */}
          {variant === 'midsegment-mnp' && (
            <g>
              <polygon points="180,24 68,154 292,154" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
              <polygon
                points="124,89 236,89 180,154"
                fill={arrived ? fillTeal : 'none'}
                stroke={strokeDanger}
                strokeWidth="2.6"
                strokeDasharray={arrived ? undefined : `${360 * moveT} 360`}
              />
              <circle cx="124" cy="89" r="4.5" fill={strokeDanger} />
              <circle cx="236" cy="89" r="4.5" fill={strokeDanger} />
              <circle cx="180" cy="154" r="4.5" fill={strokeDanger} />
              <text x="176" y="16" fontSize="14" fontWeight="bold" fill={textMain}>A</text>
              <text x="52" y="162" fontSize="14" fontWeight="bold" fill={textMain}>B</text>
              <text x="298" y="162" fontSize="14" fontWeight="bold" fill={textMain}>C</text>
              <text x="105" y="88" fontSize="13" fontWeight="bold" fill={strokeDanger}>M</text>
              <text x="244" y="88" fontSize="13" fontWeight="bold" fill={strokeDanger}>N</text>
              <text x="176" y="172" fontSize="13" fontWeight="bold" fill={strokeDanger}>P</text>
              {showProofAids && metrics.perimeterVal && (
                <SvgMeasureTag x={180} y={114} label={`محيط ABC = ${metrics.perimeterVal}`} color={strokePrimary} isDark={isDark} />
              )}
              <text x="180" y="189" fontSize="11" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                محيط MNP = ½ محيط ABC
              </text>
            </g>
          )}

          {/* Quadrilateral Midpoints IJKL */}
          {variant === 'quad-midpoints' && (
            <g>
              <polygon points="95,36 250,28 298,136 60,148" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.4" />
              <line x1="95" y1="36" x2={95 + (298 - 95) * easeOutCubic(lineGrowA)} y2={36 + (136 - 36) * easeOutCubic(lineGrowA)} stroke={strokeAccent} strokeWidth="2" strokeDasharray="5,4" />
              <polygon points="172.5,32 274,82 179,142 77.5,92" fill={arrived ? fillTeal : 'none'} stroke={strokeDanger} strokeWidth="2.6" opacity={clamp01(lineGrowB * 1.2)} />
              <circle cx="172.5" cy="32" r="4.5" fill={strokeDanger} />
              <circle cx="274" cy="82" r="4.5" fill={strokeDanger} />
              <circle cx="179" cy="142" r="4.5" fill={strokeDanger} />
              <circle cx="77.5" cy="92" r="4.5" fill={strokeDanger} />

              <text x="86" y="28" fontSize="13" fontWeight="bold" fill={textMain}>A</text>
              <text x="254" y="24" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
              <text x="305" y="142" fontSize="13" fontWeight="bold" fill={textMain}>C</text>
              <text x="46" y="154" fontSize="13" fontWeight="bold" fill={textMain}>D</text>

              <text x="172" y="22" fontSize="13" fontWeight="bold" fill={strokeDanger}>I</text>
              <text x="284" y="82" fontSize="13" fontWeight="bold" fill={strokeDanger}>J</text>
              <text x="179" y="160" fontSize="13" fontWeight="bold" fill={strokeDanger}>K</text>
              <text x="60" y="92" fontSize="13" fontWeight="bold" fill={strokeDanger}>L</text>

              {showProofAids && metrics.namedLengths['AC'] && (
                <SvgMeasureTag x={200} y={88} label={`AC = ${metrics.namedLengths['AC']}`} color={strokeAccent} isDark={isDark} />
              )}

              <text x="180" y="182" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                IJ = KL = ½ AC  |  (IJ) // (KL) // (AC)
              </text>
            </g>
          )}

          {/* 11. THALES & THREE RATIOS (p.40-41) WITH FULL NUMBERS, OUTER SIDE BRACKETS & PARALLEL ARROWS! */}
          {(variant === 'thales' || variant === 'three-ratios') && (() => {
            const amTag = getDynVal('AM');
            const abTag = getDynVal('AB');
            const anTag = getDynVal('AN');
            const acTag = getDynVal('AC');
            const mnTag = getDynVal('MN');
            const bcTag = getDynVal('BC');
            const hasExplicitNums = Boolean(amTag.text || abTag.text || acTag.text || mnTag.text || m_hasHeight());

            function m_hasHeight() {
              return Boolean(metrics.heightVal || fullText.includes('ظل'));
            }

            // Special Sunlight Shadow Thales visual when page 41 example ("عصا" / "شجرة") is active!
            if (fullText.includes('عصا') || fullText.includes('شجرة')) {
              return (
                <g>
                  {/* Ground line */}
                  <line x1="25" y1="152" x2="335" y2="152" stroke={strokePrimary} strokeWidth="2.5" />
                  {/* Tree vertical */}
                  <line x1="75" y1="152" x2="75" y2="34" stroke={strokeSecondary} strokeWidth="3.5" />
                  <circle cx="75" cy="36" r="14" fill={fillTeal} stroke={strokeSecondary} strokeWidth="2" />
                  {/* Stick vertical */}
                  <line x1="215" y1="152" x2="215" y2="108" stroke={strokeAccent} strokeWidth="3.2" />
                  {/* Sun ray hypotenuse */}
                  <line x1="75" y1="34" x2={75 + 225 * easeOutCubic(lineGrowA)} y2={34 + 118 * easeOutCubic(lineGrowA)} stroke={strokeDanger} strokeWidth="2" strokeDasharray="5,4" />
                  <polyline points="75,140 87,140 87,152" fill="none" stroke={strokeSecondary} strokeWidth="1.6" />
                  <polyline points="215,142 225,142 225,152" fill="none" stroke={strokeAccent} strokeWidth="1.6" />

                  <SvgMeasureTag x={260} y={136} label="ظل العصا = 2 m" color={strokeAccent} isDark={isDark} fontSize={9.5} />
                  <SvgMeasureTag x={180} y={170} label="ظل الشجرة = 10 m" color={strokePrimary} isDark={isDark} fontSize={9.5} />
                  <SvgMeasureTag x={242} y={102} label="1.5 m" color={strokeAccent} isDark={isDark} fontSize={9.5} />
                  <SvgMeasureTag
                    x={38}
                    y={86}
                    label={solutionRevealed ? `h = ${metrics.heightVal || '7.5 m'}` : 'h = ؟'}
                    color={solutionRevealed ? strokeSecondary : strokeDanger}
                    isDark={isDark}
                    isSolved={solutionRevealed}
                    fontSize={10}
                  />
                  <text x="180" y="190" fontSize="11" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                    2 / 10 = 1.5 / h  ⇐  تشابه المثلثين بأشعة الشمس المتوازية
                  </text>
                </g>
              );
            }

            return (
              <g>
                {/* Main Triangle ABC */}
                <polygon points="180,26 80,152 280,152" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.8" />

                {/* Color-coded upper proportion sides [AM] and [AN] */}
                <line x1="180" y1="26" x2="132" y2="86" stroke={strokePrimary} strokeWidth="3.8" />
                <line x1="180" y1="26" x2="228" y2="86" stroke={strokeSecondary} strokeWidth="3.8" />

                {/* Parallel Segment [MN] animating smoothly M -> N */}
                <line
                  x1="132"
                  y1="86"
                  x2={132 + 96 * moveT}
                  y2="86"
                  stroke={strokeAccent}
                  strokeWidth="3.4"
                />
                <circle cx="132" cy="86" r="4.5" fill={strokeAccent} />
                {arrived && <circle cx="228" cy="86" r="4.5" fill={strokeAccent} />}

                {/* Parallel Markers (>>) showing (MN) // (BC) */}
                {showProofAids && arrived && (
                  <>
                    <ParallelMark x={180} y={86} color={strokeAccent} />
                    <ParallelMark x={180} y={152} color={strokePrimary} />
                  </>
                )}

                {/* Vertices safely padded away from triangle lines */}
                <text x="180" y="16" fontSize="14" fontWeight="bold" textAnchor="middle" fill={textMain}>A</text>
                <text x="66" y="158" fontSize="14" fontWeight="bold" fill={textMain}>B</text>
                <text x="287" y="158" fontSize="14" fontWeight="bold" fill={textMain}>C</text>
                <text x="115" y="90" fontSize="13" fontWeight="bold" fill={strokeAccent}>M</text>
                <text x="235" y="90" fontSize="13" fontWeight="bold" fill={arrived ? strokeAccent : textMuted}>N</text>

                {/* Outer Dimension Brackets along Whole Sides [AB] & [AC] so part vs whole is crystal clear! */}
                {showProofAids && abTag.text && (
                  <g opacity="0.88">
                    <line x1="158" y1="18" x2="62" y2="140" stroke={strokePrimary} strokeWidth="1.2" strokeDasharray="3,2" />
                    <line x1="158" y1="18" x2="168" y2="26" stroke={strokePrimary} strokeWidth="1.2" />
                    <line x1="62" y1="140" x2="72" y2="148" stroke={strokePrimary} strokeWidth="1.2" />
                    <SvgMeasureTag x={44} y={96} label={abTag.text} color={strokePrimary} isDark={isDark} isSolved={abTag.isSolved} fontSize={10} />
                  </g>
                )}

                {showProofAids && acTag.text && (
                  <g opacity="0.88">
                    <line x1="202" y1="18" x2="298" y2="140" stroke={strokeSecondary} strokeWidth="1.2" strokeDasharray="3,2" />
                    <line x1="202" y1="18" x2="192" y2="26" stroke={strokeSecondary} strokeWidth="1.2" />
                    <line x1="298" y1="140" x2="288" y2="148" stroke={strokeSecondary} strokeWidth="1.2" />
                    <SvgMeasureTag x={316} y={96} label={acTag.text} color={strokeSecondary} isDark={isDark} isSolved={acTag.isSolved} fontSize={10} />
                  </g>
                )}

                {/* Upper Segment Badges AM & AN */}
                {showProofAids && amTag.text && (
                  <SvgMeasureTag x={135} y={48} label={amTag.text} color={strokePrimary} isDark={isDark} isSolved={amTag.isSolved} fontSize={10} />
                )}
                {showProofAids && (anTag.text || (amTag.text && acTag.text)) && (
                  <SvgMeasureTag
                    x={224}
                    y={48}
                    label={anTag.text || 'AN = ؟'}
                    color={anTag.isSolved ? strokeSecondary : strokeDanger}
                    isDark={isDark}
                    isSolved={anTag.isSolved}
                    fontSize={10}
                  />
                )}

                {/* Parallel Segment MN & Base BC Badges */}
                {showProofAids && mnTag.text && (
                  <SvgMeasureTag x={180} y={71} label={mnTag.text} color={strokeAccent} isDark={isDark} isSolved={mnTag.isSolved} fontSize={10} />
                )}
                {showProofAids && (bcTag.text || mnTag.text) && (
                  <SvgMeasureTag
                    x={180}
                    y={166}
                    label={bcTag.text || 'BC = ؟'}
                    color={bcTag.isSolved ? strokeSecondary : strokeDanger}
                    isDark={isDark}
                    isSolved={bcTag.isSolved}
                    fontSize={10}
                  />
                )}

                {/* Footer Proportion Equation (with exact numerical values when available!) */}
                <text x="180" y="191" fontSize="11" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>
                  {hasExplicitNums && metrics.namedLengths['AM'] && metrics.namedLengths['AB']
                    ? `${metrics.namedLengths['AM']}/${metrics.namedLengths['AB']} = ${solutionRevealed && metrics.namedLengths['AN'] ? metrics.namedLengths['AN'] : 'AN'}/${metrics.namedLengths['AC'] || 'AC'} = ${metrics.namedLengths['MN'] || 'MN'}/${solutionRevealed && metrics.namedLengths['BC'] ? metrics.namedLengths['BC'] : 'BC'}`
                    : 'AM / AB = AN / AC = MN / BC'}
                </text>
              </g>
            );
          })()}

          {variant === 'trapezoid-mid' && (
            <g>
              <polygon points="110,40 245,40 295,148 65,148" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.8" />
              <line x1="110" y1="40" x2={110 + (295 - 110) * easeOutCubic(lineGrowA)} y2={40 + (148 - 40) * easeOutCubic(lineGrowA)} stroke={strokeSecondary} strokeWidth="1.6" strokeDasharray="4,4" />
              <line x1="87.5" y1="94" x2={87.5 + (270 - 87.5) * moveT} y2="94" stroke={strokeDanger} strokeWidth="2.6" />
              <circle cx="87.5" cy="94" r="4.5" fill={strokeDanger} />
              {moveT > 0.5 && <circle cx="202.5" cy="94" r="4" fill={strokeAccent} />}
              {arrived && <circle cx="270" cy="94" r="4.5" fill={strokeDanger} />}
              <text x="102" y="33" fontSize="13" fontWeight="bold" fill={textMain}>A</text>
              <text x="249" y="33" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
              <text x="301" y="156" fontSize="13" fontWeight="bold" fill={textMain}>C</text>
              <text x="51" y="156" fontSize="13" fontWeight="bold" fill={textMain}>D</text>
              <text x="68" y="96" fontSize="13" fontWeight="bold" fill={strokeDanger}>M</text>
              <text x="206" y="86" fontSize="12" fontWeight="bold" fill={strokeAccent}>O</text>
              <text x="278" y="96" fontSize="13" fontWeight="bold" fill={strokeDanger}>N</text>
              {showProofAids && abLenLabel && <SvgMeasureTag x={178} y={26} label={`AB = ${abLenLabel}`} color={strokePrimary} isDark={isDark} fontSize={10} />}
              {showProofAids && metrics.namedLengths['DC'] && <SvgMeasureTag x={178} y={162} label={`DC = ${metrics.namedLengths['DC']}`} color={strokeSecondary} isDark={isDark} fontSize={10} />}
              {showProofAids && metrics.namedLengths['MN'] && <SvgMeasureTag x={145} y={82} label={`MN = ${metrics.namedLengths['MN']}`} color={strokeDanger} isDark={isDark} isSolved fontSize={10} />}
              <text x="180" y="182" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>(MN) // (AB) // (DC)</text>
            </g>
          )}

          {variant === 'perpendicular-bisectors' && (
            <g>
              <circle cx="180" cy="96" r={64 * easeOutCubic(lineGrowB)} fill="none" stroke={strokeSecondary} strokeWidth="2" strokeDasharray="5,4" />
              <polygon points="180,32 122,126 240,120" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
              <circle cx="180" cy="96" r="4.5" fill={strokeDanger} />
              <line x1="180" y1="96" x2="180" y2={96 - 64 * moveT} stroke={strokeAccent} strokeWidth="1.6" />
              <line x1="180" y1="96" x2={180 - 58 * moveT} y2={96 + 30 * moveT} stroke={strokeAccent} strokeWidth="1.6" />
              <line x1="180" y1="96" x2={180 + 60 * moveT} y2={96 + 24 * moveT} stroke={strokeAccent} strokeWidth="1.6" />
              <text x="176" y="24" fontSize="13" fontWeight="bold" fill={textMain}>A</text>
              <text x="108" y="135" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
              <text x="247" y="128" fontSize="13" fontWeight="bold" fill={textMain}>C</text>
              <text x="187" y="95" fontSize="13" fontWeight="bold" fill={strokeDanger}>O</text>
              {showProofAids && radiusLabel && <SvgMeasureTag x={216} y={66} label={`R = ${radiusLabel}`} color={strokeAccent} isDark={isDark} />}
              <text x="180" y="182" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>OA = OB = OC</text>
            </g>
          )}

          {variant === 'altitudes' && (
            <g>
              <polygon points="160,30 70,152 290,152" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
              <line x1="160" y1="30" x2="160" y2={30 + 122 * moveT} stroke={strokeDanger} strokeWidth="2.2" />
              {arrived && <polyline points="160,140 172,140 172,152" fill="none" stroke={strokeDanger} strokeWidth="1.8" />}
              <line x1="70" y1="152" x2={70 + 158 * moveT} y2={152 - 60 * moveT} stroke={strokeAccent} strokeWidth="1.8" strokeDasharray="4,3" />
              <line x1="290" y1="152" x2={290 - 177 * moveT} y2={152 - 58 * moveT} stroke={strokeSecondary} strokeWidth="1.8" strokeDasharray="4,3" />
              {arrived && <circle cx="160" cy="118" r="4.5" fill={strokeDanger} />}
              <text x="156" y="22" fontSize="13" fontWeight="bold" fill={textMain}>A</text>
              <text x="56" y="160" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
              <text x="296" y="160" fontSize="13" fontWeight="bold" fill={textMain}>C</text>
              <text x="167" y="114" fontSize="13" fontWeight="bold" fill={strokeDanger}>H</text>
              <text x="234" y="92" fontSize="12" fontWeight="bold" fill={strokeAccent}>H′</text>
              <text x="98" y="92" fontSize="12" fontWeight="bold" fill={strokeSecondary}>H″</text>
              {showProofAids && areaLabel && <SvgMeasureTag x={260} y={48} label={`S = ${areaLabel}`} color={strokeSecondary} isDark={isDark} isSolved />}
              {showProofAids && metrics.angleVal && <SvgMeasureTag x={182} y={142} label={metrics.angleVal} color={strokeDanger} isDark={isDark} fontSize={9.5} />}
              <text x="180" y="180" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>نقطة تلاقي الارتفاعات H</text>
            </g>
          )}

          {/* Medians & Centroid G with exact 2/3 & 1/3 lengths */}
          {variant === 'medians-centroid' && (() => {
            const bcTag = getDynVal('BC');
            const bgTag = getDynVal('BG');
            const gbpTag = getDynVal("GB'");
            const bbpTag = getDynVal("BB'");
            const cgTag = getDynVal('CG');
            const ccTag = getDynVal("CC'");
            return (
              <g>
                <polygon points="180,26 70,150 290,150" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
                {showProofAids && (
                  <>
                    {/* Bisector tick marks on base BC */}
                    <line x1="122" y1="145" x2="122" y2="155" stroke={strokeAccent} strokeWidth="2" />
                    <line x1="238" y1="145" x2="238" y2="155" stroke={strokeAccent} strokeWidth="2" />
                  </>
                )}
                <line x1="180" y1="26" x2="180" y2={26 + 124 * moveT} stroke={strokeDanger} strokeWidth="2.2" />
                <line x1="70" y1="150" x2={70 + 165 * moveT} y2={150 - 62 * moveT} stroke={strokeSecondary} strokeWidth="2.2" />
                <line x1="290" y1="150" x2={290 - 165 * moveT} y2={150 - 62 * moveT} stroke={strokeAccent} strokeWidth="2.2" />
                {arrived && <circle cx="180" cy="109" r="5" fill={strokeDanger} />}
                <text x="176" y="18" fontSize="13" fontWeight="bold" fill={textMain}>A</text>
                <text x="56" y="158" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
                <text x="296" y="158" fontSize="13" fontWeight="bold" fill={textMain}>C</text>
                <text x="176" y="166" fontSize="12" fontWeight="bold" fill={strokeDanger}>A′</text>
                <text x="188" y="106" fontSize="13" fontWeight="bold" fill={strokeDanger}>G</text>

                {showProofAids && bcTag.text && <SvgMeasureTag x={180} y={139} label={bcTag.text} color={strokePrimary} isDark={isDark} fontSize={9.5} />}
                {showProofAids && bgTag.text && <SvgMeasureTag x={112} y={114} label={bgTag.text} color={strokeSecondary} isDark={isDark} isSolved={bgTag.isSolved} fontSize={9.5} />}
                {showProofAids && gbpTag.text && <SvgMeasureTag x={225} y={84} label={gbpTag.text} color={strokeAccent} isDark={isDark} isSolved={gbpTag.isSolved} fontSize={9.5} />}
                {showProofAids && bbpTag.text && <SvgMeasureTag x={66} y={76} label={bbpTag.text} color={strokePrimary} isDark={isDark} fontSize={9.5} />}
                {showProofAids && cgTag.text && <SvgMeasureTag x={242} y={118} label={cgTag.text} color={strokeAccent} isDark={isDark} fontSize={9.5} />}
                {showProofAids && ccTag.text && <SvgMeasureTag x={294} y={76} label={ccTag.text} color={strokeSecondary} isDark={isDark} isSolved={ccTag.isSolved} fontSize={9.5} />}

                <text x="180" y="186" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>
                  {bbpTag.text ? `BB′ = ${metrics.namedLengths["BB'"]}  |  BG = ⅔ BB′` : 'AG = ⅔ AA′  (نسبة 2 : 1 من الرأس)'}
                </text>
              </g>
            );
          })()}

          {variant === 'angle-bisectors' && (
            <g>
              <polygon points="180,28 70,152 290,152" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
              <circle cx="180" cy="114" r={38 * easeOutCubic(lineGrowB)} fill={fillAmber} stroke={strokeAccent} strokeWidth="2" />
              <circle cx="180" cy="114" r="4" fill={strokeDanger} />
              <line x1="180" y1="28" x2="180" y2={28 + 86 * moveT} stroke={strokeDanger} strokeWidth="1.6" strokeDasharray="4,3" />
              <line x1="70" y1="152" x2={70 + 110 * moveT} y2={152 - 38 * moveT} stroke={strokeDanger} strokeWidth="1.6" strokeDasharray="4,3" />
              <line x1="290" y1="152" x2={290 - 110 * moveT} y2={152 - 38 * moveT} stroke={strokeDanger} strokeWidth="1.6" strokeDasharray="4,3" />
              <line x1="180" y1="114" x2="180" y2={114 + 38 * moveT} stroke={strokeSecondary} strokeWidth="2.2" />
              {arrived && <polyline points="180,142 190,142 190,152" fill="none" stroke={strokeSecondary} strokeWidth="1.5" />}
              <text x="176" y="20" fontSize="13" fontWeight="bold" fill={textMain}>A</text>
              <text x="56" y="160" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
              <text x="296" y="160" fontSize="13" fontWeight="bold" fill={textMain}>C</text>
              <text x="186" y="110" fontSize="13" fontWeight="bold" fill={strokeDanger}>I</text>
              <text x="175" y="166" fontSize="12" fontWeight="bold" fill={strokeSecondary}>H</text>
              <SvgMeasureTag x={152} y={133} label={radiusLabel ? `r=${radiusLabel}` : 'r'} color={strokeSecondary} isDark={isDark} fontSize={9.5} />
              <text x="180" y="185" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>I مركز الدائرة المماسّة للأضلاع داخلاً</text>
            </g>
          )}

          {variant === 'right-triangle-circle' && (() => {
            const hypTag = metrics.namedLengths['BC'] ? getDynVal('BC') : getDynVal('EF');
            const medTag = metrics.namedLengths['AO'] ? getDynVal('AO') : getDynVal('R');
            return (
              <g>
                <circle cx="180" cy="96" r={62 * easeOutCubic(lineGrowB)} fill="none" stroke={strokeSecondary} strokeWidth="2.2" strokeDasharray="5,4" />
                <line x1="118" y1="96" x2="242" y2="96" stroke={strokePrimary} strokeWidth="2.6" />
                <polygon points="118,96 242,96 155,40" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
                <line x1="180" y1="96" x2={180 - 25 * moveT} y2={96 - 56 * moveT} stroke={strokeDanger} strokeWidth="2.4" />
                <circle cx="180" cy="96" r="4.5" fill={strokeDanger} />
                <text x="148" y="30" fontSize="13" fontWeight="bold" fill={textMain}>A (90°)</text>
                <text x="102" y="102" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
                <text x="248" y="102" fontSize="13" fontWeight="bold" fill={textMain}>C</text>
                <text x="177" y="114" fontSize="13" fontWeight="bold" fill={strokeDanger}>O</text>
                {showProofAids && hypTag.text && <SvgMeasureTag x={180} y={134} label={hypTag.text} color={strokePrimary} isDark={isDark} />}
                {showProofAids && (medTag.text || hypTag.text) && (
                  <SvgMeasureTag
                    x={216}
                    y={64}
                    label={medTag.text || 'AO = ½ BC'}
                    color={medTag.isSolved ? strokeSecondary : strokeDanger}
                    isDark={isDark}
                    isSolved={medTag.isSolved}
                  />
                )}
                <text x="180" y="182" fontSize="11" fontWeight="bold" textAnchor="middle" fill={textMuted}>AO = OB = OC = ½ BC</text>
              </g>
            );
          })()}

          {/* Pythagoras & Converse with ACTUAL extracted side lengths and squared boxes! */}
          {(variant === 'pythagoras' || variant === 'pythagoras-converse') && (() => {
            const nums = metrics.numberList.filter((s) => !s.includes('²') && !s.includes('°') && !s.includes('90'));
            const legA = metrics.namedLengths['LK'] || metrics.namedLengths['AB'] || (nums[0] || '');
            const legB = metrics.namedLengths['KM'] || metrics.namedLengths['AC'] || (nums[1] || '');
            const hypC = metrics.namedLengths['LM'] || metrics.namedLengths['BC'] || metrics.namedLengths['d'] || (nums[2] || '');

            const nA = parseFloat(legA);
            const nB = parseFloat(legB);
            const nC = parseFloat(hypC);
            const sqA = !isNaN(nA) ? `${legA}²=${Number((nA * nA).toFixed(1))}` : 'c²';
            const sqB = !isNaN(nB) ? `${legB}²=${Number((nB * nB).toFixed(1))}` : 'b²';

            return (
              <g>
                <rect x="82" y="68" width={52 * easeOutCubic(lineGrowA)} height={52 * easeOutCubic(lineGrowA)} fill={fillTeal} stroke={strokeSecondary} strokeWidth="1.8" />
                <rect x="134" y="120" width={68 * easeOutCubic(lineGrowB)} height={46 * easeOutCubic(lineGrowB)} fill={fillAmber} stroke={strokeAccent} strokeWidth="1.8" />
                <polygon points="134,68 134,120 202,120" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.8" />
                <polyline points="134,108 146,108 146,120" fill="none" stroke={strokeDanger} strokeWidth="2" />
                <text x="130" y="60" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
                <text x="122" y="132" fontSize="13" fontWeight="bold" fill={textMain}>A</text>
                <text x="208" y="128" fontSize="13" fontWeight="bold" fill={textMain}>C</text>

                <text x="108" y="98" fontSize="11" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>{sqA}</text>
                <text x="168" y="148" fontSize="11" fontWeight="bold" textAnchor="middle" fill={strokeAccent}>{sqB}</text>

                {showProofAids && legA && <SvgMeasureTag x={122} y={94} label={legA} color={strokeSecondary} isDark={isDark} fontSize={9.5} />}
                {showProofAids && legB && <SvgMeasureTag x={168} y={131} label={legB} color={strokeAccent} isDark={isDark} isSolved={solutionRevealed && Boolean(metrics.namedLengths['KM'])} fontSize={9.5} />}
                <SvgMeasureTag x={196} y={84} label={hypC ? `الوتر = ${hypC}` : 'a (الوتر)'} color={strokePrimary} isDark={isDark} isSolved={!isNaN(nC) && solutionRevealed} fontSize={10} />

                <text x="180" y="185" fontSize="11.5" fontWeight="bold" textAnchor="middle" fill={textMain}>
                  {!isNaN(nA) && !isNaN(nB) && !isNaN(nC)
                    ? `${nA}² + ${nB}² = ${nC}²`
                    : 'BC² = AB² + AC²'}
                </text>
              </g>
            );
          })()}

          {variant === 'point-line-distance' && (() => {
            const ahTag = getDynVal('AH', metrics.numberList[0] || '');
            const amTag = getDynVal('AM');
            const hmTag = getDynVal('HM');
            return (
              <g>
                <line x1="45" y1="138" x2="315" y2="138" stroke={strokePrimary} strokeWidth="2.8" />
                <circle cx="170" cy="44" r="4.5" fill={strokeDanger} />
                <line x1="170" y1="44" x2="170" y2={44 + 94 * moveT} stroke={strokeDanger} strokeWidth="2.8" />
                <line x1="170" y1="44" x2={170 + 85 * easeOutCubic(lineGrowB)} y2={44 + 94 * easeOutCubic(lineGrowB)} stroke={strokeSecondary} strokeWidth="1.8" strokeDasharray="5,4" />
                {arrived && <polyline points="170,124 184,124 184,138" fill="none" stroke={strokeDanger} strokeWidth="1.8" />}
                <text x="166" y="34" fontSize="14" fontWeight="bold" fill={strokeDanger}>A</text>
                <text x="166" y="156" fontSize="14" fontWeight="bold" fill={textMain}>H</text>
                <text x="253" y="156" fontSize="14" fontWeight="bold" fill={textMain}>M</text>
                <text x="318" y="142" fontSize="13" fontWeight="bold" fill={strokePrimary}>(d)</text>
                {showProofAids && ahTag.text && <SvgMeasureTag x={132} y={92} label={ahTag.text} color={strokeDanger} isDark={isDark} isSolved={ahTag.isSolved} fontSize={10} />}
                {showProofAids && amTag.text && <SvgMeasureTag x={236} y={78} label={amTag.text} color={strokeSecondary} isDark={isDark} fontSize={10} />}
                {showProofAids && hmTag.text && <SvgMeasureTag x={212} y={126} label={hmTag.text} color={strokePrimary} isDark={isDark} fontSize={9.5} />}
                <text x="180" y="182" fontSize="12" fontWeight="bold" textAnchor="middle" fill={textMuted}>AH &lt; AM</text>
              </g>
            );
          })()}

          {variant === 'circle-tangent' && (() => {
            const rTag = radiusLabel || metrics.namedLengths['d'] || '';
            const omTag = getDynVal('OM');
            const mtTag = getDynVal('MT');
            return (
              <g>
                <circle cx="135" cy="94" r="56" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.6" />
                <line x1="191" y1="22" x2="191" y2={22 + 146 * easeOutCubic(lineGrowB)} stroke={strokeDanger} strokeWidth="2.6" />
                <line x1="135" y1="94" x2={135 + 56 * moveT} y2="94" stroke={strokeAccent} strokeWidth="2.4" />
                <line x1="135" y1="94" x2={135 + 56 * easeOutCubic(lineGrowB)} y2={94 + 58 * easeOutCubic(lineGrowB)} stroke={strokeSecondary} strokeWidth="1.8" strokeDasharray="4,3" />
                {arrived && <polyline points="177,94 177,80 191,80" fill="none" stroke={strokeDanger} strokeWidth="1.8" />}
                <circle cx="135" cy="94" r="4" fill={strokePrimary} />
                <circle cx="191" cy="94" r="4" fill={strokeDanger} />
                <circle cx="191" cy="152" r="4" fill={strokeSecondary} />
                <text x="120" y="98" fontSize="13" fontWeight="bold" fill={textMain}>O</text>
                <text x="200" y="96" fontSize="13" fontWeight="bold" fill={strokeDanger}>T</text>
                <text x="200" y="156" fontSize="13" fontWeight="bold" fill={textMain}>M</text>
                <text x="198" y="34" fontSize="12" fontWeight="bold" fill={strokeDanger}>(d)</text>
                <SvgMeasureTag x={160} y={76} label={rTag ? `R=${rTag}` : 'R'} color={strokeAccent} isDark={isDark} fontSize={9.5} />
                {showProofAids && omTag.text && <SvgMeasureTag x={144} y={136} label={omTag.text} color={strokeSecondary} isDark={isDark} fontSize={9.5} />}
                {showProofAids && mtTag.text && <SvgMeasureTag x={238} y={124} label={mtTag.text} color={strokeDanger} isDark={isDark} isSolved={mtTag.isSolved} fontSize={9.5} />}
                <text x="180" y="185" fontSize="12" fontWeight="bold" textAnchor="middle" fill={textMuted}>(MT) ⊥ (OT) | OTM = 90°</text>
              </g>
            );
          })()}

          {(variant === 'pyramid' || variant === 'pyramid-volume') && (
            <g>
              <polygon points="105,146 215,146 260,114 150,114" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.2" />
              <line x1="182" y1="30" x2="105" y2="146" stroke={strokePrimary} strokeWidth="2.6" />
              <line x1="182" y1="30" x2="215" y2="146" stroke={strokePrimary} strokeWidth="2.6" />
              <line x1="182" y1="30" x2="260" y2="114" stroke={strokePrimary} strokeWidth="2.6" />
              <line x1="182" y1="30" x2="150" y2="114" stroke={strokePrimary} strokeWidth="1.6" strokeDasharray="4,4" />
              <line x1="182" y1="30" x2="182" y2={30 + 100 * moveT} stroke={strokeDanger} strokeWidth="2.2" strokeDasharray="5,3" />
              <line x1="182" y1="130" x2={182 + 55.5 * easeOutCubic(lineGrowB)} y2="130" stroke={strokeAccent} strokeWidth="1.8" />
              <line x1="182" y1="30" x2={182 + 55.5 * easeOutCubic(lineGrowB)} y2={30 + 100 * easeOutCubic(lineGrowB)} stroke={strokeAccent} strokeWidth="1.8" strokeDasharray="3,3" />
              <circle cx="182" cy="130" r="3.5" fill={strokeDanger} />
              <circle cx="237.5" cy="130" r="3.5" fill={strokeAccent} />
              <text x="179" y="23" fontSize="14" fontWeight="bold" fill={textMain}>S</text>
              <text x="92" y="154" fontSize="13" fontWeight="bold" fill={textMain}>A</text>
              <text x="220" y="154" fontSize="13" fontWeight="bold" fill={textMain}>B</text>
              <text x="266" y="118" fontSize="13" fontWeight="bold" fill={textMain}>C</text>
              <text x="142" y="110" fontSize="13" fontWeight="bold" fill={textMain}>D</text>
              <text x="171" y="133" fontSize="12" fontWeight="bold" fill={strokeDanger}>O</text>
              <text x="245" y="135" fontSize="12" fontWeight="bold" fill={strokeAccent}>M</text>

              <SvgMeasureTag x={160} y={84} label={metrics.heightVal ? `h=${metrics.heightVal}` : 'h'} color={strokeDanger} isDark={isDark} isSolved={solutionRevealed && !problemMetrics.heightVal} fontSize={9.5} />
              {showProofAids && (sideLenLabel || metrics.areaVal) && (
                <SvgMeasureTag x={52} y={130} label={metrics.areaVal ? `S=${metrics.areaVal}` : `a=${sideLenLabel}`} color={strokePrimary} isDark={isDark} fontSize={9.5} />
              )}
              {showProofAids && metrics.volumeVal && (
                <SvgMeasureTag x={294} y={62} label={`V=${metrics.volumeVal}`} color={strokeSecondary} isDark={isDark} isSolved fontSize={10} />
              )}
              {showProofAids && metrics.slantVal && (
                <SvgMeasureTag x={262} y={90} label={`SM=${metrics.slantVal}`} color={strokeAccent} isDark={isDark} isSolved fontSize={9.5} />
              )}
              <text x="180" y="178" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>V = ⅓ × S × h</text>
            </g>
          )}

          {variant === 'cone' && (() => {
            const effR = radiusLabel || (metrics.diameterVal ? `${parseFloat(metrics.diameterVal) / 2}` : '');
            return (
              <g>
                <ellipse cx="180" cy="142" rx="70" ry="20" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.4" />
                <line x1="180" y1="32" x2="110" y2="142" stroke={strokePrimary} strokeWidth="2.6" />
                <line x1="180" y1="32" x2="250" y2="142" stroke={strokePrimary} strokeWidth="2.6" />
                <line x1="180" y1="32" x2="180" y2={32 + 110 * moveT} stroke={strokeDanger} strokeWidth="2.2" strokeDasharray="5,3" />
                <line x1="180" y1="142" x2={180 + 70 * easeOutCubic(lineGrowB)} y2="142" stroke={strokeAccent} strokeWidth="2.2" />
                {arrived && <polyline points="180,130 192,130 192,142" fill="none" stroke={strokeDanger} strokeWidth="1.6" />}
                <text x="177" y="24" fontSize="14" fontWeight="bold" fill={textMain}>S</text>

                <SvgMeasureTag x={156} y={92} label={metrics.heightVal ? `h=${metrics.heightVal}` : 'h'} color={strokeDanger} isDark={isDark} fontSize={9.5} />
                <SvgMeasureTag x={218} y={136} label={effR ? `r=${effR}` : 'r'} color={strokeAccent} isDark={isDark} fontSize={9.5} />
                <SvgMeasureTag x={242} y={84} label={metrics.slantVal ? `L=${metrics.slantVal}` : 'L'} color={strokePrimary} isDark={isDark} isSolved={solutionRevealed && !problemMetrics.slantVal} fontSize={9.5} />

                {showProofAids && (metrics.volumeVal || metrics.angleVal) && (
                  <SvgMeasureTag
                    x={74}
                    y={72}
                    label={metrics.volumeVal ? `V=${metrics.volumeVal}` : `θ=${metrics.angleVal}`}
                    color={strokeSecondary}
                    isDark={isDark}
                    isSolved={solutionRevealed}
                    fontSize={9.5}
                  />
                )}
                <text x="180" y="182" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>V = ⅓ × π × r² × h</text>
              </g>
            );
          })()}

          {variant === 'cylinder' && (
            <g>
              <ellipse cx="180" cy="46" rx="56" ry="16" fill={fillSoft} stroke={strokePrimary} strokeWidth="2.4" />
              <ellipse cx="180" cy="142" rx="56" ry="16" fill={fillTeal} stroke={strokePrimary} strokeWidth="2.4" />
              <line x1="124" y1="46" x2="124" y2="142" stroke={strokePrimary} strokeWidth="2.4" />
              <line x1="236" y1="46" x2="236" y2="142" stroke={strokePrimary} strokeWidth="2.4" />
              <line x1="180" y1="46" x2="180" y2={46 + 96 * moveT} stroke={strokeDanger} strokeWidth="2" strokeDasharray="4,3" />
              <line x1="180" y1="142" x2={180 + 56 * easeOutCubic(lineGrowB)} y2="142" stroke={strokeAccent} strokeWidth="2" />
              <SvgMeasureTag x={160} y={96} label={metrics.heightVal ? `h=${metrics.heightVal}` : 'h'} color={strokeDanger} isDark={isDark} fontSize={9.5} />
              <SvgMeasureTag x={208} y={135} label={radiusLabel ? `r=${radiusLabel}` : 'r'} color={strokeAccent} isDark={isDark} fontSize={9.5} />
              {showProofAids && metrics.volumeVal && (
                <SvgMeasureTag x={286} y={94} label={`V=${metrics.volumeVal}`} color={strokeSecondary} isDark={isDark} isSolved fontSize={9.5} />
              )}
              <text x="180" y="180" fontSize="12" fontWeight="bold" textAnchor="middle" fill={strokeSecondary}>V = π × r² × h</text>
            </g>
          )}
        </svg>
      </div>

      {/* Smart Pedagogical Deduction Strip: Automatic theorem insight & numerical proof hint */}
      {smartInsight && (
        <div
          className={`mt-2 pt-2 border-t flex flex-wrap items-center justify-between gap-2 px-1.5 text-[11px] sm:text-xs font-bold ${
            isDark
              ? 'border-emerald-800/50 text-emerald-200'
              : 'border-sky-200/80 text-sky-900'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
            <span dir="ltr" className="tabular-nums">{smartInsight.formulaHint}</span>
          </span>
          {smartInsight.computedNote && (
            <span dir="ltr" className={`tabular-nums font-extrabold ${isDark ? 'text-amber-300' : 'text-emerald-700'}`}>
              {smartInsight.computedNote}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
