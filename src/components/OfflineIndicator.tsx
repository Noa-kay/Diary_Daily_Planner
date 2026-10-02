import React from 'react';
import { HardDrive, Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-pink-50/60 text-pink-900 border border-pink-200/60">
      <HardDrive className="w-3.5 h-3.5 text-pink-500" />
      <span className="hidden md:inline">Local Storage</span>
      <span className="inline-flex items-center gap-1">
        {isOnline ? (
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Online</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-600">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </span>
        )}
      </span>
    </div>
  );
};
