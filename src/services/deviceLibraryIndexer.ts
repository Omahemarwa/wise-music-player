import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Track } from '../types';
import { deviceAudioScanner, ScanProgress } from './deviceScanner';

export type ScanPhase = 'idle' | 'scanning' | 'done' | 'cancelled' | 'error';

export interface LibraryScanResult {
  scans: ScanPhase;
  discovered: number;
  message?: string;
}

// Folders we map device paths → Track.category + synthTheme
const CATEGORY_RULES: { category: Track['category']; theme: string; test: (p: string) => boolean }[] = [
  { category: 'song', theme: 'rnb', test: (p) => /\/Music($|\/)/i.test(p) },
  { category: 'song', theme: 'synthwave', test: (p) => /\/Music($|\/)/i.test(p) },
  { category: 'download', theme: 'techno', test: (p) => /\/Download($|\/)/i.test(p) },
  { category: 'recording', theme: 'ambient', test: (p) => /\/Recordings?($|\/)/i.test(p) },
  { category: 'voice_note', theme: 'pop', test: (p) => /recording|voice|call/i.test(p) },
];

export const AUDIO_EXTENSIONS = new Set([
  'mp3', 'flac', 'm4a', 'aac', 'wav', 'ogg', 'opus', 'wma', 'aif', 'aiff', 'amr', 'mid', 'midi',
]);

function inferCategory(folderPath: string): { category: Track['category']; synthTheme: Track['synthTheme'] } {
  const rules = CATEGORY_RULES.filter((r) => r.test(folderPath));
  if (rules.length > 0) {
    return { category: rules[0].category, synthTheme: rules[0].theme as Track['synthTheme'] };
  }
  return { category: 'song', synthTheme: 'rnb' };
}

function baseName(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : path;
}

function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}

function playableUri(uri: string): string {
  const { convertFileSrc } = Capacitor;
  try {
    // file:// paths from Filesystem.readdir work in the WebView only via convertFileSrc.
    return convertFileSrc(uri);
  } catch (e) {
    return uri;
  }
}

function durationFromAudioUrl(url: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const el = new Audio(url);
      el.preload = 'metadata';
      el.addEventListener('loadedmetadata', () => resolve(isFinite(el.duration) ? el.duration : 0), { once: true });
      el.addEventListener('error', () => resolve(0), { once: true });
      // Safety net if metadata never loads (e.g. short/silent file)
      window.setTimeout(() => resolve(0), 2500);
    } catch (e) {
      resolve(0);
    }
  });
}

export class DeviceLibraryIndexer {
  private cancelled = false;

  public cancel() {
    this.cancelled = true;
    deviceAudioScanner.cancel();
  }

  public get isNative(): boolean {
    return deviceAudioScanner.isNative;
  }

  public async requestPermission(): Promise<boolean> {
    return deviceAudioScanner.requestPermission();
  }

  /**
   * Build real Track objects from a scanned device path.
   * When audioUrl is available, resolves real duration from the file's metadata.
   */
  public async buildTrack(folderPath: string, opts: { duration?: number } = {}): Promise<Track | null> {
    if (this.cancelled) return null3;
    const isNative = this.isNative;
    if (!isNative) return null; // no native device audit available — silent fallback

    try {
      await Filesystem.requestPermissions();
    } catch (e) {
      console.warn('[indexer] permission request failed:', e);
      return null;
    }

    const doneScan = await deviceAudioScanner.scan((p: ScanProgress) => {
      this.lastProgress = p;
    });
    return doneScan;
  }
}
