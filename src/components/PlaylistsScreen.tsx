import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  SlidersHorizontal, 
  Heart, 
  Plus, 
  FolderHeart, 
  ChevronDown, 
  MoreVertical, 
  Play, 
  Pause,
  Shuffle, 
  ArrowLeft,
  Trash2,
  Music
} from 'lucide-react';
import { Playlist, Track } from '../types';
import { formatTotalDuration, formatTime } from '../utils/formatters';

interface PlaylistsScreenProps {
  playlists: Playlist[];
  allTracks: Track[];
  onSelectPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: (title: string, description: string, selectedTrackIds: string[]) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveTrackFromPlaylist?: (trackId: string, playlistId: string) => void;
  onPlayTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  selectedPlaylistId: string | null;
  onClearSelectedPlaylist: () => void;
}

export const PlaylistsScreen: React.FC<PlaylistsScreenProps> = ({
  playlists,
  allTracks,
  onSelectPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onPlayTrack,
  currentTrack,
  isPlaying,
  onTogglePlay,
  selectedPlaylistId,
  onClearSelectedPlaylist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  // Count liked tracks
  const likedTracks = allTracks.filter((t) => t.isFavorite);

  // Selected playlist object
  const activePlaylist = selectedPlaylistId === 'liked'
    ? {
        id: 'liked',
        title: 'Liked Tracks',
        description: 'All your favorite songs stored offline on your device.',
        trackIds: likedTracks.map((t) => t.id),
        createdAt: 'Auto-updated',
        isSmart: true,
      }
    : playlists.find((p) => p.id === selectedPlaylistId);

  const activePlaylistTracks = activePlaylist
    ? activePlaylist.trackIds
        .map((id) => allTracks.find((t) => t.id === id))
        .filter((t): t is Track => !!t)
    : [];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim(), newDescription.trim(), selectedTrackIds);
    setNewTitle('');
    setNewDescription('');
    setSelectedTrackIds([]);
    setIsCreateModalOpen(false);
  };

  const toggleTrackInNewPlaylist = (id: string) => {
    setSelectedTrackIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // If viewing a single playlist details view
  if (activePlaylist) {
    return (
      <div className="flex-1 px-4 pt-3 pb-36 space-y-4">
        {/* Back button and title */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClearSelectedPlaylist}
            className="flex items-center gap-1 text-sm font-semibold text-[#c7bfff] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Playlists</span>
          </button>

          {!activePlaylist.isSmart && (
            <button
              onClick={() => {
                if (confirm(`Delete playlist "${activePlaylist.title}"?`)) {
                  onDeletePlaylist(activePlaylist.id);
                  onClearSelectedPlaylist();
                }
              }}
              className="text-red-400 hover:text-red-300 p-1.5 rounded-full hover:bg-white/5 transition-colors"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Playlist Hero Info Card */}
        <div className="flex gap-4 items-center bg-[#1c1a26] border border-white/10 p-3.5 rounded-2xl shadow-xl">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#12111a] flex-shrink-0 relative border border-white/10 shadow-md">
            {activePlaylist.id === 'liked' ? (
              <div className="w-full h-full bg-[#7c3aed] flex items-center justify-center text-white">
                <Heart className="w-8 h-8 fill-white" />
              </div>
            ) : activePlaylist.customGridCovers ? (
              <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px]">
                {activePlaylist.customGridCovers.map((src, i) => (
                  <img key={i} src={src} alt="cover" className="w-full h-full object-cover" />
                ))}
              </div>
            ) : activePlaylist.coverUrl ? (
              <img src={activePlaylist.coverUrl} alt={activePlaylist.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#2a2835] flex items-center justify-center text-[#c7bfff]">
                <Music className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white truncate">{activePlaylist.title}</h2>
            <p className="text-xs text-[#958da1] line-clamp-2 mt-0.5">{activePlaylist.description}</p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#c7bfff] mt-1.5">
              <span>{activePlaylistTracks.length} tracks</span>
              <span>•</span>
              <span>{formatTotalDuration(activePlaylistTracks)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Play All / Shuffle */}
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              if (activePlaylistTracks.length > 0) {
                onPlayTrack(activePlaylistTracks[0]);
              }
            }}
            disabled={activePlaylistTracks.length === 0}
            className="flex-1 py-2.5 px-4 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play All</span>
          </button>

          <button
            onClick={() => {
              if (activePlaylistTracks.length > 0) {
                const randomTrack = activePlaylistTracks[Math.floor(Math.random() * activePlaylistTracks.length)];
                onPlayTrack(randomTrack);
              }
            }}
            disabled={activePlaylistTracks.length === 0}
            className="flex-1 py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <Shuffle className="w-4 h-4" />
            <span>Shuffle</span>
          </button>
        </div>

        {/* Track list inside playlist with swipe-to-remove */}
        <div className="space-y-1.5 pt-1">
          {activePlaylistTracks.length > 0 && (
            <p className="text-[10px] text-[#958da1]/70 text-center pb-1">
              Swipe any song left or right to remove from playlist
            </p>
          )}

          {activePlaylistTracks.length === 0 ? (
            <div className="p-8 text-center text-white/50 text-xs">
              <p>No tracks in this playlist yet.</p>
              <p className="mt-1 text-white/30">Browse Library to add your favorite songs.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {activePlaylistTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                const isCurrentPlaying = isCurrent && isPlaying;

                return (
                  <motion.div
                    key={track.id}
                    layout
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                    className="relative overflow-hidden rounded-xl bg-red-950/40"
                  >
                    {/* Background swipe indicators */}
                    <div className="absolute inset-0 flex items-center justify-between px-4 bg-red-600/90 text-white rounded-xl">
                      <div className="flex items-center gap-1 text-xs font-semibold">
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold">
                        <span>Remove</span>
                        <Trash2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Draggable Foreground track item */}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.8}
                      onDragEnd={(_, info) => {
                        // If swiped significantly left or right (>= 100px or fast swipe)
                        if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 400) {
                          if (onRemoveTrackFromPlaylist) {
                            onRemoveTrackFromPlaylist(track.id, activePlaylist.id);
                          }
                        }
                      }}
                      onClick={() => onPlayTrack(track)}
                      className={`relative z-10 h-14 flex items-center justify-between px-2.5 rounded-xl transition-colors cursor-pointer select-none bg-[#181622] ${
                        isCurrent ? 'border border-[#7c3aed]/50 bg-[#1f1b2e]' : 'hover:bg-[#1e1c2a]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xs font-mono text-[#958da1] w-4 text-center">
                          {idx + 1}
                        </span>
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 pointer-events-none"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-[#c7bfff]' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-[11px] text-[#958da1] truncate">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#958da1]">{formatTime(track.duration)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCurrent) onTogglePlay();
                            else onPlayTrack(track);
                          }}
                          className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#7c3aed] flex items-center justify-center text-white transition-colors"
                        >
                          {isCurrentPlaying ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current translate-x-0.5" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    );
  }

  // Normal Playlists Directory Screen matching Image 7
  return (
    <div className="flex-1 px-4 pt-3 pb-36 space-y-5">
      {/* Search playlists input */}
      <div className="relative flex items-center h-12 rounded-full bg-[#1c1a24] border border-white/10 px-4 focus-within:border-[#7c3aed] shadow-inner transition-all">
        <Search className="w-4 h-4 text-[#958da1] mr-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search playlists, moods, or genres..."
          className="bg-transparent border-none outline-none text-sm text-white placeholder:text-[#958da1] w-full focus:ring-0"
        />
        <button aria-label="Filter" className="text-[#958da1] hover:text-white">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Bento Grid Top Cards: Liked Tracks + Create Playlist */}
      <div className="grid grid-cols-2 gap-3">
        {/* Liked Tracks Bento Card */}
        <div
          onClick={() => onSelectPlaylist({
            id: 'liked',
            title: 'Liked Tracks',
            description: 'All your favorite tracks',
            trackIds: likedTracks.map((t) => t.id),
            createdAt: 'auto',
          })}
          className="group relative overflow-hidden rounded-2xl bg-[#1c1a24] border border-white/10 p-3 flex flex-col items-center justify-center gap-2.5 h-34 active:scale-[0.98] transition-transform cursor-pointer text-center hover:border-[#7c3aed]/40 shadow-md"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#7c3aed] shadow-md text-white group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white truncate">Liked Tracks</h3>
            <span className="text-[11px] text-[#958da1] mt-0.5 block">{likedTracks.length} tracks</span>
          </div>
        </div>

        {/* Create Playlist Bento Card */}
        <div
          onClick={() => setIsCreateModalOpen(true)}
          className="group relative overflow-hidden rounded-2xl bg-[#1c1a24] border border-white/10 p-3 flex flex-col items-center justify-center gap-2.5 h-34 active:scale-[0.98] transition-transform cursor-pointer text-center hover:border-[#7c3aed]/40 shadow-md"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 border border-white/15 text-[#c7bfff] group-hover:border-[#7c3aed] group-hover:bg-[#7c3aed]/20 transition-all">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#c7bfff] transition-colors">
              Create Playlist
            </h3>
            <span className="text-[11px] text-[#958da1] mt-0.5 block">Custom mix</span>
          </div>
        </div>
      </div>

      {/* Section: Other Playlists */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <FolderHeart className="w-4 h-4 text-[#c7bfff]" />
            <h2 className="text-base font-bold text-white tracking-tight">Other Playlists</h2>
          </div>
          <button className="text-xs font-semibold text-[#c7bfff] hover:underline flex items-center gap-0.5 cursor-pointer">
            <span>Sort by Recent</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          {playlists
            .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((playlist) => {
              const playlistTracks = playlist.trackIds
                .map((id) => allTracks.find((t) => t.id === id))
                .filter((t): t is Track => !!t);

              return (
                <div
                  key={playlist.id}
                  onClick={() => onSelectPlaylist(playlist)}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-[#1c1a24]/90 active:scale-[0.99] transition-all group cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* 4-tile album artwork collage or single image */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#12111a] flex-shrink-0 shadow-md border border-white/10">
                      {playlist.customGridCovers && playlist.customGridCovers.length >= 4 ? (
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[1px]">
                          {playlist.customGridCovers.map((src, i) => (
                            <img key={i} src={src} alt="grid" className="w-full h-full object-cover" />
                          ))}
                        </div>
                      ) : playlist.coverUrl ? (
                        <img src={playlist.coverUrl} alt={playlist.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#201e2a] flex items-center justify-center text-[#c7bfff]">
                          <Music className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#c7bfff] transition-colors">
                        {playlist.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#958da1]">
                        <span>{playlistTracks.length} tracks</span>
                        <span>•</span>
                        <span>{formatTotalDuration(playlistTracks)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (playlistTracks.length > 0) {
                          onPlayTrack(playlistTracks[0]);
                        }
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-[#7c3aed] text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer"
                      aria-label="Play playlist"
                    >
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                    </button>
                    <button
                      onClick={() => onSelectPlaylist(playlist)}
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

      {/* Modal: Create Playlist */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#1c1a26] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-1 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Create New Playlist</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-[#958da1] block mb-1">Playlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midnight Chill, Gym Beats"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#12111a] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="text-xs text-[#958da1] block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Relaxing tunes for rainy nights"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#12111a] border border-white/10 text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="text-xs text-[#958da1] block mb-1.5">
                  Select Songs ({selectedTrackIds.length} chosen)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-white/10 rounded-xl p-2 bg-[#12111a]">
                  {allTracks.map((t) => {
                    const isSelected = selectedTrackIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleTrackInNewPlaylist(t.id)}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer ${
                          isSelected ? 'bg-[#7c3aed]/30 text-white' : 'hover:bg-white/5 text-[#958da1]'
                        }`}
                      >
                        <span className="truncate pr-2">{t.title} - {t.artist}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="accent-[#7c3aed] rounded"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="flex-1 py-2.5 rounded-full bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#8b5cf6] disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
