import { Track } from '../types';

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
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

export function loadSavedPlaylists<T>(fallback: T): T {
  try {
    const saved = localStorage.getItem('wise_playlists_v1');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not read from local storage:', e);
  }
  return fallback;
}

export function savePlaylists<T>(playlists: T): void {
  try {
    localStorage.setItem('wise_playlists_v1', JSON.stringify(playlists));
  } catch (e) {
    console.warn('Could not save playlists:', e);
  }
}

export function loadSavedTracks<T>(fallback: T): T {
  try {
    const saved = localStorage.getItem('wise_tracks_v1');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not read tracks from local storage:', e);
  }
  return fallback;
}

export function saveTracks<T>(tracks: T): void {
  try {
    localStorage.setItem('wise_tracks_v1', JSON.stringify(tracks));
  } catch (e) {
    console.warn('Could not save tracks:', e);
  }
}
