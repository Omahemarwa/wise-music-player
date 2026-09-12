import React, { useState } from 'react';
import { Search, Sliders, Play, Pause, MoreVertical, Sparkles } from 'lucide-react';
import { Track } from '../types';

interface HomeScreenProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onTrackOptions: (track: Track) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onTrackOptions,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'most_played' | 'recently_added'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Derived track lists
  const filteredTracks = tracks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q);
  });

  const mostPlayedTracks = [...filteredTracks].sort((a, b) => b.playCount - a.playCount).slice(0, 4);
  const recentlyAddedTracks = [...filteredTracks].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()).slice(0, 4);

  return (
    <div className="flex-1 px-4 pt-3 pb-36 space-y-5">
      {/* Search Input Bar matching Image 2 */}
      <div className="relative flex items-center w-full rounded-full bg-[#1c1a24] border border-white/10 px-4 py-2.5 text-sm text-white focus-within:border-[#7c3aed]/70 transition-all shadow-inner">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Looking for..."
          className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-[#958da1]/60 pr-8 focus:ring-0 focus:outline-none"
        />
        <button 
          aria-label="Search" 
          className="absolute right-3.5 text-[#958da1] hover:text-[#c7bfff] transition-colors flex items-center justify-center"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Filter Chips Carousel matching Image 2 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
              : 'bg-[#1c1a24] text-[#958da1] hover:bg-white/5 border border-white/10'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          All
        </button>

        <button
          onClick={() => setActiveFilter('most_played')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
            activeFilter === 'most_played'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
              : 'bg-[#1c1a24] text-[#958da1] hover:bg-white/5 border border-white/10'
          }`}
        >
          Most Played
        </button>

        <button
          onClick={() => setActiveFilter('recently_added')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
            activeFilter === 'recently_added'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
              : 'bg-[#1c1a24] text-[#958da1] hover:bg-white/5 border border-white/10'
          }`}
        >
          Recently Added
        </button>
      </div>

      {/* Section 1: Most Played */}
      {(activeFilter === 'all' || activeFilter === 'most_played') && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-white tracking-tight">Most Played</h2>
            <span className="text-xs font-semibold text-[#c7bfff] hover:underline cursor-pointer">
              See all
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {mostPlayedTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className={`h-16 flex items-center justify-between px-2.5 rounded-2xl transition-all cursor-pointer group ${
                    isCurrent 
                      ? 'bg-[#7c3aed]/20 border border-[#7c3aed]/40' 
                      : 'hover:bg-[#1c1a24]/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-mono font-bold w-4 text-center flex-shrink-0 ${
                      idx === 0 ? 'text-[#c7bfff]' : 'text-[#958da1]'
                    }`}>
                      {idx + 1}
                    </span>

                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#12111a]">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-[#c7bfff]' : 'text-white'
                      }`}>
                        {track.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-[#958da1] truncate">{track.artist}</span>
                        {track.format === 'flac' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-white/10 text-[#c7bfff]">
                            FLAC
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (isCurrent) {
                          onTogglePlay();
                        } else {
                          onPlayTrack(track);
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
                        isCurrent
                          ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      aria-label="Play Track"
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onTrackOptions(track)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#958da1] hover:text-white transition-colors"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 2: Recently Added */}
      {(activeFilter === 'all' || activeFilter === 'recently_added') && (
        <section className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-white tracking-tight">Recently Added</h2>
            <span className="text-xs font-semibold text-[#c7bfff] hover:underline cursor-pointer">
              See all
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {recentlyAddedTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className={`h-16 flex items-center justify-between px-2.5 rounded-2xl transition-all cursor-pointer group ${
                    isCurrent 
                      ? 'bg-[#7c3aed]/20 border border-[#7c3aed]/40' 
                      : 'hover:bg-[#1c1a24]/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-[#958da1] w-4 text-center flex-shrink-0">
                      {idx + 1}
                    </span>

                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#12111a]">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-[#c7bfff]' : 'text-white'
                      }`}>
                        {track.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-[#958da1] truncate">{track.artist}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (isCurrent) {
                          onTogglePlay();
                        } else {
                          onPlayTrack(track);
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
                        isCurrent
                          ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      aria-label="Play Track"
                    >
                      {isCurrentPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onTrackOptions(track)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#958da1] hover:text-white transition-colors"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
