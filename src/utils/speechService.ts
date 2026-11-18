// Robust Offline Web Speech API Manager with sentence chunking
// Supports Play, Pause, Resume, Fast-Forward, and Rewind across all browsers
// Solves Chromium Android / Desktop 15-second speech cutoff bug for full-page reading

export interface SpeechPlaybackState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentIndex: number;
  total: number;
  currentSentence: string;
}

// Normalize mathematical expressions and split text into natural Arabic sentences.
// Exported so UI timeline builders produce 100% identical sentence indices.
export function normalizeAndSplitSpeechSentences(text: string): string[] {
  if (!text) return [];
  // 1. Prevent clock time interpretation (e.g. "24: 15" -> "24 ثم 15") so TTS never says "15 دقيقة"!
  const cleaned = text
    .replace(/(\d+)\s*:\s*(\d+)/g, '$1 ثم $2')
    .replace(/:\s*(\d+)/g, ' ، $1')
    .replace(/(\d+)\s*:\s*/g, '$1 ، ')
    // 2. Specific fraction phonetics (Lesson 1 & common rational fractions)
    .replace(/15\/24/g, 'خمسة عشر على أربعة وعشرين')
    .replace(/4\/24/g, 'أربعة على أربعة وعشرين')
    .replace(/11\/24/g, 'أحد عشر على أربعة وعشرين')
    .replace(/21\/24/g, 'واحد وعشرون على أربعة وعشرين')
    .replace(/28\/24/g, 'ثمانية وعشرون على أربعة وعشرين')
    .replace(/40\/24/g, 'أربعون على أربعة وعشرين')
    .replace(/9\/24/g, 'تسعة على أربعة وعشرين')
    .replace(/10\/12/g, 'عشرة على اثني عشر')
    .replace(/9\/12/g, 'تسعة على اثني عشر')
    .replace(/19\/12/g, 'تسعة عشر على اثني عشر')
    .replace(/20\/12/g, 'عشرون على اثني عشر')
    .replace(/21\/12/g, 'واحد وعشرون على اثني عشر')
    .replace(/-1\/12/g, 'ناقص واحد على اثني عشر')
    .replace(/-9\/7/g, 'ناقص تسعة على سبعة')
    .replace(/9\/7/g, 'تسعة على سبعة')
    .replace(/5\/7/g, 'خمسة على سبعة')
    .replace(/-4\/7/g, 'ناقص أربعة على سبعة')
    .replace(/4\/7/g, 'أربعة على سبعة')
    .replace(/5\/8/g, 'خمسة أثمان')
    .replace(/4\/8/g, 'أربعة أثمان')
    .replace(/9\/8/g, 'تسعة أثمان')
    .replace(/1\/6/g, 'سدس')
    .replace(/-3\/6/g, 'ناقص ثلاثة على ستة')
    .replace(/10\/6/g, 'عشرة على ستة')
    .replace(/7\/6/g, 'سبعة على ستة')
    .replace(/1\/2/g, 'نصف')
    .replace(/-1\/2/g, 'ناقص نصف')
    .replace(/3\/4/g, 'ثلاثة أرباع')
    .replace(/5\/6/g, 'خمسة أسداس')
    .replace(/5\/3/g, 'خمسة أثلاث')
    .replace(/5\/9/g, 'خمسة أتساع')
    .replace(/1\/3/g, 'ثلث')
    .replace(/3\/9/g, 'ثلاثة أتساع')
    .replace(/8\/9/g, 'ثمانية أتساع')
    .replace(/3\/5/g, 'ثلاثة أخماس')
    .replace(/6\/5/g, 'ستة أخماس')
    .replace(/9\/5/g, 'تسعة أخماس')
    .replace(/10\/5/g, 'عشرة أخماس')
    .replace(/1\/5/g, 'خمس')
    .replace(/-2\/5/g, 'ناقص خمسان')
    .replace(/-7\/5/g, 'ناقص سبعة أخماس')
    .replace(/-3\/5/g, 'ناقص ثلاثة أخماس')
    .replace(/-10\/5/g, 'ناقص عشرة على خمسة')
    .replace(/-7\/3/g, 'ناقص سبعة على ثلاثة')
    .replace(/0\.5\/3/g, 'نصف على ثلاثة')
    .replace(/-6\.5\/3/g, 'ناقص ستة ونصف على ثلاثة')
    .replace(/7\/8/g, 'سبعة على ثمانية')
    // 3. Compound and algebraic fractions into clear spoken Arabic
    .replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, ' $1 الكل على $2 ')
    .replace(/\(([^()]+)\)\s*\/\s*([a-zA-Z0-9\.\-]+)/g, ' $1 الكل على $2 ')
    .replace(/([a-zA-Z0-9\.\-]+)\s*\/\s*\(([^()]+)\)/g, ' $1 على $2 ')
    .replace(/\ba\/b\b/g, ' a على b ')
    .replace(/\bc\/b\b/g, ' c على b ')
    .replace(/\bc\/d\b/g, ' c على d ')
    .replace(/\bb\/a\b/g, ' b على a ')
    .replace(/\bd\/c\b/g, ' d على c ')
    .replace(/\by\/x\b/g, ' y على x ')
    // 4. Separate algebraic coefficients & powers (e.g. 3x -> 3 x, x^2 -> x مربع)
    .replace(/(\d+(?:\.\d+)?)([a-zA-Z])\b/g, '$1 $2')
    .replace(/\^2\b|\^\(2\)|²/g, ' مربع ')
    .replace(/\^3\b|\^\(3\)|³/g, ' مكعب ')
    .replace(/\^n\b|\^\(n\)/g, ' أس n ')
    .replace(/\^\((-?[a-zA-Z0-9+\-]+)\)/g, ' أس $1 ')
    .replace(/\^(-?[a-zA-Z0-9]+)/g, ' أس $1 ')
    .replace(/√\(([^()]+)\)/g, ' الجذر التربيعي لـ $1 ')
    .replace(/√([a-zA-Z0-9]+)/g, ' الجذر التربيعي لـ $1 ')
    // 5. Mathematical & comparison operators
    .replace(/≠/g, ' لا يساوي ')
    .replace(/≈/g, ' يساوي تقريباً ')
    .replace(/≤/g, ' أصغر أو يساوي ')
    .replace(/≥/g, ' أكبر أو يساوي ')
    .replace(/➔|->|=>/g, ' وبالتالي ')
    .replace(/</g, ' أصغر من ')
    .replace(/>/g, ' أكبر من ')
    .replace(/[-–—]/g, ' ناقص ')
    .replace(/\+/g, ' زائد ')
    .replace(/×/g, ' ضرب ')
    .replace(/÷/g, ' تقسيم ')
    .replace(/=/g, ' يساوي ')
    .replace(/\|/g, ' . ')
    .replace(/\//g, ' على ')
    .replace(/[()[\]]/g, ' ')
    .replace(/[✅📌🎯★💡🥤📖🏫⭐⚡🔢📘📝🎙️🔍🎥]/g, '')
    .replace(/[\r\n]+/g, ' . ')
    .replace(/\s+/g, ' ');

  // Match chunks ending with punctuation or boundary
  const matches = cleaned.match(/[^.،؛!?\n]+[.،؛!?\n]*/g);
  if (!matches || matches.length === 0) {
    const t = cleaned.trim();
    return t && t.replace(/[\s.،؛!?\-–—:]+/g, '').length > 0 ? [t] : [];
  }

  return matches
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.replace(/[\s.،؛!?\-–—:]+/g, '').length > 0);
}

export class OfflineSpeechManager {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private currentRate = 0.9;
  private onEndCallback: (() => void) | null = null;
  private onStateChangeCallback: ((speaking: boolean) => void) | null = null;
  private onSentenceCallback: ((sentence: string, index: number, total: number) => void) | null = null;
  private onProgressCallback: ((sentenceIndex: number, progressRatio: number, sentence: string) => void) | null = null;
  private onPlaybackStateCallback: ((state: SpeechPlaybackState) => void) | null = null;
  private queue: string[] = [];
  private currentSentenceIndex = 0;
  private currentText = '';
  private progressTimer: number | null = null;
  private sentenceTimeout: number | null = null;
  private pendingStartTimeout: number | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private playbackSessionId = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  setOnStateChange(cb: (speaking: boolean) => void) {
    this.onStateChangeCallback = cb;
  }

  setOnSentence(cb: (sentence: string, index: number, total: number) => void) {
    this.onSentenceCallback = cb;
  }

  setOnProgress(cb: (sentenceIndex: number, progressRatio: number, sentence: string) => void) {
    this.onProgressCallback = cb;
  }

  setOnPlaybackState(cb: (state: SpeechPlaybackState) => void) {
    this.onPlaybackStateCallback = cb;
  }

  isSupported(): boolean {
    return !!this.synth;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  getCurrentIndex(): number {
    return this.currentSentenceIndex;
  }

  getTotalSentences(): number {
    return this.queue.length;
  }

  getCurrentSentence(): string {
    return this.queue[this.currentSentenceIndex] || '';
  }

  private notifyPlaybackState() {
    const state: SpeechPlaybackState = {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      currentIndex: this.currentSentenceIndex,
      total: this.queue.length,
      currentSentence: this.getCurrentSentence()
    };
    if (this.onPlaybackStateCallback) {
      this.onPlaybackStateCallback(state);
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.isSpeaking && !this.isPaused);
    }
  }

  private splitIntoSentences(text: string): string[] {
    return normalizeAndSplitSpeechSentences(text);
  }

  // Internally break long sentences into <=12-word utterances so Chrome Android NEVER cuts off at 15s
  private splitIntoSubChunks(sentence: string, maxWords: number = 12): string[] {
    const words = sentence.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords + 2) {
      return [sentence];
    }
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
    }
    return chunks;
  }

  private clearTimers() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    if (this.sentenceTimeout) {
      clearTimeout(this.sentenceTimeout);
      this.sentenceTimeout = null;
    }
    if (this.pendingStartTimeout) {
      clearTimeout(this.pendingStartTimeout);
      this.pendingStartTimeout = null;
    }
    this.activeUtterance = null;
  }

  speak(text: string, rate: number = 0.9, onEnd?: () => void) {
    const sentences = this.splitIntoSentences(text);
    this.speakSentences(sentences, rate, onEnd, text);
  }

  speakSentences(sentences: string[], rate: number = 0.9, onEnd?: () => void, rawText?: string) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.stop();

    const cleanQueue = sentences
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.replace(/[\s.،؛!?\-–—:]+/g, '').length > 0);

    if (cleanQueue.length === 0) {
      if (onEnd) onEnd();
      return;
    }

    const sessionId = ++this.playbackSessionId;
    this.currentText = rawText ?? cleanQueue.join(' ');
    this.currentRate = rate;
    this.onEndCallback = onEnd || null;

    this.queue = cleanQueue;
    this.currentSentenceIndex = 0;
    this.isSpeaking = true;
    this.isPaused = false;
    this.notifyPlaybackState();

    // Small delay after synth.cancel() so Chromium flushes prior utterances cleanly before speaking
    this.pendingStartTimeout = window.setTimeout(() => {
      if (sessionId !== this.playbackSessionId || !this.isSpeaking || this.isPaused) return;
      this.speakCurrentSentence(sessionId);
    }, 60);
  }

  private speakCurrentSentence(sessionId: number = this.playbackSessionId) {
    this.clearTimers();

    if (sessionId !== this.playbackSessionId || !this.synth || !this.isSpeaking || this.isPaused) {
      return;
    }

    if (this.currentSentenceIndex >= this.queue.length) {
      const finishEnd = this.onEndCallback;
      this.stop();
      if (finishEnd) finishEnd();
      return;
    }

    const sentence = this.queue[this.currentSentenceIndex];
    if (this.onSentenceCallback) {
      this.onSentenceCallback(sentence, this.currentSentenceIndex, this.queue.length);
    }
    this.notifyPlaybackState();

    const subChunks = this.splitIntoSubChunks(sentence, 12);
    this.speakSubChunk(sentence, subChunks, 0, sessionId);
  }

  private speakSubChunk(
    fullSentence: string,
    subChunks: string[],
    subIndex: number,
    sessionId: number
  ) {
    this.clearTimers();

    if (sessionId !== this.playbackSessionId || !this.synth || !this.isSpeaking || this.isPaused) {
      return;
    }

    if (subIndex >= subChunks.length) {
      this.currentSentenceIndex++;
      this.pendingStartTimeout = window.setTimeout(() => {
        if (sessionId !== this.playbackSessionId) return;
        this.speakCurrentSentence(sessionId);
      }, 90);
      return;
    }

    const chunkText = subChunks[subIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    // Retain instance reference to avoid Chromium GC dropping utterance.onend mid-playback
    this.activeUtterance = utterance;

    const voices = this.synth.getVoices() || [];
    const arabicVoice = voices.find(v => v.lang.startsWith('ar')) || null;
    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = arabicVoice.lang;
    } else {
      utterance.lang = 'ar-SA';
    }

    utterance.rate = this.currentRate;
    utterance.pitch = 1.0;

    let handled = false;
    const startTime = Date.now();
    const wordCount = chunkText.split(/\s+/).filter(Boolean).length;
    const effectiveWps = Math.max(1.05, 1.65 * Math.min(1.1, this.currentRate));
    const expectedDurationMs = Math.max(2500, (wordCount / effectiveWps) * 1000 + 1200);

    const reportCombinedProgress = (localRatio: number) => {
      if (
        sessionId === this.playbackSessionId &&
        this.onProgressCallback &&
        this.isSpeaking &&
        !this.isPaused
      ) {
        const clampedLocal = Math.min(1.0, Math.max(0.0, localRatio));
        const combined = (subIndex + clampedLocal) / subChunks.length;
        this.onProgressCallback(
          this.currentSentenceIndex,
          Math.min(1.0, Math.max(0.0, combined)),
          fullSentence
        );
      }
    };

    reportCombinedProgress(0.0);

    this.progressTimer = window.setInterval(() => {
      if (sessionId !== this.playbackSessionId || !this.isSpeaking || this.isPaused) {
        if (this.progressTimer) clearInterval(this.progressTimer);
        return;
      }
      const elapsed = Date.now() - startTime;
      reportCombinedProgress(elapsed / expectedDurationMs);
    }, 80);

    utterance.onboundary = (event) => {
      if (sessionId !== this.playbackSessionId) return;
      if (event.name === 'word' && chunkText.length > 0) {
        reportCombinedProgress(event.charIndex / chunkText.length);
      }
    };

    const advanceSub = () => {
      if (handled || sessionId !== this.playbackSessionId) return;
      handled = true;
      this.clearTimers();
      if (this.isSpeaking && !this.isPaused) {
        this.pendingStartTimeout = window.setTimeout(() => {
          if (sessionId !== this.playbackSessionId) return;
          this.speakSubChunk(fullSentence, subChunks, subIndex + 1, sessionId);
        }, 70);
      }
    };

    utterance.onend = () => {
      advanceSub();
    };

    utterance.onerror = () => {
      advanceSub();
    };

    // Reliable watchdog fallback when mobile engines drop onend
    this.sentenceTimeout = window.setTimeout(() => {
      if (!handled && sessionId === this.playbackSessionId && this.isSpeaking && !this.isPaused) {
        advanceSub();
      }
    }, expectedDurationMs + 3500);

    try {
      this.synth.speak(utterance);
    } catch {
      advanceSub();
    }
  }

  pause() {
    if (!this.isSpeaking || this.isPaused) return;
    this.playbackSessionId++;
    this.clearTimers();
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPaused = true;
    this.notifyPlaybackState();
  }

  resume() {
    if (!this.isSpeaking || !this.isPaused) return;
    this.isPaused = false;
    const sessionId = ++this.playbackSessionId;
    this.notifyPlaybackState();
    this.pendingStartTimeout = window.setTimeout(() => {
      if (sessionId !== this.playbackSessionId || !this.isSpeaking || this.isPaused) return;
      this.speakCurrentSentence(sessionId);
    }, 55);
  }

  togglePlayPause() {
    if (!this.isSpeaking) {
      if (this.currentText) {
        this.speak(this.currentText, this.currentRate, this.onEndCallback || undefined);
      }
      return;
    }
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  forward() {
    if (!this.isSpeaking || this.queue.length === 0) return;
    if (this.currentSentenceIndex < this.queue.length - 1) {
      this.currentSentenceIndex++;
      const sessionId = ++this.playbackSessionId;
      this.clearTimers();
      if (this.synth) {
        this.synth.cancel();
      }
      if (!this.isPaused) {
        this.notifyPlaybackState();
        this.pendingStartTimeout = window.setTimeout(() => {
          if (sessionId !== this.playbackSessionId) return;
          this.speakCurrentSentence(sessionId);
        }, 55);
      } else {
        const sentence = this.queue[this.currentSentenceIndex];
        if (this.onSentenceCallback) {
          this.onSentenceCallback(sentence, this.currentSentenceIndex, this.queue.length);
        }
        this.notifyPlaybackState();
      }
    }
  }

  rewind() {
    if (!this.isSpeaking || this.queue.length === 0) return;
    if (this.currentSentenceIndex > 0) {
      this.currentSentenceIndex--;
    }
    const sessionId = ++this.playbackSessionId;
    this.clearTimers();
    if (this.synth) {
      this.synth.cancel();
    }
    if (!this.isPaused) {
      this.notifyPlaybackState();
      this.pendingStartTimeout = window.setTimeout(() => {
        if (sessionId !== this.playbackSessionId) return;
        this.speakCurrentSentence(sessionId);
      }, 55);
    } else {
      const sentence = this.queue[this.currentSentenceIndex];
      if (this.onSentenceCallback) {
        this.onSentenceCallback(sentence, this.currentSentenceIndex, this.queue.length);
      }
      this.notifyPlaybackState();
    }
  }

  stop() {
    this.playbackSessionId++;
    this.clearTimers();
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.queue = [];
    this.currentSentenceIndex = 0;
    this.notifyPlaybackState();
  }
}

export const speechManager = new OfflineSpeechManager();
