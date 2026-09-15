import { Track } from '../types';

export interface DeviceLibraryIndexer {
  tracks: Track[];
}

/**
 * Device-first library — the app starts with an EMPTY library.
 * Real tracks only come from either:
 *   1. deviceAudioScanner.scanDeviceAudio() — indexes /storage/emulated/0/Music,
 *      Download, Recordings, Podcasts, Ringtones for real audio on Android.
 *   2. A user-imported audio file (HTML5 File API, works on web + device).
 * There are NO hardcoded demo tracks, No fake Unsplash songs, No demo folders,
 * No seeded playlists.
 */
export class DeviceLibraryIndexerImpl {
  public readonly tracks: Track[] = [];

  public accept(track: Track): void {
    this.tracks.push(track);
  }
}

export const deviceLibraryIndexer = new DeviceLibraryIndexerImpl();
