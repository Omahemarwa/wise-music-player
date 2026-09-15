import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Track } from '../types';

// Walk the real external-storage audio folders on Android and build playable
// Track objects. CONVERT_FILE_SRC ensures the Capacitor WebView can <audio>-play
// the device file (http://localhost/_capacitor_file_/... — not a fake URL).

const AUDIO_EXTENSIONS = new Set(['mp3', 'flac', 'm4a', 'aac', 'wav', 'ogg', 'opus', 'wma', 'aiff', 'aif', 'amr', 'mid', 'midi']);

const SCAN_ROOTS = [
  '/storage/emulated/0/Music',
  '/storage/emulated/0/Download',
  '/storage/emulated/0/Recordings',
  '/storage/emulated/0/Podcasts',
  '/storage/emulated/0/Ringtones',
];

const MAX_FILE_COUNT = 520;
const MAX_DEPTH = 5;

function folderToCategory(dirPath: string): Track['category'] {
  if (dirPath.includes('/Music/')) return 'song';
  if (dirPath.includes('/Download/')) return 'download';
  if (dirPath.includes('/Recordings/')) return 'voice_note';
  return 'song';
}

export interface ScanProgress {
  scanned: number;
  discovered: number;
  phase: 'scan' | 'done' | 'cancelled' | 'error';
  message?: string;
}

export class DeviceAudioScanner {
  private cancelled = false;

  public get env(): string {
    return Capacitor.getPlatform();
  }

  public get isNative(): boolean {
    return this.env === 'android' || this.env === 'ios';
  }

  public cancel() {
    this.cancelled = true;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      await Filesystem.requestPermissions();
      return true;
    } catch (e) {
      console.warn('[deviceScanner] Storage permission error:', e);
      return false;
    }
  }

  public async scanDeviceAudio(onProgress: (p: ScanProgress) => void): Promise<void> {
    this.cancelled = false;

    if (!this.isNative) {
      onProgress({ scanned: 0, discovered: 0, phase: 'error', message: 'Full device scanning requires the native Android app — use Import for a single file here.' });
      return;
    }

    const granted = await this.requestPermission();
    if (!granted) {
      onProgress({ scanned: 0, discovered: 0, phase: 'error', message: 'Storage permission denied' });
      return;
    }

    const found: Track[] = [];
    let scanned = 0;

    const walk = async (dirPath: string, depth: number): Promise<void> => {
      if (this.cancelled) return;
      if (depth > MAX_DEPTH) return;
      if (found.length >= MAX_FILE_COUNT) return;

      let entries;
      try {
        entries = await Filesystem.readdir({ path: dirPath, directory: Directory.ExternalStorage });
      } catch (e) {
        return; // unreadable directory — skip silently
      }

      for (const entry of entries) {
        if (this.cancelled) return;

        const fullPath = `${dirPath}/${entry.name}`;

        if (entry.type === 'directory') {
          if (!entry.name.startsWith('.')) {
            await walk(fullPath, depth + 1);
          }
        } else if (entry.type === 'file') {
          const ext = entry.name.split('.').pop()?.toLowerCase() ?? '';
          if (!AUDIO_EXTENSIONS.has(ext)) continue;

          scanned++;
          if (scanned % 10 === 0 || scanned % 25 === 0) {
            const message = `Found ${found.length} audio files`;
            onProgress({ scanned, discovered: found.length, phase: 'scan', message });
          }

          const title = entry.name.replace(/\.[^/.]+$/, '');
          found.push({
            id: `device-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: title || entry.name,
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0, // metadata read after selection via audio element
            coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
            audioUrl: fullPath,
            format: ext as Track['format'],
            bitrate: undefined,
            isFavorite: false,
            playCount: 0,
            dateAdded: new Date().toISOString().split('T')[0],
            folderPath: dirPath,
            category: folderToCategory(dirPath),
          });
        }
      }
    };

    for (const root of SCAN_ROOTS) {
      if (this.cancelled) break;
      await walk(root, 0);
    }

    onProgress({
      scanned,
      discovered: found.length,
      phase: this.cancelled ? 'cancelled' : 'done',
      message: this.cancelled
        ? `Scan cancelled — ${found.length} audio files found`
        : `Scan complete — ${found.length} audio files found`,
    });
  }
}

export const deviceAudioScanner = new DeviceAudioScanner();
