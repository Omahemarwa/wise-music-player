import { Track } from '../types';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying = false;
  private currentTrack: Track | null = null;
  private currentTime = 0;
  private volume = 0.85;

  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  private onTrackEndedCallback?: () => void;

  // ---------------------------------------------------------------- context
  private initAudioContext(): void {
    if (!this.audioCtx) {
      const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
      this.audioCtx = new Ctx();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
  }

  public setCallbacks(
      onTimeUpdate: (time: number, duration: number) => void,
      onEnded: () => void
  ): void {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onTrackEndedCallback = onEnded;
  }

  // ---------------------------------------------------------------- playback
  public playTrack(track: Track, startTime = 0): void {
    this.stopCurrent();

    this.currentTrack = track;
    this.currentTime = startTime;

    if (!track.audioUrl) {
      console.warn('[audioEngine] Track has no playable audioUrl:', track.id);
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    this.playAudioUrl(track.audioUrl, startTime);
  }

  private playAudioUrl(url: string, startTime: number): void {
    try {
      this.initAudioContext();

      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = this.volume;
      this.currentAudioElement = audio;

      audio.addEventListener('loadedmetadata', () => {
        try {
          if (startTime > 0) audio.currentTime = startTime;
        } catch {
          /* ignore seek errors on non-seekable streams */
        }
      });

      audio.addEventListener('timeupdate', () => {
        if (!this.currentAudioElement) return;
        this.currentTime = this.currentAudioElement.currentTime;
        this.onTimeUpdateCallback?.(
            this.currentTime,
            this.currentAudioElement.duration || this.currentTrack?.duration || 0
        );
      });

      audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.onTrackEndedCallback?.();
      });

      audio.addEventListener('error', (e) => {
        console.warn('[audioEngine] Playback error:', e);
      });

      // Hook the analyser (best-effort — some content:// URIs may reject)
      if (this.audioCtx && this.analyser) {
        try {
          this.sourceNode = this.audioCtx.createMediaElementSource(audio);
          this.sourceNode.connect(this.analyser);
        } catch {
          // Visualizer falls back to the idle bars.
        }
      }

      void audio.play().catch((err) => {
        console.warn('[audioEngine] Autoplay blocked — user gesture needed:', err);
      });
    } catch (e) {
      console.error('[audioEngine] Failed to start playback:', e);
      this.isPlaying = false;
    }
  }

  // ---------------------------------------------------------------- controls
  public pause(): void {
    this.isPlaying = false;
    this.currentAudioElement?.pause();
  }

  public resume(): void {
    if (!this.currentTrack || !this.currentAudioElement) return;
    this.isPlaying = true;
    void this.currentAudioElement.play().catch(console.warn);
  }

  public seek(seconds: number): void {
    if (!this.currentTrack) return;
    const max =
        this.currentAudioElement?.duration || this.currentTrack.duration || 0;
    this.currentTime = Math.max(0, Math.min(seconds, max));

    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.currentTime = this.currentTime;
      } catch {
        /* ignore */
      }
    }
    this.onTimeUpdateCallback?.(this.currentTime, this.currentTrack.duration);
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentAudioElement) this.currentAudioElement.volume = this.volume;
  }

  public stopCurrent(): void {
    this.isPlaying = false;
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.src = '';
      } catch {
        /* ignore */
      }
      this.currentAudioElement = null;
    }
    this.sourceNode = null;
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