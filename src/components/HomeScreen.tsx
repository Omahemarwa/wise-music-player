import React, { useState, useMemo } from 'react';
import { Search, Play, Pause, MoreVertical, Music2, ListMusic, Heart, Music } from 'lucide-react';
import { Track, Playlist } from '../types';

interface HomeScreenProps {
  tracks: Track[];
  playlists?: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onTrackOptions: (track: Track) => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
  onPlayPlaylist?: (playlist: Playlist) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  tracks,
  playlists = [],
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onTrackOptions,
  onSelectPlaylist,
  onPlayPlaylist,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'most_played' | 'recently_added' | 'playlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Derived track lists based on search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase().trim();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [tracks, searchQuery]);

  // Display tracks sorted according to active tab - showing all songs through to the end
  const displayTracks = useMemo(() => {
    if (activeFilter === 'most_played') {
      return [...filteredTracks].sort((a, b) => b.playCount - a.playCount);
    }
    if (activeFilter === 'recently_added') {
      return [...filteredTracks].sort(
        (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      );
    }
    return filteredTracks;
  }, [filteredTracks, activeFilter]);

  // Liked tracks playlist
  const likedTracks = useMemo(() => tracks.filter((t) => t.isFavorite), [tracks]);

  // Combined and filtered playlists
  const displayPlaylists = useMemo(() => {
    const likedItem: Playlist = {
      id: 'liked',
      title: 'Liked Tracks',
      description: 'All your favorite songs',
      trackIds: likedTracks.map((t) => t.id),
      createdAt: 'auto',
      isSmart: true,
    };

    const list = [likedItem, ...playlists];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [playlists, likedTracks, searchQuery]);

  const sectionTitle = useMemo(() => {
    if (activeFilter === 'most_played') return 'Top Tracks';
    if (activeFilter === 'recently_added') return 'Recently Added';
    if (activeFilter === 'playlist') return 'Playlists';
    return 'All Songs';
  }, [activeFilter]);

  return (
    <div className="flex-1 px-4 pt-3 pb-36 space-y-5">
      {/* Search Input Bar */}
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

      {/* Filter Tabs: All, Top, Recent, Playlists - configured to fit screen width */}
      <div className="grid grid-cols-4 gap-1.5 w-full py-0.5">
        <button
          onClick={() => setActiveFilter('all')}
          className={`h-9 px-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer truncate ${
            activeFilter === 'all'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
              : 'bg-[#1c1a24] text-[#958da1] hover:bg-white/5 border border-white/10'
          }`}
        >
          {activeFilter === 'all' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 animate-pulse"></span>
          )}
          <span>All</span>
        </button>

        <button
          onClick={() => setActiveFilter('most_played')}
          className={`h-9 px-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer truncate ${
            activeFilter === 'most_played'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
              : 'bg-[#1c1a24] text-[#958da1] hover:bg-white/5 border border-white/10'
          }`}
        >
          {activeFilter === 'most_played' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 animate-pulse"></span>
          )}
          <span>Top</span>
        </button>

        <button
          onClick={() => setActiveFilter('recently_added')}
          className={`h-9 px-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer truncate ${
            activeFilter === 'recently_added'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
              : 'bg-[#1c1a24] text-[#958da1] hover:bg-white/5 border border-white/10'
          }`}
        >
          {activeFilter === 'recently_added' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 animate-pulse"></span>
          )}
          <span>Recent</span>
        </button>

        <button
          onClick={() => setActiveFilter('playlist')}
          className={`h-9 px-1 rounded-full text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer truncate ${
            activeFilter === 'playlist'
              ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
              : 'bg-[#1c1a24] text-[#958da1] hover:bg-white/5 border border-white/10'
          }`}
        >
          {activeFilter === 'playlist' && (
            <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 animate-pulse"></span>
          )}
          <span>Playlists</span>
        </button>
      </div>

      {activeFilter === 'playlist' ? (
        /* Playlists Section */
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              Playlists
            </h2>
            <span className="text-xs text-[#958da1] font-mono">
              {displayPlaylists.length} {displayPlaylists.length === 1 ? 'playlist' : 'playlists'}
            </span>
          </div>

          {displayPlaylists.length === 0 ? (
            <div className="py-12 text-center text-[#958da1] text-xs flex flex-col items-center gap-2">
              <ListMusic className="w-8 h-8 stroke-1 text-[#958da1]/40" />
              <p>No playlists found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {displayPlaylists.map((playlist) => {
                const isLiked = playlist.id === 'liked';
                const pTracks = isLiked
                  ? likedTracks
                  : playlist.trackIds
                      .map((id) => tracks.find((t) => t.id === id))
                      .filter((t): t is Track => !!t);

                return (
                  <div
                    key={playlist.id}
                    onClick={() => onSelectPlaylist?.(playlist)}
                    className="h-16 flex items-center justify-between px-2.5 rounded-2xl hover:bg-[#1c1a24]/80 active:scale-[0.99] transition-all cursor-pointer group border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#12111a] border border-white/10 flex items-center justify-center shadow-md">
                        {isLiked ? (
                          <div className="w-full h-full bg-[#7c3aed] flex items-center justify-center text-white">
                            <Heart className="w-5 h-5 fill-white" />
                          </div>
                        ) : playlist.customGridCovers && playlist.customGridCovers.length >= 4 ? (
                          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px]">
                            {playlist.customGridCovers.map((src, i) => (
                              <img key={i} src={src} alt="grid" className="w-full h-full object-cover" />
                            ))}
                          </div>
                        ) : playlist.coverUrl ? (
                          <img
                            src={playlist.coverUrl}
                            alt={playlist.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#2a2835] flex items-center justify-center text-[#c7bfff]">
                            <Music className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#c7bfff] transition-colors">
                          {playlist.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#958da1]">
                          <span>{pTracks.length} {pTracks.length === 1 ? 'track' : 'tracks'}</span>
                          {playlist.description && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[140px]">{playlist.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (onPlayPlaylist) {
                            onPlayPlaylist(playlist);
                          } else if (pTracks.length > 0) {
                            onPlayTrack(pTracks[0]);
                          }
                        }}
                        disabled={pTracks.length === 0}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-[#7c3aed] hover:shadow-md hover:shadow-[#7c3aed]/40 active:scale-90 transition-all cursor-pointer disabled:opacity-40"
                        aria-label="Play Playlist"
                      >
                        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        /* Unified Track Section: Shows all tracks until the end with no truncated 'See all' buttons */
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              {sectionTitle}
            </h2>
            <span className="text-xs text-[#958da1] font-mono">
              {displayTracks.length} {displayTracks.length === 1 ? 'song' : 'songs'}
            </span>
          </div>

          {displayTracks.length === 0 ? (
            <div className="py-12 text-center text-[#958da1] text-xs flex flex-col items-center gap-2">
              <Music2 className="w-8 h-8 stroke-1 text-[#958da1]/40" />
              <p>No songs found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {displayTracks.map((track, idx) => {
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
                        idx === 0 && activeFilter === 'most_played' ? 'text-[#c7bfff]' : 'text-[#958da1]'
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
          )}
        </section>
      )}
    </div>
  );
};
