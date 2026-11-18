import React, { useState, useEffect, useRef } from 'react';
import { 
  WifiOff, Battery, Volume2, Pause, ChevronLeft, ChevronRight, 
  BookOpen, Sparkles, CheckCircle2, RotateCcw, Play, Layers, Menu, ArrowRight,
  FastForward, Rewind, Square
} from 'lucide-react';
import { BOARD_PAGES_DATA, PAGE_AUDIO_NARRATIONS, EXERCISES, BoardFullPage } from '../data/lessonData';
import { getFullLessonPackage, BookPageData } from '../data/curriculumLessonsData';
import { speechManager } from '../utils/speechService';
import { sfx } from '../utils/soundEffects';
import { GranularMathEquation } from './GranularMathEquation';
import { FormattedMathText } from './FormattedMathText';
import { GeometryDiagram } from './GeometryDiagram';
import { getActiveTokenKey } from '../utils/audioTimelineService';
import { SidebarDrawer } from './SidebarDrawer';
import { CurriculumLesson, ALL_CURRICULUM_UNITS, getBookForLesson } from '../data/curriculumUnits';

interface MobileSimulatorProps {
  initialTab?: 'read' | 'board' | 'quiz';
  onTabChange?: (tab: 'read' | 'board' | 'quiz') => void;
  lessonId?: string;
  onOpenFlutterCode?: () => void;
  onOpenSummary?: () => void;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({ 
  initialTab = 'board',
  onTabChange,
  lessonId = 'u1-l1',
  onOpenFlutterCode,
  onOpenSummary
}) => {
  const [activeTab, setActiveTab] = useState<'read' | 'board' | 'quiz'>(initialTab);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [sentenceProgressRatio, setSentenceProgressRatio] = useState<number>(0);
  const [sentenceCounter, setSentenceCounter] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [bookPageIdx, setBookPageIdx] = useState<number>(0);
  const [boardPageIdx, setBoardPageIdx] = useState<number>(0);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(null);

  const boardScrollRef = useRef<HTMLDivElement | null>(null);
  const bookScrollRef = useRef<HTMLDivElement | null>(null);

  // Sync tab with external prop if changed
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Sync external lessonId prop with selectedLesson
  useEffect(() => {
    if (lessonId && lessonId !== 'u1-l1') {
      for (const unit of ALL_CURRICULUM_UNITS) {
        const found = unit.lessons.find(l => l.id === lessonId);
        if (found) {
          setSelectedLesson(found);
          break;
        }
      }
    } else if (lessonId === 'u1-l1') {
      setSelectedLesson(null);
    }
  }, [lessonId]);

  // Dynamic lesson resolution
  const activeLessonId = selectedLesson ? selectedLesson.id : (lessonId || 'u1-l1');
  const customPkg = getFullLessonPackage(activeLessonId);
  const isDefaultLesson = activeLessonId === 'u1-l1' || !customPkg;

  // Real board and book pages from Syrian curriculum
  const activeBoardPages: BoardFullPage[] = (customPkg && customPkg.boardPages.length > 0)
    ? customPkg.boardPages
    : BOARD_PAGES_DATA;

  const activeBookPages: BookPageData[] = (customPkg && customPkg.bookPages.length > 0)
    ? customPkg.bookPages
    : [
        { pageNum: 5, pageTitle: 'النشاط الاستكشافي: الجمع والطرح', badge: 'النشاط', objective: 'تمديد قواعد الجمع والطرح للأعداد العادية', spokenScript: PAGE_AUDIO_NARRATIONS[0]?.spokenScript || '', sections: [] },
        { pageNum: 6, pageTitle: 'القواعد والخواص وسلسلة العمليات', badge: 'الخواص', objective: 'خواص العمليات وتوحيد المقامات', spokenScript: PAGE_AUDIO_NARRATIONS[1]?.spokenScript || '', sections: [] },
        { pageNum: 7, pageTitle: 'تحقق من فهمك وتدرب والمسألة الحياتية', badge: 'التمارين', objective: 'التدريب وحل المشكلات الواقعية', spokenScript: PAGE_AUDIO_NARRATIONS[2]?.spokenScript || '', sections: [] }
      ];

  const currentBoardPage = activeBoardPages[boardPageIdx] || activeBoardPages[0];
  const currentBookPage = activeBookPages[bookPageIdx] || activeBookPages[0];

  // Reset page indices on lesson change
  useEffect(() => {
    setBoardPageIdx(0);
    setBookPageIdx(0);
    setActiveSectionIdx(0);
    speechManager.stop();
    setIsSpeaking(false);
  }, [activeLessonId]);

  useEffect(() => {
    speechManager.setOnPlaybackState((st) => {
      setIsSpeaking(st.isSpeaking);
      setIsPaused(st.isPaused);
      setCurrentSentence(st.currentSentence);
      setSentenceCounter({ current: st.currentIndex + 1, total: st.total });
      if (!st.isSpeaking) {
        setSentenceProgressRatio(0);
      }

      // Determine active section dynamically
      let targetSection = 0;
      const index = st.currentIndex;
      const sentence = st.currentSentence;
      if (isDefaultLesson && sentence) {
        if (boardPageIdx === 0) {
          if ((index >= 8 && index <= 12) || sentence.includes('مضاعف') || sentence.includes('أثمان') || sentence.includes('نصف زائد خمسة') || sentence.includes('ثمانية')) {
            targetSection = 1;
          } else if ((index >= 13 && index <= 19) || sentence.includes('مختلفة') || sentence.includes('ستة') || sentence.includes('ناقص نصف') || sentence.includes('أثلاث')) {
            targetSection = 2;
          } else if (index >= 20 || sentence.includes('خلاصة') || sentence.includes('انتهى') || sentence.includes('تعلمنا')) {
            targetSection = 3;
          }
        } else if (boardPageIdx === 1) {
          if ((index >= 7 && index <= 10) || sentence.includes('الخاصة الثانية') || sentence.includes('المقامات مختلفة') || sentence.includes('خمسة أسداس') || sentence.includes('اثنا عشر')) {
            targetSection = 1;
          } else if (index >= 11 || sentence.includes('سلسلة') || sentence.includes('العبارة A') || sentence.includes('أربعة وعشرون') || sentence.includes('سبعة على ثمانية')) {
            targetSection = 2;
          }
        } else if (boardPageIdx === 2) {
          if ((index >= 8 && index <= 14) || sentence.includes('تدرب') || sentence.includes('خمسة أثمان ناقص سدس') || sentence.includes('أربعة وعشرين') || sentence.includes('اثني عشر')) {
            targetSection = 1;
          } else if (index >= 15 || sentence.includes('زينة') || sentence.includes('عصير') || sentence.includes('تفاح') || sentence.includes('عنب') || sentence.includes('موز') || sentence.includes('خمس')) {
            targetSection = 2;
          }
        }
      }

      setActiveSectionIdx(targetSection);

      const targetEl = document.getElementById(`board-card-${targetSection}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    speechManager.setOnProgress((index, ratio) => {
      setSentenceCounter(prev => ({ ...prev, current: index + 1 }));
      setSentenceProgressRatio(ratio);
    });

    return () => {
      speechManager.stop();
    };
  }, [boardPageIdx, isDefaultLesson]);

  const switchTab = (tab: 'read' | 'board' | 'quiz') => {
    speechManager.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
    sfx.playClick();
  };

  // Speak the ENTIRE selected page on the chalkboard with pause/resume support
  const handleToggleBoardVoice = () => {
    sfx.playClick();
    if (isSpeaking) {
      if (isPaused) {
        speechManager.resume();
        setIsPaused(false);
      } else {
        speechManager.pause();
        setIsPaused(true);
      }
    } else {
      setIsSpeaking(true);
      setIsPaused(false);
      setActiveSectionIdx(0);
      speechManager.speak(currentBoardPage.fullSpokenText, 0.9, () => {
        setIsSpeaking(false);
        setIsPaused(false);
        sfx.playSuccessSound();
      });
    }
  };

  // Speak the ENTIRE page in the Book reader with pause/resume support
  const handleToggleBookVoice = () => {
    sfx.playClick();
    if (isSpeaking) {
      if (isPaused) {
        speechManager.resume();
        setIsPaused(false);
      } else {
        speechManager.pause();
        setIsPaused(true);
      }
    } else {
      setIsSpeaking(true);
      setIsPaused(false);
      const script = isDefaultLesson
        ? (PAGE_AUDIO_NARRATIONS[bookPageIdx]?.spokenScript || '')
        : (currentBookPage?.spokenScript || '');
      speechManager.speak(script, 0.9, () => {
        setIsSpeaking(false);
        setIsPaused(false);
        sfx.playSuccessSound();
      });
    }
  };

  const handleForwardVoice = () => {
    sfx.playClick();
    speechManager.forward();
  };

  const handleRewindVoice = () => {
    sfx.playClick();
    speechManager.rewind();
  };

  const handleStopVoice = () => {
    sfx.playClick();
    speechManager.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Switch Chalkboard Pages
  const selectBoardPage = (idx: number) => {
    speechManager.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setBoardPageIdx(idx);
    setActiveSectionIdx(0);
    sfx.playChalkSound();
    if (boardScrollRef.current) {
      boardScrollRef.current.scrollTop = 0;
    }
  };

  const flipNextBookPage = () => {
    speechManager.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    if (bookPageIdx < activeBookPages.length - 1) {
      setBookPageIdx(prev => prev + 1);
      sfx.playClick();
      if (bookScrollRef.current) {
        bookScrollRef.current.scrollTop = 0;
      }
    }
  };

  const flipPrevBookPage = () => {
    speechManager.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    if (bookPageIdx > 0) {
      setBookPageIdx(prev => prev - 1);
      sfx.playClick();
      if (bookScrollRef.current) {
        bookScrollRef.current.scrollTop = 0;
      }
    }
  };

  const activeTokenKey = isSpeaking
    ? getActiveTokenKey(
        activeTab === 'board' ? 'mobile-board' : 'mobile-book',
        activeTab === 'board' ? boardPageIdx : bookPageIdx,
        sentenceCounter.current - 1,
        sentenceProgressRatio
      )
    : null;

  return (
    <div className="flex flex-col items-center justify-center p-0 sm:p-2 w-full max-w-full">
      {/* Optimized responsive container: fits screen perfectly without wasting vertical space */}
      <div className="relative w-full max-w-[440px] h-[85vh] min-h-[580px] bg-slate-950 rounded-2xl sm:rounded-[36px] shadow-2xl border-2 sm:border-4 border-slate-700/80 flex flex-col overflow-hidden text-slate-100 select-none">
        
        {/* Sidebar Navigation Drawer for Mobile Simulator */}
        <SidebarDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          currentLessonId={selectedLesson ? selectedLesson.id : 'u1-l1'}
          onSelectLesson={(lesson) => {
            setSelectedLesson(lesson);
            if (lesson.id === 'u1-l1') {
              switchTab('board');
            }
          }}
          isMobileSimulator={true}
        />

        {/* COMPACT UNIFIED TOP HEADER: Contains branding, tabs, and page selectors */}
        <div className="bg-[#0f766e] text-white px-3 py-2 shadow-md flex flex-col gap-1.5 shrink-0 z-30">
          {/* Row 1: Menu Button + Title + Tabs */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sfx.playClick();
                  setIsDrawerOpen(true);
                }}
                className="p-1.5 rounded-xl bg-teal-850 hover:bg-teal-700 text-amber-300 hover:text-white transition-all shadow-sm border border-teal-500/50 flex items-center gap-1 active:scale-95 shrink-0"
                title="فتح فهرس الوحدات والدروس"
              >
                <Menu className="w-4 h-4" />
                <span className="text-[10px] font-black hidden xs:inline">الفهرس</span>
              </button>
              <div>
                <span className="text-[10px] text-amber-300 font-bold block leading-none">
                  الرياضيات | {getBookForLesson(activeLessonId).shortTitle} - الصف الثامن
                </span>
                <span className="text-xs sm:text-sm font-extrabold block leading-tight mt-0.5 truncate max-w-[150px] sm:max-w-[190px]">
                  {customPkg ? customPkg.title : (selectedLesson ? selectedLesson.title : 'الدرس 1: جمع وطرح الأعداد العادية')}
                </span>
              </div>
            </div>

            {/* Compact Main Mode Switcher */}
            <div className="flex items-center bg-teal-900/80 p-0.5 rounded-xl border border-teal-500/40 text-[11px] shrink-0">
              <button
                onClick={() => switchTab('board')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activeTab === 'board'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>السبورة</span>
              </button>
              <button
                onClick={() => switchTab('read')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activeTab === 'read'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>الكتاب</span>
              </button>
              <button
                onClick={() => switchTab('quiz')}
                className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'text-teal-200 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>الملخص</span>
              </button>
            </div>
          </div>

          {/* Row 2: Page Selection Chips with exact textbook page numbers */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {/* Page Chips */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[260px]">
              {(activeTab === 'board' ? activeBoardPages : activeBookPages).map((p, idx) => {
                const pageNum = 'bookPageNum' in p ? p.bookPageNum : p.pageNum;
                const isSelected = activeTab === 'board' ? boardPageIdx === idx : bookPageIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (activeTab === 'board') selectBoardPage(idx);
                      else {
                        speechManager.stop();
                        setIsSpeaking(false);
                        setIsPaused(false);
                        setBookPageIdx(idx);
                        sfx.playPageFlipSound();
                        if (bookScrollRef.current) {
                          bookScrollRef.current.scrollTop = 0;
                        }
                      }
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-white text-teal-900 font-black shadow ring-1 ring-white'
                        : 'bg-teal-800/80 text-teal-200 hover:bg-teal-700'
                    }`}
                  >
                    ص {pageNum}
                  </button>
                );
              })}
            </div>

            {/* UNIFIED AUDIO CONTROLS SUITE: تأخير، قراءة الدرس، توقف مؤقت، متابعة القراءة، تقديم، إيقاف */}
            <div className="flex items-center gap-1 shrink-0">
              {/* 1. زر تأخير (Rewind ⏪) */}
              <button
                onClick={handleRewindVoice}
                disabled={!isSpeaking || sentenceCounter.current <= 1}
                className="px-2 py-1 rounded-lg bg-teal-950/80 border border-teal-700/60 disabled:opacity-30 disabled:cursor-not-allowed text-amber-300 hover:bg-teal-900 transition-all active:scale-95 shadow-sm flex items-center gap-0.5 text-[10px] font-bold"
                title="تأخير (الجملة السابقة) ⏪"
              >
                <Rewind className="w-3 h-3" />
                <span>تأخير</span>
              </button>

              {/* 2. زر قراءة الدرس / توقف مؤقت / متابعة القراءة (Play / Pause / Resume) */}
              <button
                onClick={activeTab === 'board' ? handleToggleBoardVoice : handleToggleBookVoice}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all shadow-md active:scale-95 shrink-0 ${
                  !isSpeaking
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-amber-300/60'
                    : isPaused
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-300'
                      : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-300'
                }`}
                title={!isSpeaking ? 'قراءة الدرس' : isPaused ? 'متابعة القراءة' : 'توقف مؤقت'}
              >
                {!isSpeaking ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
                    <span>قراءة الدرس</span>
                  </>
                ) : isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>متابعة القراءة ▶️</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>توقف مؤقت ⏸️</span>
                  </>
                )}
              </button>

              {/* 3. زر تقديم (Forward ⏩) */}
              <button
                onClick={handleForwardVoice}
                disabled={!isSpeaking || (sentenceCounter.total > 0 && sentenceCounter.current >= sentenceCounter.total)}
                className="px-2 py-1 rounded-lg bg-teal-950/80 border border-teal-700/60 disabled:opacity-30 disabled:cursor-not-allowed text-amber-300 hover:bg-teal-900 transition-all active:scale-95 shadow-sm flex items-center gap-0.5 text-[10px] font-bold"
                title="تقديم (الجملة التالية) ⏩"
              >
                <span>تقديم</span>
                <FastForward className="w-3 h-3" />
              </button>

              {/* 4. زر إيقاف كامل (Stop ⏹️) */}
              {isSpeaking && (
                <button
                  onClick={handleStopVoice}
                  className="px-1.5 py-1 rounded-lg bg-rose-950/90 border border-rose-800 text-rose-300 hover:bg-rose-900 transition-all active:scale-95 shadow-sm flex items-center gap-0.5 text-[10px] font-bold"
                  title="إيقاف كامل ⏹️"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Audio Subtitle Marquee Bar with Mini Controls */}
        {isSpeaking && currentSentence && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-3 py-1.5 text-[11px] text-amber-200 flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-xs">🎙️</span>
              <span className="font-bold text-amber-300 whitespace-nowrap">
                {isPaused ? '⏸️ متوقف مؤقتاً' : '🔊 يُشرح الآن'} ({sentenceCounter.current}/{sentenceCounter.total}):
              </span>
              <span className="truncate font-sans font-medium text-amber-100">{currentSentence}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleRewindVoice}
                disabled={sentenceCounter.current <= 1}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-amber-300 text-[10px] font-bold"
                title="ترجيع ⏪"
              >
                ⏪
              </button>
              <button
                onClick={activeTab === 'board' ? handleToggleBoardVoice : handleToggleBookVoice}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 text-[10px] font-bold"
                title={isPaused ? "متابعة ▶️" : "توقف مؤقت ⏸️"}
              >
                {isPaused ? '▶️' : '⏸️'}
              </button>
              <button
                onClick={handleForwardVoice}
                disabled={sentenceCounter.total > 0 && sentenceCounter.current >= sentenceCounter.total}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-amber-300 text-[10px] font-bold"
                title="تقديم ⏩"
              >
                ⏩
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY AREA: Now takes 85% of full height! Spacious and readable */}
        {/* MAIN BODY AREA: Now takes 85% of full height! Spacious and readable */}
        <div className="flex-1 overflow-hidden flex flex-col p-2 bg-[#142620]">
          {activeTab === 'quiz' ? (
            /* ========================================================================= */
            /* CURRICULUM LESSON SUMMARY / ملخص وقواعد الدرس                             */
            /* ========================================================================= */
            <div className="flex-1 bg-[#142620] border-4 border-[#52331d] rounded-2xl p-3 shadow-inner overflow-y-auto space-y-3 font-sans text-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                <span className="text-amber-300 font-extrabold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{selectedLesson ? selectedLesson.title : (customPkg ? customPkg.title : 'الدرس 1: جمع وطرح الأعداد العادية')}</span>
                </span>
                <span className="text-emerald-300 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700 font-bold">
                  {selectedLesson ? selectedLesson.pages : (customPkg ? customPkg.pages : 'ص 5 - 7')}
                </span>
              </div>

              {/* Summary */}
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-slate-200 text-[11px] leading-relaxed">
                <span className="font-bold text-amber-300 block mb-1">💡 ملخص الدرس والأهداف:</span>
                {selectedLesson ? selectedLesson.summary : 'تعلّم تمديد قواعد جمع وطرح الكسور العادية للأعداد ذات الإشارة وحساب سلسلة عمليات.'}
              </div>

              {/* Core Rule in Blackboard Theme with Proper Stacking Fractions */}
              <div className="p-2.5 rounded-xl bg-[#0d1a15] border border-emerald-700 space-y-2">
                <span className="font-bold text-amber-300 block text-[11px]">📌 القاعدة الرياضية:</span>
                <div className="text-emerald-100 text-[11px] leading-relaxed">
                  <FormattedMathText text={selectedLesson ? selectedLesson.keyRule : 'نوحد المقامات بالمضاعف المشترك الأصغر ثم نجمع أو نطرح البسوط.'} size="sm" />
                </div>
                <div dir="ltr" className="py-1 text-center font-bold text-xs sm:text-sm">
                  <GranularMathEquation
                    equation={selectedLesson ? selectedLesson.ruleEquation : 'a/b + c/b = (a + c) / b'}
                    theme="chalkboard"
                    size="sm"
                  />
                </div>
              </div>

              {/* Example with Stacked Fractions */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                <span className="font-bold text-teal-300 block">📝 مثال تطبيقي محلول:</span>
                <div className="text-slate-300 font-mono">
                  <FormattedMathText text={selectedLesson ? selectedLesson.exampleProblem : 'احسب: (-9/7) + (5/7)'} size="sm" />
                </div>
                <div className="text-emerald-300 font-bold bg-emerald-950/50 p-1.5 rounded border border-emerald-900">
                  <span className="ml-1">الحل:</span>
                  <FormattedMathText text={selectedLesson ? selectedLesson.exampleSolution : '(-9 + 5)/7 = -4/7'} size="sm" />
                </div>
              </div>

              {/* Audio explanation controls */}
              <div className="flex items-center gap-1.5 pt-1">
                {isSpeaking && (
                  <button
                    onClick={handleRewindVoice}
                    disabled={sentenceCounter.current <= 1}
                    className="p-2 rounded-xl bg-teal-950/90 border border-teal-700/60 disabled:opacity-30 text-amber-300 font-bold active:scale-95 transition-all shadow"
                    title="ترجيع ⏪"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    sfx.playClick();
                    if (!isSpeaking) {
                      setIsSpeaking(true);
                      setIsPaused(false);
                      const txt = selectedLesson 
                        ? `${selectedLesson.title}. ${selectedLesson.summary}. ${selectedLesson.keyRule}`
                        : 'الدرس الأول: جمع وطرح الأعداد العادية. نوحد المقامات ثم نجمع أو نطرح البسوط.';
                      speechManager.speak(txt, 0.9, () => {
                        setIsSpeaking(false);
                        setIsPaused(false);
                      });
                    } else if (isPaused) {
                      speechManager.resume();
                      setIsPaused(false);
                    } else {
                      speechManager.pause();
                      setIsPaused(true);
                    }
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 ${
                    !isSpeaking 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                      : isPaused
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                        : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-300'
                  }`}
                >
                  {!isSpeaking ? (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>استمع لشرح هذا الدرس 🎙️</span>
                    </>
                  ) : isPaused ? (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>متابعة الشرح ▶️</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>توقف مؤقت ⏸️</span>
                    </>
                  )}
                </button>

                {isSpeaking && (
                  <>
                    <button
                      onClick={handleForwardVoice}
                      disabled={sentenceCounter.total > 0 && sentenceCounter.current >= sentenceCounter.total}
                      className="p-2 rounded-xl bg-teal-950/90 border border-teal-700/60 disabled:opacity-30 text-amber-300 font-bold active:scale-95 transition-all shadow"
                      title="تقديم ⏩"
                    >
                      <FastForward className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleStopVoice}
                      className="p-2 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-300 font-bold active:scale-95 transition-all shadow"
                      title="إيقاف ⏹️"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : activeTab === 'board' ? (
            /* ========================================================================= */
            /* CHALKBOARD WITH STRUCTURED SECTIONS THAT HIGHLIGHT & AUTO-SCROLL          */
            /* ========================================================================= */
            <div 
              ref={boardScrollRef}
              className="flex-1 bg-[#142620] border-4 border-[#52331d] rounded-2xl p-2.5 sm:p-3 shadow-inner overflow-y-auto space-y-3 font-mono text-xs"
            >
              {/* Chalkboard Header with exact textbook page number */}
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-1.5 text-xs">
                <span className="text-amber-300 font-extrabold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{currentBoardPage.title}</span>
                </span>
                <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 font-bold">
                  صفحة {currentBoardPage.bookPageNum} من الكتاب
                </span>
              </div>

              {!isDefaultLesson ? (
                /* Dynamic chalkboard lines for other lessons with stacked textbook fractions */
                <div className="space-y-2.5">
                  <GeometryDiagram
                    lessonId={activeLessonId}
                    sectionTitle={currentBoardPage.title}
                    theme="chalkboard"
                  />
                  {currentBoardPage.boardLines.map((line, lIdx) => {
                    const lineContent = line.text || line.equation || '';
                    if (line.type === 'divider') {
                      return <div key={lIdx} className="h-0.5 bg-emerald-800/60 my-1 rounded-full" />;
                    }
                    if (line.type === 'header' || line.type === 'title') {
                      return (
                        <div key={lIdx} className="font-bold text-amber-300 text-xs border-b border-emerald-800 pb-1">
                          {lineContent}
                        </div>
                      );
                    }
                    if (line.type === 'rule' || line.type === 'example') {
                      return (
                        <div key={lIdx} className="text-emerald-200 text-[11px] font-sans p-2 rounded-xl bg-[#0d1a15] border border-emerald-900/60 leading-relaxed">
                          {lineContent}
                        </div>
                      );
                    }
                    if (line.type === 'result' || line.equation) {
                      return (
                        <div key={lIdx} dir="ltr" className="py-1 text-center font-bold text-xs sm:text-sm">
                          {line.label && <div className="text-[10px] text-emerald-400 mb-0.5 font-sans">{line.label}:</div>}
                          <GranularMathEquation
                            equation={line.equation || lineContent}
                            theme="chalkboard"
                            size="sm"
                          />
                        </div>
                      );
                    }
                    if (line.type === 'note') {
                      return (
                        <div key={lIdx} className="p-2 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-200 text-[11px] font-sans">
                          {lineContent}
                        </div>
                      );
                    }
                    return (
                      <div key={lIdx} className="text-slate-200 text-[11px] font-mono">
                        {lineContent}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* -------------------- DEFAULT LESSON (LESSON 1: PAGES 5, 6, 7) -------------------- */}
              {isDefaultLesson && boardPageIdx === 0 && (
                <>
                  {/* Section 1: المقامات متساوية */}
                  {(() => {
                    const active = isSpeaking && activeSectionIdx === 0;
                    return (
                      <div 
                        id="board-card-0"
                        className="p-2.5 rounded-xl border border-emerald-900/50 bg-[#0d1a15] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-amber-200 font-black' : 'text-amber-300'}`}>
                            1️⃣ الحالة الأولى: المقامات متساوية
                          </span>
                        </div>
                        <div className="text-[11px] mb-1.5 text-slate-300">
                          نحتفظ بالمقام المشترك (7) ونجمع البسطين جبرياً:
                        </div>
                        <div dir="ltr" className="py-1 text-center font-bold text-xs sm:text-sm">
                          <GranularMathEquation
                            equation="(-9 / 7) + (5 / 7) = (-9 + 5) / 7 = -4 / 7"
                            equationKey="mob-b-p0-s0"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isSpeaking}
                            theme="chalkboard"
                            size="sm"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 2: أحد المقامين مضاعف للآخر */}
                  {(() => {
                    const active = isSpeaking && activeSectionIdx === 1;
                    return (
                      <div 
                        id="board-card-1"
                        className="p-2.5 rounded-xl border border-emerald-900/50 bg-[#0d1a15] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-amber-200 font-black' : 'text-amber-300'}`}>
                            2️⃣ الحالة الثانية: أحد المقامين مضاعف للآخر
                          </span>
                        </div>
                        <div className="text-[11px] mb-1.5 text-slate-300 flex flex-wrap items-center gap-1.5">
                          <span>المقام 8 مضاعف لـ 2، نوحد بضرب النصف في 4:</span>
                          <GranularMathEquation equation="(1 × 4)/(2 × 4) = 4/8" theme="chalkboard" size="sm" />
                        </div>
                        <div dir="ltr" className="py-1 text-center font-bold text-xs sm:text-sm">
                          <GranularMathEquation
                            equation="1/2 + 5/8 = 4/8 + 5/8 = (4 + 5) / 8 = 9/8"
                            equationKey="mob-b-p0-s1"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isSpeaking}
                            theme="chalkboard"
                            size="sm"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 3: المقامات مختلفة تماماً */}
                  {(() => {
                    const active = isSpeaking && activeSectionIdx === 2;
                    return (
                      <div 
                        id="board-card-2"
                        className="p-2.5 rounded-xl border border-emerald-900/50 bg-[#0d1a15] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-amber-200 font-black' : 'text-amber-300'}`}>
                            3️⃣ الحالة الثالثة: كيفما كانت المقامات (مختلفة)
                          </span>
                        </div>
                        <div className="text-[11px] mb-1.5 text-slate-300 flex flex-wrap items-center gap-1.5">
                          <span>أصغر مضاعف مشترك لـ 2 و 3 هو 6:</span>
                          <GranularMathEquation equation="(-1 × 3)/6 = -3/6" theme="chalkboard" size="sm" />
                          <span>و</span>
                          <GranularMathEquation equation="(5 × 2)/6 = 10/6" theme="chalkboard" size="sm" />
                        </div>
                        <div dir="ltr" className="py-1 text-center font-bold text-xs sm:text-sm">
                          <GranularMathEquation
                            equation="-1/2 + 5/3 = -3/6 + 10/6 = (-3 + 10) / 6 = 7/6"
                            equationKey="mob-b-p0-s2"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isSpeaking}
                            theme="chalkboard"
                            size="sm"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 4: خلاصة الصفحة 5 */}
                  <div id="board-card-3" className="p-2.5 bg-amber-950/40 border border-amber-600/30 rounded-xl text-amber-200 text-[11px] font-sans">
                    💡 <span className="font-bold">خلاصة ص 5:</span> دائماً نوحد الكسور إلى مقام مشترك لنجمع أو نطرح البسوط مباشرة.
                  </div>
                </>
              )}

              {/* -------------------- PAGE 6 SECTIONS -------------------- */}
              {isDefaultLesson && boardPageIdx === 1 && (
                <>
                  {/* Section 1: خاصة 1 المقامات متساوية */}
                  {(() => {
                    const active = isSpeaking && activeSectionIdx === 0;
                    return (
                      <div 
                        id="board-card-0"
                        className="p-2.5 rounded-xl border border-emerald-900/50 bg-[#0d1a15] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-amber-200 font-black' : 'text-amber-300'}`}>
                            📌 [خاصّة 1] المقامات متساوية
                          </span>
                        </div>
                        <div 
                          dir="ltr"
                          className="text-emerald-300 text-[11px] font-mono text-center mb-1.5"
                        >
                          <GranularMathEquation
                            equation="a/b + c/b = (a + c) / b | a/b - c/b = (a - c) / b"
                            equationKey="mob-b-p1-rule1"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isSpeaking}
                            theme="chalkboard"
                            size="sm"
                          />
                        </div>
                        <div 
                          dir="ltr"
                          className="p-1 font-bold text-xs space-y-1 text-center"
                        >
                          <div>
                            <GranularMathEquation
                              equation="(-7)/3 + 0.5/3 = (-7 + 0.5) / 3 = -6.5 / 3"
                              equationKey="mob-b-p1-ex1"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                            &nbsp;✅
                          </div>
                          <div>
                            <GranularMathEquation
                              equation="1/5 - 3/5 = (1 - 3) / 5 = -2/5"
                              equationKey="mob-b-p1-ex2"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                            &nbsp;✅
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 2: خاصة 2 المقامات مختلفة */}
                  {(() => {
                    const active = isSpeaking && activeSectionIdx === 1;
                    return (
                      <div 
                        id="board-card-1"
                        className="p-2.5 rounded-xl border border-emerald-900/50 bg-[#0d1a15] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-amber-200 font-black' : 'text-amber-300'}`}>
                            📌 [خاصّة 2] المقامات مختلفة وتوحيد المقامات
                          </span>
                        </div>
                        <div className="text-[11px] mb-1.5 text-slate-300">
                          احسب 5/6 + 3/4 (المقام المشترك الأصغر للعددين 6 و 4 هو 12):
                        </div>
                        <div 
                          dir="ltr"
                          className="py-1 font-bold text-xs sm:text-sm text-center"
                        >
                          <GranularMathEquation
                            equation="5/6 = 10/12 | 3/4 = 9/12 ➔ 10/12 + 9/12 = 19/12"
                            equationKey="mob-b-p1-rule2"
                            activeTokenKey={activeTokenKey}
                            currentSentence={currentSentence}
                            isSpeaking={isSpeaking}
                            theme="chalkboard"
                            size="sm"
                          />
                          &nbsp;✅
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 3: سلسلة العمليات A */}
                  {(() => {
                    const active = isSpeaking && activeSectionIdx === 2;
                    return (
                      <div 
                        id="board-card-2"
                        className="p-2.5 rounded-xl border border-emerald-900/50 bg-[#0d1a15] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-amber-200 font-black' : 'text-amber-300'}`}>
                            📌 [اكتساب معارف] إنجاز سلسلة العمليات A
                          </span>
                        </div>
                        <div className="text-[11px] mb-1.5 text-slate-300">
                          A = 5/3 - 7/6 + 3/8 (المضاعف المشترك للأعداد 3 و 6 و 8 هو 24):
                        </div>
                        <div 
                          dir="ltr"
                          className="py-1 font-bold text-xs space-y-1 text-center"
                        >
                          <div>
                            <GranularMathEquation
                              equation="A = 40/24 - 28/24 + 9/24 = 21/24"
                              equationKey="mob-b-p1-calcA-1"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                          </div>
                          <div>
                            نختصر ÷ 3: &nbsp;
                            <GranularMathEquation
                              equation="A = (21 ÷ 3) / (24 ÷ 3) = 7/8"
                              equationKey="mob-b-p1-calcA-2"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                            &nbsp;✅
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* -------------------- PAGE 7 SECTIONS -------------------- */}
              {isDefaultLesson && boardPageIdx === 2 && (
                <>
                  {/* Section 1: تحقق من فهمك */}
                  {(() => {
                    const active = isSpeaking && activeSectionIdx === 0;
                    return (
                      <div 
                        id="board-card-0"
                        className="p-2.5 rounded-xl border border-emerald-900/50 bg-[#0d1a15] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-amber-200 font-black' : 'text-amber-300'}`}>
                            1️⃣ تحقق من فهمك (صفحة 7)
                          </span>
                        </div>
                        <div 
                          dir="ltr"
                          className="py-1 font-bold text-xs space-y-1 text-center"
                        >
                          <div>
                            <GranularMathEquation
                              equation="5/9 + 1/3 = 5/9 + 3/9 = 8/9"
                              equationKey="mob-b-p2-check1"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                            &nbsp;✅
                          </div>
                          <div>
                            <GranularMathEquation
                              equation="(-7/5) + (-3/5) = -10/5 = -2"
                              equationKey="mob-b-p2-check2"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                            &nbsp;✅
                          </div>
                          <div>
                            <GranularMathEquation
                              equation="4/7 - 0.1/7 = 3.9/7"
                              equationKey="mob-b-p2-check3"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                            &nbsp;✅
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 2: تدرب */}
                  {(() => {
                    const active = isSpeaking && activeSectionIdx === 1;
                    return (
                      <div 
                        id="board-card-1"
                        className="p-2.5 rounded-xl border border-emerald-900/50 bg-[#0d1a15] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-amber-200 font-black' : 'text-amber-300'}`}>
                            2️⃣ تدرب (توحيد المقامات في الطرح)
                          </span>
                        </div>
                        <div 
                          dir="ltr"
                          className="py-1 font-bold text-xs space-y-1 text-center"
                        >
                          <div>
                            <GranularMathEquation
                              equation="5/8 - 1/6 = 15/24 - 4/24 = 11/24"
                              equationKey="mob-b-p2-prac1"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                            &nbsp;✅
                          </div>
                          <div>
                            <GranularMathEquation
                              equation="5/3 - 7/4 = 20/12 - 21/12 = -1/12"
                              equationKey="mob-b-p2-prac2"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                            &nbsp;✅
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section 3: مسألة عصير زينة */}
                  {(() => {
                    const active = isSpeaking && activeSectionIdx === 2;
                    return (
                      <div 
                        id="board-card-2"
                        className="p-2.5 rounded-xl border border-emerald-900/50 bg-[#0d1a15] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-amber-200 font-black' : 'text-amber-300'}`}>
                            🥤 3️⃣ مسألة عصير زينة (تطبيق حياتي)
                          </span>
                        </div>
                        <div className="text-[11px] mb-1.5 font-sans text-slate-300">
                          خلطت 3/5 L تفاح مع 6/5 L عنب لملء وعاء 2 L. كم ليتراً موز يلزمها؟
                        </div>
                        <div 
                          dir="ltr"
                          className="py-1 font-bold text-xs space-y-1 text-center"
                        >
                          <div>
                            <GranularMathEquation
                              equation="3/5 + 6/5 = 9/5 L"
                              equationKey="mob-b-p2-juice1"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                          </div>
                          <div>
                            <GranularMathEquation
                              equation="2 L = 10/5 L"
                              equationKey="mob-b-p2-juice2"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                          </div>
                          <div>
                            <span className="font-sans text-[11px] text-amber-200 ml-1">عصير الموز = </span>
                            <GranularMathEquation
                              equation="10/5 - 9/5 = 1/5 ليتر"
                              equationKey="mob-b-p2-juice3"
                              activeTokenKey={activeTokenKey}
                              currentSentence={currentSentence}
                              isSpeaking={isSpeaking}
                              theme="chalkboard"
                              size="sm"
                            />
                            &nbsp;🍌 ✅
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Bottom Chalkboard Shelf Marker */}
              <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-emerald-400/80">
                <span>سبورة ذكية تفاعلية متزامنة مع الصوت</span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-1.5 bg-slate-200 rounded-sm inline-block" />
                  <span className="w-4 h-1.5 bg-yellow-300 rounded-sm inline-block" />
                </span>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* TEXTBOOK READING VIEW WITH FULL PAGE & HORIZONTAL FLIP                   */
            /* ========================================================================= */
            <div 
              ref={bookScrollRef}
              className="flex-1 bg-[#fffdfa] dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl p-3 shadow-inner border border-slate-300 dark:border-slate-700 overflow-y-auto space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="font-bold text-teal-800 dark:text-teal-300 text-xs">
                  كتاب {getBookForLesson(activeLessonId).shortTitle} - صفحة {currentBookPage?.pageNum || (5 + bookPageIdx)} من الكتاب
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={flipPrevBookPage}
                    disabled={bookPageIdx === 0}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-700 disabled:opacity-30 text-xs"
                  >
                    السابقة
                  </button>
                  <button
                    onClick={flipNextBookPage}
                    disabled={bookPageIdx >= activeBookPages.length - 1}
                    className="p-1 rounded bg-teal-600 disabled:opacity-30 text-white text-xs font-bold"
                  >
                    التالية
                  </button>
                </div>
              </div>

              {/* Page Content */}
              {!isDefaultLesson && currentBookPage ? (
                <div className="space-y-2.5 animate-in fade-in">
                  <div className="font-bold text-teal-900 dark:text-teal-300 text-sm">
                    {currentBookPage.pageTitle} (صفحة {currentBookPage.pageNum})
                  </div>
                  {currentBookPage.objective && (
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[10px] text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                      💡 {currentBookPage.objective}
                    </div>
                  )}
                  {currentBookPage.sections.map((sec, sIdx) => (
                    <div key={sec.id || sIdx} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-800 dark:text-teal-300 text-xs">{sec.title}</span>
                        <span className="text-[10px] text-slate-500">{sec.badge}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        <FormattedMathText text={sec.ruleText} size="sm" />
                      </div>
                      <div dir="ltr" className="py-1 text-center font-bold text-xs">
                        <GranularMathEquation
                          equation={sec.mathEquation}
                          theme="paper"
                          size="sm"
                        />
                      </div>
                      <GeometryDiagram
                        lessonId={activeLessonId}
                        sectionTitle={sec.title}
                        sectionText={`${sec.ruleText} ${sec.mathEquation || ''} ${sec.exampleProblem}`}
                        theme="paper"
                      />
                      <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-[10px] space-y-0.5">
                        <div className="text-slate-600 dark:text-slate-300 font-bold">
                          <span className="ml-1">مثال:</span>
                          <FormattedMathText text={sec.exampleProblem} size="sm" />
                        </div>
                        <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                          <span className="ml-1">الحل:</span>
                          <FormattedMathText text={sec.exampleSolution} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {isDefaultLesson && bookPageIdx === 0 && (
                <div className="space-y-2.5 animate-in fade-in">
                  <div className="font-bold text-teal-900 dark:text-teal-300">النشاط الاستكشافي: جمع وطرح الكسور</div>
                  
                  {/* Case 1 */}
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold transition-colors ${isSpeaking && activeSectionIdx === 0 ? 'text-amber-700 dark:text-amber-300 font-black' : 'text-teal-700 dark:text-teal-400'}`}>
                        1. المقامات متساوية:
                      </span>
                    </div>
                    <div dir="ltr" className="py-1 text-center font-bold text-xs">
                      <GranularMathEquation
                        equation="(-9/7) + (5/7) = (-9 + 5)/7 = -4/7"
                        equationKey="read-p0-eq-c1"
                        activeTokenKey={activeTokenKey}
                        currentSentence={currentSentence}
                        isSpeaking={isSpeaking}
                        theme="paper"
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Case 2 */}
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold transition-colors ${isSpeaking && activeSectionIdx === 1 ? 'text-amber-700 dark:text-amber-300 font-black' : 'text-amber-700 dark:text-amber-400'}`}>
                        2. أحدهما مضاعف للآخر:
                      </span>
                    </div>
                    <div dir="ltr" className="py-1 text-center font-bold text-xs">
                      <GranularMathEquation
                        equation="1/2 + 5/8 = 4/8 + 5/8 = 9/8"
                        equationKey="read-p0-eq-c2"
                        activeTokenKey={activeTokenKey}
                        currentSentence={currentSentence}
                        isSpeaking={isSpeaking}
                        theme="paper"
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Case 3 */}
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold transition-colors ${isSpeaking && activeSectionIdx === 2 ? 'text-amber-700 dark:text-amber-300 font-black' : 'text-indigo-700 dark:text-indigo-400'}`}>
                        3. المقامات مختلفة تماماً:
                      </span>
                    </div>
                    <div dir="ltr" className="py-1 text-center font-bold text-xs">
                      <GranularMathEquation
                        equation="-1/2 + 5/3 = -3/6 + 10/6 = 7/6"
                        equationKey="read-p0-eq-c3"
                        activeTokenKey={activeTokenKey}
                        currentSentence={currentSentence}
                        isSpeaking={isSpeaking}
                        theme="paper"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isDefaultLesson && bookPageIdx === 1 && (
                <div className="space-y-2.5 animate-in fade-in">
                  <div className="font-bold text-teal-900 dark:text-teal-300">الخواص وسلسلة العمليات (صفحة 6)</div>
                  
                  {/* Rule 1 */}
                  <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold transition-colors ${isSpeaking && activeSectionIdx === 0 ? 'text-amber-800 dark:text-amber-300 font-black' : 'text-emerald-800 dark:text-emerald-300'}`}>
                        خاصة 1 (المقامات متساوية):
                      </span>
                    </div>
                    <div dir="ltr" className="py-1 text-center font-bold text-xs">
                      <GranularMathEquation
                        equation="(-7)/3 + 0.5/3 = -6.5/3 | 1/5 - 3/5 = -2/5"
                        equationKey="read-p1-rule1-ex1"
                        activeTokenKey={activeTokenKey}
                        currentSentence={currentSentence}
                        isSpeaking={isSpeaking}
                        theme="paper"
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Rule 2 */}
                  <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold transition-colors ${isSpeaking && activeSectionIdx === 1 ? 'text-amber-800 dark:text-amber-300 font-black' : 'text-indigo-800 dark:text-indigo-300'}`}>
                        خاصة 2 (توحيد المقامات):
                      </span>
                    </div>
                    <div dir="ltr" className="py-1 text-center font-bold text-xs">
                      <GranularMathEquation
                        equation="5/6 + 3/4 = 10/12 + 9/12 = 19/12"
                        equationKey="read-p1-rule2-ex"
                        activeTokenKey={activeTokenKey}
                        currentSentence={currentSentence}
                        isSpeaking={isSpeaking}
                        theme="paper"
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Series A */}
                  <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 transition-all duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold transition-colors ${isSpeaking && activeSectionIdx === 2 ? 'text-amber-800 dark:text-amber-300 font-black' : 'text-purple-800 dark:text-purple-300'}`}>
                        سلسلة العمليات A:
                      </span>
                    </div>
                    <div dir="ltr" className="py-1 text-center font-bold text-xs">
                      <GranularMathEquation
                        equation="A = 5/3 - 7/6 + 3/8 = 21/24 = 7/8"
                        equationKey="read-p1-calcA-step1"
                        activeTokenKey={activeTokenKey}
                        currentSentence={currentSentence}
                        isSpeaking={isSpeaking}
                        theme="paper"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isDefaultLesson && bookPageIdx === 2 && (
                <div className="space-y-2.5 animate-in fade-in">
                  <div className="font-bold text-teal-900 dark:text-teal-300">تمارين ومسألة عصير زينة (صفحة 7)</div>
                  
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-all duration-200">
                    <div className="text-[11px] font-bold mb-1">تحقق من فهمك وتدرب:</div>
                    <div dir="ltr" className="py-1 text-center font-bold text-xs space-y-1">
                      <div>
                        <GranularMathEquation
                          equation="5/9 + 1/3 = 8/9 | (-7/5) + (-3/5) = -2"
                          equationKey="read-p2-check-eq1"
                          activeTokenKey={activeTokenKey}
                          currentSentence={currentSentence}
                          isSpeaking={isSpeaking}
                          theme="paper"
                          size="sm"
                        />
                      </div>
                      <div>
                        <GranularMathEquation
                          equation="5/8 - 1/6 = 11/24 | 5/3 - 7/4 = -1/12"
                          equationKey="read-p2-prac-eq1"
                          activeTokenKey={activeTokenKey}
                          currentSentence={currentSentence}
                          isSpeaking={isSpeaking}
                          theme="paper"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 transition-all duration-200">
                    <div className="font-bold text-amber-900 dark:text-amber-300 text-[11px]">🥤 مسألة عصير زينة:</div>
                    <div dir="ltr" className="py-1 text-center font-bold text-xs">
                      <GranularMathEquation
                        equation="2 - (3/5 + 6/5) = 10/5 - 9/5 = 1/5 L"
                        equationKey="read-p2-juice-eq3"
                        activeTokenKey={activeTokenKey}
                        currentSentence={currentSentence}
                        isSpeaking={isSpeaking}
                        theme="paper"
                        size="sm"
                      />
                      &nbsp;🍌
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Page Numbers Navigation Bar */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>أرقام صفحات الدرس:</span>
                  </span>
                  <span>
                    صفحة {currentBookPage?.pageNum || (5 + bookPageIdx)} من {activeBookPages.length}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {activeBookPages.map((p, idx) => {
                    const isActive = idx === bookPageIdx;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (idx !== bookPageIdx) {
                            speechManager.stop();
                            setIsSpeaking(false);
                            setBookPageIdx(idx);
                            sfx.playClick();
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 shadow-sm ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300 scale-105'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        <span>صفحة {p.pageNum || (5 + idx)}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick shortcuts under simulator */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        {onOpenSummary && (
          <button
            onClick={() => { sfx.playClick(); onOpenSummary(); }}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>فتح ملخص وقواعد الدرس الكاملة 💡</span>
          </button>
        )}
        {onOpenFlutterCode && (
          <button
            onClick={() => { sfx.playClick(); onOpenFlutterCode(); }}
            className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <span>عرض كود Flutter للواجهة بالكامل 💻</span>
          </button>
        )}
      </div>
    </div>
  );
};
