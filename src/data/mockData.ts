import { Track, Playlist, StorageFolder } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Device-first library — intentionally EMPTY.
//
// There are NO hardcoded demo tracks / playlists / folders here anymore.
// The app now indexes real audio files from the device:
//   • Android (native) → deviceAudioScanner walks /storage/emulated/0
//     (Music, Download, Recordings, Podcasts, Ringtones…) and builds real
//     Tracks with convertFileSrc() playable URIs.
//   • Web preview → stays empty; user imports a real audio file via
//     "Import" (HTML5 File API). No fake Google/Unsplash songs.
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_TRACKS: Track[] = [];

export const INITIAL_PLAYLISTS: Playlist[] = [];

export const INITIAL_STORAGE_FOLDERS: StorageFolder[] = [];
