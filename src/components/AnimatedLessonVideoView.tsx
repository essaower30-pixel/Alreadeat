import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Film,
  Sparkles,
  Maximize2,
  Minimize2,
  BookOpen,
  CheckSquare,
  Lightbulb,
  Compass,
  Calculator,
  Clock,
  Layers,
  PenTool,
  CheckCircle2,
  Pin,
  PinOff
} from 'lucide-react';
import {
  getCurriculumLessonById,
  getBookForLesson,
  SYRIAN_ALGEBRA_UNITS
} from '../data/curriculumUnits';
import { getFullLessonPackage } from '../data/curriculumLessonsData';
import { speechManager, normalizeAndSplitSpeechSentences } from '../utils/speechService';
import { sfx } from '../utils/soundEffects';
import { GranularMathEquation, tokenizeEquation } from './GranularMathEquation';
import { FormattedMathText } from './FormattedMathText';
import { GeometryDiagram, resolveGeometryDiagramVariant } from './GeometryDiagram';
import { AlgebraExampleVisualSvg } from './ExampleVisualBoard';
import { buildExampleChalkboardEquation, extractGeometryMeasurements } from '../utils/exampleMathExtractor';

interface AnimatedLessonVideoViewProps {
  lessonId: string;
  onOpenRead?: () => void;
  onOpenExercises?: () => void;
}

type CueRole = 'title' | 'rule' | 'eqPart' | 'exampleProblem' | 'exampleSolution' | 'tip';

interface SceneCue {
  role: CueRole;
  displayText?: string;
  spokenSentences: string[];
  tokenStart?: number;
  tokenEnd?: number;
}

interface FlatNarrationSlot {
  cueIdx: number;
  role: CueRole;
  sentenceIdxInCue: number;
  totalSentencesInCue: number;
  sentence: string;
  ruleLineIndex?: number;
  tokenStart?: number;
  tokenEnd?: number;
}

interface VideoScene {
  id: string;
  kind: 'intro' | 'concept' | 'summary';
  chapterBadge: string;
  title: string;
  ruleText: string;
  mathEquation?: string;
  equationTotalTokens: number;
  exampleProblem?: string;
  exampleSolution?: string;
  keyTip?: string;
  pageNum?: number;
  hasDiagram: boolean;
  cues: SceneCue[];
  slots: FlatNarrationSlot[];
  narrationLines: string[];
  estimatedSeconds: number;
}

function formatDurationMMSS(totalSec: number): string {
  const safe = Math.max(0, Math.round(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Breaks a raw mathEquation string into progressive step-by-step equation cues
 * aligned 1-to-1 with token slices of tokenizeEquation(mathEquation) so each
 * number, fraction, and operator appears on the empty chalkboard right as the teacher says it.
 */
function buildEquationTokenCues(mathEquation: string): SceneCue[] {
  const cleanEq = (mathEquation || '').trim();
  if (!cleanEq) return [];

  const tokens = tokenizeEquation(cleanEq);
  if (tokens.length === 0) return [];

  // Group token indices at top-level '=' / '➔' / '|' boundaries
  interface TokenGroup {
    start: number;
    end: number; // exclusive
    leadOp: string;
    rawTokens: string[];
  }

  const groups: TokenGroup[] = [];
  let curStart = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].trim();
    if (i > curStart && (t === '=' || t === '➔' || t === '|')) {
      groups.push({
        start: curStart,
        end: i,
        leadOp: curStart === 0 ? '' : tokens[curStart].trim(),
        rawTokens: tokens.slice(curStart, i)
      });
      curStart = i;
    }
  }
  if (curStart < tokens.length) {
    groups.push({
      start: curStart,
      end: tokens.length,
      leadOp: curStart === 0 ? '' : tokens[curStart].trim(),
      rawTokens: tokens.slice(curStart)
    });
  }

  const cues: SceneCue[] = [];
  groups.forEach((grp, gIdx) => {
    const bodyStr = grp.rawTokens
      .map((tk) => tk.replace(/\s+\/\s+/g, '/'))
      .join(' ')
      .trim();

    let spokenPrompt = bodyStr;
    if (gIdx === 0) {
      spokenPrompt = `نكتب على السبورة: ${bodyStr}.`;
    } else if (grp.leadOp === '|') {
      spokenPrompt = `وكذلك ${bodyStr.replace(/^\|/, '').trim()}.`;
    } else if (grp.leadOp === '➔') {
      spokenPrompt = `ومنها ${bodyStr.replace(/^➔/, '').trim()}.`;
    } else if (grp.leadOp === '=') {
      const isLast = gIdx === groups.length - 1;
      spokenPrompt = isLast
        ? `ويساوي الناتج النهائي ${bodyStr.replace(/^=/, '').trim()}.`
        : `يساوي ${bodyStr.replace(/^=/, '').trim()}.`;
    }

    const spokenSentences = normalizeAndSplitSpeechSentences(spokenPrompt);
    cues.push({
      role: 'eqPart',
      spokenSentences: spokenSentences.length > 0 ? spokenSentences : [bodyStr],
      tokenStart: grp.start,
      tokenEnd: grp.end
    });
  });

  return cues;
}

function buildSceneCuesAndSlots(params: {
  titleSpoken: string;
  ruleText: string;
  mathEquation?: string;
  exampleProblem?: string;
  exampleSolution?: string;
  keyTip?: string;
}): { cues: SceneCue[]; slots: FlatNarrationSlot[]; narrationLines: string[] } {
  const cues: SceneCue[] = [];

  // 1. Title Cue (board begins empty, then title writes at top)
  const titleSentences = normalizeAndSplitSpeechSentences(params.titleSpoken);
  if (titleSentences.length > 0) {
    cues.push({
      role: 'title',
      spokenSentences: titleSentences
    });
  }

  // 2. Rule / Explanation Cue (split into readable chunks revealed sequentially)
  if (params.ruleText) {
    const rawParts = params.ruleText
      .split(/(?<=[.،؛!?])\s+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const ruleChunks = rawParts.length > 0 ? rawParts : [params.ruleText];
    ruleChunks.forEach((chunk) => {
      const sents = normalizeAndSplitSpeechSentences(chunk);
      if (sents.length > 0) {
        cues.push({
          role: 'rule',
          displayText: chunk,
          spokenSentences: sents
        });
      }
    });
  }

  // 3. Equation Token-by-Token Cues
  if (params.mathEquation) {
    const eqCues = buildEquationTokenCues(params.mathEquation);
    cues.push(...eqCues);
  }

  // 4. Example Problem Cue
  if (params.exampleProblem) {
    const probSents = normalizeAndSplitSpeechSentences(`مثال تطبيقي: ${params.exampleProblem}.`);
    if (probSents.length > 0) {
      cues.push({
        role: 'exampleProblem',
        spokenSentences: probSents
      });
    }
  }

  // 5. Example Solution Cue
  if (params.exampleSolution) {
    const solSents = normalizeAndSplitSpeechSentences(`خطوة الحل والنتيجة: ${params.exampleSolution}.`);
    if (solSents.length > 0) {
      cues.push({
        role: 'exampleSolution',
        spokenSentences: solSents
      });
    }
  }

  // 6. Key Tip Cue
  if (params.keyTip) {
    const tipSents = normalizeAndSplitSpeechSentences(`ملاحظة مهمة: ${params.keyTip}`);
    if (tipSents.length > 0) {
      cues.push({
        role: 'tip',
        spokenSentences: tipSents
      });
    }
  }

  // Flatten cues into narrationLines + aligned FlatNarrationSlot[]
  const slots: FlatNarrationSlot[] = [];
  const narrationLines: string[] = [];
  let ruleCounter = 0;

  cues.forEach((cue, cueIdx) => {
    const assignedRuleIdx = cue.role === 'rule' ? ruleCounter++ : undefined;
    cue.spokenSentences.forEach((sent, sIdx) => {
      narrationLines.push(sent);
      slots.push({
        cueIdx,
        role: cue.role,
        sentenceIdxInCue: sIdx,
        totalSentencesInCue: cue.spokenSentences.length,
        sentence: sent,
        ruleLineIndex: assignedRuleIdx,
        tokenStart: cue.tokenStart,
        tokenEnd: cue.tokenEnd
      });
    });
  });

  return { cues, slots, narrationLines };
}

export const AnimatedLessonVideoView: React.FC<AnimatedLessonVideoViewProps> = ({
  lessonId,
  onOpenRead,
  onOpenExercises
}) => {
  const activeBook = getBookForLesson(lessonId);
  const isGeometry = activeBook.id === 'geometry';
  const lessonMeta = useMemo(
    () => getCurriculumLessonById(lessonId) || SYRIAN_ALGEBRA_UNITS[0].lessons[0],
    [lessonId]
  );
  const fullPkg = useMemo(() => getFullLessonPackage(lessonId), [lessonId]);

  // Build empty-to-animated chalkboard scenes for EVERY Algebra & Geometry lesson
  const scenes: VideoScene[] = useMemo(() => {
    const built: VideoScene[] = [];

    // 1. Intro Scene
    const introBuilt = buildSceneCuesAndSlots({
      titleSpoken: `أهلاً بكم أعزائي طلاب الصف الثامن في شرح ${lessonMeta.title}.`,
      ruleText: [lessonMeta.subtitle, lessonMeta.summary].filter(Boolean).join('. '),
      mathEquation: lessonMeta.ruleEquation
    });

    built.push({
      id: `${lessonId}-intro`,
      kind: 'intro',
      chapterBadge: `المقدمة · ${lessonMeta.pages}`,
      title: lessonMeta.title,
      ruleText: lessonMeta.summary,
      mathEquation: lessonMeta.ruleEquation,
      equationTotalTokens: lessonMeta.ruleEquation ? tokenizeEquation(lessonMeta.ruleEquation).length : 0,
      pageNum: fullPkg?.bookPages[0]?.pageNum,
      hasDiagram: !!resolveGeometryDiagramVariant(lessonId, lessonMeta.title, lessonMeta.summary),
      cues: introBuilt.cues,
      slots: introBuilt.slots,
      narrationLines: introBuilt.narrationLines.length > 0 ? introBuilt.narrationLines : [`أهلاً بكم في شرح ${lessonMeta.title}.`],
      estimatedSeconds: Math.max(10, introBuilt.narrationLines.length * 4 + 3)
    });

    // 2. Concept / Book Sections Scenes
    if (fullPkg && fullPkg.bookPages.length > 0) {
      fullPkg.bookPages.forEach((page) => {
        page.sections.forEach((sec, sIdx) => {
          const secBuilt = buildSceneCuesAndSlots({
            titleSpoken: `${sec.title}.`,
            ruleText: sec.ruleText,
            mathEquation: sec.mathEquation,
            exampleProblem: sec.exampleProblem,
            exampleSolution: sec.exampleSolution,
            keyTip: sec.keyTip
          });

          built.push({
            id: sec.id || `${lessonId}-p${page.pageNum}-s${sIdx}`,
            kind: 'concept',
            chapterBadge: `${sec.badge || page.badge} · ص ${page.pageNum}`,
            title: sec.title,
            ruleText: sec.ruleText,
            mathEquation: sec.mathEquation,
            equationTotalTokens: sec.mathEquation ? tokenizeEquation(sec.mathEquation).length : 0,
            exampleProblem: sec.exampleProblem,
            exampleSolution: sec.exampleSolution,
            keyTip: sec.keyTip,
            pageNum: page.pageNum,
            hasDiagram: !!resolveGeometryDiagramVariant(
              lessonId,
              sec.title,
              `${sec.ruleText} ${sec.mathEquation || ''} ${sec.exampleProblem}`
            ),
            cues: secBuilt.cues,
            slots: secBuilt.slots,
            narrationLines: secBuilt.narrationLines.length > 0 ? secBuilt.narrationLines : [sec.title],
            estimatedSeconds: Math.max(12, secBuilt.narrationLines.length * 4 + 4)
          });
        });
      });
    }

    // 3. Outro / Golden Summary Scene
    const outroBuilt = buildSceneCuesAndSlots({
      titleSpoken: `الخلاصة الذهبية لـ ${lessonMeta.title}.`,
      ruleText: lessonMeta.keyRule,
      mathEquation: lessonMeta.ruleEquation,
      exampleProblem: lessonMeta.exampleProblem,
      exampleSolution: lessonMeta.exampleSolution,
      keyTip: 'يمكنك الآن الانتقال لحل التمارين التفاعلية بثقة.'
    });

    built.push({
      id: `${lessonId}-outro`,
      kind: 'summary',
      chapterBadge: 'الخلاصة الذهبية ⭐',
      title: `ملخص ${lessonMeta.title}`,
      ruleText: lessonMeta.keyRule,
      mathEquation: lessonMeta.ruleEquation,
      equationTotalTokens: lessonMeta.ruleEquation ? tokenizeEquation(lessonMeta.ruleEquation).length : 0,
      exampleProblem: lessonMeta.exampleProblem,
      exampleSolution: lessonMeta.exampleSolution,
      keyTip: 'انتهى فيديو الشرح! جرّب حل تمارين الدرس الآن لتثبيت الفهم.',
      hasDiagram: !!resolveGeometryDiagramVariant(
        lessonId,
        lessonMeta.title,
        `${lessonMeta.keyRule} ${lessonMeta.exampleProblem}`
      ),
      cues: outroBuilt.cues,
      slots: outroBuilt.slots,
      narrationLines: outroBuilt.narrationLines.length > 0 ? outroBuilt.narrationLines : [lessonMeta.keyRule],
      estimatedSeconds: Math.max(10, outroBuilt.narrationLines.length * 4 + 3)
    });

    return built;
  }, [lessonId, lessonMeta, fullPkg]);

  const [sceneIndex, setSceneIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false); // False => chalkboard starts 100% empty!
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [sceneProgress, setSceneProgress] = useState<number>(0); // 0..100
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number>(0);
  const [sentenceProgressRatio, setSentenceProgressRatio] = useState<number>(0); // 0..1 inside active sentence
  const [activeSentenceText, setActiveSentenceText] = useState<string>('');
  const [isCinemaExpanded, setIsCinemaExpanded] = useState<boolean>(false);
  const [isBoardPinned, setIsBoardPinned] = useState<boolean>(true);
  const [diagramAnimProgress, setDiagramAnimProgress] = useState<number>(0);
  const [exampleAnimProgress, setExampleAnimProgress] = useState<number>(0);

  const sceneIndexRef = useRef(sceneIndex);
  sceneIndexRef.current = sceneIndex;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const isAudioEnabledRef = useRef(isAudioEnabled);
  isAudioEnabledRef.current = isAudioEnabled;
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;

  const currentScene = scenes[sceneIndex] || scenes[0];

  // Calculate cumulative timestamps for scrubber & chapter list
  const sceneTimelineMeta = useMemo(() => {
    let cursor = 0;
    const offsets = scenes.map((sc) => {
      const start = cursor;
      cursor += sc.estimatedSeconds;
      return { start, duration: sc.estimatedSeconds, end: cursor };
    });
    return { offsets, totalDuration: Math.max(1, cursor) };
  }, [scenes]);

  const elapsedSeconds = useMemo(() => {
    if (!hasStarted) return 0;
    const meta = sceneTimelineMeta.offsets[sceneIndex];
    if (!meta) return 0;
    const clampedPct = Math.min(100, Math.max(0, sceneProgress));
    return Math.min(sceneTimelineMeta.totalDuration, meta.start + (meta.duration * clampedPct) / 100);
  }, [hasStarted, sceneTimelineMeta, sceneIndex, sceneProgress]);

  const totalProgressPercent = useMemo(() => {
    return Math.min(100, Math.max(0, (elapsedSeconds / sceneTimelineMeta.totalDuration) * 100));
  }, [elapsedSeconds, sceneTimelineMeta.totalDuration]);

  // Build progressive chronological stages for "مراحل الدرس تحت السبورة"
  const sceneStages = useMemo(() => {
    interface StageItem {
      id: string;
      role: CueRole;
      label: string;
      startCueIdx: number;
      endCueIdx: number;
      bodyText: string;
      formulaText?: string;
      metricChips?: string[];
    }

    const stages: StageItem[] = [];
    const ruleTexts: string[] = [];
    let ruleStart = -1;
    let ruleEnd = -1;
    let eqStart = -1;
    let eqEnd = -1;

    currentScene.cues.forEach((c, idx) => {
      if (c.role === 'title') {
        stages.push({
          id: `${currentScene.id}-stg-title`,
          role: 'title',
          label: '1. التمهيد وعنوان الفقرة',
          startCueIdx: idx,
          endCueIdx: idx,
          bodyText: currentScene.title
        });
      } else if (c.role === 'rule') {
        if (ruleStart === -1) ruleStart = idx;
        ruleEnd = idx;
        if (c.displayText) ruleTexts.push(c.displayText);
      } else if (c.role === 'eqPart') {
        if (eqStart === -1) eqStart = idx;
        eqEnd = idx;
      }
    });

    if (ruleStart !== -1) {
      stages.splice(Math.min(1, stages.length), 0, {
        id: `${currentScene.id}-stg-rule`,
        role: 'rule',
        label: '2. الشرح والقاعدة الهندسية / الجبرية',
        startCueIdx: ruleStart,
        endCueIdx: ruleEnd,
        bodyText: ruleTexts.join(' ') || currentScene.ruleText
      });
    }

    if (eqStart !== -1 && currentScene.mathEquation) {
      stages.push({
        id: `${currentScene.id}-stg-eq`,
        role: 'eqPart',
        label: '3. العلاقة الرياضية على السبورة',
        startCueIdx: eqStart,
        endCueIdx: eqEnd,
        bodyText: currentScene.mathEquation,
        formulaText: currentScene.mathEquation
      });
    }

    const probIdx = currentScene.cues.findIndex((c) => c.role === 'exampleProblem');
    if (probIdx !== -1 && currentScene.exampleProblem) {
      const m = extractGeometryMeasurements(`${currentScene.exampleProblem} ${currentScene.exampleSolution || ''}`);
      const chips: string[] = [];
      if (m.segLen) chips.push(`الطول: ${m.segLen}`);
      if (m.shiftLen) chips.push(`الانسحاب: ${m.shiftLen}`);
      if (m.sideLen) chips.push(`الضلع: ${m.sideLen}`);
      if (m.areaVal) chips.push(`المساحة: ${m.areaVal}`);
      if (m.radiusVal) chips.push(`R = ${m.radiusVal}`);
      Object.entries(m.namedLengths).slice(0, 2).forEach(([k, v]) => {
        const entry = `${k} = ${v}`;
        if (!chips.some((ch) => ch.includes(v))) chips.push(entry);
      });

      stages.push({
        id: `${currentScene.id}-stg-prob`,
        role: 'exampleProblem',
        label: '4. المثال التطبيقي والأرقام',
        startCueIdx: probIdx,
        endCueIdx: probIdx,
        bodyText: currentScene.exampleProblem,
        metricChips: chips
      });
    }

    const solIdx = currentScene.cues.findIndex((c) => c.role === 'exampleSolution');
    if (solIdx !== -1 && currentScene.exampleSolution) {
      stages.push({
        id: `${currentScene.id}-stg-sol`,
        role: 'exampleSolution',
        label: '5. خطوة الحل والنتيجة على السبورة',
        startCueIdx: solIdx,
        endCueIdx: solIdx,
        bodyText: currentScene.exampleSolution
      });
    }

    const tipIdx = currentScene.cues.findIndex((c) => c.role === 'tip');
    if (tipIdx !== -1 && currentScene.keyTip) {
      stages.push({
        id: `${currentScene.id}-stg-tip`,
        role: 'tip',
        label: '6. الملاحظة الذهبية',
        startCueIdx: tipIdx,
        endCueIdx: tipIdx,
        bodyText: currentScene.keyTip
      });
    }

    return stages;
  }, [currentScene]);

  const exampleBoardEquation = useMemo(() => {
    if (!currentScene.exampleProblem) return '';
    return buildExampleChalkboardEquation(
      currentScene.exampleProblem,
      currentScene.exampleSolution || '',
      currentScene.mathEquation
    );
  }, [currentScene]);

  const exampleBoardTotalTokens = useMemo(
    () => (exampleBoardEquation ? tokenizeEquation(exampleBoardEquation).length : 0),
    [exampleBoardEquation]
  );

  // =========================================================================
  // SYNCHRONIZED CHALKBOARD REVEAL ENGINE (Starts Empty -> Writes With Speech)
  // =========================================================================
  const boardRevealState = useMemo(() => {
    if (!hasStarted) {
      return {
        isEmptyBoard: true,
        showTitle: false,
        visibleRuleLines: [] as string[],
        showDiagram: false,
        showEquationBox: false,
        visibleTokenCount: 0,
        activeWriteTokenIdx: null as number | null,
        showExampleProblem: false,
        showExampleSolution: false,
        showKeyTip: false,
        activeRole: undefined as CueRole | undefined,
        activeStageIdx: -1
      };
    }

    const totalSlots = Math.max(1, currentScene.slots.length);
    const safeSlotIdx = Math.min(totalSlots - 1, Math.max(0, activeSentenceIdx));
    const currentSlot = currentScene.slots[safeSlotIdx];
    const currentCueIdx = currentSlot?.cueIdx ?? 0;

    const showTitle = true;

    const visibleRuleLines: string[] = [];
    currentScene.cues.forEach((c, idx) => {
      if (c.role === 'rule' && idx <= currentCueIdx && c.displayText) {
        visibleRuleLines.push(c.displayText);
      }
    });

    const hasRuleOrLater = currentCueIdx >= 1 || sceneProgress >= 12;
    const showDiagram = currentScene.hasDiagram && hasRuleOrLater;

    let visibleTokenCount = 0;
    let activeWriteTokenIdx: number | null = null;
    let showEquationBox = false;

    if (currentScene.mathEquation && currentScene.equationTotalTokens > 0) {
      const firstEqCueIdx = currentScene.cues.findIndex((c) => c.role === 'eqPart');
      if (firstEqCueIdx !== -1 && currentCueIdx >= firstEqCueIdx) {
        showEquationBox = true;

        let lastEqCueIdx = firstEqCueIdx;
        currentScene.cues.forEach((c, idx) => {
          if (c.role === 'eqPart') lastEqCueIdx = idx;
        });

        if (currentCueIdx > lastEqCueIdx || sceneProgress >= 99) {
          visibleTokenCount = currentScene.equationTotalTokens;
          activeWriteTokenIdx = null;
        } else if (currentSlot && currentSlot.role === 'eqPart') {
          const tStart = currentSlot.tokenStart ?? 0;
          const tEnd = currentSlot.tokenEnd ?? currentScene.equationTotalTokens;
          const span = Math.max(1, tEnd - tStart);
          const cueProgress =
            (currentSlot.sentenceIdxInCue + Math.min(0.99, Math.max(0.05, sentenceProgressRatio))) /
            Math.max(1, currentSlot.totalSentencesInCue);

          const newlyWrittenInGroup = Math.max(1, Math.min(span, Math.ceil(cueProgress * span)));
          visibleTokenCount = Math.min(currentScene.equationTotalTokens, tStart + newlyWrittenInGroup);
          activeWriteTokenIdx = Math.max(0, visibleTokenCount - 1);
        }
      }
    }

    const probCueIdx = currentScene.cues.findIndex((c) => c.role === 'exampleProblem');
    const solCueIdx = currentScene.cues.findIndex((c) => c.role === 'exampleSolution');
    const tipCueIdx = currentScene.cues.findIndex((c) => c.role === 'tip');

    const showExampleProblem = Boolean(
      currentScene.exampleProblem && probCueIdx !== -1 && currentCueIdx >= probCueIdx
    );
    const showExampleSolution = Boolean(
      currentScene.exampleSolution && solCueIdx !== -1 && currentCueIdx >= solCueIdx
    );
    const showKeyTip = Boolean(
      currentScene.keyTip && tipCueIdx !== -1 && currentCueIdx >= tipCueIdx
    );

    const foundStageIdx = sceneStages.findIndex(
      (stg) => currentCueIdx >= stg.startCueIdx && currentCueIdx <= stg.endCueIdx
    );
    const activeStageIdx = foundStageIdx !== -1 ? foundStageIdx : Math.max(0, sceneStages.length - 1);

    return {
      isEmptyBoard: false,
      showTitle,
      visibleRuleLines,
      showDiagram,
      showEquationBox,
      visibleTokenCount,
      activeWriteTokenIdx,
      showExampleProblem,
      showExampleSolution,
      showKeyTip,
      activeRole: currentSlot?.role,
      activeStageIdx
    };
  }, [hasStarted, currentScene, sceneStages, activeSentenceIdx, sentenceProgressRatio, sceneProgress]);

  // Continuous 30fps motion engine so geometric translations (A -> B, sliding tiles/triangles)
  // and example boards visibly glide across the chalkboard in sync with the teacher!
  useEffect(() => {
    if (!hasStarted || !boardRevealState.showDiagram) {
      setDiagramAnimProgress(0);
      return;
    }
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setDiagramAnimProgress((prev) => {
        const step = 0.011 * Math.max(0.65, playbackRateRef.current);
        const next = prev + step;
        // During active rule/equation explanation, gently loop after holding briefly at destination
        const isRuleOrEq =
          boardRevealState.activeRole === 'rule' || boardRevealState.activeRole === 'eqPart';
        if (next >= 1.35) {
          return isRuleOrEq ? 0.04 : 1;
        }
        return next;
      });
    }, 35);

    return () => window.clearInterval(timer);
  }, [hasStarted, isPlaying, boardRevealState.showDiagram, boardRevealState.activeRole, sceneIndex]);

  // Continuous motion engine for the Applied Example Visual Chalkboard (Problem -> Solution)
  useEffect(() => {
    if (!hasStarted || (!boardRevealState.showExampleProblem && !boardRevealState.showExampleSolution)) {
      setExampleAnimProgress(0);
      return;
    }
    // Kick off fresh motion burst when entering solution stage if needed
    if (boardRevealState.showExampleSolution) {
      setExampleAnimProgress((prev) => (prev >= 0.95 ? 0.15 : prev));
    }
  }, [hasStarted, boardRevealState.showExampleProblem, boardRevealState.showExampleSolution, sceneIndex]);

  useEffect(() => {
    if (!hasStarted || (!boardRevealState.showExampleProblem && !boardRevealState.showExampleSolution)) {
      return;
    }
    if (!isPlaying) {
      setExampleAnimProgress((prev) => (prev < 0.25 ? 1 : prev));
      return;
    }

    const timer = window.setInterval(() => {
      setExampleAnimProgress((prev) => {
        const step = 0.013 * Math.max(0.65, playbackRateRef.current);
        const next = prev + step;
        const maxHold = boardRevealState.showExampleSolution ? 1.45 : 0.72;
        if (next >= maxHold) {
          return boardRevealState.activeRole === 'exampleProblem' || boardRevealState.activeRole === 'exampleSolution'
            ? 0.05
            : 1;
        }
        return next;
      });
    }, 35);

    return () => window.clearInterval(timer);
  }, [hasStarted, isPlaying, boardRevealState.showExampleProblem, boardRevealState.showExampleSolution, boardRevealState.activeRole, sceneIndex]);

  // Reset on lesson change -> chalkboard starts cleanly empty!
  useEffect(() => {
    speechManager.stop();
    setSceneIndex(0);
    setIsPlaying(false);
    setHasStarted(false);
    setSceneProgress(0);
    setActiveSentenceIdx(0);
    setSentenceProgressRatio(0);
    setActiveSentenceText('');
    setDiagramAnimProgress(0);
    setExampleAnimProgress(0);
  }, [lessonId]);

  useEffect(() => {
    return () => {
      speechManager.stop();
    };
  }, []);

  const startScenePlayback = useCallback(
    (targetIdx: number, audioOn: boolean, rate: number) => {
      const targetScene = scenes[targetIdx];
      if (!targetScene) {
        setIsPlaying(false);
        return;
      }

      speechManager.stop();
      setHasStarted(true);
      setSceneIndex(targetIdx);
      setSceneProgress(1);
      setActiveSentenceIdx(0);
      setSentenceProgressRatio(0.05);
      setActiveSentenceText(targetScene.narrationLines[0] || '');
      setDiagramAnimProgress(0);
      setExampleAnimProgress(0);
      setIsPlaying(true);

      if (audioOn && speechManager.isSupported() && targetScene.narrationLines.length > 0) {
        const ttsRate = Math.max(0.65, Math.min(1.45, rate * 0.9));

        speechManager.setOnSentence((sentence, idx, total) => {
          setActiveSentenceIdx(idx);
          setSentenceProgressRatio(0.12);
          setActiveSentenceText(sentence);
          const pct = Math.min(96, Math.round(((idx + 0.1) / Math.max(1, total)) * 100));
          setSceneProgress(pct);
        });

        speechManager.setOnProgress((idx, ratio) => {
          setActiveSentenceIdx(idx);
          setSentenceProgressRatio(Math.min(1, Math.max(0, ratio)));
          const total = Math.max(1, targetScene.narrationLines.length);
          const pct = Math.min(99, Math.round(((idx + ratio) / total) * 100));
          setSceneProgress(pct);
        });

        speechManager.speakSentences(targetScene.narrationLines, ttsRate, () => {
          if (!isPlayingRef.current) return;
          const nextIdx = targetIdx + 1;
          if (nextIdx < scenes.length) {
            startScenePlayback(nextIdx, isAudioEnabledRef.current, playbackRateRef.current);
          } else {
            setSceneProgress(100);
            setSentenceProgressRatio(1);
            setIsPlaying(false);
            sfx.playSuccessSound();
          }
        });
      }
    },
    [scenes]
  );

  // Silent animated chalkboard driver (when audio muted or unsupported)
  useEffect(() => {
    if (!isPlaying) return;
    if (isAudioEnabled && speechManager.isSupported()) {
      return;
    }

    const durationMs = (currentScene.estimatedSeconds * 1000) / Math.max(0.5, playbackRate);
    const tickMs = 80;
    const stepPct = (tickMs / durationMs) * 100;

    const timer = window.setInterval(() => {
      setSceneProgress((prev) => {
        const next = Math.min(100, prev + stepPct);
        const linesCount = Math.max(1, currentScene.narrationLines.length);
        const exactFloat = (next / 100) * linesCount;
        const sentIdx = Math.min(linesCount - 1, Math.floor(exactFloat));
        const localRatio = Math.min(0.99, Math.max(0.02, exactFloat - sentIdx));

        setActiveSentenceIdx(sentIdx);
        setSentenceProgressRatio(localRatio);
        setActiveSentenceText(currentScene.narrationLines[sentIdx] || '');

        if (next >= 100) {
          window.clearInterval(timer);
          const nextIdx = sceneIndexRef.current + 1;
          if (nextIdx < scenes.length) {
            setTimeout(() => {
              if (isPlayingRef.current) {
                startScenePlayback(nextIdx, isAudioEnabledRef.current, playbackRateRef.current);
              }
            }, 140);
          } else {
            setIsPlaying(false);
            sfx.playSuccessSound();
          }
          return 100;
        }
        return next;
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, isAudioEnabled, playbackRate, currentScene, scenes.length, startScenePlayback]);

  const handleTogglePlayPause = () => {
    sfx.playClick();
    if (isPlaying) {
      speechManager.stop();
      setIsPlaying(false);
    } else {
      const startAt =
        hasStarted && sceneIndex >= scenes.length - 1 && sceneProgress >= 99 ? 0 : sceneIndex;
      startScenePlayback(startAt, isAudioEnabled, playbackRate);
    }
  };

  const handleSelectScene = (idx: number) => {
    sfx.playClick();
    if (isPlaying) {
      startScenePlayback(idx, isAudioEnabled, playbackRate);
    } else {
      // Jumping to a scene while paused starts it from an empty board ready to write,
      // OR auto-plays smoothly so the chalkboard immediately writes with the teacher!
      startScenePlayback(idx, isAudioEnabled, playbackRate);
    }
  };

  const handlePrevScene = () => {
    const prevIdx = Math.max(0, sceneIndex - 1);
    handleSelectScene(prevIdx);
  };

  const handleNextScene = () => {
    const nextIdx = Math.min(scenes.length - 1, sceneIndex + 1);
    handleSelectScene(nextIdx);
  };

  const handleRestartVideo = () => {
    sfx.playClick();
    startScenePlayback(0, isAudioEnabled, playbackRate);
  };

  const handleResetToEmptyBoard = () => {
    sfx.playClick();
    speechManager.stop();
    setIsPlaying(false);
    setHasStarted(false);
    setSceneProgress(0);
    setActiveSentenceIdx(0);
    setSentenceProgressRatio(0);
    setActiveSentenceText('');
    setDiagramAnimProgress(0);
    setExampleAnimProgress(0);
  };

  const handleToggleAudio = () => {
    sfx.playClick();
    const nextAudio = !isAudioEnabled;
    setIsAudioEnabled(nextAudio);
    if (isPlaying) {
      if (!nextAudio) {
        speechManager.stop();
      } else {
        startScenePlayback(sceneIndex, true, playbackRate);
      }
    }
  };

  const handleChangeSpeed = (nextSpeed: number) => {
    sfx.playClick();
    setPlaybackRate(nextSpeed);
    if (isPlaying && isAudioEnabled) {
      startScenePlayback(sceneIndex, true, nextSpeed);
    }
  };

  const handleScrubBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const targetSec = clickRatio * sceneTimelineMeta.totalDuration;
    const foundIdx = sceneTimelineMeta.offsets.findIndex(
      (o) => targetSec >= o.start && targetSec <= o.end
    );
    const nextIdx = foundIdx >= 0 ? foundIdx : scenes.length - 1;
    handleSelectScene(nextIdx);
  };

  return (
    <div
      className={`space-y-4 font-['Cairo',sans-serif] ${
        isCinemaExpanded ? 'fixed inset-0 z-[70] bg-slate-950 p-2 sm:p-5 overflow-y-auto' : ''
      }`}
      dir="rtl"
    >
      {/* Video Mode Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-[#161936] to-slate-900 border border-indigo-500/40 rounded-2xl px-3.5 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                فيديو الشرح الأنيميشن: {lessonMeta.title}
              </h2>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold whitespace-nowrap">
                {activeBook.shortTitle} · {scenes.length} مشاهد
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              سبورة تبدأ فارغة وتُكتب عليها الأرقام والمعادلات والأشكال بالتزامن مع شرح المعلّم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!isCinemaExpanded && (
            <button
              onClick={() => {
                sfx.playClick();
                setIsBoardPinned((p) => !p);
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
                isBoardPinned
                  ? 'bg-emerald-900/70 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title={isBoardPinned ? 'إلغاء تثبيت السبورة بالأعلى' : 'تثبيت السبورة بالأعلى لمتابعتها دائماً'}
            >
              {isBoardPinned ? <Pin className="w-3.5 h-3.5 text-amber-300" /> : <PinOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isBoardPinned ? 'السبورة مثبتة' : 'تثبيت السبورة'}</span>
            </button>
          )}
          {hasStarted && (
            <button
              onClick={handleResetToEmptyBoard}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
              title="مسح السبورة والعودة لحالة البدء الفارغة"
            >
              <PenTool className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">مسح السبورة</span>
            </button>
          )}
          {onOpenRead && !isCinemaExpanded && (
            <button
              onClick={() => {
                sfx.playClick();
                speechManager.stop();
                setIsPlaying(false);
                onOpenRead();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">كتاب الطالب</span>
            </button>
          )}
          <button
            onClick={() => {
              sfx.playClick();
              setIsCinemaExpanded(!isCinemaExpanded);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-400/40 text-xs font-bold flex items-center gap-1.5 transition-all"
            title={isCinemaExpanded ? 'تصغير المشغّل' : 'وضع السينما الكامل'}
          >
            {isCinemaExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isCinemaExpanded ? 'إغلاق التكبير' : 'وضع السينما'}</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* PRIMARY STICKY CHALKBOARD (السبورة هي السمة الأساسية في الصفحة)     */}
      {/* =================================================================== */}
      <div
        className={`${
          isBoardPinned && !isCinemaExpanded ? 'sticky top-[102px] sm:top-[132px] z-30' : ''
        } rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-indigo-500/50 bg-[#080d1a] shadow-[0_18px_45px_rgba(0,0,0,0.88)]`}
      >
        {/* Authentic Classroom Blackboard Canvas */}
        <div className="relative min-h-[250px] sm:min-h-[340px] flex flex-col justify-between p-1.5 sm:p-3 bg-gradient-to-b from-[#0b1324] to-[#080d1a]">
          {/* Wooden Framed Green Chalkboard */}
          <div className="flex-1 flex flex-col justify-between rounded-xl sm:rounded-2xl bg-[#0e231a] border-[4px] sm:border-[6px] border-[#5b3821] shadow-[inset_0_0_45px_rgba(0,0,0,0.72)] overflow-hidden relative video-studio-grid">
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top HUD inside Chalkboard */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 border-b border-emerald-800/40 bg-[#0b1c15]/70">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white font-black text-xs shadow shrink-0 ${
                    isPlaying ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-slate-700'
                  }`}
                >
                  {isGeometry ? <Compass className="w-3.5 h-3.5" /> : <Calculator className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[11px] sm:text-xs font-extrabold text-emerald-100 truncate">
                  {boardRevealState.isEmptyBoard
                    ? 'السبورة فارغة وجاهزة'
                    : (boardRevealState.activeRole === 'exampleProblem' || boardRevealState.activeRole === 'exampleSolution')
                      ? 'المعلّم يرسم ويحل المثال بالأرقام على السبورة'
                      : isPlaying
                        ? 'المعلّم يرسم ويكتب على السبورة'
                        : 'متوقف مؤقتاً'}
                </span>
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-3 pr-1 shrink-0" aria-hidden="true">
                    <span className="w-1 h-full bg-emerald-400 rounded-full video-wave-bar" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-full bg-amber-300 rounded-full video-wave-bar" style={{ animationDelay: '180ms' }} />
                    <span className="w-1 h-full bg-teal-400 rounded-full video-wave-bar" style={{ animationDelay: '340ms' }} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-200 border border-emerald-700/60 max-w-[140px] sm:max-w-none truncate">
                  {currentScene.chapterBadge}
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 border border-emerald-800/60 tabular-nums">
                  {sceneIndex + 1}/{scenes.length}
                </span>
              </div>
            </div>

            {/* Center Empty-to-Animated Live Chalkboard Area */}
            <div
              key={`${currentScene.id}-${hasStarted ? 'live' : 'empty'}`}
              className="relative z-10 flex-1 flex flex-col justify-center px-2.5 sm:px-5 py-2 sm:py-3.5 gap-2"
            >
              {boardRevealState.isEmptyBoard ? (
                /* 100% CLEAN EMPTY BLACKBOARD PRIOR TO START */
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-2 opacity-90">
                  <div className="text-xs sm:text-sm font-black text-amber-300">
                    {lessonMeta.title} · السبورة التعليمية الفارغة
                  </div>
                  <p className="text-[11px] sm:text-sm text-emerald-200/80 max-w-md leading-relaxed">
                    ستبدأ السبورة فارغة، وكلما شرح المعلّم سيظهر الرسم الهندسي والأرقام والمعادلات هنا، وتظهر مراحل الدرس تحت السبورة تباعاً.
                  </p>
                </div>
              ) : (() => {
                const isExamplePhaseOnBoard =
                  (boardRevealState.activeRole === 'exampleProblem' ||
                    boardRevealState.activeRole === 'exampleSolution' ||
                    boardRevealState.activeRole === 'tip') &&
                  Boolean(currentScene.exampleProblem);

                const pEx = Math.min(1, exampleAnimProgress);
                const exVisibleTokens =
                  exampleBoardTotalTokens === 0
                    ? 0
                    : boardRevealState.showExampleSolution
                      ? sceneProgress >= 96
                        ? exampleBoardTotalTokens
                        : Math.max(1, Math.ceil(pEx * exampleBoardTotalTokens))
                      : Math.max(1, Math.ceil(pEx * Math.max(1, Math.floor(exampleBoardTotalTokens * 0.6))));

                return (
                  <div className="space-y-2 video-scene-enter">
                    {/* Compact Active Scene Heading at Top of Chalkboard */}
                    <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        <span>{isExamplePhaseOnBoard ? 'حل المثال التطبيقي على السبورة' : currentScene.title}</span>
                      </span>
                    </div>

                    {isExamplePhaseOnBoard && currentScene.exampleProblem ? (
                      /* APPLIED EXAMPLE ON THE MAIN CHALKBOARD WITH REAL NUMBERS & PARALLELOGRAM DRAWING */
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-center max-w-5xl mx-auto w-full">
                        <div className="video-diagram-animate">
                          {isGeometry ? (
                            <GeometryDiagram
                              lessonId={lessonId}
                              sectionTitle={currentScene.title}
                              sectionText={`${currentScene.exampleProblem} ${currentScene.exampleSolution || ''} ${currentScene.ruleText} ${currentScene.mathEquation || ''}`}
                              problemText={currentScene.exampleProblem}
                              theme="chalkboard"
                              caption="رسم المثال بالقياسات التفاعلية"
                              animProgress={boardRevealState.showExampleSolution ? Math.max(0.75, pEx) : pEx}
                            />
                          ) : (
                            <div className="rounded-xl border border-emerald-700/50 bg-slate-950/70 p-2.5">
                              <AlgebraExampleVisualSvg
                                lessonId={lessonId}
                                problem={currentScene.exampleProblem}
                                solution={currentScene.exampleSolution || ''}
                                equation={exampleBoardEquation}
                                isDark={true}
                                animProgress={pEx}
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {exampleBoardEquation && (
                            <div
                              dir="ltr"
                              className="bg-[#081610]/95 border-2 border-amber-400/55 rounded-xl p-2.5 sm:p-3.5 text-center shadow-[0_0_24px_rgba(250,204,21,0.16)]"
                            >
                              <div dir="rtl" className="text-[11px] font-bold text-amber-300 mb-1 flex items-center justify-center gap-1.5">
                                <PenTool className="w-3 h-3" />
                                <span>أرقام وخطوات المثال على السبورة:</span>
                              </div>
                              <GranularMathEquation
                                equation={exampleBoardEquation}
                                equationKey={`vid-ex-${currentScene.id}`}
                                isSpeaking={isPlaying}
                                theme="chalkboard"
                                size="lg"
                                visibleTokenCount={exVisibleTokens}
                                activeWriteIndex={exVisibleTokens > 0 && exVisibleTokens < exampleBoardTotalTokens ? exVisibleTokens - 1 : null}
                                animateEntrance={true}
                              />
                            </div>
                          )}

                          {boardRevealState.showExampleSolution && currentScene.exampleSolution && (
                            <div className="bg-emerald-950/85 border border-emerald-400/55 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-emerald-100 leading-snug text-center">
                              <span className="text-emerald-300 ml-1">✅ النتيجة:</span>
                              <FormattedMathText text={currentScene.exampleSolution} size="sm" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* RULE / CONCEPT / EQUATION ON THE MAIN CHALKBOARD */
                      <div
                        className={`grid gap-2.5 items-center max-w-5xl mx-auto w-full ${
                          boardRevealState.showDiagram && boardRevealState.showEquationBox
                            ? 'grid-cols-1 lg:grid-cols-2'
                            : 'grid-cols-1 max-w-3xl'
                        }`}
                      >
                        {boardRevealState.showDiagram && (
                          <div className="video-diagram-animate">
                            <GeometryDiagram
                              lessonId={lessonId}
                              sectionTitle={currentScene.title}
                              sectionText={`${currentScene.ruleText} ${currentScene.mathEquation || ''} ${currentScene.exampleProblem || ''}`}
                              problemText={currentScene.exampleProblem}
                              theme="chalkboard"
                              animProgress={Math.min(1, diagramAnimProgress)}
                            />
                          </div>
                        )}

                        {boardRevealState.showEquationBox && currentScene.mathEquation ? (
                          <div
                            dir="ltr"
                            className="bg-[#081610]/95 border-2 border-amber-400/50 rounded-xl p-2.5 sm:p-4 text-center shadow-[0_0_24px_rgba(250,204,21,0.16)] video-pop-step"
                          >
                            <div dir="rtl" className="text-[11px] font-bold text-amber-300 mb-1 flex items-center justify-center gap-1.5">
                              <PenTool className="w-3 h-3" />
                              <span>كتابة العلاقة على السبورة:</span>
                            </div>
                            <GranularMathEquation
                              equation={currentScene.mathEquation}
                              equationKey={`vid-chalk-${currentScene.id}`}
                              isSpeaking={isPlaying}
                              theme="chalkboard"
                              size="lg"
                              visibleTokenCount={boardRevealState.visibleTokenCount}
                              activeWriteIndex={boardRevealState.activeWriteTokenIdx}
                              animateEntrance={true}
                            />
                          </div>
                        ) : (
                          !boardRevealState.showDiagram &&
                          boardRevealState.visibleRuleLines.length > 0 && (
                            <div className="bg-[#081610]/90 border border-emerald-500/40 rounded-xl p-3 sm:p-4 text-center">
                              <p className="text-sm sm:text-base md:text-lg text-emerald-50 font-bold leading-relaxed">
                                <FormattedMathText
                                  text={boardRevealState.visibleRuleLines[boardRevealState.visibleRuleLines.length - 1]}
                                  size="lg"
                                />
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Summary Final Action Buttons */}
                    {currentScene.kind === 'summary' && sceneProgress >= 75 && (onOpenRead || onOpenExercises) && (
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 video-pop-step">
                        {onOpenExercises && (
                          <button
                            onClick={() => {
                              sfx.playClick();
                              speechManager.stop();
                              setIsPlaying(false);
                              onOpenExercises();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>اختبر فهمك في التمارين</span>
                          </button>
                        )}
                        {onOpenRead && (
                          <button
                            onClick={() => {
                              sfx.playClick();
                              speechManager.stop();
                              setIsPlaying(false);
                              onOpenRead();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>مراجعة الكتاب</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Center Floating Play Overlay when Paused or Empty */}
            {!isPlaying && (
              <button
                onClick={handleTogglePlayPause}
                className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/25 hover:bg-slate-950/15 transition-colors group"
                title="تشغيل فيديو الشرح الأنيميشن"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 group-hover:scale-110 transition-transform flex items-center justify-center text-white shadow-[0_0_30px_rgba(244,63,94,0.6)] ring-4 ring-white/25">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current mr-[-3px]" />
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-slate-950/90 text-white text-xs sm:text-sm font-black border border-white/20 shadow-lg">
                    {hasStarted ? 'متابعة الشرح على السبورة ▶' : 'اضغط لتشغيل الشرح والرسم على السبورة ▶'}
                  </span>
                </div>
              </button>
            )}

            {/* Bottom Synchronized Subtitle Strip Inside Blackboard */}
            <div className="relative z-10 px-2 sm:px-4 pb-2">
              <div className="max-w-3xl mx-auto bg-slate-950/85 backdrop-blur border border-emerald-800/60 rounded-lg px-3 py-1.5 text-center shadow-lg min-h-[34px] flex items-center justify-center">
                <p className="text-[11px] sm:text-xs font-bold text-amber-200 leading-snug">
                  {hasStarted
                    ? (activeSentenceText || currentScene.narrationLines[0] || currentScene.title)
                    : 'السبورة جاهزة — اضغط تشغيل ليرسم المعلّم ويكتب الأرقام والمعادلات أمامك'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* VIDEO TIMELINE SCRUBBER & PLAYER CONTROLS BAR                     */}
        {/* ================================================================= */}
        <div className="bg-slate-950 border-t border-slate-800 px-3 sm:px-5 py-3 space-y-2.5">
          {/* Interactive Timeline Bar (LTR for standard video scrubber UX) */}
          <div className="space-y-1">
            <div
              dir="ltr"
              onClick={handleScrubBarClick}
              className="relative h-3 bg-slate-800 rounded-full cursor-pointer overflow-hidden group border border-slate-700"
              title="انقر للانتقال إلى أي مشهد من الفيديو"
            >
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-200"
                style={{ width: `${totalProgressPercent}%` }}
              />
              {sceneTimelineMeta.offsets.slice(1).map((o, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-950/80"
                  style={{ left: `${(o.start / sceneTimelineMeta.totalDuration) * 100}%` }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
              <span dir="ltr">
                {formatDurationMMSS(elapsedSeconds)} / {formatDurationMMSS(sceneTimelineMeta.totalDuration)}
              </span>
              <span className="font-sans text-slate-300">
                المشهد {sceneIndex + 1} من {scenes.length} · التقدم {Math.round(Math.min(100, sceneProgress))}%
              </span>
            </div>
          </div>

          {/* Primary Video Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePrevScene}
                disabled={sceneIndex <= 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-35 text-slate-200 border border-slate-700 transition-all active:scale-95"
                title="المشهد السابق"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlayPause}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                  isPlaying
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>تشغيل الفيديو</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNextScene}
                disabled={sceneIndex >= scenes.length - 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-35 text-slate-200 border border-slate-700 transition-all active:scale-95"
                title="المشهد التالي"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handleRestartVideo}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-all active:scale-95"
                title="مسح السبورة وإعادة التشغيل من البداية"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={handleToggleAudio}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  isAudioEnabled
                    ? 'bg-teal-900/60 border-teal-500/50 text-teal-200 hover:bg-teal-800/70'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="تفعيل أو كتم صوت المعلّم"
              >
                {isAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                <span>{isAudioEnabled ? 'صوت المعلّم' : 'مشاهدة صامتة'}</span>
              </button>

              <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                {[0.75, 1, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleChangeSpeed(spd)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                      playbackRate === spd
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={`سرعة العرض ${spd}x`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PROGRESSIVE STAGES BELOW CHALKBOARD (مراحل الدرس تحت السبورة)      */}
      {/* ================================================================= */}
      <div
        id="stages-below-chalkboard"
        className="bg-slate-900/95 border border-emerald-500/35 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-black text-white">
              مراحل الدرس المتتابعة تحت السبورة ({hasStarted ? `${Math.min(sceneStages.length, boardRevealState.activeStageIdx + 1)} / ${sceneStages.length}` : 'تبدأ مع التشغيل'})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            كلما انتهت مرحلة تظهر المرحلة التالية أسفل السبورة مباشرة
          </span>
        </div>

        {!hasStarted ? (
          <div className="rounded-xl bg-slate-950/75 border border-slate-800 p-3.5 text-center text-xs sm:text-sm text-slate-400">
            اضغط <strong className="text-emerald-300">تشغيل</strong> على السبورة بالأعلى لتظهر المراحل هنا تباعاً واحدة تلو الأخرى مع متابعة السبورة.
          </div>
        ) : (
          <div className="space-y-2.5">
            {sceneStages.slice(0, boardRevealState.activeStageIdx + 1).map((stg, sIdx) => {
              const isCompleted = sIdx < boardRevealState.activeStageIdx;
              const isCurrent = sIdx === boardRevealState.activeStageIdx;
              return (
                <div
                  key={stg.id}
                  className={`rounded-xl border p-3 sm:p-3.5 transition-all video-pop-step ${
                    isCurrent
                      ? 'bg-emerald-950/60 border-amber-400/75 ring-1 ring-amber-400/50 shadow-md'
                      : 'bg-slate-950/75 border-emerald-700/45 opacity-90'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className={`text-xs font-black ${isCurrent ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {stg.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCurrent
                          ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isCurrent ? '✏️ يُشرح على السبورة الآن' : '✓ انتهت المرحلة'}
                    </span>
                  </div>

                  {stg.formulaText ? (
                    <div dir="ltr" className="bg-[#081610] border border-emerald-800/70 rounded-lg p-2.5 text-center">
                      <GranularMathEquation
                        equation={stg.formulaText}
                        theme="chalkboard"
                        size="md"
                      />
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-slate-100 font-bold leading-relaxed">
                      <FormattedMathText text={stg.bodyText} size="md" />
                    </div>
                  )}

                  {stg.metricChips && stg.metricChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {stg.metricChips.map((chip, cIdx) => (
                        <span
                          key={cIdx}
                          dir="ltr"
                          className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-950/90 text-sky-200 border border-sky-500/40"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* SCENE CHAPTERS PLAYLIST (فهرس مشاهد الفيديو التفاعلية)             */}
      {/* ================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-black text-white">
              فهرس مشاهد فيديو الدرس ({scenes.length} مشاهد)
            </h3>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span dir="ltr">{formatDurationMMSS(sceneTimelineMeta.totalDuration)}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {scenes.map((sc, idx) => {
            const active = idx === sceneIndex;
            const meta = sceneTimelineMeta.offsets[idx];
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScene(idx)}
                className={`text-right p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 ${
                  active
                    ? 'bg-indigo-950/80 border-indigo-400 ring-1 ring-indigo-400/50 shadow-md'
                    : 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                      active
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {active && isPlaying ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-teal-400 truncate">
                      {sc.chapterBadge}
                    </div>
                    <div className={`text-xs sm:text-sm font-extrabold truncate mt-0.5 ${active ? 'text-amber-300' : 'text-slate-100'}`}>
                      {sc.title}
                    </div>
                  </div>
                </div>

                <span dir="ltr" className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums mt-0.5">
                  {formatDurationMMSS(meta?.start || 0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
