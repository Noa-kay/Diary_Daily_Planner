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

            <div className="mt-4 space-y-3 text-xs text-stone-700 leading-relaxed text-right" dir="rtl">
              <div className="p-3 bg-pink-50/80 rounded-xl border border-pink-200">
                <p className="font-bold text-pink-950 flex items-center gap-1.5 mb-1 text-xs">
                  <Info className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>100% אופליין – ללא תלות באינטרנט!</span>
                </p>
                <p className="text-[11px] text-pink-900/90 leading-relaxed">
                  האפליקציה שומרת את כל הנתונים, המשימות והמחשבות שלך <strong>בתוך המחשב בלבד</strong>. אין שום שרת ושום ענן, וניתן לנתק את האינטרנט לחלוטין.
                </p>
              </div>

              {/* Mac Safari Instructions */}
              <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
                  <span>🍏</span>
                  <span>במחשב Mac (בדפדפן Safari שבו את נמצאת כעת):</span>
                </div>
                <div className="text-[11px] text-stone-700 space-y-1.5 pr-2">
                  <p>1. בסרגל התפריטים העליון ביותר של מסך המק, לחצי על: <strong>קובץ (File)</strong>.</p>
                  <p>2. לחצי על: <strong>הוסף ל-Dock‏ (Add to Dock...)</strong>.</p>
                  <p>3. לחצי על <strong>הוסף (Add)</strong>.</p>
                  <p className="text-pink-700 font-semibold pt-1">
                    🎀 זהו! האפליקציה תופיע ב-Dock של המק כתוכנה עצמאית עם אייקון ורוד, ותיפתח ישירות כתוכנה ללא תלות באינטרנט!
                  </p>
                </div>
              </div>

              {/* In Chrome */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1 text-[10px] text-stone-600">
                <p className="font-semibold text-stone-800">במידה ואת פותחת דרך Google Chrome:</p>
                <p>לחצי על תפריט 3 הנקודות ⋮ למעלה ➔ שמירה ושיתוף ➔ התקנת My Planner.</p>
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
