import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, HelpCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { EXERCISES, ExerciseItem } from '../data/lessonData';
import { getFullLessonPackage } from '../data/curriculumLessonsData';
import { getBookForLesson } from '../data/curriculumUnits';
import { GranularMathEquation } from './GranularMathEquation';
import { FormattedMathText } from './FormattedMathText';
import { GeometryDiagram } from './GeometryDiagram';
import { AlgebraExampleVisualSvg } from './ExampleVisualBoard';
import { sfx } from '../utils/soundEffects';

interface ExercisesViewProps {
  lessonId?: string;
}

export const ExercisesView: React.FC<ExercisesViewProps> = ({
  lessonId = 'u1-l1'
}) => {
  const customPkg = getFullLessonPackage(lessonId);
  const activeBook = getBookForLesson(lessonId);
  const bookLabel = `كتاب ${activeBook.shortTitle}`;
  const activeExercises: ExerciseItem[] = (customPkg && customPkg.exercises && customPkg.exercises.length > 0)
    ? customPkg.exercises
    : EXERCISES;

  const lessonTitle = customPkg ? customPkg.title : 'الدرس 1: جمع وطرح الأعداد العادية';
  const lessonPages = customPkg ? customPkg.pages : 'صفحة 7';

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showSteps, setShowSteps] = useState<Record<string, boolean>>({});

  // Reset when lesson changes
  useEffect(() => {
    setUserAnswers({});
    setShowSteps({});
  }, [lessonId]);

  const handleSelectOption = (exerciseId: string, option: string, isCorrect: boolean) => {
    setUserAnswers(prev => ({ ...prev, [exerciseId]: option }));
    if (isCorrect) {
      sfx.playSuccessSound();
    } else {
      sfx.playClick();
    }
  };

  const toggleSteps = (exerciseId: string) => {
    setShowSteps(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
    sfx.playClick();
  };

  const handleReset = () => {
    setUserAnswers({});
    setShowSteps({});
    sfx.playClick();
  };

  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = activeExercises.filter(ex => userAnswers[ex.id] === ex.correctAnswer).length;

  return (
    <div className="space-y-6">
      {/* Header & Score Bar */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>تمارين وتدريبات: {lessonTitle} ({lessonPages})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            اختبر فهمك لمسائل تحقق من فهمك وتدرب المستخرجة حرفياً من {bookLabel} للصف الثامن
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div className="text-left">
              <div className="text-[11px] text-slate-400">النتيجة الحالية:</div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                {correctCount} / {activeExercises.length}
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            title="إعادة حل التمارين"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {activeExercises.map((ex, index) => {
          const selected = userAnswers[ex.id];
          const isAnswered = !!selected;
          const isCorrect = selected === ex.correctAnswer;
          const isExpanded = showSteps[ex.id];

          return (
            <div
              key={ex.id}
              className={`bg-slate-800/90 border rounded-2xl p-5 shadow-md transition-all ${
                isAnswered
                  ? isCorrect
                    ? 'border-emerald-500/60 bg-emerald-950/10'
                    : 'border-rose-500/60 bg-rose-950/10'
                  : 'border-slate-700/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs font-mono">
                    {index + 1}
                  </span>
                  <span className="font-bold text-white text-sm">{ex.title}</span>
                </div>
                {isAnswered && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                    isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{isCorrect ? 'إجابة صحيحة ممتاز!' : 'حاول مرة أخرى'}</span>
                  </span>
                )}
              </div>

              {/* Question text & formula */}
              <div className="text-sm text-slate-200 mb-3 leading-relaxed">
                <FormattedMathText text={ex.question} size="sm" />
              </div>

              <div className="bg-[#142620] py-3 px-4 rounded-xl border border-emerald-900/60 mb-4 flex items-center justify-center overflow-x-auto shadow-inner">
                <GranularMathEquation 
                  equation={ex.formula} 
                  theme="chalkboard" 
                  size="md"
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {ex.options?.map((opt) => {
                  const isThisSelected = selected === opt;
                  const isThisCorrect = opt === ex.correctAnswer;

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(ex.id, opt, isThisCorrect)}
                      className={`p-2.5 rounded-xl font-bold font-mono text-sm border transition-all flex items-center justify-center ${
                        isThisSelected
                          ? isThisCorrect
                            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300/40'
                            : 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-300/40'
                          : 'bg-slate-900/60 hover:bg-slate-700/80 text-slate-200 border-slate-700'
                      }`}
                    >
                      <FormattedMathText text={opt} size="sm" />
                    </button>
                  );
                })}
              </div>

              {/* Toggle Explanation Steps */}
              <div className="border-t border-slate-700/60 pt-3 flex items-center justify-between">
                <button
                  onClick={() => toggleSteps(ex.id)}
                  className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isExpanded ? 'إخفاء خطوات الحل الرياضي' : 'عرض خطوات الحل المفصلة'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isAnswered && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <span>الإجابة الصحيحة:</span>
                    <span className="font-bold text-emerald-300 font-mono">
                      <FormattedMathText text={ex.correctAnswer} size="sm" />
                    </span>
                  </span>
                )}
              </div>

              {/* Expanded Explanation */}
              {isExpanded && (
                <div className="mt-3 p-3.5 sm:p-4 bg-slate-900/90 border border-slate-700/70 rounded-xl space-y-3 text-xs">
                  <div className="text-amber-300 font-bold">الشرح الرياضي:</div>
                  <div className="text-slate-200 text-xs sm:text-sm leading-relaxed font-semibold">
                    <FormattedMathText text={ex.explanation} size="sm" />
                  </div>

                  {/* Visual Shape / Diagram Illustrating the Explanation */}
                  <div>
                    {lessonId.startsWith('g-') ? (
                      <GeometryDiagram
                        lessonId={lessonId}
                        sectionTitle={ex.title}
                        sectionText={`${ex.question} ${ex.formula} ${ex.explanation} ${ex.steps.join(' ')}`}
                        theme="chalkboard"
                        caption="الشكل الهندسي الموضّح للشرح والبرهان"
                      />
                    ) : (
                      <div className="rounded-xl border border-emerald-700/45 bg-slate-950/75 p-2.5">
                        <AlgebraExampleVisualSvg
                          lessonId={lessonId}
                          problem={ex.question}
                          solution={ex.explanation}
                          equation={ex.formula}
                          isDark={true}
                          animProgress={1}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    {ex.steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300 font-semibold leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-teal-300 flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <FormattedMathText text={st} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
