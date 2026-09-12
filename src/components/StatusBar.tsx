import React from 'react';
import { Wifi, Battery } from 'lucide-react';

interface StatusBarProps {
  time?: string;
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ time = '9:41', className = '' }) => {
  return (
    <header className={`w-full pt-3 px-6 flex justify-between items-center z-30 select-none text-white/90 ${className}`}>
      {/* Time */}
      <span className="text-xs font-semibold tracking-tight font-sans">{time}</span>

      {/* Status Icons */}
      <div className="flex items-center space-x-1.5 text-xs text-white/80">
        {/* Cellular signal bars */}
        <div className="flex items-end space-x-[2px] h-3.5 pr-0.5">
          <div className="w-[3px] h-1.5 bg-white rounded-[0.5px]"></div>
          <div className="w-[3px] h-2 bg-white rounded-[0.5px]"></div>
          <div className="w-[3px] h-2.5 bg-white rounded-[0.5px]"></div>
          <div className="w-[3px] h-3.5 bg-white rounded-[0.5px]"></div>
        </div>

        {/* Wifi */}
        <Wifi className="w-3.5 h-3.5 text-white stroke-[2.2]" />

        {/* Battery */}
        <div className="flex items-center ml-0.5">
          <Battery className="w-4 h-4 text-white stroke-[2.2]" />
        </div>
      </div>
    </header>
  );
};
