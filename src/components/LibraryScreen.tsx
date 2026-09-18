import React, { useState, useRef } from 'react';
import { 
  Search, 
  Mic, 
  Smartphone, 
  RefreshCw, 
  ArrowUpDown, 
  Shuffle, 
  Play, 
  Pause, 
  MoreVertical, 
  Upload, 
  Music,
  Radio
} from 'lucide-react';
import { Track, StorageFolder } from '../types';
import { formatTime } from '../utils/formatters';

interface LibraryScreenProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onShuffleAll: () => void;
  onTrackOptions: (track: Track) => void;
  storageFolders: StorageFolder[];
  onImportUserAudio: (file: File) => void;
  onScanDevice: () => void;
  isScanning: boolean;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onShuffleAll,
  onTrackOptions,
  onImportUserAudio,
  onScanDevice,
  isScanning,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'song' | 'voice_note' | 'download' | 'folders'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'artist' | 'duration'>('date');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter tracks
  const filteredTracks = tracks.filter((track) => {
    // Category filter
    if (activeCategory === 'song' && track.category !== 'song') return false;
    if (activeCategory === 'voice_note' && track.category !== 'voice_note') return false;
    if (activeCategory === 'download' && track.category !== 'download') return false;
    if (activeCategory === 'folders' && track.folderPath !== '/storage/emulated/0/Music') return false;

    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q) ||
      track.format.toLowerCase().includes(q) ||
      track.folderPath.toLowerCase().includes(q)
    );
  });

  // Sort tracks
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'artist') {
      return a.artist.localeCompare(b.artist);
    }
    if (sortBy === 'duration') {
      return b.duration - a.duration;
    }
    return 0;
  });

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        onImportUserAudio(files[i]);
      }
    }
  };

  const songCount = tracks.filter((t) => t.category === 'song').length;
  const voiceCount = tracks.filter((t) => t.category === 'voice_note').length;
  const downloadCount = tracks.filter((t) => t.category === 'download').length;

  const chipClass = (active: boolean) =>
    `flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
      active
        ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/40'
        : 'bg-slate-100 dark:bg-[#1c1a24] text-slate-500 dark:text-[#958da1] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/5'
    }`;

  return (
    <div className="flex-1 px-4 pt-3 pb-36 space-y-4">
      {/* Hidden File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg"
        multiple
        className="hidden"
      />

      {/* Screen Title & Storage Status Badge */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Library</h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#1c1a26] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-white/80 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse"></span>
          <span>Audio: {tracks.length} tracks</span>
        </div>
      </div>

      {/* Local Storage Scanner Card - Positioned above search, containing Scan and Import */}
      <section className="rounded-2xl bg-slate-100 dark:bg-[#1c1a24] border border-slate-200 dark:border-white/10 p-3 relative overflow-hidden backdrop-blur-sm shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/15 dark:bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center text-[#7c3aed] dark:text-[#c7bfff]">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">Local Storage Scanner</h2>
            <span className="text-[10px] text-slate-500 dark:text-[#958da1]">Device media access API</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onScanDevice}
            disabled={isScanning}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#7c3aed]/15 dark:bg-[#7c3aed]/20 hover:bg-[#7c3aed]/25 dark:hover:bg-[#7c3aed]/30 text-[#7c3aed] dark:text-[#c7bfff] text-[11px] font-semibold border border-[#7c3aed]/40 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white text-[11px] font-semibold active:scale-95 transition-all cursor-pointer"
            title="Import audio files from your device"
          >
            <Upload className="w-3 h-3" />
            <span>Import</span>
          </button>
        </div>
      </section>

      {/* Search Input Field matching Image 6 */}
      <div className="relative flex items-center w-full h-11 rounded-full bg-slate-100 dark:bg-[#1c1a24] border border-slate-200 dark:border-white/10 px-4 focus-within:border-[#7c3aed] shadow-inner transition-all">
        <Search className="w-4 h-4 text-slate-500 dark:text-[#958da1] mr-2 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search local tracks, formats, folders..."
          className="w-full bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#958da1] focus:ring-0"
        />
        <button aria-label="Voice search" className="text-slate-500 dark:text-[#958da1] hover:text-slate-900 dark:hover:text-white ml-2 flex-shrink-0">
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Chips (Horizontal Carousel) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button onClick={() => setActiveCategory('all')} className={chipClass(activeCategory === 'all')}>
          All Audio
        </button>
        <button onClick={() => setActiveCategory('song')} className={chipClass(activeCategory === 'song')}>
          Songs ({songCount})
        </button>
        <button onClick={() => setActiveCategory('voice_note')} className={chipClass(activeCategory === 'voice_note')}>
          Voice Notes ({voiceCount})
        </button>
        <button onClick={() => setActiveCategory('download')} className={chipClass(activeCategory === 'download')}>
          Downloads ({downloadCount})
        </button>
        <button onClick={() => setActiveCategory('folders')} className={chipClass(activeCategory === 'folders')}>
          Folders
        </button>
      </div>

      {/* Audio File Action Header: Sort by & Shuffle All */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#958da1]">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort by: </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'artist' | 'duration')}
            className="bg-transparent text-slate-900 dark:text-white font-semibold outline-none cursor-pointer text-xs"
          >
            <option value="date" className="bg-white dark:bg-[#1c1a24] text-slate-900 dark:text-white">Date Added</option>
            <option value="title" className="bg-white dark:bg-[#1c1a24] text-slate-900 dark:text-white">Title</option>
            <option value="artist" className="bg-white dark:bg-[#1c1a24] text-slate-900 dark:text-white">Artist</option>
            <option value="duration" className="bg-white dark:bg-[#1c1a24] text-slate-900 dark:text-white">Duration</option>
          </select>
        </div>

        <button
          onClick={onShuffleAll}
          className="flex items-center gap-1 text-[#7c3aed] dark:text-[#c7bfff] hover:text-[#5b21b6] dark:hover:text-white text-xs font-semibold active:scale-95 transition-transform cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle all</span>
        </button>
      </div>

      {/* Track List Items matching Image 6 */}
      <div className="space-y-1">
        {sortedTracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id;
          const isCurrentPlaying = isCurrent && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track)}
              className={`flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer group ${
                isCurrent 
                  ? 'bg-[#7c3aed]/15 dark:bg-[#7c3aed]/20 border border-[#7c3aed]/40 shadow-sm' 
                  : 'hover:bg-slate-100 dark:hover:bg-[#1c1a24]/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Cover or Format Icon */}
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#12111a] flex-shrink-0 flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-white/5">
                  {track.category === 'voice_note' ? (
                    <div className="w-full h-full bg-pink-100 dark:bg-[#352538] flex items-center justify-center text-pink-500 dark:text-[#ffb0cd]">
                      <Mic className="w-5 h-5" />
                    </div>
                  ) : track.category === 'download' && track.title.includes('Podcast') ? (
                    <div className="w-full h-full bg-sky-100 dark:bg-[#1b2b3b] flex items-center justify-center text-sky-500 dark:text-[#90c5ff]">
                      <Radio className="w-5 h-5" />
                    </div>
                  ) : (
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}

                  {/* Hover play icon overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className={`text-xs font-semibold truncate ${
                      isCurrent ? 'text-[#7c3aed] dark:text-[#c7bfff]' : 'text-slate-900 dark:text-white'
                    }`}>
                      {track.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#958da1] mt-0.5">
                    <span className="truncate">{track.artist}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{formatTime(track.duration)}</span>
                    {track.format === 'flac' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#7c3aed]/20 dark:bg-[#7c3aed]/30 text-[#7c3aed] dark:text-[#c7bfff] font-bold">
                        FLAC
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    if (isCurrent) onTogglePlay();
                    else onPlayTrack(track);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                    isCurrent
                      ? 'bg-[#7c3aed] text-white shadow-sm'
                      : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-white/80 hover:bg-slate-300 dark:hover:bg-white/20'
                  }`}
                  aria-label="Play Track"
                >
                  {isCurrentPlaying ? (
                    <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={() => onTrackOptions(track)}
                  aria-label="Track options"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 dark:text-[#958da1] hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};