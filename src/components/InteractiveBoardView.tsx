import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, FastForward, Rewind, Square, ChevronRight, ChevronLeft, 
  Sparkles
} from 'lucide-react';
import { BOARD_PAGES_DATA, BoardFullPage } from '../data/lessonData';
import {
  getFullLessonPackage,
  buildCustomBoardNarrationTimeline,
  CustomBoardNarrationSlot
} from '../data/curriculumLessonsData';
import { speechManager } from '../utils/speechService';
import { sfx } from '../utils/soundEffects';
import { GranularMathEquation, getEquationPartTokenIndices } from './GranularMathEquation';
import { FormattedMathText } from './FormattedMathText';
import { GeometryDiagram } from './GeometryDiagram';
import { getActiveTokenKey } from '../utils/audioTimelineService';

interface InteractiveBoardViewProps {
  lessonId?: string;
}

export const InteractiveBoardView: React.FC<InteractiveBoardViewProps> = ({
  lessonId = 'u1-l1'
}) => {
  const customPkg = getFullLessonPackage(lessonId);
  const activeBoardPages: BoardFullPage[] = (customPkg && customPkg.boardPages.length > 0)
    ? customPkg.boardPages
    : BOARD_PAGES_DATA;

  // Page selector
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  // Reset page when lesson changes
  useEffect(() => {
    setSelectedPageIndex(0);
    setIsSpeakingFullPage(false);
    speechManager.stop();
  }, [lessonId]);

  const [isSpeakingFullPage, setIsSpeakingFullPage] = useState<boolean>(false);
  const [isPausedFullPage, setIsPausedFullPage] = useState<boolean>(false);
  const [currentSentenceText, setCurrentSentenceText] = useState<string>('');
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(-1);
  const [sentenceProgressRatio, setSentenceProgressRatio] = useState<number>(0);
  const [sentenceProgress, setSentenceProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [speechRate, setSpeechRate] = useState<number>(0.85);

  const safeIndex = Math.min(selectedPageIndex, activeBoardPages.length - 1);
  const currentPageData: BoardFullPage = activeBoardPages[safeIndex] || activeBoardPages[0];

  const customBoardTimeline = useMemo(() => {
    if (lessonId === 'u1-l1') return null;
    return buildCustomBoardNarrationTimeline(currentPageData);
  }, [lessonId, currentPageData]);

  // Deterministic sentence index -> board line index mapping for Lesson 1
  // Ensures ONLY ONE line is active at a time, preventing duplicate words or numbers from lighting up!
  const PAGE_SENTENCE_TO_BOARD_LINE: Record<number, number[]> = {
    // Page 5 (Book page 5 - 21 sentences 0..20)
    0: [
      0, 0, 0, // [0,1,2] مقدمة وترحيب
      2,       // [3] الحالة 1: المقامات متساوية
      3,       // [4] (-9/7) + (5/7) عملية باسم وهاشم
      4,       // [5] نحتفظ بالمقام 7
      5, 5,    // [6,7] (-9+5)/7 = -4/7
      7,       // [8] الحالة 2: مضاعف
      8,       // [9] 1/2 + 5/8
      9,       // [10] توحيد المقامين على 8
      10,      // [11] (1x4)/(2x4) = 4/8
      11,      // [12] الناتج = 9/8
      13, 13,  // [13,14] الحالة 3: مختلفة تماماً
      14,      // [15] -1/2 + 5/3
      15,      // [16] أصغر مضاعف هو 6
      16, 16,  // [17,18] -3/6 و 10/6
      17,      // [19] الناتج = 7/6
      18       // [20] خلاصة ص 5
    ],
    // Page 6 (Book page 6 - 19 sentences 0..18)
    1: [
      0,       // [0] مقدمة ص 6
      2,       // [1] خاصة 1 المقامات متساوية
      3, 3,    // [2,3] القاعدة a/b + c/b و a/b - c/b
      4,       // [4] مثال (-7)/3 + 0.5/3 = -6.5/3
      5,       // [5] مثال 1/5 - 3/5 = -2/5
      7,       // [6] خاصة 2 المقامات مختلفة
      8, 8,    // [7,8] نوحد المقامات بالمضاعف
      9,       // [9] مثل 5/6 + 3/4
      10,      // [10] المضاعف 12
      10,      // [11] 10/12 + 9/12
      11,      // [12] المجموع 19/12
      14,      // [13] سلسلة العمليات A = 5/3 - 7/6 + 3/8
      15,      // [14] مضاعف 3 و 6 و 8 هو 24
      16,      // [15] 40/24 - 28/24 + 9/24
      17,      // [16] الناتج 21/24
      18,      // [17] الاختصار 7/8
      19       // [18] نصيحة الاختصار
    ],
    // Page 7 (Book page 7 - 25 sentences 0..24)
    2: [
      0,          // [0] مقدمة ص 7
      3, 3, 3,    // [1,2,3] 5/9 + 1/3 = 8/9
      4, 4, 4, 4, // [4,5,6,7] (-7/5) + (-3/5) = -2
      5,          // [8] 4/7 - 0.1/7 = 3.9/7
      6, 6,       // [9,10] 13/(-6) + (-5/6) = -3
      8,          // [11] تدرب
      9, 9,       // [12,13] 5/8 - 1/6 على 24
      10,         // [14] الناتج 11/24
      11, 11,     // [15,16] 5/3 - 7/4 على 12
      12,         // [17] الناتج -1/12
      14,         // [18] مسألة عصير زينة
      15,         // [19] المعطيات 3/5 و 6/5 و 2L
      16,         // [20] مجموع التفاح والعنب 9/5
      17,         // [21] سعة الوعاء 10/5
      18, 18,     // [22,23] الموز = 1/5 ليتر
      19          // [24] انتهاء ص 7
    ]
  };

  // Sync speech state
  useEffect(() => {
    speechManager.setOnPlaybackState((st) => {
      setIsSpeakingFullPage(st.isSpeaking);
      setIsPausedFullPage(st.isPaused);
      setCurrentSentenceText(st.currentSentence);
      setCurrentSentenceIndex(st.currentIndex);
      setSentenceProgress({ current: st.currentIndex + 1, total: st.total });
      if (!st.isSpeaking) {
        setSentenceProgressRatio(0);
      }
    });

    speechManager.setOnProgress((index, ratio) => {
      setCurrentSentenceIndex(index);
      setSentenceProgressRatio(ratio);
    });

    return () => {
      speechManager.stop();
    };
  }, [selectedPageIndex]);

  const activeCustomSlot: CustomBoardNarrationSlot | null =
    isSpeakingFullPage && lessonId !== 'u1-l1' && customBoardTimeline && currentSentenceIndex >= 0
      ? customBoardTimeline.slots[currentSentenceIndex] || null
      : null;

  const getMappedLineIndex = (): number => {
    if (!isSpeakingFullPage || currentSentenceIndex < 0) return -1;
    if (lessonId === 'u1-l1') {
      const mapped = PAGE_SENTENCE_TO_BOARD_LINE[selectedPageIndex]?.[currentSentenceIndex];
      return mapped !== undefined ? mapped : -1;
    }
    return activeCustomSlot ? activeCustomSlot.lineIdx : -1;
  };

  // AUTO-SCROLL: Smoothly scroll to the line being read so student never gets lost!
  useEffect(() => {
    if (!isSpeakingFullPage || currentSentenceIndex < 0) return;
    const mappedIdx = getMappedLineIndex();
    if (mappedIdx >= 0) {
      const lineEl = document.getElementById(`board-line-${mappedIdx}`);
      if (lineEl) {
        lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentSentenceIndex, isSpeakingFullPage, selectedPageIndex, lessonId]);

  // Unique position-based token key active in real-time audio playback (all 27 lessons)
  const activeTokenKey = isSpeakingFullPage
    ? (lessonId === 'u1-l1'
        ? getActiveTokenKey('board', selectedPageIndex, currentSentenceIndex, sentenceProgressRatio)
        : (() => {
            if (!activeCustomSlot || !activeCustomSlot.isMath || activeCustomSlot.lineIdx < 0) return null;
            const line = currentPageData.boardLines[activeCustomSlot.lineIdx];
            if (!line) return null;
            const rawText = line.equation || line.text || '';
            const colonIdx = rawText.indexOf(':');
            const mathStr = (!line.equation && colonIdx > 0 && (rawText.includes('/') || rawText.includes('=') || rawText.includes('+') || rawText.includes('-')))
              ? rawText.slice(colonIdx + 1).trim()
              : rawText;
            const eqParts = getEquationPartTokenIndices(mathStr);
            const partIdx = Math.min(eqParts.length - 1, activeCustomSlot.mathPartIdx ?? 0);
            const partTokens = eqParts[partIdx] || [];
            if (partTokens.length === 0) return null;
            const pos = Math.min(
              partTokens.length - 1,
              Math.floor(Math.max(0, Math.min(0.99, sentenceProgressRatio)) * partTokens.length)
            );
            return `b-p${selectedPageIndex}-l${activeCustomSlot.lineIdx}-${partTokens[pos]}`;
          })())
    : null;

  // Position-specific Arabic word highlighter strictly scoped to [wordStart, wordEnd) of the active board line
  const renderActiveBoardText = (text: string, isActive: boolean) => {
    if (!isActive || !text) return <FormattedMathText text={text} size="sm" />;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return <FormattedMathText text={text} size="sm" />;

    const startIdx = Math.max(0, Math.min(words.length - 1, activeCustomSlot?.wordStart ?? 0));
    const endIdx = Math.max(startIdx + 1, Math.min(words.length, activeCustomSlot?.wordEnd ?? words.length));
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
                  ? 'bg-yellow-300 text-slate-950 font-black px-1 py-0.5 rounded shadow-sm inline-block transition-colors duration-150'
                  : 'transition-colors duration-150'
              }
            >
              {word.includes('/') ? <FormattedMathText text={word} size="sm" /> : word}
            </span>
            {wIdx < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        ))}
      </span>
    );
  };

  // Voice Narration Controls
  const handlePlayFullPageVoice = () => {
    sfx.playClick();
    setIsSpeakingFullPage(true);
    setIsPausedFullPage(false);
    if (lessonId !== 'u1-l1' && customBoardTimeline && customBoardTimeline.sentences.length > 0) {
      speechManager.speakSentences(
        customBoardTimeline.sentences,
        speechRate,
        () => {
          setIsSpeakingFullPage(false);
          setIsPausedFullPage(false);
          sfx.playSuccessSound();
        },
        currentPageData.fullSpokenText
      );
      return;
    }
    speechManager.speak(currentPageData.fullSpokenText, speechRate, () => {
      setIsSpeakingFullPage(false);
      setIsPausedFullPage(false);
      sfx.playSuccessSound();
    });
  };

  const handlePauseFullPageVoice = () => {
    sfx.playClick();
    speechManager.pause();
    setIsPausedFullPage(true);
  };

  const handleResumeFullPageVoice = () => {
    sfx.playClick();
    speechManager.resume();
    setIsPausedFullPage(false);
  };

  const handleForwardFullPageVoice = () => {
    sfx.playClick();
    speechManager.forward();
  };

  const handleRewindFullPageVoice = () => {
    sfx.playClick();
    speechManager.rewind();
  };

  const handleStopFullPageVoice = () => {
    sfx.playClick();
    speechManager.stop();
    setIsSpeakingFullPage(false);
    setIsPausedFullPage(false);
  };

  const handleToggleFullPageVoice = () => {
    if (!isSpeakingFullPage) {
      handlePlayFullPageVoice();
    } else if (isPausedFullPage) {
      handleResumeFullPageVoice();
    } else {
      handlePauseFullPageVoice();
    }
  };

  const handleSelectPage = (index: number) => {
    if (index === selectedPageIndex) {
      const boardFrame = document.getElementById('blackboard-frame');
      if (boardFrame) {
        boardFrame.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    sfx.playPageFlipSound();
    speechManager.stop();
    setIsSpeakingFullPage(false);
    setIsPausedFullPage(false);
    setSelectedPageIndex(index);
    requestAnimationFrame(() => {
      const scrollEl = document.getElementById('blackboard-scroll-area');
      if (scrollEl) {
        scrollEl.scrollTop = 0;
      }
      const boardFrame = document.getElementById('blackboard-frame');
      if (boardFrame) {
        boardFrame.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  // Helper to cleanly render math lines with bidirectional text isolation
  const renderMathLineContent = (text: string, isActive: boolean, lineIdx: number) => {
    const scopedTokenKey = lessonId === 'u1-l1' ? activeTokenKey : (isActive ? activeTokenKey : null);
    const colonIdx = text.indexOf(':');
    if (colonIdx > 0 && (text.includes('/') || text.includes('=') || text.includes('+') || text.includes('-'))) {
      const label = text.slice(0, colonIdx + 1).trim();
      const mathFormula = text.slice(colonIdx + 1).trim();
      return (
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 w-full py-0.5">
          <span className={`font-bold transition-colors duration-200 shrink-0 ${isActive ? 'text-amber-200 font-black' : 'text-slate-300'}`}>
            {label}
          </span>
          <div className="flex-1 flex justify-center sm:justify-start">
            <GranularMathEquation
              equation={mathFormula}
              equationKey={`b-p${selectedPageIndex}-l${lineIdx}`}
              activeTokenKey={scopedTokenKey}
              currentSentence={currentSentenceText}
              isSpeaking={isSpeakingFullPage}
              theme="chalkboard"
              size="md"
            />
          </div>
        </div>
      );
    }
    if (text.includes('/') || text.includes('=') || text.includes('+') || text.includes('-')) {
      return (
        <div className="w-full text-center py-0.5">
          <GranularMathEquation
            equation={text}
            equationKey={`b-p${selectedPageIndex}-l${lineIdx}`}
            activeTokenKey={scopedTokenKey}
            currentSentence={currentSentenceText}
            isSpeaking={isSpeakingFullPage}
            theme="chalkboard"
            size="md"
          />
        </div>
      );
    }
    return renderActiveBoardText(text, isActive);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Sleek, Single-Row Top Control Bar: Small Buttons Only, Zero Clutter */}
      <div className="bg-slate-900 border border-emerald-700/50 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-md">
        {/* Page Switcher Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">الصفحة:</span>
          {activeBoardPages.map((page, idx) => (
            <button
              key={page.pageIndex}
              onClick={() => handleSelectPage(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                selectedPageIndex === idx
                  ? 'bg-amber-400 text-slate-950 font-black shadow ring-1 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              ص {page.bookPageNum}
            </button>
          ))}
        </div>

        {/* Small Audio Buttons Suite (ترجيع، قراءة/توقف، تقديم، إيقاف) */}
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-emerald-600/40">
          {/* 1. زر ترجيع ⏪ */}
          <button
            onClick={handleRewindFullPageVoice}
            disabled={!isSpeakingFullPage || currentSentenceIndex <= 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-25 text-amber-300 font-bold text-xs flex items-center gap-1 active:scale-95"
            title="ترجيع (الجملة السابقة) ⏪"
          >
            <Rewind className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-[11px]">ترجيع</span>
          </button>

          {/* 2. زر القراءة / الإيقاف المؤقت / المتابعة ▶️ ⏸️ */}
          <button
            onClick={handleToggleFullPageVoice}
            className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 active:scale-95 shadow transition-all ${
              !isSpeakingFullPage
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-1 ring-amber-300'
                : isPausedFullPage
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-300'
                  : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-1 ring-rose-300'
            }`}
            title={!isSpeakingFullPage ? 'قراءة الدرس' : isPausedFullPage ? 'متابعة القراءة' : 'إيقاف مؤقت'}
          >
            {!isSpeakingFullPage ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>قراءة</span>
              </>
            ) : isPausedFullPage ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>متابعة</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>إيقاف</span>
              </>
            )}
          </button>

          {/* 3. زر تقديم ⏩ */}
          <button
            onClick={handleForwardFullPageVoice}
            disabled={!isSpeakingFullPage || (sentenceProgress.total > 0 && currentSentenceIndex >= sentenceProgress.total - 1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-25 text-amber-300 font-bold text-xs flex items-center gap-1 active:scale-95"
            title="تقديم (الجملة التالية) ⏩"
          >
            <span className="hidden xs:inline text-[11px]">تقديم</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>

          {/* 4. زر إيقاف كامل ⏹️ */}
          {isSpeakingFullPage && (
            <button
              onClick={handleStopFullPageVoice}
              className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 active:scale-95"
              title="إيقاف كامل ⏹️"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {/* 5. عداد الجمل الصغير */}
          {isSpeakingFullPage && sentenceProgress.total > 0 && (
            <span className="text-[10px] font-mono text-amber-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              {currentSentenceIndex + 1}/{sentenceProgress.total}
            </span>
          )}
        </div>

        {/* Audio Speed Toggles */}
        <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-slate-800 text-[11px] hidden sm:flex">
          {[0.85, 1.0].map((rate) => (
            <button
              key={rate}
              onClick={() => { setSpeechRate(rate); sfx.playClick(); }}
              className={`px-1.5 py-0.5 rounded font-mono font-bold transition-all ${
                speechRate === rate ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Blackboard Frame: 100% Focused on Content */}
      <div id="blackboard-frame" className="relative rounded-2xl overflow-hidden border-[8px] sm:border-[12px] border-[#5a361c] bg-[#142620] shadow-2xl flex flex-col scroll-mt-28 sm:scroll-mt-36">
        {/* Wood Texture Header Bar */}
        <div className="bg-[#0f1d18] px-3 sm:px-5 py-2.5 border-b border-[#1f3b31] flex items-center justify-between gap-2 text-xs text-slate-300 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSpeakingFullPage && !isPausedFullPage ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span className="font-extrabold text-amber-300 text-xs sm:text-sm truncate">
              {currentPageData.title} (ص {currentPageData.bookPageNum})
            </span>
          </div>

          {isSpeakingFullPage && currentSentenceText && (
            <div className="text-[11px] text-amber-200 truncate max-w-[200px] sm:max-w-md bg-amber-950/40 px-2 py-0.5 rounded border border-amber-600/30">
              <span className="font-bold text-amber-400">🎙️ </span>
              <span>{currentSentenceText}</span>
            </div>
          )}
        </div>

        {/* Blackboard Surface Area with Auto-Scrollable Container */}
        <div 
          id="blackboard-scroll-area"
          className="relative p-3.5 sm:p-6 md:p-8 font-mono text-slate-100 overflow-y-auto max-h-[65vh] sm:max-h-[70vh] selection:bg-emerald-700"
        >
          {/* Subtle chalk dust background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:18px_18px]" />

          {/* Board Content Text: Covers the FULL page */}
          <div className="relative z-0 space-y-3 text-xs sm:text-sm md:text-base leading-relaxed pr-1 sm:pr-4 select-text">
            <GeometryDiagram
              lessonId={lessonId}
              sectionTitle={currentPageData.title}
              theme="chalkboard"
            />
            {currentPageData.boardLines.map((line, idx) => {
              const lineContent = line.text || line.equation || '';
              
              // STRICT 1-to-1 sentence mapping: ONLY the specific line currently being read is active!
              // This strictly prevents multiple duplicate words or numbers across the page from highlighting together!
              const mappedLine = getMappedLineIndex();
              const isActive = isSpeakingFullPage && (mappedLine !== -1 && idx === mappedLine);

              if (line.type === 'divider') {
                return <div key={idx} className="h-0.5 bg-emerald-800/60 my-2 rounded-full" />;
              }
              if (line.type === 'header' || line.type === 'title') {
                return (
                  <div 
                    id={`board-line-${idx}`}
                    key={idx} 
                    className={`font-extrabold text-sm sm:text-base border-b border-emerald-800/80 pb-1.5 flex items-center justify-between gap-2 transition-all duration-300 rounded-lg p-1.5 ${
                      isActive 
                        ? 'text-yellow-300 bg-yellow-400/20 border-r-4 border-yellow-400 drop-shadow-[0_0_12px_rgba(253,224,71,0.9)]' 
                        : 'text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {renderActiveBoardText(lineContent, isActive)}
                    </div>
                    {isActive && (
                      <span className="text-[10px] bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded-full animate-pulse shrink-0">
                        👉 يُشرح الآن
                      </span>
                    )}
                  </div>
                );
              }
              if (line.type === 'rule' || line.type === 'example') {
                return (
                  <div 
                    id={`board-line-${idx}`}
                    key={idx} 
                    className={`font-bold text-xs sm:text-sm pt-1.5 transition-all duration-300 rounded-xl p-2 ${
                      isActive 
                        ? 'text-yellow-200 font-black bg-amber-500/20 border-r-4 border-yellow-400 ring-1 ring-yellow-400/60 shadow-[0_0_16px_rgba(250,204,21,0.4)]' 
                        : line.type === 'example' ? 'text-amber-200' : 'text-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        {isActive && <span className="inline-block text-yellow-300 animate-bounce">👉</span>}
                        {renderActiveBoardText(lineContent, isActive)}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded-full animate-pulse shrink-0">
                          المعلم يقرأ هنا
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
              if (line.type === 'result' || line.equation) {
                return (
                  <div 
                    id={`board-line-${idx}`}
                    key={idx} 
                    className={`py-1 text-center font-bold text-xs sm:text-sm dir-ltr transition-all duration-300 rounded-xl ${
                      isActive ? 'bg-amber-500/20 border-r-4 border-yellow-400 ring-1 ring-yellow-400/60 shadow-[0_0_16px_rgba(250,204,21,0.4)] p-1.5' : ''
                    }`}
                  >
                    {line.label && (
                      <div className="text-[10px] font-sans text-emerald-400/80 mb-0.5 text-right">{line.label}:</div>
                    )}
                    <GranularMathEquation
                      equation={line.equation || lineContent}
                      equationKey={`b-p${selectedPageIndex}-l${idx}`}
                      activeTokenKey={isActive ? activeTokenKey : null}
                      currentSentence={currentSentenceText}
                      isSpeaking={isSpeakingFullPage}
                      theme="chalkboard"
                      size="md"
                    />
                  </div>
                );
              }
              if (line.type === 'note') {
                return (
                  <div 
                    id={`board-line-${idx}`}
                    key={idx} 
                    className={`p-2 rounded-xl text-xs font-sans mt-1.5 transition-all duration-200 ${
                      isActive 
                        ? 'bg-amber-950/60 border-r-4 border-yellow-400 text-yellow-100 font-bold ring-1 ring-yellow-400/60' 
                        : 'bg-amber-950/30 border border-amber-600/30 text-amber-200'
                    }`}
                  >
                    {isActive ? renderActiveBoardText(lineContent, true) : <FormattedMathText text={lineContent} size="sm" />}
                  </div>
                );
              }
              // Regular math line or text
              return (
                <div 
                  id={`board-line-${idx}`}
                  key={idx} 
                  className={`font-mono text-xs sm:text-sm leading-relaxed transition-all duration-200 rounded-lg px-2 py-0.5 ${
                    isActive 
                      ? 'text-white border-r-4 border-yellow-400 bg-amber-500/20 ring-1 ring-yellow-400/60 font-bold' 
                      : 'text-slate-200'
                  }`} 
                >
                  {renderMathLineContent(lineContent, isActive, idx)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Board Bottom Shelf / Wood Tray: Chalks & Page Arrows Only, No Overlapping Audio Bars! */}
        <div className="bg-[#3e2311] border-t-2 sm:border-t-4 border-[#2b170a] px-3 sm:px-5 py-2 flex items-center justify-between gap-2 text-xs select-none">
          {/* Chalk pieces & Eraser */}
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-2 bg-slate-100 rounded-sm shadow-sm" title="طبشورة بيضاء" />
            <span className="inline-block w-6 h-2 bg-yellow-300 rounded-sm shadow-sm" title="طبشورة صفراء" />
            <span className="inline-block w-6 h-2 bg-cyan-300 rounded-sm shadow-sm" title="طبشورة زرقاء" />
            <span className="inline-block w-10 h-2.5 bg-amber-900 border border-amber-950 rounded shadow-sm" title="ممسحة سبورة" />
          </div>

          {/* Simple Previous / Next Page navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (selectedPageIndex > 0) handleSelectPage(selectedPageIndex - 1);
              }}
              disabled={selectedPageIndex === 0}
              className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 disabled:opacity-25 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>السابقة</span>
            </button>
            <span className="text-[11px] text-amber-300 font-mono font-bold px-1">
              ص {currentPageData.bookPageNum}
            </span>
            <button
              onClick={() => {
                if (selectedPageIndex < activeBoardPages.length - 1) handleSelectPage(selectedPageIndex + 1);
              }}
              disabled={selectedPageIndex === activeBoardPages.length - 1}
              className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 disabled:opacity-25 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
            >
              <span>التالية</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
