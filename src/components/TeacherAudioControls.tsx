import React from 'react';
import { 
  Play, Pause, FastForward, Rewind, Square, Volume2
} from 'lucide-react';
import { sfx } from '../utils/soundEffects';

interface TeacherAudioControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentSentence?: string;
  currentIndex?: number;
  totalSentences?: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onForward: () => void;
  onRewind: () => void;
  onStop: () => void;
  title?: string;
  theme?: 'teal' | 'chalkboard' | 'dark';
  compact?: boolean;
  showFloatingPlayer?: boolean;
}

export const TeacherAudioControls: React.FC<TeacherAudioControlsProps> = ({
  isPlaying,
  isPaused,
  currentSentence,
  currentIndex = 0,
  totalSentences = 0,
  onPlay,
  onPause,
  onResume,
  onForward,
  onRewind,
  onStop,
  title,
  theme = 'teal',
  compact = false,
  showFloatingPlayer = false
}) => {
  const handleTogglePlayPause = () => {
    sfx.playClick();
    if (!isPlaying) {
      onPlay();
    } else if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const handleForwardClick = () => {
    sfx.playClick();
    onForward();
  };

  const handleRewindClick = () => {
    sfx.playClick();
    onRewind();
  };

  const handleStopClick = () => {
    sfx.playClick();
    onStop();
  };

  const isActive = isPlaying;

  const bgStyle = theme === 'chalkboard'
    ? 'bg-[#142620]/95 border-emerald-700/60 shadow-md'
    : theme === 'teal'
      ? 'bg-slate-900/90 border-teal-600/40 shadow-md'
      : 'bg-slate-900/90 border-slate-700 shadow-md';

  return (
    <div className={`p-1.5 sm:p-2 rounded-xl border transition-all inline-flex items-center gap-1.5 ${bgStyle}`}>
      {/* Optional Title icon when title provided */}
      {title && (
        <div className="flex items-center gap-1.5 pl-1 hidden sm:flex text-xs font-bold text-slate-200 truncate max-w-[140px]">
          <Volume2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">{title}</span>
        </div>
      )}

      {/* 1. زر ترجيع (Rewind ⏪) */}
      <button
        onClick={handleRewindClick}
        disabled={!isActive || currentIndex <= 0}
        className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed text-amber-300 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-sm border border-slate-700/80"
        title="ترجيع (الجملة السابقة) ⏪"
      >
        <Rewind className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">ترجيع</span>
      </button>

      {/* 2. زر القراءة / الإيقاف المؤقت / المتابعة (Play/Pause/Resume) */}
      <button
        onClick={handleTogglePlayPause}
        className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 ${
          !isActive
            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-1 ring-amber-300'
            : isPaused
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-300'
              : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-1 ring-rose-300'
        }`}
        title={!isActive ? 'قراءة الدرس' : isPaused ? 'متابعة القراءة' : 'إيقاف مؤقت'}
      >
        {!isActive ? (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>قراءة</span>
          </>
        ) : isPaused ? (
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

      {/* 3. زر تقديم (Forward ⏩) */}
      <button
        onClick={handleForwardClick}
        disabled={!isActive || (totalSentences > 0 && currentIndex >= totalSentences - 1)}
        className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed text-amber-300 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-sm border border-slate-700/80"
        title="تقديم (الجملة التالية) ⏩"
      >
        <span className="hidden md:inline text-[11px]">تقديم</span>
        <FastForward className="w-3.5 h-3.5" />
      </button>

      {/* 4. زر إيقاف كامل (Stop ⏹️) */}
      {isActive && (
        <button
          onClick={handleStopClick}
          className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-all active:scale-95"
          title="إيقاف كامل ⏹️"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      )}

      {/* 5. عداد الخطوات والجمل الصغير */}
      {isActive && totalSentences > 0 && (
        <span className="text-[10px] font-mono text-amber-300 font-bold bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
          {currentIndex + 1}/{totalSentences}
        </span>
      )}
    </div>
  );
};
