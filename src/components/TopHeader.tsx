import React from 'react';
import { Headphones, Bell, ArrowLeft, RotateCcw, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#13121b]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] px-5 h-14 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2.5">
        {showBackButton ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2 cursor-pointer" onClick={onViewSplash} title="View Welcome Splash">
            <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/15 dark:bg-[#7c3aed]/20 border border-[#7c3aed]/30 flex items-center justify-center text-[#7c3aed] dark:text-[#c7bfff]">
              <Headphones className="w-4 h-4 text-[#7c3aed] dark:text-[#c7bfff]" />
            </div>
            <span className="font-keania text-xl tracking-wider text-slate-900 dark:text-white uppercase font-bold">
              WISE
            </span>
          </div>
        )}

        {title && (
          <span className="text-sm font-semibold text-slate-800 dark:text-white/90 truncate max-w-[170px] ml-1">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {onViewSplash && !showBackButton && (
          <button
            onClick={onViewSplash}
            title="View Splash Screen"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-white/60 hover:text-[#7c3aed] dark:hover:text-[#c7bfff] hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 transition-all text-xs"
            aria-label="View Splash"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-white/60 hover:text-[#7c3aed] dark:hover:text-[#c7bfff] hover:bg-slate-100 dark:hover:bg-white/5 active:scale-90 transition-all"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 active:scale-90 transition-transform"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7c3aed] ring-2 ring-white dark:ring-[#13121b]"></span>
        </div>
      </div>
    </header>
  );
};