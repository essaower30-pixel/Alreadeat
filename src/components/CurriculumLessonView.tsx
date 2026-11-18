import React, { useState, useEffect, useMemo } from 'react';
import { 
  Volume2, Pause, Play, FastForward, Rewind, Square, Sparkles, ArrowRight, CheckCircle2, 
  HelpCircle, ChevronLeft, Award, XCircle, Lightbulb, Film
} from 'lucide-react';
import { CurriculumLesson, getBookForLesson } from '../data/curriculumUnits';
import { buildCurriculumSummaryNarrationTimeline, CurriculumSummarySlot } from '../data/curriculumLessonsData';
import { getQuickCheckForLesson, verifyQuickCheckAnswer } from '../data/quickCheckQuestions';
import { GranularMathEquation, getEquationPartTokenIndices } from './GranularMathEquation';
import { FormattedMathText } from './FormattedMathText';
import { TeacherAudioControls } from './TeacherAudioControls';
import { GeometryDiagram } from './GeometryDiagram';
import { ExampleVisualBoard } from './ExampleVisualBoard';
import { speechManager } from '../utils/speechService';
import { sfx } from '../utils/soundEffects';

interface CurriculumLessonViewProps {
  lesson: CurriculumLesson;
  onReturnToLesson1: () => void;
  onOpenChalkboard?: () => void;
  onOpenVideo?: () => void;
}

export const CurriculumLessonView: React.FC<CurriculumLessonViewProps> = ({
  lesson,
  onReturnToLesson1,
  onOpenChalkboard,
  onOpenVideo
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [sentenceProgressRatio, setSentenceProgressRatio] = useState<number>(0);
  const [sentenceCounter, setSentenceCounter] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [userPracticeAnswer, setUserPracticeAnswer] = useState<string>('');
  const [practiceFeedback, setPracticeFeedback] = useState<'correct' | 'incorrect' | 'empty' | null>(null);
  const [showPracticeHint, setShowPracticeHint] = useState<boolean>(false);

  const quickCheck = getQuickCheckForLesson(lesson.id);

  useEffect(() => {
    speechManager.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setUserPracticeAnswer('');
    setPracticeFeedback(null);
    setShowPracticeHint(false);
  }, [lesson.id]);

  useEffect(() => {
    speechManager.setOnPlaybackState((st) => {
      setIsSpeaking(st.isSpeaking);
      setIsPaused(st.isPaused);
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

  const summaryTimeline = useMemo(
    () => buildCurriculumSummaryNarrationTimeline(lesson),
    [lesson]
  );

  const activeSlot: CurriculumSummarySlot | null =
    isSpeaking && sentenceCounter.current > 0
      ? summaryTimeline.slots[sentenceCounter.current - 1] || null
      : null;

  const activeListenSection: 'overview' | 'rule' | 'example' | null = (() => {
    if (!activeSlot) return null;
    if (activeSlot.part === 'overview') return 'overview';
    if (activeSlot.part === 'ruleText' || activeSlot.part === 'ruleEquation') return 'rule';
    return 'example';
  })();

  const activeRuleTokenKey: string | null = (() => {
    if (!isSpeaking || !activeSlot || activeSlot.part !== 'ruleEquation' || !lesson.ruleEquation) {
      return null;
    }
    const eqParts = getEquationPartTokenIndices(lesson.ruleEquation);
    const partIdx = Math.min(eqParts.length - 1, activeSlot.mathPartIdx ?? 0);
    const partTokens = eqParts[partIdx] || [];
    if (partTokens.length === 0) return null;
    const pos = Math.min(
      partTokens.length - 1,
      Math.floor(Math.max(0, Math.min(0.99, sentenceProgressRatio)) * partTokens.length)
    );
    return `curr-rule-${lesson.id}-${partTokens[pos]}`;
  })();

  const renderSpokenWords = (
    text: string,
    isActive: boolean,
    wordStart?: number,
    wordEnd?: number
  ) => {
    if (!isActive || !text) {
      return <FormattedMathText text={text} size="md" />;
    }
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return <FormattedMathText text={text} size="md" />;

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
                  ? 'bg-amber-400 text-slate-950 font-black px-1 py-0.5 rounded shadow-sm transition-colors duration-150 inline-block'
                  : 'transition-colors duration-150'
              }
            >
              {word.includes('/') ? <FormattedMathText text={word} size="md" /> : word}
            </span>
            {wIdx < words.length - 1 ? ' ' : ''}
          </React.Fragment>
        ))}
      </span>
    );
  };

  useEffect(() => {
    if (!isSpeaking || !activeListenSection) return;
    const el = document.getElementById(`curr-sec-${activeListenSection}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [sentenceCounter.current, isSpeaking, activeListenSection, lesson.id]);

  const handlePlayVoice = () => {
    sfx.playClick();
    setIsSpeaking(true);
    setIsPaused(false);
    speechManager.speakSentences(summaryTimeline.sentences, 0.85, () => {
      setIsSpeaking(false);
      setIsPaused(false);
      sfx.playSuccessSound();
    });
  };

  const handlePauseVoice = () => {
    speechManager.pause();
    setIsPaused(true);
  };

  const handleResumeVoice = () => {
    speechManager.resume();
    setIsPaused(false);
  };

  const handleForwardVoice = () => {
    speechManager.forward();
  };

  const handleRewindVoice = () => {
    speechManager.rewind();
  };

  const handleStopVoice = () => {
    speechManager.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleToggleVoice = () => {
    sfx.playClick();
    if (!isSpeaking) {
      handlePlayVoice();
    } else if (isPaused) {
      handleResumeVoice();
    } else {
      handlePauseVoice();
    }
  };

  const handleCheckPractice = () => {
    sfx.playClick();
    if (!userPracticeAnswer.trim()) {
      setPracticeFeedback('empty');
      return;
    }
    const isRight = verifyQuickCheckAnswer(userPracticeAnswer, quickCheck);
    if (isRight) {
      setPracticeFeedback('correct');
      sfx.playSuccessSound();
    } else {
      setPracticeFeedback('incorrect');
      sfx.playErrorSound();
    }
  };

  const activeBook = getBookForLesson(lesson.id);
  const subjectLabel = activeBook.shortTitle;
  const returnLabel = activeBook.returnToFirstLabel;

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-right font-['Cairo',sans-serif]">
      {/* Top Navigation Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <button 
            onClick={onReturnToLesson1}
            className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>منهاج {subjectLabel}</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-slate-500">/</span>
          <span className="text-slate-300 font-bold">{lesson.badge}</span>
          <span className="text-slate-500">/</span>
          <span className="text-amber-300 font-extrabold">{lesson.title}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onReturnToLesson1}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{returnLabel}</span>
          </button>

          {onOpenVideo && (
            <button
              onClick={() => {
                sfx.playClick();
                speechManager.stop();
                setIsSpeaking(false);
                onOpenVideo();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow"
            >
              <Film className="w-3.5 h-3.5" />
              <span>فيديو أنيميشن 🎬</span>
            </button>
          )}
          
          <div className="flex items-center gap-1">
            {isSpeaking && (
              <button
                onClick={handleRewindVoice}
                disabled={sentenceCounter.current <= 1}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-amber-300 text-xs font-bold transition-all"
                title="ترجيع ⏪"
              >
                <Rewind className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleToggleVoice}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow ${
                !isSpeaking
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : isPaused
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-2 ring-rose-300'
              }`}
            >
              {!isSpeaking ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>استمع للدرس 🎙️</span>
                </>
              ) : isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>متابعة ▶️</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>توقف ⏸️</span>
                </>
              )}
            </button>

            {isSpeaking && (
              <>
                <button
                  onClick={handleForwardVoice}
                  disabled={sentenceCounter.total > 0 && sentenceCounter.current >= sentenceCounter.total}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-amber-300 text-xs font-bold transition-all"
                  title="تقديم ⏩"
                >
                  <FastForward className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleStopVoice}
                  className="p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800 transition-all"
                  title="إيقاف ⏹️"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Lesson Showcase Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-teal-600/30 rounded-3xl p-5 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Corner Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header & Meta */}
          <div className="border-b border-slate-800 pb-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {lesson.badge}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                كتاب الطالب: {lesson.pages}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                المنهاج السوري للصف الثامن 🇸🇾
              </span>
            </div>

            <h1 className="text-xl md:text-3xl font-black text-white leading-tight">
              {lesson.title}
            </h1>
            <p className="text-sm md:text-base text-slate-400 mt-1">
              {lesson.subtitle}
            </p>
          </div>

          {/* Complete Teacher Audio Controller Bar with Pause, Resume, Rewind, Forward */}
          <TeacherAudioControls
            isPlaying={isSpeaking}
            isPaused={isPaused}
            currentSentence={currentSentence}
            currentIndex={sentenceCounter.current - 1}
            totalSentences={sentenceCounter.total}
            onPlay={handlePlayVoice}
            onPause={handlePauseVoice}
            onResume={handleResumeVoice}
            onForward={handleForwardVoice}
            onRewind={handleRewindVoice}
            onStop={handleStopVoice}
            title={`الشرح الصوتي لمعلم الرياضيات: ${lesson.title}`}
            theme="teal"
          />

          {/* Lesson Overview Box */}
          <div
            id="curr-sec-overview"
            className={`rounded-2xl p-4 md:p-5 border transition-all duration-300 scroll-mt-28 ${
              activeListenSection === 'overview'
                ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/60 shadow-lg'
                : 'bg-slate-850/60 border-slate-800'
            }`}
          >
            <h3 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظرة عامة على الدرس والأهداف التعليمية:</span>
            </h3>
            <div className="text-sm md:text-base text-slate-200 leading-relaxed">
              {renderSpokenWords(
                lesson.summary,
                activeSlot?.part === 'overview' && activeSlot.wordStart !== undefined,
                activeSlot?.wordStart,
                activeSlot?.wordEnd
              )}
            </div>
          </div>

          {/* Core Rule in Blackboard Theme with Proper Stacking Fractions */}
          <div
            id="curr-sec-rule"
            className={`bg-[#142620] border-4 rounded-2xl p-4 md:p-6 shadow-inner space-y-4 transition-all duration-300 scroll-mt-28 ${
              activeListenSection === 'rule'
                ? 'border-amber-400 ring-2 ring-amber-400/70 shadow-[0_0_25px_rgba(251,191,36,0.2)]'
                : 'border-[#52331d]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
              <span className="text-xs md:text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                <span>📌 القاعدة الأساسية الجوهرية (من كتاب {subjectLabel})</span>
              </span>
              <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-bold">
                تنسيق الكتب المدرسية السورية (بدون سلاش /)
              </span>
            </div>

            <div className="text-sm md:text-base text-emerald-100 font-medium leading-relaxed">
              {renderSpokenWords(
                lesson.keyRule,
                activeSlot?.part === 'ruleText',
                activeSlot?.wordStart,
                activeSlot?.wordEnd
              )}
            </div>

            {/* Vertical Fraction Math Equation */}
            <div 
              dir="ltr"
              className={`p-3.5 rounded-xl border text-center font-mono text-base md:text-lg font-bold transition-all duration-200 ${
                activeSlot?.part === 'ruleEquation'
                  ? 'bg-[#12261e] border-amber-400/70 ring-1 ring-amber-400/50'
                  : 'bg-[#0d1a15] border-emerald-800/70'
              }`}
            >
              <GranularMathEquation
                equation={lesson.ruleEquation}
                equationKey={`curr-rule-${lesson.id}`}
                activeTokenKey={activeRuleTokenKey}
                currentSentence={currentSentence}
                isSpeaking={isSpeaking && activeSlot?.part === 'ruleEquation'}
                theme="chalkboard"
                size="lg"
              />
            </div>

            <GeometryDiagram
              lessonId={lesson.id}
              sectionTitle={lesson.title}
              sectionText={`${lesson.keyRule} ${lesson.exampleProblem}`}
              theme="chalkboard"
            />
          </div>

          {/* Solved Example Step-by-Step with Vertical Stacked Fractions */}
          <div
            id="curr-sec-example"
            className={`bg-slate-900 border rounded-2xl p-4 md:p-6 space-y-3 transition-all duration-300 scroll-mt-28 ${
              activeListenSection === 'example'
                ? 'border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg'
                : 'border-slate-800'
            }`}
          >
            <h3 className="text-sm md:text-base font-extrabold text-teal-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>مثال تطبيقي محلول خطوة بخطوة:</span>
            </h3>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs md:text-sm text-slate-200">
              <span className="font-bold text-amber-300 ml-1">المسألة:</span>
              {renderSpokenWords(
                lesson.exampleProblem,
                activeSlot?.part === 'exampleProblem',
                activeSlot?.wordStart,
                activeSlot?.wordEnd
              )}
            </div>

            <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-800/40 text-xs md:text-sm text-emerald-200">
              <span className="font-bold text-emerald-400 ml-1">خطوات الحل:</span>
              {renderSpokenWords(
                lesson.exampleSolution,
                activeSlot?.part === 'exampleSolution',
                activeSlot?.wordStart,
                activeSlot?.wordEnd
              )}
            </div>

            <ExampleVisualBoard
              lessonId={lesson.id}
              sectionTitle={lesson.title}
              mathEquation={lesson.ruleEquation}
              exampleProblem={lesson.exampleProblem}
              exampleSolution={lesson.exampleSolution}
              theme="chalkboard"
              showSolution={true}
            />
          </div>

          {/* Quick Practice for Student */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm md:text-base font-extrabold text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>تحقق من فهمك (اختبار سريع للدرس):</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setShowPracticeHint(prev => !prev);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1 transition-all"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showPracticeHint ? 'إخفاء التلميح' : 'تلميح'}</span>
              </button>
            </div>

            <div className="bg-slate-900/90 border border-teal-500/30 rounded-xl p-3.5 space-y-2">
              <div className="text-xs md:text-sm font-bold text-slate-100">
                <FormattedMathText text={quickCheck.question} size="md" />
              </div>
              {quickCheck.formula && (
                <div dir="ltr" className="py-2 px-3 rounded-lg bg-slate-950/90 border border-slate-800 text-center font-mono font-bold text-base md:text-lg text-amber-300">
                  <GranularMathEquation
                    equation={quickCheck.formula}
                    theme="chalkboard"
                    size="md"
                  />
                </div>
              )}
            </div>

            {showPracticeHint && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs leading-relaxed">
                <span className="font-bold text-amber-300">💡 تلميح الحل: </span>
                <FormattedMathText text={quickCheck.hint} size="sm" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                dir="ltr"
                placeholder="اكتب الناتج النهائي هنا (مثال: 8/9 أو 5)..."
                value={userPracticeAnswer}
                onChange={(e) => {
                  setUserPracticeAnswer(e.target.value);
                  if (practiceFeedback) setPracticeFeedback(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckPractice();
                }}
                className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs md:text-sm text-white text-center font-mono focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleCheckPractice}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs md:text-sm transition-all active:scale-95"
              >
                تحقق من الإجابة ✅
              </button>
            </div>

            {practiceFeedback === 'empty' && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs md:text-sm font-bold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>الرجاء كتابة الناتج في الخانة أعلاه قبل الضغط على زر التحقق.</span>
              </div>
            )}

            {practiceFeedback === 'correct' && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs md:text-sm space-y-1 animate-in fade-in">
                <div className="font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>أحسنت يا بطل! الإجابة صحيحة ✅</span>
                </div>
                <div className="text-xs text-emerald-300/90 pr-6">
                  <FormattedMathText text={quickCheck.correctExplanation} size="sm" />
                </div>
              </div>
            )}

            {practiceFeedback === 'incorrect' && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs md:text-sm space-y-1.5 animate-in fade-in">
                <div className="font-bold flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>الإجابة غير صحيحة ❌ — حاول مرة أخرى!</span>
                </div>
                <div className="text-xs text-rose-200/90 pr-6">
                  <span className="font-bold text-amber-300">💡 تلميح: </span>
                  <FormattedMathText text={quickCheck.hint} size="sm" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Fast Switcher */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onReturnToLesson1}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm transition-all shadow-md flex items-center gap-2"
            >
              <span>{activeBook.returnToFirstLabel} ⭐</span>
            </button>

            <span className="text-xs text-slate-400">
              يمكنك دائماً فتح الفهرس الجانبي ☰ للتنقل بين وحدات المنهاج
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
