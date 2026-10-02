import React, { useState } from 'react';
import { Sparkles, X, Heart, RefreshCw, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AffirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AFFIRMATIONS = [
  {
    quote: "You are allowed to take up space, speak your truth, and live life at your own gentle pace.",
    theme: "Self-Worth 🌸",
  },
  {
    quote: "Small, consistent steps lead to breathtaking destinations. Be patient with your blooming.",
    theme: "Progress & Dreams ✨",
  },
  {
    quote: "Breathe in calm, exhale worry. You have handled hard days before, and today is full of grace.",
    theme: "Inner Peace 🕊️",
  },
  {
    quote: "Your body is a sanctuary that works tirelessly for you. Treat it with immense love and gratitude.",
    theme: "Body Love 💖",
  },
  {
    quote: "You do not need to prove your worth to anyone. Being authentically yourself is your superpower.",
    theme: "Authenticity 🎀",
  },
  {
    quote: "Celebrate how far you have come. The courage it took to get here is worthy of celebration.",
    theme: "Celebration 🌷",
  },
  {
    quote: "Give yourself permission to rest. Rest is not a reward; it is an essential part of life.",
    theme: "Gentle Rest ☕",
  },
  {
    quote: "Trust the timing of your life. What is meant for you will not pass you by.",
    theme: "Trust & Hope ☁️",
  },
];

export const AffirmationModal: React.FC<AffirmationModalProps> = ({ isOpen, onClose }) => {
  const [index, setIndex] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % AFFIRMATIONS.length);
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#fb7185', '#fbcfe8', '#fbbf24'],
    });
  };

  const current = AFFIRMATIONS[index];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#fff2f6] via-white to-[#fff8fb] p-6 shadow-2xl border-2 border-pink-200 text-center relative overflow-hidden">
        
        {/* Ribbon bow in corner */}
        <div className="absolute top-3 left-4 text-xl select-none">🎀</div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-pink-100 text-stone-400 hover:text-stone-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-300 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-pink-300/40">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>

        <span className="inline-block px-3 py-0.5 rounded-full bg-pink-100 text-pink-800 text-[10px] font-bold uppercase tracking-wider mb-3">
          {current.theme}
        </span>

        {/* Affirmation Card Frame */}
        <div className="p-4 rounded-2xl bg-white border border-pink-100 shadow-2xs my-2">
          <p className="text-base sm:text-lg font-serif font-medium text-pink-950 leading-relaxed italic">
            "{current.quote}"
          </p>
        </div>

        <p className="text-[11px] text-pink-700/80 font-script my-3">
          ♥ Read this gently to yourself twice today ♥
        </p>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Another Sparkle</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-pink-200 hover:bg-pink-50 text-pink-900 text-xs font-medium transition cursor-pointer"
          >
            Keep in Heart ♡
          </button>
        </div>
      </div>
    </div>
  );
};
