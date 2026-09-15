export interface LyricLine {
  time: number;
  text: string;
}

export type AudioFormat =
    | 'mp3' | 'flac' | 'm4a' | 'aac' | 'wav'
    | 'ogg' | 'opus' | 'wma' | 'aiff' | 'amr';

export interface Track {
  id: string;

  // MediaStore linkage (present when the track came from a device scan)
  mediaStoreId?: string;
  contentUri?: string;    // content://media/external/audio/media/<id>
  albumId?: number;       // for album art lookup

  title: string;
  artist: string;
  featuredArtists?: string;
  album: string;
  duration: number;       // seconds
  coverUrl: string;       // playable URL or data-URI placeholder, '' if none
  audioUrl?: string;      // playable URL (http://localhost/_capacitor_content_/… or blob:)

  format: AudioFormat;
  bitrate?: string;
  isFavorite: boolean;
  playCount: number;
  dateAdded: string;      // YYYY-MM-DD
  folderPath: string;
  category: 'song' | 'voice_note' | 'download' | 'recording';
  lyrics?: LyricLine[];
  fileSize?: string;

  // (Removed: isSynthesized, synthTheme — no more procedural audio)
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  coverUrl?: string;
  customGridCovers?: string[];
  createdAt: string;
  isSmart?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface StorageFolder {
  path: string;
  fileCount: number;
  iconType: 'music' | 'downloads' | 'recordings';
}