import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  Compass,
  Calculator,
  QrCode,
  Search,
  Volume2,
  X,
  Film
} from 'lucide-react';
import {
  BOOKS_CATALOG,
  ALL_CURRICULUM_UNITS,
  BookConfig,
  CurriculumLesson,
  CurriculumUnit,
  getBookById,
  getBookForLesson
} from '../data/curriculumUnits';
import { sfx } from '../utils/soundEffects';

interface HomeLibraryViewProps {
  currentLessonId: string;
  onOpenLesson: (lesson: CurriculumLesson, targetTab?: 'read' | 'video' | 'board' | 'summary' | 'exercises') => void;
  onOpenBook: (bookId: string) => void;
  onOpenQRModal: () => void;
}

const BOOK_ACCENT_STYLES: Record<
  BookConfig['accentTheme'],
  { badgeText: string; openBtn: string; activeTocTab: string }
> = {
  amber: {
    badgeText: 'text-emerald-400',
    openBtn: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
    activeTocTab: 'bg-amber-400 text-slate-950 font-black shadow-sm',
  },
  teal: {
    badgeText: 'text-sky-400',
    openBtn: 'bg-teal-500 hover:bg-teal-400 text-slate-950',
    activeTocTab: 'bg-teal-600 text-white shadow-sm',
  },
  sky: {
    badgeText: 'text-sky-400',
    openBtn: 'bg-sky-400 hover:bg-sky-300 text-slate-950',
    activeTocTab: 'bg-sky-600 text-white shadow-sm',
  },
  emerald: {
    badgeText: 'text-emerald-400',
    openBtn: 'bg-emerald-400 hover:bg-emerald-300 text-slate-950',
    activeTocTab: 'bg-emerald-600 text-white shadow-sm',
  },
  purple: {
    badgeText: 'text-purple-400',
    openBtn: 'bg-purple-400 hover:bg-purple-300 text-slate-950',
    activeTocTab: 'bg-purple-600 text-white shadow-sm',
  },
  rose: {
    badgeText: 'text-rose-400',
    openBtn: 'bg-rose-400 hover:bg-rose-300 text-slate-950',
    activeTocTab: 'bg-rose-600 text-white shadow-sm',
  },
};

export const HomeLibraryView: React.FC<HomeLibraryViewProps> = ({
  currentLessonId,
  onOpenLesson,
  onOpenBook,
  onOpenQRModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndexBookId, setActiveIndexBookId] = useState<string>(() => {
    const active = getBookForLesson(currentLessonId);
    return active?.id || BOOKS_CATALOG[BOOKS_CATALOG.length - 1]?.id || 'algebra';
  });
  const [expandedUnitIds, setExpandedUnitIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const book of BOOKS_CATALOG) {
      if (book.units[0]) initial[book.units[0].id] = true;
    }
    return initial;
  });

  const libraryTotals = useMemo(() => {
    const totalBooks = BOOKS_CATALOG.length;
    const totalUnits = ALL_CURRICULUM_UNITS.length;
    const totalLessons = ALL_CURRICULUM_UNITS.reduce((acc, u) => acc + u.lessons.length, 0);
    const totalPages = BOOKS_CATALOG.reduce((acc, b) => acc + b.totalPages, 0);
    return { totalBooks, totalUnits, totalLessons, totalPages };
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { unit: CurriculumUnit; lesson: CurriculumLesson; book: BookConfig }[] = [];
    for (const book of BOOKS_CATALOG) {
      for (const unit of book.units) {
        for (const lesson of unit.lessons) {
          if (
            lesson.title.toLowerCase().includes(q) ||
            lesson.subtitle.toLowerCase().includes(q) ||
            lesson.summary.toLowerCase().includes(q) ||
            unit.title.toLowerCase().includes(q) ||
            book.title.toLowerCase().includes(q)
          ) {
            results.push({ unit, lesson, book });
          }
        }
      }
    }
    return results;
  }, [searchQuery]);

  const toggleUnit = (unitId: string) => {
    sfx.playClick();
    setExpandedUnitIds(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const activeTocBook = getBookById(activeIndexBookId);
  const displayedUnits = activeTocBook.units;

  return (
    <div className="space-y-8 py-2 sm:py-4 font-['Cairo',sans-serif]" dir="rtl">
      {/* Main Hero Header & Global Search */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="text-xs font-bold text-teal-300 tracking-wide">
              الجمهورية العربية السورية · وزارة التربية · طبعة 2025 - 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-snug text-balance">
              فهرس كتب الصف الثامن الأساسي التفاعلية
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              اختر الكتاب أو الدرس للبدء مباشرة بالقراءة التفاعلية، كتاب الوزارة (نسخة مكبّرة وواضحة أو صورة ممسوحة عالية الدقة)،
              السبورة الذكية بالصوت الكامل، ملخص القواعد، والتمارين المصححة أوفلاين.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-400 font-medium tabular-nums">
              <span>{libraryTotals.totalBooks} كتب مدرسية معتمدة</span>
              <span aria-hidden="true">·</span>
              <span>{libraryTotals.totalUnits} وحدة دراسية</span>
              <span aria-hidden="true">·</span>
              <span>{libraryTotals.totalLessons} محوراً ودرساً</span>
              <span aria-hidden="true">·</span>
              <span>{libraryTotals.totalPages} صفحة مصوّرة عالية الدقة</span>
            </div>
          </div>

          <div className="w-full lg:w-96 space-y-3 shrink-0">
            {/* Search Input across ALL Registered Books */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن أي درس أو مفهوم في الكتب..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl pr-10 pl-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-white absolute left-2.5 top-2.5 rounded-lg"
                  title="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                sfx.playClick();
                onOpenQRModal();
              }}
              className="w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <QrCode className="w-4 h-4 text-amber-300 shrink-0" />
              <span>مشاركة التطبيق أو تثبيته بالباركود</span>
            </button>
          </div>
        </div>

        {/* Instant Cross-Book Search Results */}
        {searchQuery.trim() && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 mb-3 tabular-nums">
              نتائج البحث ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="text-sm text-slate-400 py-4 text-center">
                لم يتم العثور على دروس مطابقة لكلمة البحث. جرّب كلمة أخرى مثل: فيثاغورث، الانسحاب، الكسور، المعادلات، الهرم.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pl-1">
                {searchResults.map(({ unit, lesson, book }) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      sfx.playClick();
                      onOpenLesson(lesson, 'read');
                    }}
                    className="text-right p-3 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-teal-400 truncate">
                        كتاب {book.shortTitle} · {unit.title}
                      </div>
                      <div className="text-sm font-extrabold text-white truncate mt-0.5">
                        {lesson.title}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {lesson.subtitle}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-amber-300 shrink-0 tabular-nums">
                      {lesson.pages}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Main Textbooks Shelf (Data-Driven from BOOKS_CATALOG for All Current & Future Books) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {BOOKS_CATALOG.map((book) => {
          const style = BOOK_ACCENT_STYLES[book.accentTheme] || BOOK_ACCENT_STYLES.teal;
          const lessonCount = book.units.reduce((acc, u) => acc + u.lessons.length, 0);
          const IconComponent = book.id === 'geometry' ? Compass : Calculator;

          return (
            <article
              key={book.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row gap-5 items-stretch">
                <div className="w-full sm:w-36 h-48 sm:h-auto shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-white">
                  <img
                    src={book.coverImage}
                    alt={`غلاف كتاب ${book.title} للصف الثامن الأساسي`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className={`flex items-center gap-2 text-xs font-bold ${style.badgeText}`}>
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <span>{book.cardBadge}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {book.title}
                    </h2>
                    <div className="text-xs text-slate-400 mt-1 tabular-nums">
                      {book.units.length} وحدات · {lessonCount} درساً ومحور مراجعة · {book.totalPages} صفحة
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mt-3">
                      {book.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    sfx.playClick();
                    onOpenBook(book.id);
                  }}
                  className={`px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 ${style.openBtn}`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>فتح كتاب {book.shortTitle}</span>
                </button>

                <button
                  onClick={() => {
                    sfx.playClick();
                    setActiveIndexBookId(book.id);
                    document.getElementById('curriculum-toc-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>تصفح الوحدات ({book.units.length})</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Complete Interactive Table of Contents for Selected Textbook */}
      <section
        id="curriculum-toc-section"
        className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-lg scroll-mt-24"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              الفهرس التفصيلي للوحدات والدروس
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              اضغط على أي درس للدخول مباشرة إلى صفحاته التفاعلية، كتاب الوزارة، أو السبورة الصوتية.
            </p>
          </div>

          {/* Dynamic Segmented Switcher Across All Registered Books */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {BOOKS_CATALOG.map((book) => {
              const isSelected = activeTocBook.id === book.id;
              const style = BOOK_ACCENT_STYLES[book.accentTheme] || BOOK_ACCENT_STYLES.teal;
              return (
                <button
                  key={book.id}
                  onClick={() => {
                    sfx.playClick();
                    setActiveIndexBookId(book.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? style.activeTocTab
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  كتاب {book.shortTitle} ({book.units.length} وحدات)
                </button>
              );
            })}
          </div>
        </div>

        {/* Units Accordion List */}
        <div className="mt-5 space-y-3">
          {displayedUnits.map((unit) => {
            const isExpanded = !!expandedUnitIds[unit.id];
            return (
              <div
                key={unit.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden"
              >
                <button
                  onClick={() => toggleUnit(unit.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-right hover:bg-slate-800/60 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                      <span className="text-sm sm:text-base font-extrabold text-white">
                        {unit.title}
                      </span>
                      <span className="text-xs text-teal-400 font-bold">
                        {unit.term} · {unit.pagesSpan}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {unit.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-slate-300 tabular-nums">
                      {unit.lessons.length} محاور
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-800/80 divide-y divide-slate-800/60">
                    {unit.lessons.map((lesson) => {
                      const isCurrent = lesson.id === currentLessonId;
                      return (
                        <div
                          key={lesson.id}
                          className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                            isCurrent ? 'bg-teal-950/30' : 'hover:bg-slate-900/70'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                              <button
                                onClick={() => {
                                  sfx.playClick();
                                  onOpenLesson(lesson, 'read');
                                }}
                                className="text-sm font-bold text-slate-100 hover:text-amber-300 transition-colors text-right"
                              >
                                {lesson.title}
                              </button>
                              <span className="text-xs font-mono text-slate-400 tabular-nums">
                                ({lesson.pages})
                              </span>
                              {isCurrent && (
                                <span className="text-[11px] font-bold text-amber-300">
                                  · آخر درس مفتوح
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {lesson.subtitle}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                sfx.playClick();
                                onOpenLesson(lesson, 'read');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>الكتاب</span>
                            </button>
                            <button
                              onClick={() => {
                                sfx.playClick();
                                onOpenLesson(lesson, 'video');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-500 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                              title="شرح الدرس عبر فيديو أنيميشن"
                            >
                              <Film className="w-3.5 h-3.5" />
                              <span>فيديو أنيميشن</span>
                            </button>
                            <button
                              onClick={() => {
                                sfx.playClick();
                                onOpenLesson(lesson, 'board');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>السبورة</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
