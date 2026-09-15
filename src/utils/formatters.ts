import { Track } from '../types';

// ---------------------------------------------------------------------------
// Storage keys — bumped to _v2 to orphan any pre-existing mock data.
// ---------------------------------------------------------------------------
const TRACKS_KEY = 'wise_tracks_v2';
const PLAYLISTS_KEY = 'wise_playlists_v2';

// Any saved track whose id starts with these is a leftover mock — purge it.
const LEGACY_MOCK_TRACK_PREFIXES = ['track-', 'user-demo-'];
// Mock playlists were created with plain names + fixed ids in old mockData.
const LEGACY_MOCK_PLAYLIST_IDS = [
  'playlist-1',
  'playlist-2',
  'playlist-3',
  'playlist-4',
  'playlist-liked',
];

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${paddedMins}:${paddedSecs}`;
}

export function formatTotalDuration(tracks: Track[]): string {
  const totalSecs = tracks.reduce((acc, t) => acc + t.duration, 0);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min`;
}

// ---------------------------------------------------------------------------
// One-time purge of legacy mock data (idempotent, safe to call on every load)
// ---------------------------------------------------------------------------

function purgeLegacyMockStorage(): void {
  try {
    // Remove the old v1 keys entirely — they are the source of the mocks.
    localStorage.removeItem('wise_tracks_v1');
    localStorage.removeItem('wise_playlists_v1');
  } catch {
    /* ignore */
  }
}

function isLegacyMockTrack(t: { id?: string }): boolean {
  const id = t?.id ?? '';
  return LEGACY_MOCK_TRACK_PREFIXES.some((p) => id.startsWith(p));
}

function isLegacyMockPlaylist(p: { id?: string; title?: string }): boolean {
  const id = p?.id ?? '';
  // Fixed ids from the old mockData file
  if (LEGACY_MOCK_PLAYLIST_IDS.includes(id)) return true;
  // Anything id'd `playlist-<number>` (not a timestamp) is legacy
  if (/^playlist-\d{1,4}$/.test(id)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Playlists
// ---------------------------------------------------------------------------

export function loadSavedPlaylists<T>(fallback: T): T {
  purgeLegacyMockStorage();
  try {
    const saved = localStorage.getItem(PLAYLISTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (p) => !isLegacyMockPlaylist(p as { id?: string; title?: string })
        );
        return cleaned as unknown as T;
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Could not read playlists from local storage:', e);
  }
  return fallback;
}

export function savePlaylists<T>(playlists: T): void {
  try {
    const arr = Array.isArray(playlists) ? playlists : [];
    const cleaned = arr.filter(
      (p) => !isLegacyMockPlaylist(p as { id?: string; title?: string })
    );
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(cleaned));
  } catch (e) {
    console.warn('Could not save playlists:', e);
  }
}

// ---------------------------------------------------------------------------
// Tracks
// ---------------------------------------------------------------------------

export function loadSavedTracks<T>(fallback: T): T {
  purgeLegacyMockStorage();
  try {
    const saved = localStorage.getItem(TRACKS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (t) => !isLegacyMockTrack(t as { id?: string })
        );
        return cleaned as unknown as T;
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Could not read tracks from local storage:', e);
  }
  return fallback;
}

export function saveTracks<T>(tracks: T): void {
  try {
    const arr = Array.isArray(tracks) ? tracks : [];
    const cleaned = arr.filter((t) => !isLegacyMockTrack(t as { id?: string }));
    localStorage.setItem(TRACKS_KEY, JSON.stringify(cleaned));
  } catch (e) {
    console.warn('Could not save tracks:', e);
  }
}