import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import {
  ChevronDown,
  MoreVertical,
  Heart,
  Shuffle,
  Repeat,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  ListMusic,
  Mic2,
  FolderPlus,
} from 'lucide-react';
import { Track, RepeatMode } from '../types';
import { formatTime } from '../utils/formatters';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onToggleFavorite: (trackId: string) => void;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  queue: Track[];
  onSelectTrackFromQueue: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  onTogglePlay,
  onSeek,
  onNextTrack,
  onPrevTrack,
  onToggleFavorite,
  repeatMode,
  onToggleRepeat,
  isShuffle,
  onToggleShuffle,
  queue,
  onSelectTrackFromQueue,
  onAddToPlaylist,
}) => {
  const [activeSheet, setActiveSheet] = useState<
    'none' | 'lyrics' | 'queue' | 'menu'
  >('none');
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  if (!isOpen) return null;

  const duration = currentTrack.duration || 0;
  const currentPos = isSeeking ? seekValue : currentTime;
  const progressPercent = duration > 0 ? (currentPos / duration) * 100 : 0;

  const nextTrackIndex =
    queue.length > 0
      ? (queue.findIndex((t) => t.id === currentTrack.id) + 1) % queue.length
      : 0;
  const nextTrack = queue[nextTrackIndex] || currentTrack;

  const activeLyricIndex =
    currentTrack.lyrics?.findIndex((line, index, arr) => {
      const nextLine = arr[index + 1];
      if (nextLine) {
        return currentPos >= line.time && currentPos < nextLine.time;
      }
      return currentPos >= line.time;
    }) ?? -1;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekValue(currentTime);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    onSeek(seekValue);
  };

  // Drag-down-to-dismiss
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) {
      onClose();
    }
  };

  // Stop framer-motion's drag listener from swallowing taps on buttons.
  const stopDragPropagation = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed inset-0 z-50 flex justify-center items-center select-none bg-black/60 backdrop-blur-md"
    >
      {/* Mobile Device Canvas with drag-to-dismiss */}
      <motion.div
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        className="w-full max-w-md h-full min-h-[750px] max-h-[920px] bg-slate-50 dark:bg-[#181724] text-slate-900 dark:text-white flex flex-col justify-between overflow-hidden relative shadow-2xl rounded-[36px] border border-slate-200 dark:border-white/10"
      >
        {/* Ambient album glow (color derived from current track, no mocks) */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[90px] opacity-25 pointer-events-none -z-10"
          style={{ background: '#7c3aed' }}
        />

        {/* Navigation Header */}
        <div className="pt-2 px-5 z-20">
          {/* Grabber pill */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-white/25" />
          </div>

          <div className="flex items-center justify-between h-14 px-2 pt-1 pb-1">
            {/* Collapse — the arrow that closes the modal */}
            <button
              onClick={onClose}
              onPointerDownCapture={stopDragPropagation}
              aria-label="Collapse"
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronDown className="w-7 h-7" />
            </button>

            <div className="text-center">
              <h1 className="text-xs font-extrabold uppercase tracking-[0.25em] text-slate-700 dark:text-white/90 font-sans">
                NOW PLAYING
              </h1>
            </div>

            <button
              onClick={() =>
                setActiveSheet(activeSheet === 'menu' ? 'none' : 'menu')
              }
              onPointerDownCapture={stopDragPropagation}
              aria-label="More options"
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Album Artwork Card */}
        <div className="px-6 py-2 flex flex-col items-center justify-center relative z-10 flex-1">
          <div className="relative w-full max-w-[316px] aspect-square rounded-[28px] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#1f1d2c] group">
            {currentTrack.coverUrl ? (
              <img
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                src={currentTrack.coverUrl}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#7c3aed] text-8xl">
                ♪
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls & Track Details */}
        <div className="px-6 pb-6 pt-1 flex flex-col z-20">
          {/* Title & Favorite Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="text-[24px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                {currentTrack.title}
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-white/60 truncate mt-0.5">
                {currentTrack.artist}{' '}
                {currentTrack.featuredArtists && (
                  <span className="text-slate-400 dark:text-white/40 font-normal">
                    {currentTrack.featuredArtists}
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={() => onToggleFavorite(currentTrack.id)}
              onPointerDownCapture={stopDragPropagation}
              aria-label="Favorite"
              className="w-11 h-11 flex items-center justify-center rounded-full text-[#7c3aed] dark:text-[#c7bfff] hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <Heart
                className={`w-7 h-7 ${
                  currentTrack.isFavorite
                    ? 'fill-[#7c3aed] text-[#7c3aed] dark:fill-[#c7bfff] dark:text-[#c7bfff]'
                    : 'text-slate-400 dark:text-white/60 stroke-[1.8]'
                }`}
              />
            </button>
          </div>

          {/* Scrubber & Timestamps */}
          <div className="mb-5">
            <div className="relative w-full h-5 flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.5}
                value={currentPos}
                onChange={handleSeekChange}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                onPointerDownCapture={stopDragPropagation}
                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
              />

              <div className="relative w-full h-[5px] bg-slate-200 dark:bg-white/20 rounded-full flex items-center pointer-events-none">
                <div
                  className="h-full bg-[#7c3aed] dark:bg-[#c7bfff] rounded-full relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-[#7c3aed]" />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-1 text-xs font-semibold text-slate-500 dark:text-white/60 tracking-wider font-mono">
              <span>{formatTime(currentPos)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Playback Actions */}
          <div className="flex items-center justify-between px-1 mb-5">
            <button
              onClick={onToggleShuffle}
              onPointerDownCapture={stopDragPropagation}
              aria-label="Shuffle"
              className={`p-2 flex items-center justify-center active:scale-90 transition cursor-pointer ${
                isShuffle ? 'text-[#7c3aed] dark:text-[#c7bfff]' : 'text-slate-400 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={onPrevTrack}
              onPointerDownCapture={stopDragPropagation}
              aria-label="Previous"
              className="text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-transform p-2 cursor-pointer"
            >
              <SkipBack className="w-8 h-8 fill-current" />
            </button>

            <button
              onClick={onTogglePlay}
              onPointerDownCapture={stopDragPropagation}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-[68px] h-[68px] rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer glow-primary"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-white" />
              ) : (
                <Play className="w-8 h-8 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              onClick={onNextTrack}
              onPointerDownCapture={stopDragPropagation}
              aria-label="Next"
              className="text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-transform p-2 cursor-pointer"
            >
              <SkipForward className="w-8 h-8 fill-current" />
            </button>

            <button
              onClick={onToggleRepeat}
              onPointerDownCapture={stopDragPropagation}
              aria-label="Repeat"
              className={`p-2 flex items-center justify-center active:scale-90 transition cursor-pointer relative ${
                repeatMode !== 'off'
                  ? 'text-[#7c3aed] dark:text-[#c7bfff]'
                  : 'text-slate-400 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Repeat className="w-5 h-5" />
              {repeatMode === 'one' && (
                <span className="absolute top-1 right-1 text-[9px] font-bold">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Secondary Controls Bar */}
          <div className="flex items-center justify-center gap-2.5 mt-1">
            <button
              onClick={() =>
                setActiveSheet(activeSheet === 'queue' ? 'none' : 'queue')
              }
              onPointerDownCapture={stopDragPropagation}
              className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-full bg-[#7c3aed]/10 dark:bg-[#7c3aed]/25 hover:bg-[#7c3aed]/20 dark:hover:bg-[#7c3aed]/35 border border-[#7c3aed]/40 text-slate-900 dark:text-white shadow-md active:scale-95 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center shrink-0 text-white shadow-sm">
                  <ListMusic className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c3aed] dark:text-[#c7bfff]">
                      Up Next
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white/95 truncate">
                    {nextTrack.title}{' '}
                    <span className="text-slate-500 dark:text-white/50 font-normal">
                      • {nextTrack.artist}
                    </span>
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 dark:text-white/50 group-hover:text-slate-900 dark:group-hover:text-white transition-transform ${
                  activeSheet === 'queue' ? 'rotate-180' : ''
                }`}
              />
            </button>

            <button
              onClick={() =>
                setActiveSheet(activeSheet === 'lyrics' ? 'none' : 'lyrics')
              }
              onPointerDownCapture={stopDragPropagation}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs font-semibold tracking-wide active:scale-95 transition-all shrink-0 cursor-pointer ${
                activeSheet === 'lyrics'
                  ? 'bg-[#7c3aed] border-[#7c3aed] text-white'
                  : 'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mic2 className="w-4 h-4" />
              <span>Lyrics</span>
            </button>
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-300 dark:bg-white/30 rounded-full mx-auto mt-5" />
        </div>

        {/* Slide-over Sheet: Lyrics */}
        <AnimatePresence>
          {activeSheet === 'lyrics' && (
            <motion.div
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 150 }}
              onPointerDownCapture={stopDragPropagation}
              className="absolute inset-x-0 bottom-0 top-16 bg-white/98 dark:bg-[#13121b]/98 backdrop-blur-2xl rounded-t-[32px] p-6 z-40 border-t border-slate-200 dark:border-white/10 flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-[#7c3aed] dark:text-[#c7bfff]" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Lyrics</h3>
                </div>
                <button
                  onClick={() => setActiveSheet('none')}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-center no-scrollbar">
                {currentTrack.lyrics && currentTrack.lyrics.length > 0 ? (
                  currentTrack.lyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    return (
                      <p
                        key={idx}
                        onClick={() => onSeek(line.time)}
                        className={`cursor-pointer transition-all duration-300 py-1.5 px-3 rounded-lg ${
                          isActive
                            ? 'text-slate-900 dark:text-white text-lg font-bold bg-[#7c3aed]/15 dark:bg-[#7c3aed]/25 scale-105 shadow-sm'
                            : 'text-slate-400 dark:text-white/50 text-sm hover:text-slate-600 dark:hover:text-white/80'
                        }`}
                      >
                        {line.text}
                      </p>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/50 text-sm">
                    <p>No synced lyrics available for this local file.</p>
                    <p className="text-xs text-slate-300 dark:text-white/30 mt-1">
                      Enjoy the instrumentals!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slide-over Sheet: Queue */}
        <AnimatePresence>
          {activeSheet === 'queue' && (
            <motion.div
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 150 }}
              onPointerDownCapture={stopDragPropagation}
              className="absolute inset-x-0 bottom-0 top-20 bg-white/98 dark:bg-[#13121b]/98 backdrop-blur-2xl rounded-t-[32px] p-5 z-40 border-t border-slate-200 dark:border-white/10 flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-[#7c3aed] dark:text-[#c7bfff]" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Play Queue ({queue.length} tracks)
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSheet('none')}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2 space-y-1 pr-1 no-scrollbar">
                {queue.map((t, idx) => {
                  const isCurrent = t.id === currentTrack.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        onSelectTrackFromQueue(t);
                        setActiveSheet('none');
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#7c3aed]/15 dark:bg-[#7c3aed]/25 border border-[#7c3aed]/40'
                          : 'hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-slate-400 dark:text-white/40 w-4 text-center">
                          {idx + 1}
                        </span>
                        {t.coverUrl ? (
                          <img
                            src={t.coverUrl}
                            alt={t.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#1f1d2c] flex items-center justify-center text-[#7c3aed] shrink-0">
                            ♪
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isCurrent ? 'text-[#7c3aed] dark:text-[#c7bfff]' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {t.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-white/50 truncate">
                            {t.artist}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 dark:text-white/40 font-mono">
                        {formatTime(t.duration)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Menu Popover */}
        <AnimatePresence>
          {activeSheet === 'menu' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onPointerDownCapture={stopDragPropagation}
              className="absolute top-16 right-4 w-52 bg-white dark:bg-[#1f1d2c] border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl z-50 text-sm"
            >
              <button
                onClick={() => {
                  onToggleFavorite(currentTrack.id);
                  setActiveSheet('none');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
              >
                <Heart className="w-4 h-4 text-[#7c3aed] dark:text-[#c7bfff]" />
                <span>
                  {currentTrack.isFavorite ? 'Remove from Liked' : 'Add to Liked'}
                </span>
              </button>

              {onAddToPlaylist && (
                <button
                  onClick={() => {
                    onAddToPlaylist(currentTrack);
                    setActiveSheet('none');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                >
                  <FolderPlus className="w-4 h-4 text-[#7c3aed] dark:text-[#c7bfff]" />
                  <span>Add to Playlist</span>
                </button>
              )}

              <div className="border-t border-slate-200 dark:border-white/10 my-1" />

              <div className="px-3 py-2 text-xs text-slate-500 dark:text-white/50 space-y-1">
                <p>
                  Format:{' '}
                  <strong className="text-slate-700 dark:text-white/80 uppercase">
                    {currentTrack.format}
                  </strong>
                </p>
                <p>
                  Quality:{' '}
                  <strong className="text-slate-700 dark:text-white/80">
                    {currentTrack.bitrate || 'Lossless'}
                  </strong>
                </p>
                <p className="truncate">Path: {currentTrack.folderPath}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};