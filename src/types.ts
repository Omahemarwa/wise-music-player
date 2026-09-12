export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  featuredArtists?: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl?: string; // object URL or synthesized
  isSynthesized?: boolean;
  synthTheme?: 'rnb' | 'synthwave' | 'ambient' | 'techno' | 'lofi' | 'pop';
  format: 'mp3' | 'flac' | 'm4a' | 'aac' | 'wav';
  bitrate?: string;
  isFavorite: boolean;
  playCount: number;
  dateAdded: string;
  folderPath: string;
  category: 'song' | 'voice_note' | 'download' | 'recording';
  lyrics?: LyricLine[];
  fileSize?: string;
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
