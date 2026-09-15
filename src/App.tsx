import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { INITIAL_TRACKS, INITIAL_PLAYLISTS, INITIAL_STORAGE_FOLDERS } from './data/mockData';
import { Track, Playlist, RepeatMode, StorageFolder } from './types';
import { 
  loadSavedTracks, 
  saveTracks, 
  loadSavedPlaylists, 
  savePlaylists 
} from './utils/formatters';
import { audioEngine } from './services/audioEngine';
import { StatusBar } from './components/StatusBar';
import { TopHeader } from './components/TopHeader';
import { BottomNav, NavTab } from './components/BottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingModal } from './components/NowPlayingModal';
import { HomeScreen } from './components/HomeScreen';
import { PlaylistsScreen } from './components/PlaylistsScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { SplashScreen } from './components/SplashScreen';
import { TrackOptionsModal } from './components/TrackOptionsModal';
import { Smartphone, Monitor, CheckCircle, Music, RotateCcw } from 'lucide-react';

interface ToastState {
  message: string;
  onUndo?: () => void;
}

export default function App() {
  // App view states
  const [isSplashActive, setIsSplashActive] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [viewChassis, setViewChassis] = useState<'mobile' | 'fluid'>('mobile');

  // Core data states (with local persistence)
  const [tracks, setTracks] = useState<Track[]>(() => loadSavedTracks(INITIAL_TRACKS));
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadSavedPlaylists(INITIAL_PLAYLISTS));
  const [storageFolders, setStorageFolders] = useState<StorageFolder[]>(INITIAL_STORAGE_FOLDERS);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Playback states
  const [currentTrack, setCurrentTrack] = useState<Track>(() => tracks[0] || INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<Track[]>(() => tracks);

  // Modals & feedback
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<Track | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string, onUndo?: () => void) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message: msg, onUndo });
    // Keep toast visible longer if it has an undo action
    const duration = onUndo ? 4500 : 2800;
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, duration);
  };

  // Keep queue in sync with current tracks
  useEffect(() => {
    setQueue(tracks);
  }, [tracks]);

  // Persist tracks
  useEffect(() => {
    saveTracks(tracks);
  }, [tracks]);

  // Persist playlists
  useEffect(() => {
    savePlaylists(playlists);
  }, [playlists]);

  // Handle next track logic
  const handleNextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      audioEngine.seek(0);
      audioEngine.resume();
      setCurrentTime(0);
      return;
    }

    let nextTrack: Track;
    if (isShuffle) {
      const candidates = queue.filter((t) => t.id !== currentTrack.id);
      nextTrack = candidates[Math.floor(Math.random() * candidates.length)] || queue[0];
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

  // Handle prev track logic
  const handlePrevTrack = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }

    if (queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevTrack = queue[prevIndex];

    setCurrentTrack(prevTrack);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.playTrack(prevTrack, 0);
  }, [queue, currentTrack, currentTime]);

  // Setup audio engine callbacks
  useEffect(() => {
    audioEngine.setCallbacks(
      (time) => {
        setCurrentTime(time);
      },
      () => {
        handleNextTrack();
      }
    );
  }, [handleNextTrack]);

  // Play a specific track
  const handlePlayTrack = (track: Track) => {
    if (currentTrack.id === track.id && isPlaying) {
      return;
    }
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.playTrack(track, 0);

    // Increment play count
    setTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, playCount: t.playCount + 1 } : t))
    );
  };

  // Toggle play/pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.resume();
      setIsPlaying(true);
    }
  };

  // Seek
  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  };

  // Toggle favorite
  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const nextFav = !t.isFavorite;
          showToast(nextFav ? `Added "${t.title}" to Liked Tracks` : `Removed from Liked Tracks`);
          return { ...t, isFavorite: nextFav };
        }
        return t;
      })
    );
    if (currentTrack.id === trackId) {
      setCurrentTrack((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    }
  };

  // Repeat toggle: off -> all -> one -> off
  const handleToggleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  // Shuffle toggle
  const handleToggleShuffle = () => {
    setIsShuffle((prev) => {
      const next = !prev;
      showToast(next ? 'Shuffle is ON' : 'Shuffle is OFF');
      return next;
    });
  };

  // Shuffle all library tracks
  const handleShuffleAll = () => {
    if (tracks.length === 0) return;
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    setIsShuffle(true);
    handlePlayTrack(randomTrack);
    showToast('Shuffling all offline tracks');
  };

  // Create playlist
  const handleCreatePlaylist = (title: string, description: string, selectedTrackIds: string[]) => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      title,
      description: description || 'Offline collection',
      trackIds: selectedTrackIds,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    showToast(`Created playlist "${title}"`);
  };

  // Delete playlist
  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    showToast('Playlist deleted');
  };

  // Add track to playlist
  const handleAddTrackToPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId && !p.trackIds.includes(trackId)) {
          return { ...p, trackIds: [...p.trackIds, trackId] };
        }
        return p;
      })
    );
    showToast('Added track to playlist');
  };

  // Remove track from playlist (or un-favorite if liked tracks) with Undo capability
  const handleRemoveTrackFromPlaylist = (trackId: string, playlistId: string) => {
    if (playlistId === 'liked') {
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, isFavorite: false } : t))
      );
      showToast('Removed from Liked Tracks', () => {
        setTracks((prev) =>
          prev.map((t) => (t.id === trackId ? { ...t, isFavorite: true } : t))
        );
      });
      return;
    }

    // Save previous index to restore track at exact same position on undo
    const currentPlaylist = playlists.find((p) => p.id === playlistId);
    const prevIndex = currentPlaylist ? currentPlaylist.trackIds.indexOf(trackId) : -1;

    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) };
        }
        return p;
      })
    );

    showToast('Removed song from playlist', () => {
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id === playlistId && !p.trackIds.includes(trackId)) {
            const nextTrackIds = [...p.trackIds];
            if (prevIndex >= 0 && prevIndex <= nextTrackIds.length) {
              nextTrackIds.splice(prevIndex, 0, trackId);
            } else {
              nextTrackIds.push(trackId);
            }
            return { ...p, trackIds: nextTrackIds };
          }
          return p;
        })
      );
    });
  };

  // Delete track from library
  const handleDeleteTrack = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    // Also remove from playlists
    setPlaylists((prev) =>
      prev.map((p) => ({ ...p, trackIds: p.trackIds.filter((id) => id !== trackId) }))
    );
    showToast('Track removed from library');
  };

  // Real local file import via HTML5 File API
  const handleImportUserAudio = (file: File) => {
    try {
      const objectUrl = URL.createObjectURL(file);
      const tempAudio = new Audio(objectUrl);

      tempAudio.addEventListener('loadedmetadata', () => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp3';
        const rawTitle = file.name.replace(/\.[^/.]+$/, '');
        const durationSec = Math.round(tempAudio.duration) || 180;

        const newTrack: Track = {
          id: `user-track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: rawTitle,
          artist: 'Local Device File',
          album: 'Device Storage',
          duration: durationSec,
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          audioUrl: objectUrl,
          format: (['mp3', 'flac', 'm4a', 'aac', 'wav'].includes(fileExtension) ? fileExtension : 'mp3') as Track['format'],
          bitrate: `${Math.round(file.size / (durationSec * 128))} kbps`,
          isFavorite: false,
          playCount: 0,
          dateAdded: new Date().toISOString().split('T')[0],
          folderPath: '/storage/emulated/0/Music',
          category: file.name.toLowerCase().includes('voice') ? 'voice_note' : 'song',
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        };

        setTracks((prev) => [newTrack, ...prev]);
        setStorageFolders((prev) =>
          prev.map((f) => (f.path.includes('Music') ? { ...f, fileCount: f.fileCount + 1 } : f))
        );
        showToast(`Imported "${rawTitle}" successfully`);
      });
    } catch (err) {
      console.error('File import error:', err);
      showToast('Could not parse audio file');
    }
  };

  // Device storage scan simulation
  const handleScanDevice = async () => {
    setIsScanning(true);

    try {
      const { deviceAudioScanner } = await import('./services/deviceScanner');

      if (!deviceAudioScanner.isNative) {
        setIsScanning(false);
        showToast('Device scan requires the Android app — tap Import to add an audio file here.');
        return;
      }

      const granted = await deviceAudioScanner.requestPermission();
      if (!granted) {
        setIsScanning(false);
        showToast('Storage permission was not granted');
        return;
      }

      await deviceAudioScanner.scanDeviceAudio((p) => {
        if (p.phase === 'done') {
          setIsScanning(false);
          showToast(
            p.discovered > 0
              ? `Device scan complete — ${p.discovered} audio files indexed`
              : 'Device scan complete — no audio files found'
          );
        } else if (p.phase === 'error') {
          setIsScanning(false);
          showToast(p.message || 'Could not scan device storage');
        }
      });
    } catch (e) {
      console.error('[App] handleScanDevice error:', e);
      setIsScanning(false);
      showToast('Could not scan device storage');
    }
  };

  // Keyboard shortcut listener (Space = play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        handleNextTrack();
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        handlePrevTrack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleNextTrack, handlePrevTrack]);

  return (
    <div className="min-h-screen bg-[#0c0e14] text-[#e2e2eb] flex flex-col items-center justify-center p-0 md:p-4 select-none">
      {/* Viewport Frame Mode Switcher for Desktop Preview */}
      <div className="hidden md:flex items-center gap-2 mb-3 bg-[#181724]/90 border border-white/10 px-3 py-1.5 rounded-full text-xs text-[#958da1]">
        <span className="text-white/60">Preview Mode:</span>
        <button
          onClick={() => setViewChassis('mobile')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
            viewChassis === 'mobile' ? 'bg-[#7c3aed] text-white font-semibold' : 'hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Device Frame</span>
        </button>
        <button
          onClick={() => setViewChassis('fluid')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
            viewChassis === 'fluid' ? 'bg-[#7c3aed] text-white font-semibold' : 'hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Expanded View</span>
        </button>
      </div>

      {/* Main Container: Exact Mobile Frame matching Mockup or Fluid View */}
      <div
        className={`w-full bg-[#13121b] flex flex-col relative overflow-hidden transition-all duration-300 ${
          viewChassis === 'mobile'
            ? 'max-w-[400px] h-[852px] min-h-[852px] rounded-[42px] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]'
            : 'max-w-2xl min-h-screen md:rounded-3xl border border-white/10'
        }`}
      >
        {isSplashActive ? (
          <SplashScreen onEnter={() => setIsSplashActive(false)} />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Top iOS Status Bar */}
            <StatusBar time="9:41" />

            {/* Top Header */}
            <TopHeader
              onViewSplash={() => setIsSplashActive(true)}
              showAddPlaylist={activeTab === 'playlists' && !selectedPlaylistId}
              onOpenNewPlaylist={() => {
                const modalTrigger = document.querySelector('button[aria-label="Create Playlist"]');
                if (modalTrigger instanceof HTMLElement) modalTrigger.click();
              }}
              showBackButton={!!selectedPlaylistId}
              onBack={() => setSelectedPlaylistId(null)}
              title={selectedPlaylistId ? (selectedPlaylistId === 'liked' ? 'Liked Tracks' : 'Playlist') : undefined}
            />

            {/* Main Screen Content Router */}
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
                    const playlistTracks = playlist.id === 'liked' 
                      ? tracks.filter(t => t.isFavorite)
                      : playlist.trackIds.map(id => tracks.find(t => t.id === id)).filter((t): t is Track => !!t);
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

            {/* Persistent Floating Mini-Player Bar */}
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

            {/* Bottom Navigation Bar */}
            <BottomNav
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                setSelectedPlaylistId(null);
              }}
            />
          </div>
        )}

        {/* Full-Screen Now Playing Modal */}
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
              onSelectTrackFromQueue={(t) => {
                handlePlayTrack(t);
              }}
              onAddToPlaylist={(track) => {
                setSelectedTrackForOptions(track);
              }}
            />
          )}
        </AnimatePresence>

        {/* Track Options Modal */}
        <TrackOptionsModal
          track={selectedTrackForOptions}
          isOpen={!!selectedTrackForOptions}
          onClose={() => setSelectedTrackForOptions(null)}
          playlists={playlists}
          onToggleFavorite={handleToggleFavorite}
          onAddTrackToPlaylist={handleAddTrackToPlaylist}
          onDeleteTrack={handleDeleteTrack}
        />

        {/* Floating Toast Notification with Undo Option */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1c1a26]/95 border border-[#7c3aed]/50 text-white pl-4 pr-3 py-2 rounded-full shadow-2xl text-xs font-medium flex items-center gap-3 backdrop-blur-md max-w-[90%] sm:max-w-md"
            >
              <div className="flex items-center gap-2 truncate">
                <CheckCircle className="w-3.5 h-3.5 text-[#c7bfff] flex-shrink-0" />
                <span className="truncate">{toast.message}</span>
              </div>

              {toast.onUndo && (
                <button
                  onClick={() => {
                    toast.onUndo?.();
                    setToast(null);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7c3aed]/30 hover:bg-[#7c3aed] text-[#c7bfff] hover:text-white font-semibold transition-all active:scale-95 cursor-pointer ml-1 flex-shrink-0 border border-[#7c3aed]/40"
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
