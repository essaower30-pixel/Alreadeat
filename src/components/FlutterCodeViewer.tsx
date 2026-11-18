import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Terminal, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { FLUTTER_CODE_SNIPPET } from '../data/flutterCode';
import { sfx } from '../utils/soundEffects';

export const FlutterCodeViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(FLUTTER_CODE_SNIPPET);
    setCopied(true);
    sfx.playSuccessSound();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    sfx.playClick();
    const element = document.createElement('a');
    const file = new Blob([FLUTTER_CODE_SNIPPET], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'main.dart';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Code Header & Features Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>كود Flutter الكامل لتطبيق الدرس (Offline Mode)</span>
              <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                Flutter 3.x / Dart 3
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              واجهة متكاملة جاهزة للنسخ والتشغيل الفوري في مشاريع فلاتر دون الحاجة لأي اتصال بالإنترنت
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ كود Flutter بنجاح!' : 'نسخ كود Flutter بالكامل'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>تحميل main.dart</span>
          </button>
        </div>
      </div>

      {/* Flutter Architecture & Setup Quick Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1.5">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>متوافق 100% مع Offline Mode</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            الدرس والمحتوى والسبورة ومحرك النطق الصوتي (TTS) يعمل محلياً بالكامل على جهاز المستخدم دون أي استهلاك للإنترنت أو خوادم خارجية.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1.5">
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>الأزرار التفاعلية المطلوبة</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            زران رئيسيان بارزان: "اقرأ الدرس" لعرض الشرح والخواص، و "السبورة التفاعلية" للاستماع للشرح الصوتي ورسم الحل خطوة بخطوة.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-1.5">
          <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
            <Terminal className="w-4 h-4" />
            <span>ملف pubspec.yaml</span>
          </div>
          <div className="text-[11px] font-mono bg-slate-900 p-2 rounded text-slate-300 dir-ltr">
            dependencies:<br />
            &nbsp;&nbsp;flutter: sdk: flutter<br />
            &nbsp;&nbsp;flutter_tts: ^3.8.5
          </div>
        </div>
      </div>

      {/* Code Display Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="font-mono text-slate-300 font-bold ml-2">lib/main.dart</span>
          </div>
          <span className="font-mono text-slate-500">Dart / Flutter 3.x</span>
        </div>

        <div className="p-4 md:p-6 overflow-x-auto max-h-[580px] overflow-y-auto">
          <pre className="font-mono text-xs md:text-sm text-slate-200 leading-relaxed dir-ltr selection:bg-teal-700">
            <code>{FLUTTER_CODE_SNIPPET}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
