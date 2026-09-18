import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart } from 'lucide-react';
import { Track } from '../types';

interface MiniPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenNowPlaying: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onToggleFavorite,
  onOpenNowPlaying,
}) => {
  const progressPercent = currentTrack.duration > 0 
    ? Math.min(100, (currentTime / currentTrack.duration) * 100) 
    : 0;

  return (
    <div className="fixed bottom-[74px] left-0 right-0 z-30 max-w-md mx-auto px-3 pointer-events-none">
      <div className="pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#1c1a26]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl p-2.5 flex items-center justify-between transition-all">
        {/* Track Thumbnail & Information - Click to open Now Playing */}
        <div 
          onClick={onOpenNowPlaying}
          className="flex items-center gap-3 min-w-0 flex-1 mr-2 cursor-pointer group"
        >
          <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-[#7c3aed]/40 bg-slate-100 dark:bg-[#12111a]">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="flex items-end gap-[2px] h-3">
                  <div className="w-[2px] bg-[#c7bfff] animate-[bounce_0.8s_infinite] h-2"></div>
                  <div className="w-[2px] bg-[#c7bfff] animate-[bounce_0.6s_infinite] h-3"></div>
                  <div className="w-[2px] bg-[#c7bfff] animate-[bounce_0.9s_infinite] h-1.5"></div>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
              <span className="truncate">{currentTrack.title}</span>
              {isPlaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-ping flex-shrink-0"></span>
              )}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-[#958da1] truncate mt-0.5">
              {currentTrack.artist}
              {currentTrack.format && (
                <span className="text-[10px] text-[#7c3aed]/70 dark:text-[#c7bfff]/70 ml-1.5 uppercase font-mono">
                  • {currentTrack.format}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Favorite Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(currentTrack.id);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-[#958da1] hover:text-slate-900 dark:hover:text-white active:scale-90 transition-transform"
            aria-label="Favorite"
          >
            <Heart 
              className={`w-4 h-4 ${
                currentTrack.isFavorite 
                  ? 'fill-[#7c3aed] text-[#7c3aed] dark:fill-[#c7bfff] dark:text-[#c7bfff]' 
                  : 'stroke-[1.8]'
              }`} 
            />
          </button>

          {/* Previous Track */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevTrack();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-transform"
            aria-label="Previous Track"
          >
            <SkipBack className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="w-9 h-9 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNextTrack();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-transform"
            aria-label="Next Track"
          >
            <SkipForward className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Micro Progress Rail */}
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-200 dark:bg-white/[0.08]">
          <div 
            className="h-full bg-gradient-to-r from-[#7c3aed] to-[#c7bfff] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
