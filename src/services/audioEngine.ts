import { Track } from '../types';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private currentTrack: Track | null = null;
  private currentTime: number = 0;
  private timerInterval: number | null = null;
  private volume: number = 0.85;
  private analyser: AnalyserNode | null = null;

  // Synthesizer state
  private synthInterval: number | null = null;
  private synthGainNode: GainNode | null = null;
  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  private onTrackEndedCallback?: () => void;

  constructor() {
    // Lazy init
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.synthGainNode = this.audioCtx.createGain();
      this.synthGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.synthGainNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setCallbacks(
    onTimeUpdate: (time: number, duration: number) => void,
    onEnded: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onTrackEndedCallback = onEnded;
  }

  public playTrack(track: Track, startTime: number = 0) {
    this.stopCurrent();
    this.currentTrack = track;
    this.currentTime = startTime;
    this.isPlaying = true;

    if (track.audioUrl) {
      // Real audio element for uploaded or media files
      this.playAudioUrl(track.audioUrl, startTime);
    } else {
      // Procedural synthesizer for built-in catalog tracks
      this.playSynthesizedTrack(track, startTime);
    }

    this.startTimer();
  }

  private playAudioUrl(url: string, startTime: number) {
    try {
      this.initAudioContext();
      this.currentAudioElement = new Audio(url);
      this.currentAudioElement.volume = this.volume;
      this.currentAudioElement.currentTime = startTime;

      this.currentAudioElement.addEventListener('ended', () => {
        this.stopCurrent();
        if (this.onTrackEndedCallback) {
          this.onTrackEndedCallback();
        }
      });

      this.currentAudioElement.addEventListener('timeupdate', () => {
        if (this.currentAudioElement) {
          this.currentTime = this.currentAudioElement.currentTime;
          if (this.onTimeUpdateCallback && this.currentTrack) {
            this.onTimeUpdateCallback(this.currentTime, this.currentTrack.duration);
          }
        }
      });

      this.currentAudioElement.play().catch((err) => {
        console.warn('Audio play auto-play block, user interaction needed:', err);
      });
    } catch (e) {
      console.error('Failed to play audio url:', e);
    }
  }

  private playSynthesizedTrack(track: Track, startTime: number) {
    this.initAudioContext();
    if (!this.audioCtx || !this.synthGainNode) return;

    // Musical note sets based on theme
    const themes = {
      rnb: [130.81, 164.81, 196.0, 246.94, 293.66, 329.63, 392.0], // C major / A minor pentatonic smooth
      synthwave: [110.0, 130.81, 146.83, 164.81, 220.0, 261.63, 329.63], // A minor retro
      ambient: [146.83, 174.61, 220.0, 261.63, 293.66, 349.23, 440.0], // D minor dreamy
      techno: [98.0, 123.47, 146.83, 196.0, 246.94, 293.66], // G minor drive
      lofi: [174.61, 220.0, 261.63, 329.63, 392.0, 440.0], // F maj7 warm
      pop: [130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 329.63],
    };

    const scale = themes[track.synthTheme || 'rnb'] || themes.rnb;
    let step = Math.floor(startTime * 2);

    this.synthInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.audioCtx || !this.synthGainNode) return;

      const now = this.audioCtx.currentTime;
      step++;

      // Bass note on downbeats
      if (step % 2 === 0) {
        const bassFreq = scale[step % scale.length] / 2;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = track.synthTheme === 'synthwave' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(bassFreq, now);

        gain.gain.setValueAtTime(0.18 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.synthGainNode);
        osc.start(now);
        osc.stop(now + 0.46);
      }

      // Chord / Melody arp
      const noteFreq = scale[(step * 3) % scale.length];
      const leadOsc = this.audioCtx.createOscillator();
      const leadGain = this.audioCtx.createGain();

      leadOsc.type = 'sine';
      leadOsc.frequency.setValueAtTime(noteFreq, now);

      leadGain.gain.setValueAtTime(0.12 * this.volume, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      leadOsc.connect(leadGain);
      leadGain.connect(this.synthGainNode);
      leadOsc.start(now);
      leadOsc.stop(now + 0.36);

      // Subtle kick / hihat on rhythm
      if (step % 4 === 0) {
        // Kick
        const kickOsc = this.audioCtx.createOscillator();
        const kickGain = this.audioCtx.createGain();
        kickOsc.frequency.setValueAtTime(120, now);
        kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
        kickGain.gain.setValueAtTime(0.25 * this.volume, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        kickOsc.connect(kickGain);
        kickGain.connect(this.synthGainNode);
        kickOsc.start(now);
        kickOsc.stop(now + 0.14);
      }
    }, 450); // ~133 BPM 8th notes
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = window.setInterval(() => {
      if (!this.isPlaying || !this.currentTrack) return;

      // If playing synthetic track or html5 audio
      if (!this.currentAudioElement) {
        this.currentTime += 0.5;
        if (this.currentTime >= this.currentTrack.duration) {
          this.currentTime = this.currentTrack.duration;
          this.stopCurrent();
          if (this.onTrackEndedCallback) {
            this.onTrackEndedCallback();
          }
          return;
        }
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.currentTime, this.currentTrack.duration);
        }
      }
    }, 500);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public pause() {
    this.isPlaying = false;
    this.stopTimer();
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    }
  }

  public resume() {
    if (!this.currentTrack) return;
    this.isPlaying = true;
    if (this.currentAudioElement) {
      this.currentAudioElement.play().catch(console.warn);
    } else {
      this.playSynthesizedTrack(this.currentTrack, this.currentTime);
    }
    this.startTimer();
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.currentTrack?.duration || 100));
    if (this.currentAudioElement) {
      this.currentAudioElement.currentTime = this.currentTime;
    } else if (this.isPlaying && this.currentTrack) {
      if (this.synthInterval) {
        clearInterval(this.synthInterval);
      }
      this.playSynthesizedTrack(this.currentTrack, this.currentTime);
    }
    if (this.onTimeUpdateCallback && this.currentTrack) {
      this.onTimeUpdateCallback(this.currentTime, this.currentTrack.duration);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.synthGainNode && this.audioCtx) {
      this.synthGainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.volume;
    }
  }

  public stopCurrent() {
    this.isPlaying = false;
    this.stopTimer();
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.src = '';
      this.currentAudioElement = null;
    }
  }

  public getVisualizerData(): number[] {
    if (!this.analyser || !this.isPlaying) {
      return [12, 18, 14, 20, 16, 24, 15, 10];
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    const bars: number[] = [];
    const step = Math.floor(dataArray.length / 8);
    for (let i = 0; i < 8; i++) {
      bars.push(Math.max(6, Math.round((dataArray[i * step] / 255) * 32)));
    }
    return bars;
  }
}

export const audioEngine = new AudioEngine();
