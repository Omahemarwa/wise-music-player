import { Track } from '../types';

/**
 * Merge freshly-scanned MediaStore tracks into the app's existing library.
 *
 * Rules:
 *  - Tracks are considered "the same" if their mediaStoreId matches.
 *  - For matches, we keep the user's isFavorite and playCount.
 *  - Tracks that exist in state but NOT in the scan (e.g. files the user
 *    deleted from the phone, or user-imported files with no mediaStoreId)
 *    are preserved — we never silently drop user data.
 */
export function mergeScannedTracks(existing: Track[], scanned: Track[]): Track[] {
  const byMediaStoreId = new Map<string, Track>();
  for (const t of existing) {
    if (t.mediaStoreId) byMediaStoreId.set(t.mediaStoreId, t);
  }

  const merged: Track[] = [];
  const seen = new Set<string>();

  for (const incoming of scanned) {
    const prev = incoming.mediaStoreId ? byMediaStoreId.get(incoming.mediaStoreId) : undefined;

    merged.push(
        prev
            ? { ...incoming, isFavorite: prev.isFavorite, playCount: prev.playCount }
            : incoming
    );

    if (incoming.mediaStoreId) seen.add(incoming.mediaStoreId);
  }

  // Keep user-imported tracks (no mediaStoreId) that weren't part of the scan.
  for (const t of existing) {
    if (!t.mediaStoreId && !seen.has(t.id)) merged.push(t);
  }

  return merged;
}