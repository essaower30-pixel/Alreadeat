import React, { useState } from 'react';
import { 
  BookOpen, Volume2, Code2, CheckSquare, Smartphone, 
  WifiOff, GraduationCap, Menu, Lightbulb, School, QrCode, Download, Home, Film
} from 'lucide-react';
import { HomeLibraryView } from './components/HomeLibraryView';
import { ReadLessonView } from './components/ReadLessonView';
import { InteractiveBoardView } from './components/InteractiveBoardView';
import { ExercisesView } from './components/ExercisesView';
import { FlutterCodeViewer } from './components/FlutterCodeViewer';
import { MobileSimulator } from './components/MobileSimulator';
import { SidebarDrawer } from './components/SidebarDrawer';
import { CurriculumLessonView } from './components/CurriculumLessonView';
import { AnimatedLessonVideoView } from './components/AnimatedLessonVideoView';
import { AppDownloadQRModal } from './components/AppDownloadQRModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  CurriculumLesson,
  BOOKS_CATALOG,
  SYRIAN_ALGEBRA_UNITS,
  getCurriculumLessonById,
  getBookById,
  getBookForLesson
} from './data/curriculumUnits';
import { sfx } from './utils/soundEffects';

export type NavTab = 'home' | 'read' | 'video' | 'board' | 'summary' | 'exercises' | 'flutter' | 'simulator';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [currentLessonId, setCurrentLessonId] = useState<string>('u1-l1');
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const activeBook = getBookForLesson(currentLessonId);

  // Find active lesson object from all registered books in BOOKS_CATALOG
  const currentLesson: CurriculumLesson = React.useMemo(() => {
    return getCurriculumLessonById(currentLessonId) || SYRIAN_ALGEBRA_UNITS[0].lessons[0];
  }, [currentLessonId]);

  const handleTabChange = (tab: NavTab) => {
    sfx.playClick();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCurriculumLesson = (lesson: CurriculumLesson, targetTab?: NavTab) => {
    sfx.playClick();
    setCurrentLessonId(lesson.id);
    if (targetTab) {
      setActiveTab(targetTab);
    } else if (activeTab === 'home') {
      setActiveTab('read');
    }
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBook = (bookId: string) => {
    sfx.playClick();
    const targetBook = getBookById(bookId);
    if (activeBook.id !== targetBook.id) {
      setCurrentLessonId(targetBook.defaultLessonId);
    }
    setActiveTab('read');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Sidebar Navigation Drawer (فهرس جانبي) */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentLessonId={currentLessonId}
        onSelectLesson={(lesson) => handleSelectCurriculumLesson(lesson)}
        onGoHome={() => handleTabChange('home')}
      />

      {/* Unified Non-Colliding Sticky Header Container */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl">
        {/* Row 1: Brand & Top Bar */}
        <header className="navbar border-b border-slate-800/80 px-2 sm:px-6 py-2 sm:py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            {/* Logo & Curriculum Info + Menu + Home Button */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              {/* Top Menu Icon Button to Open Sidebar Navigation Drawer */}
              <button
                onClick={() => {
                  sfx.playClick();
                  setIsDrawerOpen(true);
                }}
                className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group shrink-0"
                title="فتح فهرس المنهاج (Sidebar Drawer)"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black hidden sm:inline text-slate-200 group-hover:text-white">الفهرس ☰</span>
              </button>

              <button
                onClick={() => handleTabChange('home')}
                className={`p-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 ${
                  activeTab === 'home'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-bold'
                }`}
                title="الصفحة الرئيسية — فهرس كتب الصف الثامن"
              >
                <Home className="w-4 h-4 shrink-0" />
                <span className="text-xs hidden sm:inline">الرئيسية</span>
              </button>

              <button
                onClick={() => handleTabChange('home')}
                className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 text-right group"
                title="العودة إلى فهرس كتب الصف الثامن"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-teal-900/40 shrink-0">
                  <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="brand-title font-extrabold text-white group-hover:text-amber-300 transition-colors text-xs sm:text-base md:text-lg whitespace-nowrap truncate">
                      منهاج الرياضيات السوري
                    </span>
                    <span className="text-[9px] sm:text-xs bg-teal-500/20 text-teal-300 px-1 sm:px-2 py-0.5 rounded-full border border-teal-500/40 font-bold whitespace-nowrap shrink-0">
                      الصف الثامن
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 hidden md:block">
                    {activeTab === 'home'
                      ? `فهرس الكتب: ${BOOKS_CATALOG.map(b => `${b.shortTitle} (${b.units.length} وحدات)`).join(' · ')}`
                      : `${activeBook.shortTitle} · ${currentLesson.title} (${currentLesson.pages})`}
                  </p>
                </div>
              </button>
            </div>

            {/* Offline Badge, QR Download & Direct Action Shortcuts */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="developer-bar info-icon hidden lg:flex items-center gap-1 px-2.5 py-1 bg-emerald-950/80 border border-emerald-600/40 rounded-full text-emerald-400 text-[10px] sm:text-xs font-bold">
                <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>100% أوفلاين</span>
              </div>

              {/* QR Barcode Download Button (Prominent on Mobile & Desktop) */}
              <button
                onClick={() => {
                  sfx.playClick();
                  setIsQRModalOpen(true);
                }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1 bg-teal-600 hover:bg-teal-500 text-white border border-teal-400/50 transition-all shadow-sm active:scale-95"
                title="باركود تحميل ومشاركة التطبيق"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>باركود التحميل</span>
              </button>

              {/* Direct PWA Install Button when supported by browser */}
              {isInstallable && !isInstalled && (
                <button
                  onClick={async () => {
                    sfx.playClick();
                    await install();
                  }}
                  className="hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-black items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 transition-all shadow-sm active:scale-95"
                  title="تثبيت التطبيق على الجهاز"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تثبيت</span>
                </button>
              )}

              {/* Direct Quick Shortcuts for Mobile Simulator, Summary, & Flutter Code */}
              <button
                onClick={() => handleTabChange('simulator')}
                className={`developer-bar hidden md:flex px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  activeTab === 'simulator'
                    ? 'bg-teal-500 text-white font-black shadow-teal-500/30 ring-2 ring-teal-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                }`}
                title="معاينة تطبيق الجوال (محاكي فلاتر)"
              >
                <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden xs:inline">معاينة الجوال</span>
              </button>

              <button
                onClick={() => handleTabChange('summary')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95 ${
                  activeTab === 'summary'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/30 ring-2 ring-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                }`}
                title="ملخص وقواعد الدرس"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">ملخص القواعد</span>
              </button>

              <button
                onClick={() => handleTabChange('flutter')}
                className={`developer-bar code-icon hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  activeTab === 'flutter'
                    ? 'bg-sky-500 text-white font-black shadow-sky-500/30 ring-2 ring-sky-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                }`}
                title="كود Flutter للواجهة"
              >
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">كود Flutter</span>
              </button>
            </div>
          </div>
        </header>

        {/* Row 2: Active Book & Lesson Banner (Visible when inside a book on tablet/desktop) */}
        {activeTab !== 'home' && (
          <div className="bg-slate-950/70 border-b border-slate-800/80 px-2 sm:px-6 py-1 text-xs hidden sm:flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
                {BOOKS_CATALOG.map((book) => {
                  const isActiveBook = activeBook.id === book.id;
                  return (
                    <button
                      key={book.id}
                      onClick={() => handleOpenBook(book.id)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                        isActiveBook
                          ? book.accentTheme === 'amber'
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-teal-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {book.shortTitle}
                    </button>
                  );
                })}
              </div>
              <span className="font-bold text-amber-300 text-xs sm:text-sm truncate">
                {currentLesson.title}
              </span>
              <span className="text-slate-400 text-[11px] hidden md:inline">
                ({currentLesson.pages} - {currentLesson.subtitle})
              </span>
            </div>
            <button
              onClick={() => {
                sfx.playClick();
                setIsDrawerOpen(true);
              }}
              className="text-[10px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-bold flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap"
            >
              <Menu className="w-3 h-3" />
              <span>الفهرس ☰</span>
            </button>
          </div>
        )}

        {/* Row 3: Primary Navigation Tabs (Completely Responsive & Clickable) */}
        {activeTab !== 'home' && (
        <nav className="px-2 sm:px-6 bg-slate-900/90 py-1.5 sm:py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {/* Button 0: الصفحة الرئيسية */}
            <button
              onClick={() => handleTabChange('home')}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
            >
              <Home className="w-4 h-4" />
              <span>فهرس الكتب</span>
            </button>

            {/* Button 1: اقرأ الدرس */}
            <button
              onClick={() => handleTabChange('read')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0 ${
                activeTab === 'read'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-amber-500/25 ring-2 ring-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>اقرأ الدرس (كتاب الطالب) 📖</span>
            </button>

            {/* Button 1.5: شرح الدرس عبر فيديو أنيميشن */}
            <button
              onClick={() => handleTabChange('video')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0 ${
                activeTab === 'video'
                  ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-black shadow-rose-500/30 ring-2 ring-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white border border-rose-500/40'
              }`}
            >
              <Film className="w-4 h-4 text-rose-300" />
              <span>فيديو أنيميشن للشرح 🎬</span>
            </button>

            {/* Button 2: استمع للشرح الصوتي والسبورة */}
            <button
              onClick={() => handleTabChange('board')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0 ${
                activeTab === 'board'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black shadow-emerald-600/30 ring-2 ring-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>استمع للشرح والسبورة 🎙️</span>
            </button>

            {/* Button 3: ملخص وقواعد الدرس */}
            <button
              onClick={() => handleTabChange('summary')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0 ${
                activeTab === 'summary'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black shadow-teal-500/30 ring-2 ring-teal-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>ملخص وقواعد الدرس 💡</span>
            </button>

            {/* Button 4: التمارين والتدريبات */}
            <button
              onClick={() => handleTabChange('exercises')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0 ${
                activeTab === 'exercises'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black shadow-purple-600/30 ring-2 ring-purple-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>تمارين وتدريبات الدرس 📝</span>
            </button>

            {/* Button 5: كود Flutter للواجهة */}
            <button
              onClick={() => handleTabChange('flutter')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0 ${
                activeTab === 'flutter'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black shadow-sky-500/30 ring-2 ring-sky-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>كود Flutter للواجهة (Offline) 💻</span>
            </button>

            {/* Button 6: معاينة تطبيق الجوال */}
            <button
              onClick={() => handleTabChange('simulator')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm active:scale-95 shrink-0 ${
                activeTab === 'simulator'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-amber-500/30 ring-2 ring-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>معاينة تطبيق الجوال 📱</span>
            </button>
          </div>
        </nav>
        )}
      </div>

      {/* Main App Content Body */}
      <main className={`flex-1 w-full mx-auto ${
        activeTab === 'read' ? 'max-w-full px-0 sm:px-2 lg:px-4 py-0 sm:py-2' : 'max-w-7xl px-2 sm:px-6 lg:px-8 py-2 sm:py-5'
      }`}>
        {activeTab === 'home' && (
          <HomeLibraryView
            currentLessonId={currentLessonId}
            onOpenLesson={(lesson, targetTab) => handleSelectCurriculumLesson(lesson, targetTab || 'read')}
            onOpenBook={handleOpenBook}
            onOpenQRModal={() => setIsQRModalOpen(true)}
          />
        )}

        {activeTab === 'read' && (
          <ReadLessonView 
            lessonId={currentLessonId} 
            onSelectLesson={(id) => setCurrentLessonId(id)}
            onOpenVideo={() => handleTabChange('video')}
          />
        )}

        {activeTab === 'video' && (
          <AnimatedLessonVideoView
            lessonId={currentLessonId}
            onOpenRead={() => handleTabChange('read')}
            onOpenExercises={() => handleTabChange('exercises')}
          />
        )}
        
        {activeTab === 'board' && (
          <InteractiveBoardView lessonId={currentLessonId} />
        )}
        
        {activeTab === 'summary' && (
          <CurriculumLessonView 
            lesson={currentLesson}
            onReturnToLesson1={() => {
              setCurrentLessonId(activeBook.defaultLessonId);
              setActiveTab('read');
            }}
            onOpenChalkboard={() => setActiveTab('board')}
            onOpenVideo={() => handleTabChange('video')}
          />
        )}
        
        {activeTab === 'exercises' && (
          <ExercisesView lessonId={currentLessonId} />
        )}
        
        {activeTab === 'flutter' && (
          <FlutterCodeViewer />
        )}
        
        {activeTab === 'simulator' && (
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 text-center">
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 shadow-sm">
                محاكي تطبيق Flutter المتطابق للعمل أوفلاين - {currentLesson.title}
              </span>
            </div>
            <MobileSimulator 
              lessonId={currentLessonId} 
              onTabChange={(subTab) => {
                if (subTab === 'quiz') setActiveTab('summary');
              }}
              onOpenFlutterCode={() => setActiveTab('flutter')}
              onOpenSummary={() => setActiveTab('summary')}
            />
          </div>
        )}
      </main>

      {/* QR Download & PWA Install Modal */}
      <AppDownloadQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-teal-400" />
            <span>
              {activeTab === 'home'
                ? `مكتبة كتب الصف الثامن (${BOOKS_CATALOG.map(b => b.shortTitle).join(' · ')}) - وزارة التربية في الجمهورية العربية السورية (2025 - 2026)`
                : `كتاب ${activeBook.title} - الصف الثامن - وزارة التربية في الجمهورية العربية السورية (2025 - 2026)`}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                sfx.playClick();
                setIsQRModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-600/40 font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span>عرض باركود تحميل التطبيق</span>
            </button>
            <span className="text-slate-500">
              متوافق تماماً مع تطبيقات الجوال والعمل أوفلاين (Offline).
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
