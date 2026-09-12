import React from 'react';
import { Headphones, Bell, ArrowLeft, RotateCcw } from 'lucide-react';

interface TopHeaderProps {
  onOpenNewPlaylist?: () => void;
  showAddPlaylist?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  onViewSplash?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  showBackButton,
  onBack,
  title,
  onViewSplash,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#13121b]/90 backdrop-blur-md border-b border-white/[0.06] px-5 h-14 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2.5">
        {showBackButton ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2 cursor-pointer" onClick={onViewSplash} title="View Welcome Splash">
            <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center text-[#c7bfff]">
              <Headphones className="w-4 h-4 text-[#c7bfff]" />
            </div>
            <span className="font-keania text-xl tracking-wider text-white uppercase font-bold">
              WISE
            </span>
          </div>
        )}

        {title && (
          <span className="text-sm font-semibold text-white/90 truncate max-w-[170px] ml-1">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {onViewSplash && !showBackButton && (
          <button
            onClick={onViewSplash}
            title="View Splash Screen"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-[#c7bfff] hover:bg-white/5 active:scale-95 transition-all text-xs"
            aria-label="View Splash"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="relative">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 active:scale-90 transition-transform"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7c3aed] ring-2 ring-[#13121b]"></span>
        </div>
      </div>
    </header>
  );
};
