import React, { useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface PlannerCoverProps {
  onOpen: () => void;
  userDisplayName?: string;
}

export const PlannerCover: React.FC<PlannerCoverProps> = ({ onOpen, userDisplayName = 'My Planner' }) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenClick = () => {
    setIsOpening(true);
    setTimeout(() => {
      onOpen();
    }, 450);
  };

  return (
    <div
      style={{ perspective: '1200px' }}
      className="relative max-w-md w-full mx-auto my-6 sm:my-10"
    >
      {/* 3D Swing Book Cover */}
      <div
        onClick={handleOpenClick}
        style={{
          transformOrigin: 'left center',
          transform: isOpening ? 'rotateY(75deg) scale(0.96)' : 'rotateY(0deg)',
          opacity: isOpening ? 0.3 : 1,
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="relative rounded-[36px] p-6 sm:p-8 bg-gradient-to-br from-[#fde8ef] via-[#fcd5e2] to-[#f9bcd0] shadow-2xl border-4 border-white/80 ring-1 ring-pink-300/60 overflow-hidden cursor-pointer group"
        title="Tap to open your planner ✨"
      >
        {/* Subtle decorative flowers & bows floating in background */}
        <div className="absolute top-4 right-4 text-pink-300/60 text-2xl select-none">🌸</div>
        <div className="absolute top-6 left-6 text-pink-300/60 text-xl select-none">✨</div>
        <div className="absolute bottom-6 right-6 text-pink-300/60 text-2xl select-none">🎀</div>
        <div className="absolute bottom-8 left-8 text-pink-300/60 text-xl select-none">🌸</div>
        <div className="absolute top-1/2 right-3 -translate-y-1/2 text-pink-300/50 text-base select-none">♡</div>
        <div className="absolute top-1/2 left-3 -translate-y-1/2 text-pink-300/50 text-base select-none">♡</div>

        {/* Golden Spiral Coil Binding on the side */}
        <div className="absolute -left-2 top-8 bottom-8 flex flex-col justify-between z-20 pointer-events-none">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="w-5 h-3 rounded-full bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400 shadow-sm border border-amber-400/80 -translate-x-1"
            />
          ))}
        </div>

        {/* Central Scalloped Label */}
        <div className="relative bg-white/95 rounded-[28px] p-6 sm:p-8 shadow-md border-2 border-pink-200/90 text-center flex flex-col items-center justify-center my-4 ml-3 group-hover:scale-[1.01] transition-transform">
          
          {/* Top Bow Ribbon */}
          <div className="text-3xl sm:text-4xl mb-2 animate-bounce duration-1000">
            🎀
          </div>

          <div className="text-[11px] uppercase tracking-widest text-pink-500 font-semibold mb-1">
            DAILY 💖 PLANNER
          </div>

          <h1 className="text-2xl sm:text-3xl font-medium text-pink-950 tracking-tight mb-2">
            {userDisplayName === 'יומני' ? 'My Daily Planner' : userDisplayName}
          </h1>

          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent my-2" />

          <p className="text-sm font-script text-pink-700 tracking-wide mb-4">
            Big dreams • Little steps • Beautiful progress
          </p>

          <p className="text-[11px] text-pink-600/80 max-w-xs leading-relaxed mb-6 font-normal">
            Personal diary, daily schedule, tasks, reflections & wellness 🌸
          </p>

          {/* Open Button with delicate glow */}
          <button
            type="button"
            className="group relative px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-pink-400/30 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            <span>Open Planner</span>
            <span className="text-sm group-hover:rotate-12 transition-transform">✨</span>
          </button>
        </div>

        {/* Bottom subtle quote */}
        <div className="text-center mt-3 text-[11px] text-pink-800/70 font-medium">
          🌸 100% Private, stored locally on your device
        </div>
      </div>
    </div>
  );
};
