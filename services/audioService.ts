class AudioService {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public isMuted: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];

  init() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.connect(this.audioCtx.destination);

      // Initialize TTS
      if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {
          this.voices = speechSynthesis.getVoices();
        };
        this.voices = speechSynthesis.getVoices();
      }

    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
    }
  }

  speak(text: string, lang: 'en-US' | 'fr-CA') {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    
    speechSynthesis.cancel(); // Stop any previous speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    // Voice selection
    const preferredVoice = this.voices.find(voice => voice.lang === lang);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    } else {
       const fallbackVoice = this.voices.find(voice => voice.lang.startsWith(lang.substring(0, 2)));
       if(fallbackVoice) utterance.voice = fallbackVoice;
    }
    
    utterance.rate = 1.1;
    utterance.pitch = 1;

    speechSynthesis.speak(utterance);
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.5) {
    if (!this.audioCtx || !this.masterGain || this.isMuted) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(this.audioCtx.currentTime);
    oscillator.stop(this.audioCtx.currentTime + duration);
  }

  playPickupSound() {
    this.playTone(880, 0.1, 'triangle', 0.3);
    this.playTone(1046, 0.1, 'triangle', 0.3);
  }

  playSellSound() {
    this.playTone(523, 0.1, 'square', 0.4);
    setTimeout(() => this.playTone(659, 0.1, 'square', 0.4), 80);
    setTimeout(() => this.playTone(784, 0.1, 'square', 0.4), 160);
    setTimeout(() => this.playTone(1046, 0.15, 'square', 0.4), 240);
  }
  
  playUpgradeSound() {
    this.playTone(600, 0.3, 'sawtooth', 0.5);
    this.playTone(800, 0.3, 'sawtooth', 0.5);
  }

  playBoostSound() {
    this.playTone(520, 0.18, 'sawtooth', 0.35);
    setTimeout(() => this.playTone(980, 0.2, 'square', 0.28), 90);
  }

  playTrainDing() {
    this.playTone(1200, 0.2, 'sine', 0.6);
    setTimeout(() => this.playTone(1200, 0.2, 'sine', 0.6), 300);
  }

  playSingleSellPop() {
    this.playTone(1250, 0.05, 'triangle', 0.3);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.masterGain?.gain.setValueAtTime(0, this.audioCtx?.currentTime || 0);
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    } else {
      this.masterGain?.gain.setValueAtTime(1, this.audioCtx?.currentTime || 0);
    }
  }
}

export const audioService = new AudioService();