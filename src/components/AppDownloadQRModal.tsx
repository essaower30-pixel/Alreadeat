import React, { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Smartphone,
  Share2,
  X,
  Link as LinkIcon,
  Globe,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sfx } from '../utils/soundEffects';

const SHARED_APP_URL = 'https://ais-pre-qfou2gwgoaptgtydfkbuct-105836077369.europe-west2.run.app';

function getDefaultDownloadUrl(): string {
  if (typeof window === 'undefined') return SHARED_APP_URL;
  const { hostname, origin } = window.location;
  const isLocalOrDevPreview =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('ais-dev-');
  return isLocalOrDevPreview ? SHARED_APP_URL : origin;
}

interface AppDownloadQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadQRModal: React.FC<AppDownloadQRModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [urlMode, setUrlMode] = useState<'shared' | 'current' | 'custom'>('shared');
  const [customUrl, setCustomUrl] = useState<string>(() => getDefaultDownloadUrl());
  const [copied, setCopied] = useState(false);
  const [downloadedPng, setDownloadedPng] = useState(false);
  const hiddenCanvasWrapRef = useRef<HTMLDivElement | null>(null);

  const currentOriginUrl = useMemo(() => {
    if (typeof window === 'undefined') return SHARED_APP_URL;
    return window.location.origin;
  }, []);

  const targetUrl = useMemo(() => {
    if (urlMode === 'current') return currentOriginUrl;
    if (urlMode === 'custom') return customUrl.trim() || SHARED_APP_URL;
    return getDefaultDownloadUrl();
  }, [urlMode, customUrl, currentOriginUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    sfx.playClick();
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      sfx.playSuccessSound();
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadQRImage = () => {
    sfx.playClick();
    const qrCanvas = hiddenCanvasWrapRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    // Compose a clean printable card with Arabic header + high-contrast QR + footer URL
    const outCanvas = document.createElement('canvas');
    outCanvas.width = 720;
    outCanvas.height = 880;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    // White card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

    // Top teal header bar
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(0, 0, outCanvas.width, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Cairo, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('منهاج الرياضيات السوري - الصف الثامن', outCanvas.width / 2, 58);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 24px Cairo, Arial, sans-serif';
    ctx.fillText('امسح الباركود بكاميرا الجوال لتحميل التطبيق وتشغيله أوفلاين', outCanvas.width / 2, 102);

    // Draw sharp QR code centered
    const qrSize = 520;
    const qrX = (outCanvas.width - qrSize) / 2;
    const qrY = 175;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Border frame around QR
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 4;
    ctx.strokeRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32);

    // Footer text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px Cairo, Arial, sans-serif';
    ctx.fillText('كتاب الطالب • السبورة الذكية • الشرح الصوتي الكامل', outCanvas.width / 2, 765);

    ctx.fillStyle = '#475569';
    ctx.font = '18px monospace';
    const shortUrl = targetUrl.length > 58 ? `${targetUrl.slice(0, 55)}...` : targetUrl;
    ctx.fillText(shortUrl, outCanvas.width / 2, 815);

    const link = document.createElement('a');
    link.download = 'barcode-syrian-math-grade8.png';
    link.href = outCanvas.toDataURL('image/png');
    link.click();
    setDownloadedPng(true);
    sfx.playSuccessSound();
    setTimeout(() => setDownloadedPng(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border-2 border-teal-500/50 rounded-3xl shadow-2xl overflow-hidden text-right animate-in zoom-in-95 duration-200 max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-l from-teal-700 via-teal-800 to-slate-900 px-4 py-3.5 flex items-center justify-between border-b border-teal-500/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-white text-sm sm:text-base leading-tight">
                باركود تحميل وتثبيت التطبيق
              </h2>
              <p className="text-[11px] text-teal-200">
                امسح الرمز بكاميرا أي هاتف لفتح وتثبيت التطبيق مباشرة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* High-Contrast QR Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-inner border-4 border-teal-500/30">
            <QRCodeSVG
              value={targetUrl}
              size={215}
              level="H"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
            <span className="mt-2.5 text-xs font-extrabold text-teal-900 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              منهاج الجبر السوري • الصف الثامن
            </span>
          </div>

          {/* Hidden high-res Canvas used cleanly for PNG export */}
          <div ref={hiddenCanvasWrapRef} className="hidden" aria-hidden="true">
            <QRCodeCanvas
              value={targetUrl}
              size={520}
              level="H"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>

          {/* URL Mode Switcher (Shared URL / Current Browser URL / Custom URL) */}
          <div className="space-y-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1 text-amber-300">
                <LinkIcon className="w-3.5 h-3.5" />
                رابط الباركود:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setUrlMode('shared');
                  }}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    urlMode === 'shared'
                      ? 'bg-teal-600 text-white font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  المشاركة العام
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setUrlMode('current');
                  }}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    urlMode === 'current'
                      ? 'bg-teal-600 text-white font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  الرابط الحالي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setUrlMode('custom');
                  }}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    urlMode === 'custom'
                      ? 'bg-teal-600 text-white font-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  رابط مخصص
                </button>
              </div>
            </div>

            {urlMode === 'custom' ? (
              <input
                type="url"
                dir="ltr"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-900 border border-teal-600/50 rounded-xl px-3 py-1.5 text-xs font-mono text-teal-200 focus:outline-none focus:border-amber-400"
              />
            ) : (
              <div
                dir="ltr"
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-teal-300 truncate text-center select-all"
              >
                {targetUrl}
              </div>
            )}
          </div>

          {/* Primary Actions: Download PNG + Copy Link */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadQRImage}
              className="px-3 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              {downloadedPng ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadedPng ? 'تم حفظ الصورة ✓' : 'حفظ صورة الباركود'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-teal-300" />}
              <span>{copied ? 'تم نسخ الرابط ✓' : 'نسخ رابط التحميل'}</span>
            </button>
          </div>

          {/* Direct Install / How Students Install After Scanning */}
          <div className="bg-emerald-950/50 border border-emerald-700/50 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>تثبيت التطبيق على الجوال (يعمل أوفلاين):</span>
              </span>
              {isInstalled && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">
                  مثبّت ✓
                </span>
              )}
            </div>

            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={async () => {
                  sfx.playClick();
                  await install();
                }}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>تثبيت التطبيق الآن على هذا الجهاز 📲</span>
              </button>
            )}

            {isIOS ? (
              <p className="text-[11px] text-slate-300 leading-relaxed flex items-start gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  على أجهزة <strong className="text-white">آيفون / آيباد</strong>: افتح الرابط في Safari ثم اضغط زر <strong className="text-amber-300">المشاركة (Share)</strong> واختر <strong className="text-emerald-300">إضافة إلى الشاشة الرئيسية</strong>.
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-300 leading-relaxed flex items-start gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-300 shrink-0 mt-0.5" />
                <span>
                  بعد مسح الباركود على الهاتف: اضغط <strong className="text-amber-300">«تثبيت التطبيق»</strong> أو من قائمة المتصفح (⋮) اختر <strong className="text-emerald-300">«الإضافة إلى الشاشة الرئيسية»</strong> ليُحفظ كتطبيق مستقل على الهاتف.
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
