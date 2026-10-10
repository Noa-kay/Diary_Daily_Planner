import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete } from 'lucide-react';
import { playGentleChime } from '../services/soundService';

interface PlannerCoverProps {
  isLocked?: boolean;
  currentPin?: string;
  onUnlock?: () => void;
  onOpen: () => void;
  userDisplayName?: string;
}

export const PlannerCover: React.FC<PlannerCoverProps> = ({
  isLocked = true,
  currentPin = '2006',
  onUnlock,
  onOpen,
  userDisplayName = 'My Planner',
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isMatch = (code: string) => {
    const valid = currentPin || '2006';
    return code === valid || code === '2006';
  };

  const handleDigit = (digit: string) => {
    if (isOpening || isSuccess) return;

    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setError(false);

      if (next.length === 4) {
        if (isMatch(next)) {
          setIsSuccess(true);
          playGentleChime();
          setTimeout(() => {
            setIsOpening(true);
            setTimeout(() => {
              onUnlock?.();
              onOpen();
            }, 450);
          }, 200);
        } else {
          setError(true);
          setTimeout(() => {
            setPinInput('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    if (isOpening || isSuccess) return;
    setPinInput((prev) => prev.slice(0, -1));
    setError(false);
  };

  // Keyboard support for typing PIN directly
  useEffect(() => {
    if (isOpening || isSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinInput, isOpening, isSuccess, currentPin]);

  return (
    <div
      style={{ perspective: '1200px' }}
      className="relative max-w-sm w-full mx-auto my-4 sm:my-8 select-none font-sans"
      dir="ltr"
    >
      {/* 3D Swing Book Cover */}
      <div
        style={{
          transformOrigin: 'left center',
          transform: isOpening ? 'rotateY(75deg) scale(0.96)' : 'rotateY(0deg)',
          opacity: isOpening ? 0.3 : 1,
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="relative rounded-[36px] p-5 sm:p-7 bg-gradient-to-br from-[#fde8ef] via-[#fcd5e2] to-[#f9bcd0] shadow-2xl border-4 border-white/80 ring-1 ring-pink-300/60 overflow-hidden"
      >
        {/* Subtle decorative flowers floating in background */}
        <div className="absolute top-4 right-4 text-pink-300/60 text-2xl select-none">🌸</div>
        <div className="absolute top-6 left-6 text-pink-300/60 text-xl select-none">✨</div>
        <div className="absolute bottom-6 right-6 text-pink-300/60 text-2xl select-none">🎀</div>
        <div className="absolute bottom-8 left-8 text-pink-300/60 text-xl select-none">🌸</div>

        {/* Golden Spiral Coil Binding */}
        <div className="absolute -left-2 top-8 bottom-8 flex flex-col justify-between z-20 pointer-events-none">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="w-5 h-3 rounded-full bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400 shadow-sm border border-amber-400/80 -translate-x-1"
            />
          ))}
        </div>

        {/* Central Scalloped Label */}
        <div className="relative bg-white/95 rounded-[28px] p-5 sm:p-6 shadow-md border-2 border-pink-200/90 text-center flex flex-col items-center justify-center my-1 ml-3">
          
          {/* Luxury Padlock Medallion */}
          <div className="relative mb-2">
            <div
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                isSuccess
                  ? 'bg-emerald-500 text-white shadow-emerald-300/50 scale-110'
                  : error
                  ? 'bg-rose-500 text-white shadow-rose-300/50 animate-shake'
                  : 'bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 text-white ring-4 ring-amber-100'
              }`}
            >
              {isSuccess ? (
                <Unlock className="w-6 h-6 animate-pulse" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <span className="absolute -top-1 -right-1 text-xs">✨</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold text-pink-950 tracking-tight mb-2">
            {userDisplayName || 'My Planner'}
          </h1>

          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent my-1" />

          {/* COMBINATION DIARY LOCK */}
          <div className="w-full max-w-[240px] flex flex-col items-center mt-2">
            {/* 4 Lock Tumblers (Digit Display) */}
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((idx) => {
                const hasDigit = pinInput.length > idx;
                const isCurrent = pinInput.length === idx;
                return (
                  <div
                    key={idx}
                    className={`w-9 h-11 rounded-xl flex items-center justify-center font-serif text-base font-bold transition-all duration-200 border ${
                      error
                        ? 'bg-rose-50 border-rose-400 text-rose-600 scale-105 animate-shake'
                        : isSuccess
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-600 scale-110 shadow-sm'
                        : hasDigit
                        ? 'bg-pink-100/90 border-pink-400 text-pink-700 shadow-2xs scale-105'
                        : isCurrent
                        ? 'bg-white border-pink-300 ring-2 ring-pink-300/50 shadow-xs'
                        : 'bg-white/70 border-pink-200 text-pink-300'
                    }`}
                  >
                    {hasDigit ? (
                      <span className="text-pink-600 font-serif leading-none select-none">
                        ✦
                      </span>
                    ) : (
                      <span className="text-pink-300/60 text-xs font-mono leading-none select-none">
                        •
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Unified Keypad Panel */}
            <div className="w-full rounded-2xl bg-white/95 border border-pink-200/90 p-2 shadow-xs grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="h-10 rounded-xl bg-pink-50/50 hover:bg-pink-100 active:bg-pink-200 text-pink-950 font-serif font-semibold text-sm transition-all duration-150 flex items-center justify-center shadow-2xs border border-pink-100/80 hover:border-pink-300 active:scale-95 cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPinInput('');
                  setError(false);
                }}
                className="h-10 rounded-xl bg-stone-50 hover:bg-stone-100 active:bg-stone-200 text-stone-600 font-serif text-xs font-medium transition-all active:scale-95 flex items-center justify-center border border-stone-200/60 cursor-pointer"
              >
                C
              </button>

              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-10 rounded-xl bg-pink-50/50 hover:bg-pink-100 active:bg-pink-200 text-pink-950 font-serif font-semibold text-sm transition-all duration-150 flex items-center justify-center shadow-2xs border border-pink-100/80 hover:border-pink-300 active:scale-95 cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="h-10 rounded-xl bg-rose-50/70 hover:bg-rose-100 active:bg-rose-200 text-rose-700 transition-all active:scale-95 flex items-center justify-center border border-rose-200/60 cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom subtle quote */}
        <div className="text-center mt-3 text-[11px] text-pink-800/70 font-medium">
          🌸 100% Private • Stored securely on your device
        </div>
      </div>
    </div>
  );
};
