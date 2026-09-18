import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { mergeScannedTracks } from './services/deviceLibraryIndexer';
import { Track, Playlist, RepeatMode, StorageFolder } from './types';
import {
  loadSavedTracks,
  saveTracks,
  loadSavedPlaylists,
  savePlaylists,
} from './utils/formatters';
import { audioEngine } from './services/audioEngine';

import { TopHeader } from './components/TopHeader';
import { BottomNav, NavTab } from './components/BottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingModal } from './components/NowPlayingModal';
import { HomeScreen } from './components/HomeScreen';
import { PlaylistsScreen } from './components/PlaylistsScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { SplashScreen } from './components/SplashScreen';
import { TrackOptionsModal } from './components/TrackOptionsModal';
import { CheckCircle, RotateCcw, Settings as SettingsIcon } from 'lucide-react';

interface ToastState {
  message: string;
  onUndo?: () => void;
}

type PermissionState = 'unknown' | 'granted' | 'denied';

export default function App() {
  // ---------------------------------------------------------------- view state
  const [isSplashActive, setIsSplashActive] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  // ---------------------------------------------------------------- core data
  const [tracks, setTracks] = useState<Track[]>(() => loadSavedTracks([]));
  const [playlists, setPlaylists] = useState<Playlist[]>(() =>
      loadSavedPlaylists([])
  );
  const [storageFolders, setStorageFolders] = useState<StorageFolder[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
      null
  );

  // ---------------------------------------------------------------- playback
  const [currentTrack, setCurrentTrack] = useState<Track | null>(
      () => tracks[0] ?? null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<Track[]>(() => tracks);

  // ---------------------------------------------------------------- modals
  const [selectedTrackForOptions, setSelectedTrackForOptions] =
      useState<Track | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [permissionState, setPermissionState] =
      useState<PermissionState>('unknown');

  const toastTimeoutRef = useRef<number | null>(null);
  const permissionAttemptsRef = useRef(0);
  const hasAutoScannedRef = useRef(false);

  const showToast = useCallback((msg: string, onUndo?: () => void) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message: msg, onUndo });
    const duration = onUndo ? 4500 : 2800;
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), duration);
  }, []);

  // ---------------------------------------------------------------- sync effects
  useEffect(() => {
    setQueue(tracks);
  }, [tracks]);

  useEffect(() => {
    saveTracks(tracks);
  }, [tracks]);

  useEffect(() => {
    savePlaylists(playlists);
  }, [playlists]);

  // Keep currentTrack in sync if library empties (e.g. after a "delete all")
  useEffect(() => {
    if (currentTrack && !tracks.some((t) => t.id === currentTrack.id)) {
      setCurrentTrack(tracks[0] ?? null);
      setIsPlaying(false);
    }
  }, [tracks, currentTrack]);

  // ---------------------------------------------------------------- playback ops
  const handleNextTrack = useCallback(() => {
    if (queue.length === 0 || !currentTrack) return;

    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.resume();
      setCurrentTime(0);
      return;
    }

    let nextTrack: Track;
    if (isShuffle) {
      const candidates = queue.filter((t) => t.id !== currentTrack.id);
      nextTrack =
          candidates[Math.floor(Math.random() * candidates.length)] ?? queue[0];
    } else {
      const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
      const nextIndex = (currentIndex + 1) % queue.length;
      nextTrack = queue[nextIndex];
    }

    setCurrentTrack(nextTrack);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.playTrack(nextTrack, 0);
  }, [queue, currentTrack, repeatMode, isShuffle]);

  const handlePrevTrack = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }
    if (queue.length === 0 || !currentTrack) return;

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevTrack = queue[prevIndex];

    setCurrentTrack(prevTrack);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.playTrack(prevTrack, 0);
  }, [queue, currentTrack, currentTime]);

  useEffect(() => {
    audioEngine.setCallbacks(
        (time) => setCurrentTime(time),
        () => handleNextTrack()
    );
  }, [handleNextTrack]);

  const handlePlayTrack = useCallback(
      (track: Track) => {
        if (currentTrack?.id === track.id && isPlaying) return;

        setCurrentTrack(track);
        setCurrentTime(0);
        setIsPlaying(true);
        audioEngine.playTrack(track, 0);

        setTracks((prev) =>
            prev.map((t) =>
                t.id === track.id ? { ...t, playCount: t.playCount + 1 } : t
            )
        );
      },
      [currentTrack, isPlaying]
  );

  const handleTogglePlay = useCallback(() => {
    if (!currentTrack) {
      if (tracks.length > 0) handlePlayTrack(tracks[0]);
      return;
    }
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.resume();
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying, tracks, handlePlayTrack]);

  const handleSeek = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  }, []);

  // ---------------------------------------------------------------- favourites
  const handleToggleFavorite = useCallback(
      (trackId: string) => {
        setTracks((prev) =>
            prev.map((t) => {
              if (t.id !== trackId) return t;
              const nextFav = !t.isFavorite;
              showToast(
                  nextFav
                      ? `Added "${t.title}" to Liked Tracks`
                      : 'Removed from Liked Tracks'
              );
              return { ...t, isFavorite: nextFav };
            })
        );
        setCurrentTrack((prev) =>
            prev && prev.id === trackId
                ? { ...prev, isFavorite: !prev.isFavorite }
                : prev
        );
      },
      [showToast]
  );

  // ---------------------------------------------------------------- modes
  const handleToggleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      showToast(next ? 'Shuffle is ON' : 'Shuffle is OFF');
      return next;
    });
  }, [showToast]);

  const handleShuffleAll = useCallback(() => {
    if (tracks.length === 0) return;
    const random = tracks[Math.floor(Math.random() * tracks.length)];
    setIsShuffle(true);
    handlePlayTrack(random);
    showToast('Shuffling your library');
  }, [tracks, handlePlayTrack, showToast]);

  // ---------------------------------------------------------------- playlists
  const handleCreatePlaylist = useCallback(
      (title: string, description: string, selectedTrackIds: string[]) => {
        const newPlaylist: Playlist = {
          id: `playlist-${Date.now()}`,
          title,
          description: description || 'Offline collection',
          trackIds: selectedTrackIds,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setPlaylists((prev) => [newPlaylist, ...prev]);
        showToast(`Created playlist "${title}"`);
      },
      [showToast]
  );

  const handleDeletePlaylist = useCallback(
      (id: string) => {
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
        showToast('Playlist deleted');
      },
      [showToast]
  );

  const handleAddTrackToPlaylist = useCallback(
      (trackId: string, playlistId: string) => {
        setPlaylists((prev) =>
            prev.map((p) =>
                p.id === playlistId && !p.trackIds.includes(trackId)
                    ? { ...p, trackIds: [...p.trackIds, trackId] }
                    : p
            )
        );
        showToast('Added track to playlist');
      },
      [showToast]
  );

  const handleRemoveTrackFromPlaylist = useCallback(
      (trackId: string, playlistId: string) => {
        if (playlistId === 'liked') {
          setTracks((prev) =>
              prev.map((t) => (t.id === trackId ? { ...t, isFavorite: false } : t))
          );
          showToast('Removed from Liked Tracks', () => {
            setTracks((prev) =>
                prev.map((t) =>
                    t.id === trackId ? { ...t, isFavorite: true } : t
                )
            );
          });
          return;
        }

        const currentPlaylist = playlists.find((p) => p.id === playlistId);
        const prevIndex = currentPlaylist
            ? currentPlaylist.trackIds.indexOf(trackId)
            : -1;

        setPlaylists((prev) =>
            prev.map((p) =>
                p.id === playlistId
                    ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) }
                    : p
            )
        );

        showToast('Removed song from playlist', () => {
          setPlaylists((prev) =>
              prev.map((p) => {
                if (p.id !== playlistId || p.trackIds.includes(trackId)) return p;
                const next = [...p.trackIds];
                if (prevIndex >= 0 && prevIndex <= next.length) {
                  next.splice(prevIndex, 0, trackId);
                } else {
                  next.push(trackId);
                }
                return { ...p, trackIds: next };
              })
          );
        });
      },
      [playlists, showToast]
  );

  const handleDeleteTrack = useCallback(
      (trackId: string) => {
        setTracks((prev) => prev.filter((t) => t.id !== trackId));
        setPlaylists((prev) =>
            prev.map((p) => ({
              ...p,
              trackIds: p.trackIds.filter((id) => id !== trackId),
            }))
        );
        showToast('Track removed from library');
      },
      [showToast]
  );

  // ---------------------------------------------------------------- import
  const handleImportUserAudio = useCallback(
      (file: File) => {
        try {
          const objectUrl = URL.createObjectURL(file);
          const tempAudio = new Audio(objectUrl);

          tempAudio.addEventListener('loadedmetadata', () => {
            const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp3';
            const rawTitle = file.name.replace(/\.[^/.]+$/, '');
            const durationSec = Math.round(tempAudio.duration) || 0;

            const newTrack: Track = {
              id: `user-track-${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(2, 6)}`,
              title: rawTitle,
              artist: 'Local Device File',
              album: 'Device Storage',
              duration: durationSec,
              coverUrl: '',
              audioUrl: objectUrl,
              format: (
                  ['mp3', 'flac', 'm4a', 'aac', 'wav'].includes(ext)
                      ? ext
                      : 'mp3'
              ) as Track['format'],
              isFavorite: false,
              playCount: 0,
              dateAdded: new Date().toISOString().split('T')[0],
              folderPath: '',
              category: file.name.toLowerCase().includes('voice')
                  ? 'voice_note'
                  : 'song',
              fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            };

            setTracks((prev) => [newTrack, ...prev]);
            showToast(`Imported "${rawTitle}"`);
          });
        } catch (err) {
          console.error('File import error:', err);
          showToast('Could not parse audio file');
        }
      },
      [showToast]
  );

  // ---------------------------------------------------------------- scan
  const openAppSettings = useCallback(async () => {
    try {
      const { Capacitor, registerPlugin } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const plugin = registerPlugin<{ openAppSettings(): Promise<void> }>(
          'MediaStoreAudio'
      );
      await plugin.openAppSettings();
    } catch (e) {
      console.warn('[App] openAppSettings failed:', e);
    }
  }, []);

  const handleScanDevice = useCallback(
      async (silent = false) => {
        if (isScanning) return;
        setIsScanning(true);

        try {
          const { deviceAudioScanner } = await import('./services/deviceScanner');

          const found = await deviceAudioScanner.scanDeviceAudio((p) => {
            if (p.phase === 'error' && p.message) {
              if (p.message.toLowerCase().includes('permission')) {
                permissionAttemptsRef.current += 1;
                setPermissionState('denied');
              }
              if (!silent) showToast(p.message);
            }
          });

          setIsScanning(false);

          if (found.length === 0) {
            if (!silent) showToast('No audio files found on this device');
            return;
          }

          setPermissionState('granted');

          setTracks((prev) => mergeScannedTracks(prev, found));

          const folderCounts = new Map<string, number>();
          for (const t of found) {
            if (!t.folderPath) continue;
            folderCounts.set(
                t.folderPath,
                (folderCounts.get(t.folderPath) ?? 0) + 1
            );
          }
          setStorageFolders(
              Array.from(folderCounts.entries()).map(([path, fileCount]) => ({
                path,
                fileCount,
                iconType: path.toLowerCase().includes('download')
                    ? 'downloads'
                    : path.toLowerCase().includes('recording')
                        ? 'recordings'
                        : 'music',
              }))
          );

          if (!silent) {
            showToast(
                found.length === 1
                    ? 'Found 1 audio file'
                    : `Found ${found.length} audio files`
            );
          }
        } catch (e) {
          console.error('[App] handleScanDevice error:', e);
          setIsScanning(false);
          if (!silent) showToast('Could not scan device storage');
        }
      },
      [isScanning, showToast]
  );

  // Auto-scan once on launch (native + empty library only)
  useEffect(() => {
    if (hasAutoScannedRef.current) return;
    hasAutoScannedRef.current = true;

    (async () => {
      try {
        const { deviceAudioScanner } = await import(
            './services/deviceScanner'
            );
        if (!deviceAudioScanner.isNative) return;
        await handleScanDevice(true);
      } catch (e) {
        console.warn('[App] auto-scan skipped:', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------- keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        handleNextTrack();
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        handlePrevTrack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTogglePlay, handleNextTrack, handlePrevTrack]);

  // ---------------------------------------------------------------- render
  const showPermissionBanner =
      permissionState === 'denied' && permissionAttemptsRef.current >= 2;

  return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0c0e14] text-slate-900 dark:text-[#e2e2eb] flex flex-col items-center justify-center p-0 select-none">
        <div className="w-full max-w-[400px] h-[852px] min-h-[852px] bg-white dark:bg-[#13121b] flex flex-col relative overflow-hidden rounded-[42px] border border-slate-200 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
          {isSplashActive ? (
              <SplashScreen onEnter={() => setIsSplashActive(false)} />
          ) : (
              <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <TopHeader
                    onViewSplash={() => setIsSplashActive(true)}
                    showAddPlaylist={
                        activeTab === 'playlists' && !selectedPlaylistId
                    }
                    onOpenNewPlaylist={() => {
                      const trigger = document.querySelector(
                          'button[aria-label="Create Playlist"]'
                      );
                      if (trigger instanceof HTMLElement) trigger.click();
                    }}
                    showBackButton={!!selectedPlaylistId}
                    onBack={() => setSelectedPlaylistId(null)}
                    title={
                      selectedPlaylistId
                          ? selectedPlaylistId === 'liked'
                              ? 'Liked Tracks'
                              : 'Playlist'
                          : undefined
                    }
                />

                {showPermissionBanner && (
                    <div className="mx-4 mt-2 mb-1 rounded-2xl bg-[#7c3aed]/15 border border-[#7c3aed]/40 p-3 flex items-start gap-3">
                      <div className="flex-1 text-xs text-[#7c3aed] dark:text-[#c7bfff]">
                        <p className="font-semibold mb-0.5">Music permission blocked</p>
                        <p className="text-[#7c3aed]/70 dark:text-[#c7bfff]/70">
                          Android needs permission to see your songs. Enable it in
                          Settings, then come back and tap Scan.
                        </p>
                      </div>
                      <button
                          onClick={openAppSettings}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-[11px] font-semibold shrink-0"
                      >
                        <SettingsIcon className="w-3 h-3" />
                        Settings
                      </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                  {activeTab === 'home' && (
                      <HomeScreen
                          tracks={tracks}
                          playlists={playlists}
                          currentTrack={currentTrack}
                          isPlaying={isPlaying}
                          onPlayTrack={handlePlayTrack}
                          onTogglePlay={handleTogglePlay}
                          onTrackOptions={(track) => setSelectedTrackForOptions(track)}
                          onSelectPlaylist={(p) => {
                            setSelectedPlaylistId(p.id);
                            setActiveTab('playlists');
                          }}
                          onPlayPlaylist={(playlist) => {
                            const playlistTracks =
                                playlist.id === 'liked'
                                    ? tracks.filter((t) => t.isFavorite)
                                    : playlist.trackIds
                                        .map((id) => tracks.find((t) => t.id === id))
                                        .filter((t): t is Track => !!t);
                            if (playlistTracks.length > 0) {
                              handlePlayTrack(playlistTracks[0]);
                            }
                          }}
                      />
                  )}

                  {activeTab === 'playlists' && (
                      <PlaylistsScreen
                          playlists={playlists}
                          allTracks={tracks}
                          onSelectPlaylist={(p) => setSelectedPlaylistId(p.id)}
                          onCreatePlaylist={handleCreatePlaylist}
                          onDeletePlaylist={handleDeletePlaylist}
                          onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
                          onPlayTrack={handlePlayTrack}
                          currentTrack={currentTrack}
                          isPlaying={isPlaying}
                          onTogglePlay={handleTogglePlay}
                          selectedPlaylistId={selectedPlaylistId}
                          onClearSelectedPlaylist={() => setSelectedPlaylistId(null)}
                      />
                  )}

                  {activeTab === 'library' && (
                      <LibraryScreen
                          tracks={tracks}
                          currentTrack={currentTrack}
                          isPlaying={isPlaying}
                          onPlayTrack={handlePlayTrack}
                          onTogglePlay={handleTogglePlay}
                          onShuffleAll={handleShuffleAll}
                          onTrackOptions={(track) => setSelectedTrackForOptions(track)}
                          storageFolders={storageFolders}
                          onImportUserAudio={handleImportUserAudio}
                          onScanDevice={handleScanDevice}
                          isScanning={isScanning}
                      />
                  )}
                </div>

                {currentTrack && (
                    <MiniPlayer
                        currentTrack={currentTrack}
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                        onTogglePlay={handleTogglePlay}
                        onNextTrack={handleNextTrack}
                        onPrevTrack={handlePrevTrack}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
                    />
                )}

                <BottomNav
                    activeTab={activeTab}
                    onSelectTab={(tab) => {
                      setActiveTab(tab);
                      setSelectedPlaylistId(null);
                    }}
                />
              </div>
          )}

          <AnimatePresence>
            {isNowPlayingOpen && currentTrack && (
                <NowPlayingModal
                    isOpen={isNowPlayingOpen}
                    onClose={() => setIsNowPlayingOpen(false)}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    onTogglePlay={handleTogglePlay}
                    onSeek={handleSeek}
                    onNextTrack={handleNextTrack}
                    onPrevTrack={handlePrevTrack}
                    onToggleFavorite={handleToggleFavorite}
                    repeatMode={repeatMode}
                    onToggleRepeat={handleToggleRepeat}
                    isShuffle={isShuffle}
                    onToggleShuffle={handleToggleShuffle}
                    queue={queue}
                    onSelectTrackFromQueue={(t) => handlePlayTrack(t)}
                    onAddToPlaylist={(track) => setSelectedTrackForOptions(track)}
                />
            )}
          </AnimatePresence>

          <TrackOptionsModal
              track={selectedTrackForOptions}
              isOpen={!!selectedTrackForOptions}
              onClose={() => setSelectedTrackForOptions(null)}
              playlists={playlists}
              onToggleFavorite={handleToggleFavorite}
              onAddTrackToPlaylist={handleAddTrackToPlaylist}
              onDeleteTrack={handleDeleteTrack}
          />

          <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-white/95 dark:bg-[#1c1a26]/95 border border-[#7c3aed]/50 text-slate-900 dark:text-white pl-4 pr-3 py-2 rounded-full shadow-2xl text-xs font-medium flex items-center gap-3 backdrop-blur-md max-w-[90%]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle className="w-3.5 h-3.5 text-[#c7bfff] shrink-0" />
                    <span className="truncate">{toast.message}</span>
                  </div>
                  {toast.onUndo && (
                      <button
                          onClick={() => {
                            toast.onUndo?.();
                            setToast(null);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7c3aed]/30 hover:bg-[#7c3aed] text-[#c7bfff] hover:text-white font-semibold transition-all active:scale-95 ml-1 shrink-0 border border-[#7c3aed]/40"
                      >
                        <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                        <span>Undo</span>
                      </button>
                  )}
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
  );
}