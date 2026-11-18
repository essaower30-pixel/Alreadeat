import React, { useState, useEffect } from 'react';
import { 
  X, ChevronDown, ChevronLeft, BookOpen, Sparkles, GraduationCap, 
  Search, CheckCircle2, Bookmark, ArrowRight, ShieldCheck, Layers, Home
} from 'lucide-react';
import {
  BOOKS_CATALOG,
  ALL_CURRICULUM_UNITS,
  CurriculumLesson,
  CurriculumUnit,
  getBookById,
  getBookForLesson
} from '../data/curriculumUnits';
import { sfx } from '../utils/soundEffects';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLessonId?: string;
  onSelectLesson: (lesson: CurriculumLesson) => void;
  onGoHome?: () => void;
  isMobileSimulator?: boolean; // When true, fits inside the phone simulator container!
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  currentLessonId = 'u1-l1',
  onSelectLesson,
  onGoHome,
  isMobileSimulator = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [bookFilter, setBookFilter] = useState<string>(() =>
    getBookForLesson(currentLessonId).id
  );
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const book of BOOKS_CATALOG) {
      if (book.units[0]) initial[book.units[0].id] = true;
      if (book.units[1]) initial[book.units[1].id] = true;
    }
    return initial;
  });

  useEffect(() => {
    if (isOpen) {
      const bookId = getBookForLesson(currentLessonId).id;
      setBookFilter(bookId);
      const ownerUnit = ALL_CURRICULUM_UNITS.find(u => u.lessons.some(l => l.id === currentLessonId));
      if (ownerUnit) {
        setExpandedUnits(prev => ({ ...prev, [ownerUnit.id]: true }));
      }
    }
  }, [isOpen, currentLessonId]);

  if (!isOpen) return null;

  const toggleUnit = (unitId: string) => {
    sfx.playClick();
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleLessonClick = (lesson: CurriculumLesson) => {
    sfx.playClick();
    onSelectLesson(lesson);
    onClose();
  };

  const baseUnits =
    bookFilter === 'all'
      ? ALL_CURRICULUM_UNITS
      : getBookById(bookFilter).units;

  // Filter lessons based on search query
  const filteredUnits = baseUnits.map(unit => {
    if (!searchQuery.trim()) return unit;
    const q = searchQuery.toLowerCase().trim();
    const matchingLessons = unit.lessons.filter(l => 
      l.title.toLowerCase().includes(q) || 
      l.subtitle.toLowerCase().includes(q) || 
      l.summary.toLowerCase().includes(q)
    );
    return matchingLessons.length > 0 ? { ...unit, lessons: matchingLessons } : null;
  }).filter(Boolean) as CurriculumUnit[];

  return (
    <div 
      className={`fixed inset-0 z-50 flex ${isMobileSimulator ? 'absolute' : 'fixed'}`}
      dir="rtl"
    >
      {/* Dark Backdrop with Blur */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Panel: Positioned on the right in RTL */}
      <div 
        className={`relative mr-auto w-full max-w-[340px] sm:max-w-[380px] h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 transition-transform duration-300 animate-in slide-in-from-right`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-gradient-to-b from-slate-850 to-slate-900 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-300">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-sm">
                    {bookFilter === 'all'
                      ? 'فهرس كتب الصف الثامن'
                      : `فهرس كتاب ${getBookById(bookFilter).shortTitle}`}
                  </span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold border border-teal-500/30">
                    الصف الثامن
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  الجمهورية العربية السورية · المنهاج الحديث
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="إغلاق الفهرس"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Home Index Shortcut + Dynamic Book Switcher */}
          <div className="space-y-2 mb-2.5">
            {onGoHome && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onGoHome();
                  onClose();
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>الصفحة الرئيسية · فهرس الكتب</span>
              </button>
            )}

            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {BOOKS_CATALOG.map((book) => (
                <button
                  key={book.id}
                  onClick={() => {
                    sfx.playClick();
                    setBookFilter(book.id);
                  }}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                    bookFilter === book.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {book.shortTitle} ({book.units.length})
                </button>
              ))}
              <button
                onClick={() => {
                  sfx.playClick();
                  setBookFilter('all');
                }}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                  bookFilter === 'all'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                الكل ({ALL_CURRICULUM_UNITS.length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن درس أو وحدة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Units & Lessons List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans custom-scrollbar">
          {filteredUnits.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <span>لا توجد نتائج تطابق بحثك</span>
            </div>
          ) : (
            filteredUnits.map((unit) => {
              const isExpanded = searchQuery ? true : expandedUnits[unit.id];
              return (
                <div 
                  key={unit.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all shadow-sm"
                >
                  {/* Unit Header Button */}
                  <button
                    onClick={() => toggleUnit(unit.id)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-right bg-slate-800/40 hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{unit.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {unit.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-teal-400 font-medium">
                            {unit.term}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            • {unit.pagesSpan}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
                        {unit.lessons.length}
                      </span>
                      <ChevronDown 
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    </div>
                  </button>

                  {/* Unit Lessons List */}
                  {isExpanded && (
                    <div className="p-1.5 space-y-1 bg-slate-900/50 border-t border-slate-800/60">
                      {unit.lessons.map((lesson) => {
                        const isCurrent = lesson.id === currentLessonId;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonClick(lesson)}
                            className={`w-full text-right p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 group ${
                              isCurrent
                                ? 'bg-gradient-to-l from-teal-900/60 via-emerald-950/40 to-slate-900 border border-teal-500/60 shadow-md ring-1 ring-teal-500/30'
                                : 'hover:bg-slate-800/70 border border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0 ${
                                isCurrent
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : 'bg-slate-800 text-slate-300 group-hover:bg-teal-600 group-hover:text-white'
                              }`}>
                                {lesson.lessonNumber}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-xs font-bold leading-snug transition-colors ${
                                    isCurrent ? 'text-amber-300 font-extrabold' : 'text-slate-200 group-hover:text-teal-200'
                                  }`}>
                                    {lesson.title}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1 py-0.2 rounded font-bold animate-pulse">
                                      الدرس النشط
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 block line-clamp-1 mt-0.5">
                                  {lesson.subtitle}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0 pt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {lesson.pages}
                              </span>
                              <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${isCurrent ? 'text-amber-400' : 'text-slate-500 group-hover:text-teal-400 group-hover:-translate-x-1'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Drawer Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-bold">Offline Ready (كامل المنهاج)</span>
          </div>
          <span className="text-[10px] text-slate-400">
            تحديث 2025-2026
          </span>
        </div>
      </div>
    </div>
  );
};
