import React from 'react';
import { Home, ListMusic, Library } from 'lucide-react';

export type NavTab = 'home' | 'playlists' | 'library';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-[#181724]/95 backdrop-blur-xl border-t border-white/[0.08] shadow-2xl rounded-t-2xl pb-safe">
      <div className="flex justify-around items-center px-6 pt-2.5 pb-3">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-150 active:scale-95 cursor-pointer ${
            activeTab === 'home' ? 'text-[#c7bfff] font-semibold' : 'text-[#958da1] hover:text-white'
          }`}
          aria-label="Home"
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[11px] font-medium tracking-wide">Home</span>
          {activeTab === 'home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] -mt-0.5"></span>
          )}
        </button>

        {/* Playlists */}
        <button
          onClick={() => onSelectTab('playlists')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-150 active:scale-95 cursor-pointer ${
            activeTab === 'playlists' ? 'text-[#c7bfff] font-semibold' : 'text-[#958da1] hover:text-white'
          }`}
          aria-label="Playlists"
        >
          <ListMusic className={`w-5 h-5 ${activeTab === 'playlists' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[11px] font-medium tracking-wide">Playlists</span>
          {activeTab === 'playlists' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] -mt-0.5"></span>
          )}
        </button>

        {/* Library */}
        <button
          onClick={() => onSelectTab('library')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-150 active:scale-95 cursor-pointer ${
            activeTab === 'library' ? 'text-[#c7bfff] font-semibold' : 'text-[#958da1] hover:text-white'
          }`}
          aria-label="Library"
        >
          <Library className={`w-5 h-5 ${activeTab === 'library' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[11px] font-medium tracking-wide">Library</span>
          {activeTab === 'library' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] -mt-0.5"></span>
          )}
        </button>
      </div>

      {/* iOS Home Bar Indicator */}
      <div className="w-32 h-1 bg-white/20 rounded-full mx-auto mb-1.5"></div>
    </nav>
  );
};
