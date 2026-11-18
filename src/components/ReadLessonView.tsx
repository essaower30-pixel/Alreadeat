import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Calculator, Check, ArrowRight, Bookmark,
  Sparkles, Image as ImageIcon, Eye, Type,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Film
} from 'lucide-react';
import { LESSON_INFO, PAGE_AUDIO_NARRATIONS } from '../data/lessonData';
import {
  getFullLessonPackage,
  BookPageData,
  buildCustomPageNarrationTimeline,
  CustomNarrationSlot
} from '../data/curriculumLessonsData';
import { getBookForLesson, getTextbookScanUrl } from '../data/curriculumUnits';
import { MathFraction } from './MathFraction';
import { calculateFractions, FractionCalculationResult } from '../utils/mathUtils';
import { sfx } from '../utils/soundEffects';
import { speechManager } from '../utils/speechService';
import { GranularMathEquation, getEquationPartTokenIndices } from './GranularMathEquation';
import { FormattedMathText } from './FormattedMathText';
import { TeacherAudioControls } from './TeacherAudioControls';
import { GeometryDiagram } from './GeometryDiagram';
import { ExampleVisualBoard } from './ExampleVisualBoard';
import { getActiveTokenKey } from '../utils/audioTimelineService';

interface ReadLessonViewProps {
  lessonId?: string;
  onSelectLesson?: (lessonId: string) => void;
  onOpenVideo?: () => void;
}

export const ReadLessonView: React.FC<ReadLessonViewProps> = ({
  lessonId = 'u1-l1',
  onSelectLesson,
  onOpenVideo
}) => {
  const customPkg = getFullLessonPackage(lessonId);
  const activeBook = getBookForLesson(lessonId);
  const bookSubjectLabel = activeBook.shortTitle;
  const isDefaultLesson = !customPkg || lessonId === 'u1-l1';
  const customBookPages: BookPageData[] = customPkg?.bookPages || [];
  const totalBookPages = isDefaultLesson ? 3 : Math.max(1, customBookPages.length);

  // Real page numbers directly from Syrian curriculum textbook
  const lessonPageNumbers: number[] = isDefaultLesson
    ? [5, 6, 7]
    : (customBookPages.length > 0 ? customBookPages.map((p, idx) => p.pageNum || (idx + 1)) : [1]);

  // Book Page index
  const [currentPage, setCurrentPage] = useState<number>(0);

  const currentBookPageNumber = lessonPageNumbers[currentPage] || (isDefaultLesson ? 5 + currentPage : 1);

  // View Mode: 'digital' (interactive stacked fractions & audio) or 'scanned' (Syrian ministry textbook view)
  const [viewMode, setViewMode] = useState<'digital' | 'scanned'>('digital');
  const [scannedDisplay, setScannedDisplay] = useState<'crisp' | 'photo'>('crisp');
  const [bookFont, setBookFont] = useState<'noto' | 'readex' | 'plex' | 'amiri'>('noto');
  const [bookFontSize, setBookFontSize] = useState<number>(24);
  const [pageSizeMode, setPageSizeMode] = useState<'compact' | 'wide' | 'full'>('full');
  const [scanZoom, setScanZoom] = useState<number>(100);
  const [scanHighContrast, setScanHighContrast] = useState<boolean>(true);
  const [showInlineScanInCrisp, setShowInlineScanInCrisp] = useState<boolean>(false);

  const fontClassMap: Record<'noto' | 'readex' | 'plex' | 'amiri', string> = {
    noto: 'font-book-noto',
    readex: 'font-book-readex',
    plex: 'font-book-plex',
    amiri: 'font-book-amiri',
  };
  const activeFontClass = fontClassMap[bookFont];

  // Reset page when lessonId changes (preserve user's preferred font size & page size across lessons)
  useEffect(() => {
    setCurrentPage(0);
    setScanZoom(100);
    setShowInlineScanInCrisp(false);
    setIsPageSpeaking(false);
    speechManager.stop();
  }, [lessonId]);

  const [showCalculator, setShowCalculator] = useState(false);
  const [isPageSpeaking, setIsPageSpeaking] = useState(false);
  const [isPagePaused, setIsPagePaused] = useState(false);

  // Calculator State
  const [n1, setN1] = useState<number>(5);
  const [d1, setD1] = useState<number>(6);
  const [n2, setN2] = useState<number>(3);
  const [d2, setD2] = useState<number>(4);
  const [op, setOp] = useState<'+' | '-'>('+');
  const [calcResult, setCalcResult] = useState<FractionCalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  const scrollToBookContent = () => {
    requestAnimationFrame(() => {
      const el = document.getElementById('book-lesson-content');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const handleSelectBookPage = (pageIdx: number) => {
    sfx.playPageFlipSound();
    speechManager.stop();
    setIsPageSpeaking(false);
    setIsPagePaused(false);
    setCurrentPage(pageIdx);
    scrollToBookContent();
  };

  const currentNarration = isDefaultLesson
    ? (PAGE_AUDIO_NARRATIONS[currentPage] || PAGE_AUDIO_NARRATIONS[0])
    : {
        title: customBookPages[currentPage]?.pageTitle || '',
        bookPageNum: currentBookPageNumber,
        spokenScript: customBookPages[currentPage]?.spokenScript || '',
        keyPoints: customBookPages[currentPage]?.sections.map(s => s.title) || []
      };

  const customTimeline = useMemo(() => {
    if (isDefaultLesson || !customBookPages[currentPage]) return null;
    return buildCustomPageNarrationTimeline(customBookPages[currentPage]);
  }, [isDefaultLesson, customBookPages, currentPage]);

  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [sentenceProgressRatio, setSentenceProgressRatio] = useState<number>(0);
  const [sentenceCounter, setSentenceCounter] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Sync with speech manager
  React.useEffect(() => {
    speechManager.setOnPlaybackState((st) => {
      setIsPageSpeaking(st.isSpeaking);
      setIsPagePaused(st.isPaused);
      setCurrentSentence(st.currentSentence);
      setSentenceCounter({ current: st.currentIndex + 1, total: st.total });
      if (!st.isSpeaking) {
        setSentenceProgressRatio(0);
      }
    });

    speechManager.setOnProgress((index, ratio) => {
      setSentenceCounter(prev => ({ ...prev, current: index + 1 }));
      setSentenceProgressRatio(ratio);
    });

    return () => {
      speechManager.stop();
    };
  }, []);

  const activeTokenKey = isPageSpeaking
    ? getActiveTokenKey('book', currentPage, sentenceCounter.current - 1, sentenceProgressRatio)
    : null;

  // Deterministic audio sync section resolver for Lesson 1 (pages 5, 6, 7)
  const isSectionActive = (secId: string): boolean => {
    if (!isPageSpeaking || sentenceCounter.current <= 0) return false;
    const idx = sentenceCounter.current - 1; // 0-based index

    if (currentPage === 0) {
      if (secId === 'c1') return idx >= 4 && idx <= 7;
      if (secId === 'c2') return idx >= 8 && idx <= 12;
      if (secId === 'c3') return idx >= 13 && idx <= 19;
      return false;
    }
    if (currentPage === 1) {
      if (secId === 'rule1') return idx >= 2 && idx <= 8;
      if (secId === 'rule2') return idx >= 9 && idx <= 15;
      if (secId === 'calcA') return idx >= 16 && idx <= 21;
      return false;
    }
    if (currentPage === 2) {
      if (secId === 'check') return idx >= 3 && idx <= 15;
      if (secId === 'practice') return idx >= 16 && idx <= 22;
      if (secId === 'juice') return idx >= 23 && idx <= 31;
      return false;
    }
    return false;
  };

  // Universal deterministic active slot for ALL custom lessons (u1-l2 through u4-l5)
  const activeCustomSlot: CustomNarrationSlot | null =
    isPageSpeaking && !isDefaultLesson && customTimeline && sentenceCounter.current > 0
      ? customTimeline.slots[sentenceCounter.current - 1] || null
      : null;

  const activeCustomSecIndex: number = activeCustomSlot ? activeCustomSlot.secIndex : -1;

  // Math equation tokens ONLY light up while the math formula itself is being spoken (never during Arabic rules/examples)
  const getCustomSectionActiveTokenKey = (sIdx: number, mathEquation: string): string | null => {
    if (
      !isPageSpeaking ||
      !activeCustomSlot ||
      activeCustomSlot.secIndex !== sIdx ||
      activeCustomSlot.subPart !== 'math' ||
      !mathEquation
    ) {
      return null;
    }
    const eqParts = getEquationPartTokenIndices(mathEquation);
    const partIdx = Math.min(eqParts.length - 1, activeCustomSlot.mathPartIdx ?? 0);
    const partTokens = eqParts[partIdx] || [];
    if (partTokens.length === 0) return null;
    const pos = Math.min(
      partTokens.length - 1,
      Math.floor(Math.max(0, Math.min(0.99, sentenceProgressRatio)) * partTokens.length)
    );
    return `read-c-${lessonId}-p${currentPage}-s${sIdx}-${partTokens[pos]}`;
  };

  // Position-specific Arabic word highlighter strictly scoped to [wordStart, wordEnd) of the active sentence
  const renderSpokenArabicWords = (
    text: string,
    isBlockActive: boolean,
    wordStart?: number,
    wordEnd?: number
  ) => {
    if (!isBlockActive || !text) {
      return <FormattedMathText text={text} size="lg" />;
    }
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return <FormattedMathText text={text} size="lg" />;

    const startIdx = Math.max(0, Math.min(words.length - 1, wordStart ?? 0));
    const endIdx = Math.max(startIdx + 1, Math.min(words.length, wordEnd ?? words.length));
    const spanLen = endIdx - startIdx;
    const activeWordIdx = Math.min(
      endIdx - 1,
      startIdx + Math.floor(Math.max(0, Math.min(0.99, sentenceProgressRatio)) * spanLen)
    );

    return (
      <span>
        {words.map((word, wIdx) => (
          <React.Fragment key={wIdx}>
            <span
              className={
                wIdx === activeWordIdx
                  ? 'bg-amber-300 text-slate-950 font-black px-1 py-0.5 rounded shadow-sm transition-colors duration-150 inline-block'
                  : 'transition-colors duration-150'
              }
            >
              {word.includes('/') ? <FormattedMathText text={word} size="lg" /> : word}
            </span>
            {wIdx < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        ))}
      </span>
    );
  };

  // AUTO-SCROLL: Smoothly scroll to the exact active block being read across ALL pages of the book
  useEffect(() => {
    if (!isPageSpeaking) return;
    if (isDefaultLesson) {
      const secKeys = ['c1', 'c2', 'c3', 'rule1', 'rule2', 'calcA', 'check', 'practice', 'juice'];
      for (const key of secKeys) {
        if (isSectionActive(key)) {
          const el = document.getElementById(`book-sec-${key}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          break;
        }
      }
      return;
    }

    if (activeCustomSlot) {
      let targetId = '';
      if (activeCustomSlot.subPart === 'intro') {
        targetId = 'book-custom-objective';
      } else if (activeCustomSlot.secIndex >= 0) {
        const sIdx = activeCustomSlot.secIndex;
        if (activeCustomSlot.subPart === 'title') targetId = `book-custom-sec-${sIdx}`;
        else if (activeCustomSlot.subPart === 'rule') targetId = `book-custom-sec-${sIdx}-rule`;
        else if (activeCustomSlot.subPart === 'math') targetId = `book-custom-sec-${sIdx}-math`;
        else if (activeCustomSlot.subPart === 'tip') targetId = `book-custom-sec-${sIdx}-tip`;
        else if (activeCustomSlot.subPart === 'exampleProblem' || activeCustomSlot.subPart === 'exampleSolution') {
          targetId = `book-custom-sec-${sIdx}-ex`;
        } else {
          targetId = `book-custom-sec-${sIdx}`;
        }
      }
      if (targetId) {
        const el =
          document.getElementById(targetId) ||
          (activeCustomSlot.secIndex >= 0 ? document.getElementById(`book-custom-sec-${activeCustomSlot.secIndex}`) : null);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [sentenceCounter.current, isPageSpeaking, currentPage, lessonId, activeCustomSlot?.secIndex, activeCustomSlot?.subPart]);

  const handlePlayPageSpeech = () => {
    sfx.playClick();
    if (!isDefaultLesson && customTimeline && customTimeline.sentences.length > 0) {
      speechManager.speakSentences(
        customTimeline.sentences,
        0.9,
        () => {
          setIsPageSpeaking(false);
          setIsPagePaused(false);
        },
        customBookPages[currentPage]?.spokenScript || currentNarration.spokenScript
      );
      return;
    }
    speechManager.speak(currentNarration.spokenScript, 0.9, () => {
      setIsPageSpeaking(false);
      setIsPagePaused(false);
    });
  };

  const handlePausePageSpeech = () => {
    speechManager.pause();
  };

  const handleResumePageSpeech = () => {
    speechManager.resume();
  };

  const handleForwardPageSpeech = () => {
    speechManager.forward();
  };

  const handleRewindPageSpeech = () => {
    speechManager.rewind();
  };

  const handleStopPageSpeech = () => {
    speechManager.stop();
    setIsPageSpeaking(false);
    setIsPagePaused(false);
  };

  const handleCalculate = () => {
    sfx.playClick();
    try {
      if (d1 === 0 || d2 === 0) {
        setCalcError('المقام لا يمكن أن يساوي صفراً!');
        setCalcResult(null);
        return;
      }
      setCalcError(null);
      const res = calculateFractions(n1, d1, n2, d2, op);
      setCalcResult(res);
      sfx.playSuccessSound();
    } catch (err: unknown) {
      setCalcError(err instanceof Error ? err.message : 'حدث خطأ في الحساب');
      setCalcResult(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Slim Compact Textbook Mode Bar (Maximizes Page Space) */}
      <div className="mx-1.5 sm:mx-0 bg-gradient-to-r from-teal-900 via-slate-800 to-slate-900 border border-teal-700/50 rounded-xl px-3 py-2 shadow-md flex flex-wrap items-center justify-between gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 shadow-inner">
          <button
            onClick={() => { setViewMode('digital'); sfx.playClick(); }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'digital'
                ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>الشرح الرقمي التفاعلي</span>
          </button>
          <button
            onClick={() => { setViewMode('scanned'); sfx.playClick(); }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'scanned'
                ? 'bg-teal-500 text-white shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>كتاب الوزارة (ص {currentBookPageNumber})</span>
          </button>
        </div>

        {/* Quick Tools: Animated Video Explainer + Calculator */}
        <div className="flex items-center gap-2">
          {onOpenVideo && (
            <button
              onClick={() => { sfx.playClick(); onOpenVideo(); }}
              className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white border border-rose-300/40 active:scale-95"
              title="مشاهدة شرح الدرس عبر فيديو أنيميشن متحرك"
            >
              <Film className="w-4 h-4" />
              <span>فيديو أنيميشن 🎬</span>
            </button>
          )}

          <button
            onClick={() => { setShowCalculator(!showCalculator); sfx.playClick(); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              showCalculator
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{showCalculator ? 'إغلاق الحاسبة' : 'حاسبة الكسور'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Interactive Calculator */}
      {showCalculator && (
        <div className="bg-slate-800/95 border border-indigo-500/40 rounded-2xl p-4 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              حاسبة خطوات جمع وطرح الكسور التفاعلية (أوفلاين)
            </span>
            <span className="text-[11px] text-slate-400">توحيد المقامات تلقائياً</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700">
            {/* Fraction 1 */}
            <div className="flex items-center justify-center gap-2 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 font-bold ml-1">الكسر 1:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  value={n1}
                  onChange={(e) => setN1(parseInt(e.target.value) || 0)}
                  className="w-14 bg-slate-900 text-center font-mono font-bold text-teal-300 border border-slate-600 rounded px-1 text-sm"
                  title="البسط"
                />
                <span className="w-14 h-0.5 bg-slate-400 my-1" />
                <input
                  type="number"
                  value={d1}
                  onChange={(e) => setD1(parseInt(e.target.value) || 1)}
                  className="w-14 bg-slate-900 text-center font-mono font-bold text-amber-300 border border-slate-600 rounded px-1 text-sm"
                  title="المقام"
                />
              </div>
            </div>

            {/* Operator & Button */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => { setOp('+'); sfx.playClick(); }}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    op === '+' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                  }`}
                >
                  + جمع
                </button>
                <button
                  onClick={() => { setOp('-'); sfx.playClick(); }}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    op === '-' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                  }`}
                >
                  - طرح
                </button>
              </div>

              <button
                onClick={handleCalculate}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1"
              >
                <span>احسب الخطوات</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>

            {/* Fraction 2 */}
            <div className="flex items-center justify-center gap-2 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 font-bold ml-1">الكسر 2:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  value={n2}
                  onChange={(e) => setN2(parseInt(e.target.value) || 0)}
                  className="w-14 bg-slate-900 text-center font-mono font-bold text-teal-300 border border-slate-600 rounded px-1 text-sm"
                  title="البسط"
                />
                <span className="w-14 h-0.5 bg-slate-400 my-1" />
                <input
                  type="number"
                  value={d2}
                  onChange={(e) => setD2(parseInt(e.target.value) || 1)}
                  className="w-14 bg-slate-900 text-center font-mono font-bold text-amber-300 border border-slate-600 rounded px-1 text-sm"
                  title="المقام"
                />
              </div>
            </div>
          </div>

          {calcError && (
            <div className="mt-2 text-rose-300 text-xs bg-rose-950/60 p-2 rounded">
              ⚠️ {calcError}
            </div>
          )}

          {calcResult && (
            <div className="mt-3 p-3 bg-slate-900/90 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> الناتج النهائي:
                </span>
                <MathFraction num={calcResult.reducedNumerator} den={calcResult.reducedDenominator} size="sm" color="text-emerald-300" />
              </div>
              <div className="space-y-1">
                {calcResult.steps.map((st, i) => (
                  <div key={i} className="text-slate-300 flex items-start gap-1.5">
                    <span className="text-teal-400 font-bold font-mono">[{i + 1}]</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book Frame */}
      <div
        id="book-lesson-content"
        className={`relative select-none scroll-mt-28 sm:scroll-mt-36 transition-all duration-200 ${
          pageSizeMode === 'compact'
            ? 'max-w-3xl mx-auto'
            : pageSizeMode === 'wide'
              ? 'max-w-5xl mx-auto'
              : 'w-full'
        }`}
      >
        {/* Book Outer Binder Shadow (Zero outer borders in full-screen scanned mode so text fills 100% edge-to-edge) */}
        <div className={`book-outer-binder shadow-[0_20px_50px_rgba(0,0,0,0.7)] ${
          pageSizeMode === 'full' && viewMode === 'scanned'
            ? 'scanned-fullbleed bg-white p-0 border-0 rounded-none'
            : pageSizeMode === 'full'
              ? 'bg-[#2a1e16] p-0 sm:p-1.5 border-0 sm:border-2 rounded-none sm:rounded-2xl border-[#3e2719]'
              : 'bg-[#2a1e16] p-1 sm:p-3 md:p-4 border-2 sm:border-4 rounded-xl sm:rounded-3xl border-[#3e2719]'
        }`}>
          {/* Main Book Page with Paper Texture - Tall Vertical Scrolling */}
          <div 
            className={`lesson-card relative bg-[#fffdf8] text-slate-900 flex flex-col justify-between overflow-x-hidden transition-all duration-200 ${
              viewMode === 'scanned'
                ? pageSizeMode === 'full'
                  ? 'scanned-fullbleed p-0 min-h-[calc(100dvh-56px)] rounded-none border-0'
                  : pageSizeMode === 'wide'
                    ? 'p-2 sm:p-4 min-h-[90vh] rounded-lg sm:rounded-2xl border border-[#e8ded0]'
                    : 'p-2 sm:p-4 min-h-[75vh] rounded-lg sm:rounded-2xl border border-[#e8ded0]'
                : pageSizeMode === 'full'
                  ? 'p-2.5 sm:p-5 md:p-7 min-h-[calc(100dvh-56px)] rounded-none sm:rounded-2xl shadow-inner border-0 sm:border border-[#e8ded0]'
                  : pageSizeMode === 'wide'
                    ? 'p-3 sm:p-6 md:p-8 min-h-[88vh] rounded-lg sm:rounded-2xl shadow-inner border border-[#e8ded0]'
                    : 'p-3 sm:p-5 md:p-6 min-h-[75vh] rounded-lg sm:rounded-2xl shadow-inner border border-[#e8ded0]'
            }`}
            style={{
              boxShadow: viewMode === 'scanned'
                ? 'none'
                : 'inset 25px 0 35px -15px rgba(0,0,0,0.12), inset -10px 0 20px -10px rgba(0,0,0,0.05)',
            }}
          >
            <div className={viewMode === 'scanned' ? 'flex-1 flex flex-col' : ''}>
            {/* Book Spine Seam & Gradient Line on Right (RTL book spine) */}
            {viewMode !== 'scanned' && pageSizeMode !== 'full' && (
              <div className="hidden sm:block absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-black/15 via-black/5 to-transparent pointer-events-none" />
            )}

            {/* Slim Printed Textbook Title Line (No Redundant Page Buttons) */}
            <div className={`flex items-center justify-between border-b border-teal-800/15 gap-2 ${
              viewMode === 'scanned' ? 'px-2.5 pt-2 pb-1.5 mb-1.5' : 'pb-2 mb-3'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block shrink-0" />
                <span className="text-xs md:text-sm font-bold text-teal-900 truncate">
                  كتاب الطالب | {bookSubjectLabel} - {customPkg ? `${customPkg.title} (${customPkg.pages})` : 'الجمع والطرح (ص 5 - 7)'}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">
                صفحة {currentBookPageNumber}
              </span>
            </div>

            {/* Teacher Audio Controller with Pause, Resume, Forward, and Rewind */}
            <div className={viewMode === 'scanned' ? 'px-2 mb-1.5 space-y-1.5' : 'mb-3 space-y-2'}>
              <TeacherAudioControls
                isPlaying={isPageSpeaking}
                isPaused={isPagePaused}
                currentSentence={currentSentence}
                currentIndex={sentenceCounter.current - 1}
                totalSentences={sentenceCounter.total}
                onPlay={handlePlayPageSpeech}
                onPause={handlePausePageSpeech}
                onResume={handleResumePageSpeech}
                onForward={handleForwardPageSpeech}
                onRewind={handleRewindPageSpeech}
                onStop={handleStopPageSpeech}
                title={`قراءة وشرح المعلم: ${currentNarration.title} (ص ${currentBookPageNumber})`}
                theme="teal"
              />

              {/* Key points indicator (digital mode only to maximize scanned page height) */}
              {viewMode === 'digital' && (
                <div className="px-3 py-1.5 bg-teal-950/40 rounded-xl border border-teal-800/40 flex flex-wrap items-center gap-1.5 text-[11px] text-teal-100">
                  <span className="font-bold text-amber-300">أهم نقاط الصفحة:</span>
                  {currentNarration.keyPoints.map((pt, i) => (
                    <span key={i} className="bg-teal-900/60 px-2 py-0.5 rounded-full border border-teal-700/50">
                      • {pt}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Book Font & Size Controls Bar (Visible in Digital & Crisp Ministry Modes) */}
            {(viewMode === 'digital' || (viewMode === 'scanned' && scannedDisplay === 'crisp')) && (
              <div className="mx-1.5 sm:mx-0 mb-2.5 bg-slate-900 border border-teal-500/40 rounded-xl px-2.5 py-2 flex flex-wrap items-center justify-between gap-2 text-white text-xs shadow-md">
                {/* Font Family Switcher */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-amber-300 font-bold flex items-center gap-1 ml-1 text-[11px]">
                    <Type className="w-3.5 h-3.5" />
                    الخط:
                  </span>
                  {([
                    { id: 'noto', label: 'النسخ الواضح' },
                    { id: 'readex', label: 'عريض مقروء' },
                    { id: 'plex', label: 'حديث' },
                    { id: 'amiri', label: 'أميري' },
                  ] as const).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setBookFont(f.id); sfx.playClick(); }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        bookFont === f.id
                          ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Font Size Stepper (18px..36px) + Page Size Selector + Original Scan Toggle */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex items-center bg-slate-950 rounded-lg border border-amber-500/40 p-0.5">
                    <button
                      onClick={() => { setBookFontSize(s => Math.max(18, s - 2)); sfx.playClick(); }}
                      disabled={bookFontSize <= 18}
                      className="px-2 py-1 rounded-md hover:bg-slate-800 disabled:opacity-30 text-slate-200 font-bold text-xs"
                      title="تصغير الخط"
                    >
                      A-
                    </button>
                    <span className="px-2 font-mono font-bold text-[11px] text-amber-300 min-w-[40px] text-center">
                      {bookFontSize}px
                    </span>
                    <button
                      onClick={() => { setBookFontSize(s => Math.min(36, s + 2)); sfx.playClick(); }}
                      disabled={bookFontSize >= 36}
                      className="px-2 py-1 rounded-md hover:bg-slate-800 disabled:opacity-30 text-slate-200 font-bold text-xs"
                      title="تكبير الخط"
                    >
                      A+
                    </button>
                  </div>

                  {/* Page Size Switcher */}
                  <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 p-0.5 gap-0.5">
                    <span className="text-[10px] text-teal-300 font-bold px-1.5 hidden sm:inline">الصفحة:</span>
                    {([
                      { id: 'compact', label: 'قياسي' },
                      { id: 'wide', label: 'واسع' },
                      { id: 'full', label: 'كامل' },
                    ] as const).map((ps) => (
                      <button
                        key={ps.id}
                        onClick={() => { setPageSizeMode(ps.id); sfx.playClick(); }}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                          pageSizeMode === ps.id
                            ? 'bg-teal-500 text-slate-950 font-black'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {ps.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => { setShowInlineScanInCrisp(v => !v); sfx.playClick(); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all ${
                      showInlineScanInCrisp
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-200 border-amber-500/40'
                    }`}
                    title="إظهار أو إخفاء الرسومات وصورة صفحة الكتاب أسفل الترويسة"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{showInlineScanInCrisp ? 'إخفاء صورة الكتاب' : 'الأشكال وصورة الصفحة'}</span>
                  </button>
                  {viewMode === 'scanned' && (
                    <button
                      onClick={() => { setScanZoom(100); setScannedDisplay('photo'); sfx.playClick(); }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-600/40 flex items-center gap-1 transition-all"
                      title="عرض الصورة الأصلية كاملة بعرض الشاشة دون تمرير أفقي"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>الصورة الممسوحة</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'scanned' && scannedDisplay === 'photo' ? (
              <div className="flex-1 flex flex-col space-y-1.5 animate-in fade-in duration-300">
                {/* Scanned Photo Toolbar - Fit-to-width by default (Zero Horizontal Scrolling!) */}
                <div className="mx-1.5 sm:mx-0 bg-slate-900 border border-teal-500/40 rounded-xl px-2.5 py-2 flex flex-wrap items-center justify-between gap-2 text-white text-xs shadow-md">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="font-extrabold text-teal-200">
                      صورة صفحة الكتاب — ص {currentBookPageNumber}
                    </span>
                  </div>

                  {/* Quick Switch to Crisp Vertical Large-Font Mode + Page Size + Manual Zoom */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Prominent button to read with big crisp font & vertical scroll ONLY (no left/right scroll) */}
                    <button
                      onClick={() => {
                        setBookFontSize(s => Math.max(24, s));
                        setPageSizeMode('full');
                        setScannedDisplay('crisp');
                        sfx.playClick();
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1 transition-all shadow-sm"
                      title="عرض الصفحة بخط كبير وواضح وتمرير للأسفل فقط دون تمرير يميناً ويساراً"
                    >
                      <Type className="w-3.5 h-3.5" />
                      <span>خط كبير واضح (تمرير للأسفل ↕️)</span>
                    </button>

                    {/* Page Size selector */}
                    <div className="flex items-center bg-slate-950 rounded-lg border border-teal-500/40 p-0.5 gap-0.5">
                      <span className="text-[10px] text-teal-300 font-bold px-1.5 hidden sm:inline items-center gap-0.5">
                        <Maximize2 className="w-3 h-3 inline ml-0.5" />
                        الصفحة:
                      </span>
                      {([
                        { id: 'compact', label: 'قياسي' },
                        { id: 'wide', label: 'واسع' },
                        { id: 'full', label: 'كامل' },
                      ] as const).map((ps) => (
                        <button
                          key={ps.id}
                          onClick={() => { setPageSizeMode(ps.id); sfx.playClick(); }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                            pageSizeMode === ps.id
                              ? 'bg-teal-500 text-slate-950 font-black'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {ps.label}
                        </button>
                      ))}
                    </div>

                    {/* Optional Manual Zoom (stays at 100% by default so there is ZERO horizontal scrolling!) */}
                    <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 p-0.5">
                      <button
                        onClick={() => { setScanZoom(z => Math.max(100, z - 25)); sfx.playClick(); }}
                        disabled={scanZoom <= 100}
                        className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 text-slate-200 transition-colors"
                        title="تصغير إلى عرض الشاشة"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-mono font-bold text-[11px] text-amber-300 min-w-[44px] text-center">
                        {scanZoom}%
                      </span>
                      <button
                        onClick={() => { setScanZoom(z => Math.min(200, z + 25)); sfx.playClick(); }}
                        disabled={scanZoom >= 200}
                        className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 text-slate-200 transition-colors"
                        title="تكبير يدوي"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      {scanZoom > 100 && (
                        <button
                          onClick={() => { setScanZoom(100); sfx.playClick(); }}
                          className="p-1.5 rounded-md hover:bg-slate-800 text-teal-300 transition-colors border-r border-slate-800"
                          title="ملاءمة العرض 100% بدون تمرير أفقي"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => { setScanHighContrast(v => !v); sfx.playClick(); }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
                        scanHighContrast
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title="تبديل وضوح وتباين الحبر"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{scanHighContrast ? 'وضوح عالٍ ✓' : 'توضيح النص'}</span>
                    </button>
                  </div>
                </div>

                {/* Scanned Image Container - Strictly 100% Width Fit by Default (Zero Left/Right Scroll!) */}
                <div
                  dir="rtl"
                  className={`relative flex-1 flex flex-col bg-white w-full transition-all duration-200 ${
                    pageSizeMode === 'full'
                      ? 'min-h-[calc(100dvh-70px)] rounded-none border-0'
                      : pageSizeMode === 'wide'
                        ? 'min-h-[85vh] rounded-lg sm:rounded-xl border border-slate-300 shadow-lg p-1'
                        : 'min-h-[70vh] rounded-lg sm:rounded-xl border border-slate-300 shadow-md p-2'
                  } ${
                    scanZoom > 100
                      ? 'overflow-x-auto touch-pan-x touch-pan-y items-start'
                      : 'overflow-x-hidden justify-start items-center'
                  }`}
                >
                  <img
                    src={getTextbookScanUrl(lessonId, currentBookPageNumber)}
                    alt={`كتاب ${bookSubjectLabel} للصف الثامن - صفحة ${currentBookPageNumber}`}
                    style={scanZoom > 100 ? { width: `${scanZoom}%`, maxWidth: 'none' } : undefined}
                    className={`block select-none transition-all duration-200 h-auto ${
                      scanZoom > 100 ? '' : 'w-full max-w-full object-contain'
                    } ${
                      scanHighContrast ? 'contrast-[1.18] saturate-[1.06]' : ''
                    }`}
                    loading="eager"
                  />
                </div>
              </div>
            ) : (
              <div
                className={`book-readable-content ${activeFontClass} flex-1 flex flex-col ${
                  viewMode === 'scanned' ? 'bg-white px-3 py-3 sm:p-6' : ''
                }`}
                style={{ '--book-font-size': `${bookFontSize}px` } as React.CSSProperties}
              >
                {/* Authentic Official Ministry Textbook Header Banner in Crisp Vertical Mode */}
                {viewMode === 'scanned' && (
                  <div className="mb-4 rounded-xl bg-gradient-to-l from-sky-600 via-sky-500 to-blue-600 text-white px-4 py-3 shadow-md flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow shrink-0">
                        {currentBookPageNumber}
                      </span>
                      <span className="font-extrabold text-lg sm:text-xl truncate">
                        {customPkg ? customPkg.title : 'الجمع والطرح'} — كتاب {bookSubjectLabel} (ص {currentBookPageNumber})
                      </span>
                    </div>
                    <button
                      onClick={() => { setShowInlineScanInCrisp(v => !v); sfx.playClick(); }}
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-bold shrink-0 flex items-center gap-1 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{showInlineScanInCrisp ? 'إخفاء الشكل الأصلي' : 'عرض أشكال الكتاب'}</span>
                    </button>
                  </div>
                )}

                {/* Optional Inline Full-Width Textbook Page Image inside Vertical Reading Flow */}
                {showInlineScanInCrisp && (
                  <div className="mb-5 rounded-xl border border-sky-200 bg-white overflow-hidden shadow-sm">
                    <div className="bg-sky-50 px-3 py-1.5 border-b border-sky-100 flex items-center justify-between text-xs text-sky-900 font-bold">
                      <span>📐 الأشكال والرسومات الرسمية من صفحة {currentBookPageNumber}</span>
                      <button
                        onClick={() => setShowInlineScanInCrisp(false)}
                        className="text-sky-700 hover:text-sky-950 underline"
                      >
                        إغلاق
                      </button>
                    </div>
                    <img
                      src={getTextbookScanUrl(lessonId, currentBookPageNumber)}
                      alt={`أشكال صفحة ${currentBookPageNumber} من كتاب ${bookSubjectLabel}`}
                      className="w-full max-w-full h-auto block select-none contrast-[1.14]"
                      loading="eager"
                    />
                  </div>
                )}
                {/* Custom Lesson Book Pages */}
                {!isDefaultLesson && customBookPages[currentPage] ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2 className="text-xl md:text-2xl font-black text-teal-900 flex items-center gap-2">
                    <span className="text-2xl">📖</span>
                    <span>{customBookPages[currentPage].pageTitle} (صفحة {customBookPages[currentPage].pageNum})</span>
                  </h2>
                  <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-lg">
                    {customBookPages[currentPage].badge}
                  </span>
                </div>

                <div
                  id="book-custom-objective"
                  className={`border-r-4 p-4 rounded-xl text-slate-950 book-body-text font-medium transition-all duration-300 ${
                    activeCustomSlot?.subPart === 'intro'
                      ? 'bg-amber-100/95 border-yellow-500 ring-2 ring-yellow-400/80 shadow-md'
                      : 'bg-amber-50/90 border-amber-500'
                  }`}
                >
                  <span className="font-extrabold text-amber-950 ml-1">الهدف التعليمي للصفحة:</span>
                  {renderSpokenArabicWords(
                    customBookPages[currentPage].objective,
                    activeCustomSlot?.subPart === 'intro' && activeCustomSlot.wordStart !== undefined,
                    activeCustomSlot?.wordStart,
                    activeCustomSlot?.wordEnd
                  )}
                </div>

                {customBookPages[currentPage].sections.map((sec, sIdx) => {
                  const active = isPageSpeaking && sIdx === activeCustomSecIndex;
                  const activeSub = active && activeCustomSlot ? activeCustomSlot.subPart : null;
                  const sectionEqKey = `read-c-${lessonId}-p${currentPage}-s${sIdx}`;
                  const sectionActiveToken = getCustomSectionActiveTokenKey(sIdx, sec.mathEquation);
                  return (
                    <div 
                      id={`book-custom-sec-${sIdx}`}
                      key={sec.id || sIdx}
                      className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 space-y-3.5 scroll-mt-28 ${
                        active
                          ? 'bg-amber-50/95 border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)] border-r-4 border-r-amber-500'
                          : 'bg-white border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="font-extrabold flex items-center justify-between gap-2">
                        <span className={`book-sec-title transition-colors duration-300 ${active ? 'text-amber-950 font-black' : 'text-teal-950'}`}>
                          {renderSpokenArabicWords(
                            sec.title,
                            activeSub === 'title',
                            activeCustomSlot?.wordStart,
                            activeCustomSlot?.wordEnd
                          )}
                        </span>
                        {active ? (
                          <span className="text-xs bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full animate-pulse shrink-0">
                            🎙️ يُشرح الآن
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full font-bold shrink-0">{sec.badge}</span>
                        )}
                      </div>

                      <div
                        id={`book-custom-sec-${sIdx}-rule`}
                        className={`book-body-text transition-all duration-200 rounded-lg p-1.5 ${
                          activeSub === 'rule'
                            ? 'text-amber-950 font-bold bg-amber-100/70 ring-1 ring-amber-300'
                            : active
                              ? 'text-amber-950 font-semibold'
                              : 'text-slate-950 font-medium'
                        }`}
                      >
                        {renderSpokenArabicWords(
                          sec.ruleText,
                          activeSub === 'rule',
                          activeCustomSlot?.wordStart,
                          activeCustomSlot?.wordEnd
                        )}
                      </div>

                      <div 
                        id={`book-custom-sec-${sIdx}-math`}
                        dir="ltr"
                        className={`p-4 rounded-xl border text-center font-bold transition-all duration-200 shadow-inner ${
                          activeSub === 'math'
                            ? 'border-amber-400 bg-amber-100/80 ring-2 ring-amber-400/70'
                            : 'border-slate-300 bg-slate-50'
                        }`}
                      >
                        <GranularMathEquation
                          equation={sec.mathEquation}
                          equationKey={sectionEqKey}
                          activeTokenKey={sectionActiveToken}
                          currentSentence={currentSentence}
                          isSpeaking={isPageSpeaking && activeSub === 'math'}
                          theme="paper"
                          size="lg"
                        />
                      </div>

                      <GeometryDiagram
                        lessonId={lessonId}
                        sectionTitle={sec.title}
                        sectionText={`${sec.ruleText} ${sec.mathEquation || ''} ${sec.exampleProblem}`}
                        theme="paper"
                      />

                      <div
                        id={`book-custom-sec-${sIdx}-ex`}
                        className={`p-4 rounded-xl border book-body-text space-y-2 transition-all duration-200 ${
                          activeSub === 'exampleProblem' || activeSub === 'exampleSolution'
                            ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="text-slate-950 font-bold">
                          <span className="ml-1.5 text-teal-900">📝 مثال تطبيقي:</span>
                          {renderSpokenArabicWords(
                            sec.exampleProblem,
                            activeSub === 'exampleProblem',
                            activeCustomSlot?.wordStart,
                            activeCustomSlot?.wordEnd
                          )}
                        </div>
                        <div className="text-emerald-950 font-bold">
                          <span className="ml-1.5">✅ الحل:</span>
                          {renderSpokenArabicWords(
                            sec.exampleSolution,
                            activeSub === 'exampleSolution',
                            activeCustomSlot?.wordStart,
                            activeCustomSlot?.wordEnd
                          )}
                        </div>

                        <div className="pt-2">
                          <ExampleVisualBoard
                            lessonId={lessonId}
                            sectionTitle={sec.title}
                            mathEquation={sec.mathEquation}
                            exampleProblem={sec.exampleProblem}
                            exampleSolution={sec.exampleSolution}
                            theme="paper"
                            showSolution={true}
                          />
                        </div>
                      </div>

                      {sec.keyTip && (
                        <p
                          id={`book-custom-sec-${sIdx}-tip`}
                          className={`text-amber-950 font-bold p-3 rounded-lg border transition-all duration-200 ${
                            activeSub === 'tip'
                              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/70 shadow-sm'
                              : 'bg-amber-50/60 border-amber-200'
                          }`}
                        >
                          💡{' '}
                          {renderSpokenArabicWords(
                            sec.keyTip,
                            activeSub === 'tip',
                            activeCustomSlot?.wordStart,
                            activeCustomSlot?.wordEnd
                          )}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Page 5 Content: النشاط الاستكشافي */}
            {isDefaultLesson && currentPage === 0 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-black text-teal-900 flex items-center gap-2">
                    <span className="text-2xl">①</span>
                    <span>الجمع والطرح (صفحة 5)</span>
                  </h2>
                  <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-lg">
                    نشاط استكشافي
                  </span>
                </div>

                <div className="bg-amber-50/90 border-r-4 border-amber-500 p-4 rounded-xl book-body-text text-slate-950 font-medium">
                  <span className="font-extrabold text-amber-950">الهدف من النشاط:</span> تمديد القواعد التي عُرضت في الصف السابع لتشمل الكسور والأعداد العادية مع مراعاة الإشارات السالبة والموجبة.
                </div>

                {/* Case 1: المقامات متساوية */}
                {(() => {
                  const active = isSectionActive('c1');
                  return (
                    <div id="book-sec-c1" className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 space-y-3 ${
                      active
                        ? 'bg-amber-50/95 border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)] border-r-4 border-r-amber-500'
                        : 'bg-white border-slate-300 shadow-sm'
                    }`}>
                      <div className="font-extrabold flex items-center justify-between gap-2">
                        <span className={`book-sec-title transition-colors duration-300 ${active ? 'text-amber-950 font-black' : 'text-teal-950'}`}>
                          1. المقامات متساوية
                        </span>
                        {active ? (
                          <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shrink-0">
                            <span>🎙️ يُشرح بالصوت الآن</span>
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full font-bold shrink-0">حل باسم وهاشم</span>
                        )}
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-semibold' : 'text-slate-950 font-medium'}`}>
                        قام كل من الطالبين باسم وهاشم بجمع الكسرين: <GranularMathEquation equation="-9/7" theme="paper" size="md" /> و <GranularMathEquation equation="5/7" theme="paper" size="md" />:
                      </p>
                      <div 
                        dir="ltr"
                        className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-center font-bold transition-all duration-200"
                      >
                        <GranularMathEquation
                          equation="(-9 / 7) + (5 / 7) = (-9 + 5) / 7 = -4 / 7"
                          equationKey="read-p0-eq-c1"
                          activeTokenKey={activeTokenKey}
                          currentSentence={currentSentence}
                          isSpeaking={isPageSpeaking}
                          theme="paper"
                          size="lg"
                        />
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-bold' : 'text-slate-900 font-semibold'}`}>
                        💡 <span className="font-extrabold">النتيجة:</span> كلاهما صحيح! نجمع بسطي الكسرين ونحتفظ بالمقام المشترك 7.
                      </p>
                    </div>
                  );
                })()}

                {/* Case 2: أحد المقامات مضاعف */}
                {(() => {
                  const active = isSectionActive('c2');
                  return (
                    <div id="book-sec-c2" className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 space-y-3 ${
                      active
                        ? 'bg-amber-50/95 border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)] border-r-4 border-r-amber-500'
                        : 'bg-white border-slate-300 shadow-sm'
                    }`}>
                      <div className="font-extrabold flex items-center justify-between gap-2">
                        <span className={`book-sec-title transition-colors duration-300 ${active ? 'text-amber-950 font-black' : 'text-teal-950'}`}>
                          2. أحد المقامات مضاعف لبقية المقامات
                        </span>
                        {active ? (
                          <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shrink-0">
                            <span>🎙️ يُشرح بالصوت الآن</span>
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full font-bold shrink-0">توحيد بمضاعف مباشر</span>
                        )}
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-semibold' : 'text-slate-950 font-medium'}`}>
                        انسخ ثم أكمل: <GranularMathEquation equation="1/2 + 5/8" theme="paper" size="md" />
                      </p>
                      <div 
                        dir="ltr"
                        className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-center font-bold transition-all duration-200"
                      >
                        <GranularMathEquation
                          equation="1/2 + 5/8 = (1 × 4) / (2 × 4) + 5/8 = 4/8 + 5/8 = 9/8"
                          equationKey="read-p0-eq-c2"
                          activeTokenKey={activeTokenKey}
                          currentSentence={currentSentence}
                          isSpeaking={isPageSpeaking}
                          theme="paper"
                          size="lg"
                        />
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-bold' : 'text-slate-900 font-semibold'}`}>
                        💡 عندما نكتب الكسرين بمقام مشترك 8، نقول إننا وحدنا مقامي الكسرين بضرب بسط ومقام 1/2 بالعدد 4.
                      </p>
                    </div>
                  );
                })()}

                {/* Case 3: كيفما كانت المقامات */}
                {(() => {
                  const active = isSectionActive('c3');
                  return (
                    <div id="book-sec-c3" className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 space-y-3 ${
                      active
                        ? 'bg-amber-50/95 border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)] border-r-4 border-r-amber-500'
                        : 'bg-white border-slate-300 shadow-sm'
                    }`}>
                      <div className="font-extrabold flex items-center justify-between gap-2">
                        <span className={`book-sec-title transition-colors duration-300 ${active ? 'text-amber-950 font-black' : 'text-teal-950'}`}>
                          3. كيفما كانت المقامات (مختلفة تماماً)
                        </span>
                        {active ? (
                          <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shrink-0">
                            <span>🎙️ يُشرح بالصوت الآن</span>
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full font-bold shrink-0">المضاعف المشترك الأصغر</span>
                        )}
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-semibold' : 'text-slate-950 font-medium'}`}>
                        وحّد مقامي الكسرين: <GranularMathEquation equation="-1/2" theme="paper" size="md" /> و <GranularMathEquation equation="5/3" theme="paper" size="md" />، ثم احسب <GranularMathEquation equation="-1/2 + 5/3" theme="paper" size="md" />:
                      </p>
                      <div className="book-body-text text-slate-950 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-300 font-medium">
                        <div>• مضاعفات 2 هي: 2 ، 4 ، 6 ، 8 ، 10 ، 12 ، 14 ، 16 ، 18 ...</div>
                        <div>• مضاعفات 3 هي: 3 ، 6 ، 9 ، 12 ، 15 ، 18 ، 21 ...</div>
                        <div className="font-extrabold text-teal-950">• أصغر مضاعف مشترك للمقامين 2 و 3 هو 6:</div>
                        <div 
                          dir="ltr"
                          className="p-3 rounded-xl border border-teal-200 bg-teal-50/40 text-center font-bold transition-all duration-200 mt-1"
                        >
                          <GranularMathEquation
                            equation="-3/6 + 10/6 = (-3 + 10) / 6 = 7/6"
                            equationKey="read-p0-eq-c3"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="lg"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Page 6 Content: الخواص وسلسلة العمليات */}
            {isDefaultLesson && currentPage === 1 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-black text-teal-900 flex items-center gap-2">
                    <span className="text-2xl">②</span>
                    <span>القواعد وسلسلة العمليات (صفحة 6)</span>
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-lg">
                    تعلّم واكتساب معارف
                  </span>
                </div>

                {/* Special Rule 1 */}
                {(() => {
                  const active = isSectionActive('rule1');
                  return (
                    <div id="book-sec-rule1" className={`p-4 rounded-xl space-y-2 border-r-4 transition-all duration-300 ${
                      active
                        ? 'bg-amber-50/95 border-r-yellow-500 border border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)]'
                        : 'bg-emerald-50/80 border-r-emerald-600 border border-emerald-100'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-extrabold flex items-center gap-1.5 transition-colors duration-300 ${
                          active ? 'text-amber-950 font-black' : 'text-emerald-950'
                        }`}>
                          <Bookmark className={`w-4 h-4 ${active ? 'text-amber-600' : 'text-emerald-700'}`} />
                          خاصّة 1: لجمع أو طرح كسور ذات مقامات متساوية
                        </h3>
                        {active && (
                          <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                            🎙️ شرح صوتي نشط
                          </span>
                        )}
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-semibold' : 'text-slate-950 font-medium'}`}>
                        نجمع (أو نطرح) بسوط هذه الكسور ونحتفظ بالمقام المشترك:
                      </p>
                      <div 
                        dir="ltr"
                        className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-center font-bold transition-all duration-200"
                      >
                        <GranularMathEquation
                          equation="a/b + c/b = (a + c) / b | a/b - c/b = (a - c) / b"
                          equationKey="read-p1-rule1-def"
                          activeTokenKey={activeTokenKey}
                          currentSentence={currentSentence}
                          isSpeaking={isPageSpeaking}
                          theme="paper"
                          size="lg"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                        <div dir="ltr" className="p-3 rounded-xl border border-emerald-200 bg-white text-center">
                          <GranularMathEquation
                            equation="(-7)/3 + 0.5/3 = (-7 + 0.5) / 3 = -6.5 / 3"
                            equationKey="read-p1-rule1-ex1"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="md"
                          />
                        </div>
                        <div dir="ltr" className="p-3 rounded-xl border border-emerald-200 bg-white text-center">
                          <GranularMathEquation
                            equation="1/5 - 3/5 = (1 - 3) / 5 = -2/5"
                            equationKey="read-p1-rule1-ex2"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="md"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Special Rule 2 */}
                {(() => {
                  const active = isSectionActive('rule2');
                  return (
                    <div id="book-sec-rule2" className={`p-4 sm:p-5 rounded-xl space-y-3 border-r-4 transition-all duration-300 ${
                      active
                        ? 'bg-amber-50/95 border-r-yellow-500 border border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)]'
                        : 'bg-indigo-50/80 border-r-indigo-600 border border-indigo-200'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-extrabold flex items-center gap-1.5 transition-colors duration-300 ${
                          active ? 'text-amber-950 font-black' : 'text-indigo-950'
                        }`}>
                          <Bookmark className={`w-4 h-4 ${active ? 'text-amber-600' : 'text-indigo-700'}`} />
                          خاصّة 2: لجمع أو طرح كسور ذات مقامات مختلفة
                        </h3>
                        {active && (
                          <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                            🎙️ شرح صوتي نشط
                          </span>
                        )}
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-semibold' : 'text-slate-950 font-medium'}`}>
                        نوحد مقاماتها بالبحث عن أصغر مضاعف مشترك للمقامات، ثم نجري العمليات وفق الخاصة 1:
                      </p>
                      <div 
                        dir="ltr"
                        className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-center font-bold transition-all duration-200"
                      >
                        <GranularMathEquation
                          equation="5/6 + 3/4 = 10/12 + 9/12 = (10 + 9) / 12 = 19/12"
                          equationKey="read-p1-rule2-ex"
                          activeTokenKey={activeTokenKey}
                          currentSentence={currentSentence}
                          isSpeaking={isPageSpeaking}
                          theme="paper"
                          size="lg"
                        />
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-bold' : 'text-slate-900 font-semibold'}`}>
                        💡 العدد 12 هو أصغر مضاعف مشترك للعددين 6 و 4، فاستبدلنا كل كسر بكسر يساويه مقامه 12.
                      </p>
                    </div>
                  );
                })()}

                {/* Acquisition of Knowledge: Series of operations */}
                {(() => {
                  const active = isSectionActive('calcA');
                  return (
                    <div id="book-sec-calcA" className={`p-4 sm:p-5 rounded-xl space-y-3 border-r-4 transition-all duration-300 ${
                      active
                        ? 'bg-amber-50/95 border-r-yellow-500 border border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)]'
                        : 'bg-purple-50/80 border-r-purple-600 border border-purple-200'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-extrabold transition-colors duration-300 ${
                          active ? 'text-amber-950 font-black' : 'text-purple-950'
                        }`}>
                          اكتساب معارف: كيف ننجز سلسلة من عمليات الجمع والطرح؟
                        </h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded font-bold shrink-0 ${
                          active ? 'bg-amber-400 text-slate-950' : 'bg-purple-200/80 text-purple-950'
                        }`}>
                          مثال A
                        </span>
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-semibold' : 'text-slate-950 font-medium'}`}>
                        احسب بصيغة كسر عادي: <GranularMathEquation equation="A = 5/3 - 7/6 + 3/8" theme="paper" size="md" />
                      </p>
                      <div className="bg-white p-4 rounded-xl border border-purple-200 book-body-text text-purple-950 space-y-2.5 font-medium">
                        <div>• العدد 6 مضاعف للعدد 3، لذا يكفي إيجاد مضاعف مشترك لـ 6 و 8 وهو: 24</div>
                        <div 
                          dir="ltr"
                          className="p-3 rounded-lg border border-purple-200 bg-slate-50 text-center font-bold transition-all duration-200"
                        >
                          <GranularMathEquation
                            equation="A = 40/24 - 28/24 + 9/24 = 21/24"
                            equationKey="read-p1-calcA-step1"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="lg"
                          />
                        </div>
                        <div 
                          dir="ltr"
                          className="p-2 rounded-lg text-center font-bold text-emerald-900 transition-all duration-200"
                        >
                          نختصر ÷ 3: &nbsp;
                          <GranularMathEquation
                            equation="A = (21 ÷ 3) / (24 ÷ 3) = 7/8"
                            equationKey="read-p1-calcA-step2"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="md"
                          />
                          &nbsp;✅
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Page 7 Content: تحقق من فهمك وتدرب والمسألة الحياتية */}
            {isDefaultLesson && currentPage === 2 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-black text-teal-900 flex items-center gap-2">
                    <span className="text-2xl">③</span>
                    <span>تحقق من فهمك وتدرب (صفحة 7)</span>
                  </h2>
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-lg">
                    تمارين ومسائل
                  </span>
                </div>

                {/* Section 1: تحقق من فهمك */}
                {(() => {
                  const active = isSectionActive('check');
                  return (
                    <div id="book-sec-check" className={`p-4 rounded-xl border transition-all duration-300 space-y-2.5 ${
                      active
                        ? 'bg-amber-50/95 border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)] border-r-4 border-r-amber-500'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="font-extrabold flex items-center justify-between gap-2">
                        <span className={`book-sec-title transition-colors duration-300 ${active ? 'text-amber-950 font-black' : 'text-teal-950'}`}>
                          1. تحقق من فهمك: انسخ وأكمل
                        </span>
                        {active && (
                          <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                            🎙️ شرح صوتي نشط
                          </span>
                        )}
                      </div>
                      <div 
                        dir="ltr"
                        className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-center font-bold transition-all duration-200"
                      >
                        <GranularMathEquation
                          equation="5/9 + 1/3 = 5/9 + 3/9 = 8/9"
                          equationKey="read-p2-check-eq1"
                          activeTokenKey={activeTokenKey}
                          currentSentence={currentSentence}
                          isSpeaking={isPageSpeaking}
                          theme="paper"
                          size="lg"
                        />
                        &nbsp;✅
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div dir="ltr" className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                          <GranularMathEquation
                            equation="(-7)/5 + (-3)/5 = -10/5 = -2"
                            equationKey="read-p2-check-eq2"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="md"
                          />
                        </div>
                        <div dir="ltr" className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                          <GranularMathEquation
                            equation="4/7 - 0.1/7 = 3.9/7"
                            equationKey="read-p2-check-eq3"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="md"
                          />
                        </div>
                        <div dir="ltr" className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                          <GranularMathEquation
                            equation="4/3 + 5/3 = 9/3 = 3"
                            equationKey="read-p2-check-eq4"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="md"
                          />
                        </div>
                        <div dir="ltr" className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
                          <GranularMathEquation
                            equation="13/(-6) + (-5)/6 = -18/6 = -3"
                            equationKey="read-p2-check-eq5"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="md"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Section 2: تدرب */}
                {(() => {
                  const active = isSectionActive('practice');
                  return (
                    <div id="book-sec-practice" className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 space-y-3 ${
                      active
                        ? 'bg-amber-50/95 border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)] border-r-4 border-r-amber-500'
                        : 'bg-white border-slate-300 shadow-sm'
                    }`}>
                      <div className="font-extrabold flex items-center justify-between gap-2">
                        <span className={`book-sec-title transition-colors duration-300 ${active ? 'text-amber-950 font-black' : 'text-teal-950'}`}>
                          2. تدرب: احسب بصيغة كسر عادي
                        </span>
                        {active && (
                          <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                            🎙️ شرح صوتي نشط
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 transition-all duration-200 space-y-2">
                          <div className="book-body-text font-bold text-slate-900">5/8 - 1/6: نوحد على 24</div>
                          <div dir="ltr" className="text-center font-bold">
                            <GranularMathEquation
                              equation="15/24 - 4/24 = 11/24"
                              equationKey="read-p2-prac-eq1"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isPageSpeaking}
                              theme="paper"
                              size="lg"
                            />
                            &nbsp;✅
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 transition-all duration-200 space-y-2">
                          <div className="book-body-text font-bold text-slate-900">5/3 - 7/4: نوحد على 12</div>
                          <div dir="ltr" className="text-center font-bold">
                            <GranularMathEquation
                              equation="20/12 - 21/12 = -1/12"
                              equationKey="read-p2-prac-eq2"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isPageSpeaking}
                              theme="paper"
                              size="lg"
                            />
                            &nbsp;✅
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Section 3: Real Life Juice Problem */}
                {(() => {
                  const active = isSectionActive('juice');
                  return (
                    <div id="book-sec-juice" className={`p-4 sm:p-5 rounded-xl space-y-3 border-r-4 transition-all duration-300 ${
                      active
                        ? 'bg-amber-50/95 border-r-yellow-500 border border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.25)]'
                        : 'bg-amber-50/90 border-r-amber-600 border border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🥤</span>
                          <h3 className={`font-extrabold transition-colors duration-300 ${
                            active ? 'text-amber-950 font-black' : 'text-amber-950'
                          }`}>
                            المسألة الحياتية في الكتاب: عصير زينة (صفحة 7)
                          </h3>
                        </div>
                        {active && (
                          <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                            🎙️ شرح صوتي نشط
                          </span>
                        )}
                      </div>
                      <p className={`transition-colors duration-300 ${active ? 'text-amber-950 font-semibold' : 'text-slate-950 font-medium'}`}>
                        خلطت زينة <GranularMathEquation equation="3/5" theme="paper" size="md" /> الليتر من عصير التفاح مع <GranularMathEquation equation="6/5" theme="paper" size="md" /> الليتر من عصير العنب لملء وعاء سعته ليتران (2L). كم ليتراً من عصير الموز تحتاج زينة إضافته؟
                      </p>
                      <div className="bg-white p-4 rounded-xl border border-amber-200 book-body-text space-y-2.5 text-slate-950 font-medium">
                        <div>
                          1) كمية عصير التفاح والعنب: &nbsp;
                          <GranularMathEquation
                            equation="3/5 + 6/5 = 9/5 L"
                            equationKey="read-p2-juice-eq1"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="md"
                          />
                          &nbsp;(أي 1.8 ليتر).
                        </div>
                        <div>
                          2) سعة الوعاء الكلية: &nbsp;
                          <GranularMathEquation
                            equation="2 L = 10/5 L"
                            equationKey="read-p2-juice-eq2"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="md"
                          />
                        </div>
                        <div 
                          dir="ltr"
                          className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-center font-bold transition-all duration-200"
                        >
                          <span className="font-sans text-emerald-950 ml-1.5">3) عصير الموز المطلوب: </span>
                          <GranularMathEquation
                            equation="10/5 - 9/5 = 1/5 ليتر"
                            equationKey="read-p2-juice-eq3"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isPageSpeaking}
                            theme="paper"
                            size="lg"
                          />
                          &nbsp;🍌 ✅
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
              </div>
            )}

            </div>

            {/* Bottom Circular Page Numbers Footer (Single Unified Navigation Across All Lessons) */}
            <div className={`${
              viewMode === 'scanned' ? 'mt-2 py-2.5 px-3' : 'mt-8 pt-4'
            } border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-mono`}>
              <span className="hidden sm:inline">{bookSubjectLabel} - {customPkg ? customPkg.pages : 'ص 5 - 7'}</span>

              <div className="flex flex-wrap items-center justify-center gap-2 mx-auto sm:mx-0">
                {lessonPageNumbers.map((pNum, idx) => {
                  const isActive = idx === currentPage;
                  return (
                    <button
                      key={pNum}
                      onClick={() => {
                        if (idx !== currentPage) handleSelectBookPage(idx);
                        else scrollToBookContent();
                      }}
                      title={`الانتقال إلى صفحة ${pNum}`}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm transition-all duration-200 border ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-black ring-2 ring-amber-300/70 scale-110 shadow-md'
                          : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border-slate-300 hover:border-teal-400 font-bold shadow-inner active:scale-95'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <span className="hidden sm:inline">وزارة التربية - دمشق</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
