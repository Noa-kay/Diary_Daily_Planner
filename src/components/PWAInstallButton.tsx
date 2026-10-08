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

            <div className="mt-4 space-y-3 text-xs text-stone-700 leading-relaxed text-left" dir="ltr">
              <div className="p-3 bg-pink-50/80 rounded-xl border border-pink-200">
                <p className="font-bold text-pink-950 flex items-center gap-1.5 mb-1 text-xs">
                  <Info className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>Why doesn't the planner open if the computer was restarted?</span>
                </p>
                <p className="text-[11px] text-pink-900/90 leading-relaxed">
                  Links starting with <code>ais-dev</code> are temporary development environments that only run while AI Studio build is active. When the computer restarts, that local process stops.
                </p>
                <div className="mt-2 pt-2 border-t border-pink-200/60 text-[11px] text-pink-950 font-medium">
                  💡 <strong>The Solution:</strong> Install the planner as an independent desktop app on your computer, or use your permanent 24/7 cloud link (Shared App URL).
                </div>
              </div>

              {/* Permanent URL box */}
              <div className="p-3 bg-white rounded-xl border border-pink-200/90 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-pink-950">
                  <span>🌐 Your Permanent Link (Shared App URL - 24/7):</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 bg-pink-50/40 rounded-lg border border-pink-100 text-[10px] font-mono text-pink-900 break-all select-all">
                  <span>https://ais-pre-agokwkosnk7bvajfrptbx3-138158329068.europe-west1.run.app</span>
                </div>
                <p className="text-[10px] text-stone-500">
                  Bookmark this link or install directly from it to launch your planner anytime with zero setup!
                </p>
              </div>

              {/* Mac Safari / Chrome Instructions */}
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
                  <span>🍏</span>
                  <span>How to install as a standalone app on Mac (Safari / Chrome):</span>
                </div>
                <div className="text-[11px] text-stone-700 space-y-1.5 pl-2">
                  <p>1. In your Mac top menu bar, click: <strong>File</strong>.</p>
                  <p>2. Select: <strong>Add to Dock...</strong></p>
                  <p>3. Click <strong>Add</strong>.</p>
                  <p className="text-pink-700 font-semibold pt-1">
                    🎀 That's it! A pretty pastel planner icon will appear on your Dock. From now on, open your diary with a single click as a standalone app!
                  </p>
                </div>
              </div>

              {/* In Chrome / Windows */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1 text-[10px] text-stone-600">
                <p className="font-semibold text-stone-800">In Google Chrome / Windows:</p>
                <p>Click the 3 dots menu ⋮ at the top right ➔ Save and Share ➔ Install My Planner (or the computer/install icon in the address bar).</p>
              </div>

              {/* Standalone HTML File Option */}
              <div className="p-2.5 bg-pink-50/60 rounded-xl border border-pink-200 space-y-1 text-[10px] text-pink-950">
                <p className="font-semibold text-pink-900">💻 Want 100% Offline with Zero Servers?</p>
                <p>Click the <strong>Backup & Offline</strong> button (hard drive icon in the top header) and choose <strong>Download Standalone Planner (.html)</strong> to get a single file that runs locally forever on your PC/Mac without internet!</p>
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
