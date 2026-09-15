import { getPlatform } from 'capacitor-is-not-imported'; // placeholder replaced below
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS, INITIAL_STORAGE_FOLDERS } from '../data/mockData';
import { Track, Playlist, StorageFolder, FolderCategory } from '../types';
import { loadSavedTracks, loadSavedPlaylists } from '../utils/storage';
import { deviceAudioScanner } from '../services/deviceScanner';
import { DeviceLibraryIndexer } from '../services/deviceLibraryIndexer';

export class DeviceAudioScanner {
  private cancelled = false;
  private env = getPlatform();

  public get isNative(): boolean {
    return this.env === 'android' || this.env === 'ios';
  }

  public cancel() {
    this.cancelled = true;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isNative()) return false; // web fallback — no native FS
    try {
      const { Filesystem } = await import('@capacitor/filesystem');
      const state = await Filesystem.requestPermissions();
      const granted = state.publicStorage === 'granted' || state.photos === 'granted';
      if (!granted) {
        throw new Error('Storage permission not granted');
      }
      return true;
    } catch (e) {
      console.warn('[deviceScanner] Permission error:', e);
      return false;
    }
  }

  public cancel() {
    this.cancelled = true;
  }

  public async scanDeviceAudio(onProgress: (p: ScanProgress) => void): Promise<void> {
    this.cancelled = false;
    const isNative = this.isNative;
    if (!isNative) {
      onProgress({ scanned: 0, discovered: 0, phase: 'error', message: 'Full device scanning requires the Android app. Use Import for a single file here.' });
      return;
    }

    const granted = await this.requestPermission();
    if (!granted) {
      onProgress({ scanned: 0, discovered: 0, phase: 'error', message: 'Storage permission denied' });
      return;
    }

    try {
      const { Filesystem } = await import('@capacitor/filesystem');
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
            if (dirPath !== entry.name && entry.name.startsWith('.')) continue; // skip dot-folders
            await walk(fullPath, depth + 1);
          } else if (entry.type === 'file') {
            const ext = entry.name.split('.').pop()?.toLowerCase() ?? '';
            if (!AUDIO_EXTENSIONS.has(ext)) continue;

            scanned++;
            const category = this.folderToCategory(dirPath);
            const title = entry.name.replace(/\.[^.]*$/, '') || entry.name;

            found.push({
              id: `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title,
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: 0, // read from audio element after selection
              coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
              audioUrl: this.toPlayableUri(fullPath),
              format: 'mp3',
              isFavorite: false,
              playCount: 0,
              dateAdded: new Date().toISOString().split('T')[0],
              folderPath: dirPath,
              category,
            });

            if (scanned % 10 === 0) {
              onProgress({ scanned, discovered: found.length, phase: 'scan', message: `Scanning… ${scanned} files` });
            }
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
        message: this.cancelled ? `Scan cancelled — ${found.length} audio files found` : `Scan complete — ${found.length} audio files found`,
      });
    } catch (e) {
      console.error('[deviceScanner] Scan error:', e);
      onProgress({ scanned: 0, discovered: 0, phase: 'error', message: 'Could not scan device storage' });
    }
  }

  private folderToCategory(folderPath: string): Track['category'] {
    const p = folderPath.toLowerCase();
    if (p.includes('download')) return 'download';
    if (p.includes('record')) return 'voice_note';
    if (p.includes('recording')) return 'recording';
    if (p.includes('podcast')) return 'download';
    return 'song';
  }

  private toPlayableUri(inputPath: string): string {
    const { convertFileSrc } = Capacitor || {};
    try {
      return convertFileSrc(inputPath);
    } catch (e) {
      console.warn('[deviceScanner] convertFileSrc failed:', e);
      return inputPath;
    }
  }
}

export const deviceAudioScanner = new DeviceAudioScanner();
