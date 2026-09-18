import React, { useState } from 'react';
import { Heart, Plus, Trash2, FolderPlus, Info, Check } from 'lucide-react';
import { Track, Playlist } from '../types';
import { formatTime } from '../utils/formatters';

interface TrackOptionsModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  onToggleFavorite: (trackId: string) => void;
  onAddTrackToPlaylist: (trackId: string, playlistId: string) => void;
  onDeleteTrack?: (trackId: string) => void;
}

export const TrackOptionsModal: React.FC<TrackOptionsModalProps> = ({
  track,
  isOpen,
  onClose,
  playlists,
  onToggleFavorite,
  onAddTrackToPlaylist,
  onDeleteTrack,
}) => {
  const [showPlaylistsPicker, setShowPlaylistsPicker] = useState(false);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    onAddTrackToPlaylist(track.id, playlistId);
    setAddedPlaylistId(playlistId);
    setTimeout(() => {
      setAddedPlaylistId(null);
      setShowPlaylistsPicker(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-3">
      <div className="w-full max-w-sm bg-white dark:bg-[#1c1a26] border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-6">
        {/* Track header preview */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{track.title}</h3>
            <p className="text-xs text-slate-500 dark:text-[#958da1] truncate mt-0.5">{track.artist}</p>
            <div className="flex items-center gap-2 text-[10px] text-[#7c3aed] dark:text-[#c7bfff] font-mono mt-1">
              <span className="uppercase">{track.format}</span>
              <span>•</span>
              <span>{formatTime(track.duration)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white/70"
          >
            ✕
          </button>
        </div>

        {/* Action list or Playlist Picker */}
        {!showPlaylistsPicker ? (
          <div className="space-y-1 text-sm">
            {/* Toggle Favorite */}
            <button
              onClick={() => {
                onToggleFavorite(track.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-colors cursor-pointer text-left"
            >
              <Heart
                className={`w-5 h-5 ${
                  track.isFavorite ? 'fill-[#7c3aed] text-[#7c3aed] dark:fill-[#c7bfff] dark:text-[#c7bfff]' : 'text-[#7c3aed] dark:text-[#c7bfff]'
                }`}
              />
              <span>{track.isFavorite ? 'Remove from Liked Tracks' : 'Add to Liked Tracks'}</span>
            </button>

            {/* Add to Playlist */}
            <button
              onClick={() => setShowPlaylistsPicker(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-white transition-colors cursor-pointer text-left"
            >
              <FolderPlus className="w-5 h-5 text-[#7c3aed] dark:text-[#c7bfff]" />
              <span>Add to Playlist...</span>
            </button>

            {/* File Path Info */}
            <div className="px-3 py-2 text-xs text-slate-500 dark:text-[#958da1] bg-slate-50 dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-white/90">
                <Info className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#c7bfff]" />
                <span className="font-semibold">Offline File Info</span>
              </div>
              <p className="truncate">Path: <span className="font-mono text-slate-700 dark:text-white/70">{track.folderPath}</span></p>
              <p>Bitrate: <span className="text-slate-700 dark:text-white/70">{track.bitrate || 'Standard Audio'}</span></p>
              <p>Play count: <span className="text-slate-700 dark:text-white/70">{track.playCount}</span></p>
            </div>

            {/* Delete option */}
            {onDeleteTrack && (
              <button
                onClick={() => {
                  if (confirm(`Remove "${track.title}" from library?`)) {
                    onDeleteTrack(track.id);
                    onClose();
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer text-left"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove from Library</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Choose a Playlist</span>
              <button
                onClick={() => setShowPlaylistsPicker(false)}
                className="text-xs text-[#7c3aed] dark:text-[#c7bfff] hover:underline"
              >
                Back
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {playlists.map((playlist) => {
                const isAlreadyIn = playlist.trackIds.includes(track.id);
                const isJustAdded = addedPlaylistId === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-white/5"
                  >
                    <span className="truncate">{playlist.title}</span>
                    {isJustAdded ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Added
                      </span>
                    ) : isAlreadyIn ? (
                      <span className="text-slate-500 dark:text-[#958da1]">Already added</span>
                    ) : (
                      <Plus className="w-4 h-4 text-[#7c3aed] dark:text-[#c7bfff]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};