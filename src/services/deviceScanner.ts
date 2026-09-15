import { Capacitor, registerPlugin } from '@capacitor/core';
import { Track } from '../types';

// ---------------------------------------------------------------------------
// Native plugin bridge
// ---------------------------------------------------------------------------

interface RawMediaStoreTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumId: number;
  durationMs: number;
  size: number;
  mimeType: string;
  path: string;
  dateAdded: number; // seconds since epoch
  displayName: string;
  contentUri: string;
  albumArtUri: string;
}

interface MediaStoreAudioPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  query(): Promise<{ tracks: RawMediaStoreTrack[] }>;
}

const MediaStoreAudio = registerPlugin<MediaStoreAudioPlugin>('MediaStoreAudio');

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ScanProgress {
  scanned: number;
  discovered: number;
  phase: 'scan' | 'done' | 'cancelled' | 'error';
  message?: string;
}

// Inline SVG placeholder so we don't depend on any remote image.
const PLACEHOLDER_COVER =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
        '<rect width="100" height="100" fill="#1f1d2c"/>' +
        '<text x="50" y="64" font-size="46" text-anchor="middle" fill="#7c3aed">♪</text>' +
        '</svg>'
    );

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extensionFromMimeOrName(mimeType: string, name: string): Track['format'] {
  const m = (mimeType || '').toLowerCase();
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('flac')) return 'flac';
  if (m.includes('mp4') || m.includes('m4a')) return 'm4a';
  if (m.includes('aac')) return 'aac';
  if (m.includes('wav')) return 'wav';
  if (m.includes('opus')) return 'opus';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('wma')) return 'wma';
  if (m.includes('aiff') || m.includes('aif')) return 'aiff';
  if (m.includes('amr')) return 'amr';

  const ext = (name.split('.').pop() || '').toLowerCase();
  const map: Record<string, Track['format']> = {
    mp3: 'mp3', flac: 'flac', m4a: 'm4a', aac: 'aac', wav: 'wav',
    ogg: 'ogg', opus: 'opus', wma: 'wma', aiff: 'aiff', aif: 'aiff', amr: 'amr',
  };
  return map[ext] ?? 'mp3';
}

function isUnknown(v: string | null | undefined): boolean {
  if (!v) return true;
  const s = v.trim().toLowerCase();
  return s === '' || s === '<unknown>' || s === 'unknown' ||
      s === 'unknown artist' || s === 'unknown album';
}

/** Guess title/artist from a filename when ID3 tags are empty. */
function parseFilenameMetadata(displayName: string): { title: string; artist: string } {
  const base = displayName.replace(/\.[^/.]+$/, '').trim();

  // "Artist - Title"
  const dash = base.match(/^(.+?)\s+-\s+(.+)$/);
  if (dash) return { artist: dash[1].trim(), title: dash[2].trim() };

  // "01 Title" / "01. Title" / "01 - Title"
  const numbered = base.match(/^\d+[\s.\-_]+(.+)$/);
  if (numbered) return { artist: '', title: numbered[1].trim() };

  return { artist: '', title: base };
}

function detectCategory(folderPath: string, durationSec: number): Track['category'] {
  const p = folderPath.toLowerCase();
  if (p.includes('/recordings/') || p.includes('/voicerecorder/')) return 'recording';
  if (p.includes('/download/') || p.includes('/downloads/')) return 'download';
  if (durationSec > 0 && durationSec < 25) return 'voice_note';
  return 'song';
}

function toPlayableUrl(uri: string): string {
  if (!uri) return '';
  try {
    // Turns both file:// and content:// into http://localhost/_capacitor_*_/…
    return Capacitor.convertFileSrc(uri);
  } catch {
    return uri;
  }
}

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

export class DeviceAudioScanner {
  public get platform(): string {
    return Capacitor.getPlatform();
  }

  public get isNative(): boolean {
    return this.platform === 'android' || this.platform === 'ios';
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      const res = await MediaStoreAudio.requestPermission();
      return !!res.granted;
    } catch (e) {
      console.warn('[deviceScanner] permission error:', e);
      return false;
    }
  }

  /**
   * Scan the device media library.
   * Emits progress through `onProgress` and RETURNS the resulting tracks.
   * The caller is responsible for merging them into app state.
   */
  public async scanDeviceAudio(
      onProgress: (p: ScanProgress) => void
  ): Promise<Track[]> {
    if (!this.isNative) {
      onProgress({
        scanned: 0, discovered: 0, phase: 'error',
        message: 'Device scan is only available in the Android app.',
      });
      return [];
    }

    const granted = await this.requestPermission();
    if (!granted) {
      onProgress({
        scanned: 0, discovered: 0, phase: 'error',
        message: 'Storage permission denied',
      });
      return [];
    }

    onProgress({
      scanned: 0, discovered: 0, phase: 'scan',
      message: 'Reading media library…',
    });

    let raw: RawMediaStoreTrack[] = [];
    try {
      const res = await MediaStoreAudio.query();
      raw = res.tracks ?? [];
    } catch (e) {
      console.error('[deviceScanner] query failed:', e);
      onProgress({
        scanned: 0, discovered: 0, phase: 'error',
        message: 'Could not read media library',
      });
      return [];
    }

    const tracks = raw.map((r) => this.normalize(r));

    onProgress({
      scanned: tracks.length,
      discovered: tracks.length,
      phase: 'done',
      message: `Found ${tracks.length} audio file${tracks.length === 1 ? '' : 's'}`,
    });

    return tracks;
  }

  private normalize(r: RawMediaStoreTrack): Track {
    const parsed = parseFilenameMetadata(r.displayName || r.title || 'Unknown');

    const title  = !isUnknown(r.title)  ? r.title  : (parsed.title  || r.displayName || 'Unknown Title');
    const artist = !isUnknown(r.artist) ? r.artist : (parsed.artist || 'Unknown Artist');
    const album  = !isUnknown(r.album)  ? r.album  : 'Unknown Album';

    const durationSec = Math.max(0, Math.round((r.durationMs || 0) / 1000));
    const folderPath  = r.path && r.path.includes('/')
        ? r.path.substring(0, r.path.lastIndexOf('/'))
        : '';

    const hasAlbumArt = !!r.albumArtUri && r.albumId > 0;

    return {
      id: `mediastore-${r.id}`,
      mediaStoreId: r.id,
      contentUri: r.contentUri,
      albumId: r.albumId,

      title,
      artist,
      album,
      duration: durationSec,
      coverUrl: hasAlbumArt ? toPlayableUrl(r.albumArtUri) : PLACEHOLDER_COVER,
      audioUrl: toPlayableUrl(r.contentUri),

      format: extensionFromMimeOrName(r.mimeType, r.displayName || ''),
      isFavorite: false,
      playCount: 0,
      dateAdded: new Date((r.dateAdded || 0) * 1000).toISOString().split('T')[0],
      folderPath,
      category: detectCategory(folderPath, durationSec),
      fileSize: r.size ? `${(r.size / (1024 * 1024)).toFixed(1)} MB` : undefined,
    };
  }
}

export const deviceAudioScanner = new DeviceAudioScanner();