import React, { useState } from 'react';
import { Download, Monitor, CheckCircle, Info, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showManualGuide, setShowManualGuide] = useState(false);

  // When downloaded / installed to computer, completely disappear!
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowManualGuide(true);
      }
    } else {
      setShowManualGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install app to your Mac / PC for offline desktop access"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-pink-200">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 rounded-xl text-pink-700">
                  <Monitor className="w-5 h-5" />
                </div>
                <h3 className="text-base font-medium text-pink-950">
                  How to Install on Mac / PC?
                </h3>
              </div>
              <button
                onClick={() => setShowManualGuide(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-stone-700 leading-relaxed">
              <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-100">
                <p className="font-medium text-pink-950 flex items-center gap-1.5 mb-1">
                  <Info className="w-4 h-4 text-pink-600 shrink-0" />
                  Benefits of Desktop Installation:
                </p>
                <ul className="list-disc list-inside text-pink-900/80 space-y-1">
                  <li>Works completely offline without internet connection.</li>
                  <li>Opens in its own clean window directly from your Mac Dock or Windows Taskbar.</li>
                  <li>Saves all personal diary entries locally on your device.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-pink-950">On Mac (Safari or Chrome):</p>
                <p className="text-stone-600">
                  • In Safari: Click <strong>File &gt; Add to Dock</strong>.<br />
                  • In Chrome: Click the <strong>Install icon (computer with down arrow)</strong> in the URL bar, or click <strong>Settings (three dots) &gt; Install My Planner</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-pink-950">On Windows (Chrome / Edge):</p>
                <p className="text-stone-600">
                  Click the <strong>Install</strong> icon in the address bar to add My Planner to your Desktop.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowManualGuide(false)}
              className="mt-5 w-full py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium text-xs transition"
            >
              Got it, thank you!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
