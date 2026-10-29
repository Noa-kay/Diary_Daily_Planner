import React, { useState } from 'react';
import { 
  Sparkles, 
  Cookie, 
  Dices, 
  Heart, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Pencil, 
  RefreshCw, 
  X,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IdeaEntry, IdeaCategory } from '../types';

interface IdeasJournalProps {
  ideas: IdeaEntry[];
  onAddIdea: (idea: Omit<IdeaEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateIdea: (id: string, partial: Partial<IdeaEntry>) => void;
  onDeleteIdea: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onNavigateToDay?: (date: string) => void;
}

interface HistoricalQuote {
  id: string;
  author: string;
  titleOrEra: string;
  avatar: string;
  quote: string;
}

const HISTORICAL_QUOTES: HistoricalQuote[] = [
  {
    id: 'hq-1',
    author: 'Albert Einstein',
    titleOrEra: 'Theoretical Physicist',
    avatar: '🔬',
    quote: 'In the middle of difficulty lies opportunity.',
  },
  {
    id: 'hq-2',
    author: 'Winston Churchill',
    titleOrEra: 'Prime Minister & Statesman',
    avatar: '🏛️',
    quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
  },
  {
    id: 'hq-3',
    author: 'Marcus Aurelius',
    titleOrEra: 'Roman Emperor & Stoic Philosopher',
    avatar: '📜',
    quote: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
  },
  {
    id: 'hq-4',
    author: 'Oscar Wilde',
    titleOrEra: 'Poet & Dramatist',
    avatar: '✨',
    quote: 'Be yourself; everyone else is already taken.',
  },
  {
    id: 'hq-5',
    author: 'Albert Einstein',
    titleOrEra: 'Theoretical Physicist',
    avatar: '🔬',
    quote: 'Life is like riding a bicycle. To keep your balance, you must keep moving.',
  },
  {
    id: 'hq-6',
    author: 'Winston Churchill',
    titleOrEra: 'Prime Minister & Statesman',
    avatar: '🏛️',
    quote: 'If you are going through hell, keep going.',
  },
  {
    id: 'hq-7',
    author: 'Eleanor Roosevelt',
    titleOrEra: 'Diplomat & Activist',
    avatar: '🕊️',
    quote: 'The future belongs to those who believe in the beauty of their dreams.',
  },
  {
    id: 'hq-8',
    author: 'Mark Twain',
    titleOrEra: 'Novelist & Humorist',
    avatar: '🖋️',
    quote: 'The secret of getting ahead is getting started.',
  },
  {
    id: 'hq-9',
    author: 'Seneca',
    titleOrEra: 'Stoic Philosopher & Statesman',
    avatar: '🏛️',
    quote: 'Luck is what happens when preparation meets opportunity.',
  },
  {
    id: 'hq-10',
    author: 'Aristotle',
    titleOrEra: 'Ancient Greek Philosopher',
    avatar: '🏺',
    quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
  },
  {
    id: 'hq-11',
    author: 'Marie Curie',
    titleOrEra: 'Physicist & Nobel Laureate',
    avatar: '⚗️',
    quote: 'Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.',
  },
  {
    id: 'hq-12',
    author: 'Steve Jobs',
    titleOrEra: 'Innovator & Entrepreneur',
    avatar: '💡',
    quote: 'Your time is limited, so dont waste it living someone elses life.',
  },
  {
    id: 'hq-13',
    author: 'Ralph Waldo Emerson',
    titleOrEra: 'Essayist & Philosopher',
    avatar: '🌲',
    quote: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.',
  },
  {
    id: 'hq-14',
    author: 'Winston Churchill',
    titleOrEra: 'Prime Minister & Statesman',
    avatar: '🏛️',
    quote: 'To improve is to change; to be perfect is to change often.',
  },
  {
    id: 'hq-15',
    author: 'Marcus Aurelius',
    titleOrEra: 'Roman Emperor & Stoic Philosopher',
    avatar: '📜',
    quote: 'The happiness of your life depends upon the quality of your thoughts.',
  },
  {
    id: 'hq-16',
    author: 'Leonardo da Vinci',
    titleOrEra: 'Polymath & Artist',
    avatar: '🎨',
    quote: 'Simplicity is the ultimate sophistication.',
  },
  {
    id: 'hq-17',
    author: 'Mark Twain',
    titleOrEra: 'Novelist & Humorist',
    avatar: '🖋️',
    quote: 'Courage is resistance to fear, mastery of fear - not absence of fear.',
  },
  {
    id: 'hq-18',
    author: 'Confucius',
    titleOrEra: 'Philosopher & Teacher',
    avatar: '🎋',
    quote: 'It does not matter how slowly you go as long as you do not stop.',
  },
  {
    id: 'hq-19',
    author: 'Albert Einstein',
    titleOrEra: 'Theoretical Physicist',
    avatar: '🔬',
    quote: 'A person who never made a mistake never tried anything new.',
  },
  {
    id: 'hq-20',
    author: 'Maya Angelou',
    titleOrEra: 'Poet & Civil Rights Leader',
    avatar: '📖',
    quote: 'You may encounter many defeats, but you must not be defeated.',
  },
];

interface FortuneCookieItem {
  id: string;
  fortune: string;
  luckyNumbers: number[];
}

const FORTUNE_COOKIES: FortuneCookieItem[] = [
  {
    id: 'fc-1',
    fortune: 'An unexpected path will soon reveal a breathtaking shortcut to your ambition.',
    luckyNumbers: [7, 14, 21, 33],
  },
  {
    id: 'fc-2',
    fortune: 'A brilliant idea you dismissed yesterday will prove its genius tomorrow.',
    luckyNumbers: [3, 9, 18, 27],
  },
  {
    id: 'fc-3',
    fortune: 'Your sharp intuition is your highest intelligence — trust it without hesitation.',
    luckyNumbers: [5, 12, 25, 40],
  },
  {
    id: 'fc-4',
    fortune: 'A delightfully productive breakthrough will arrive when you least expect it.',
    luckyNumbers: [2, 11, 22, 36],
  },
  {
    id: 'fc-5',
    fortune: 'Elegance is refusal — say no to distractions and your true work will flourish.',
    luckyNumbers: [8, 16, 24, 32],
  },
  {
    id: 'fc-6',
    fortune: 'Someone is quietly admiring your poise, tenacity, and quiet confidence.',
    luckyNumbers: [6, 13, 29, 45],
  },
  {
    id: 'fc-7',
    fortune: 'The energy you invest in mastering your craft will return tenfold this season.',
    luckyNumbers: [4, 15, 28, 37],
  },
  {
    id: 'fc-8',
    fortune: 'Great journeys begin not with a leap, but with steady, unhurried footsteps.',
    luckyNumbers: [1, 10, 19, 42],
  },
  {
    id: 'fc-9',
    fortune: 'Fortune favors the bold, but tranquility belongs to the focused mind.',
    luckyNumbers: [17, 23, 31, 48],
  },
  {
    id: 'fc-10',
    fortune: 'A charming conversation will soon unlock a door you thought was closed.',
    luckyNumbers: [9, 18, 30, 44],
  },
  {
    id: 'fc-11',
    fortune: 'Clarity arrives in moments of quiet reflection, not in the rush of urgency.',
    luckyNumbers: [11, 20, 35, 49],
  },
  {
    id: 'fc-12',
    fortune: 'A disciplined morning creates a triumphant day.',
    luckyNumbers: [8, 12, 34, 46],
  },
];

export const IdeasJournal: React.FC<IdeasJournalProps> = ({
  ideas,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
}) => {
  // Fortune Cookie state
  const [cookieState, setCookieState] = useState<'closed' | 'cracking' | 'opened'>('closed');
  const [currentCookieIndex, setCurrentCookieIndex] = useState(() =>
    Math.floor(Math.random() * FORTUNE_COOKIES.length)
  );
  const [cookiesCrackedCount, setCookiesCrackedCount] = useState(0);

  // Wisdom Cube state (Rolling historical quote)
  const [cubeState, setCubeState] = useState<'ready' | 'rolling' | 'revealed'>('ready');
  const [wisdomIndex, setWisdomIndex] = useState(() =>
    Math.floor(Math.random() * HISTORICAL_QUOTES.length)
  );
  const [isRollingCube, setIsRollingCube] = useState(false);
  const [rollCount, setRollCount] = useState(0);

  // Toast / feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedToastMsg, setSavedToastMsg] = useState<string | null>(null);

  // Custom quote entry
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [customQuoteText, setCustomQuoteText] = useState('');
  const [customQuoteAuthor, setCustomQuoteAuthor] = useState('');
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editingQuoteText, setEditingQuoteText] = useState('');

  const activeCookie = FORTUNE_COOKIES[currentCookieIndex];
  const activeWisdom = HISTORICAL_QUOTES[wisdomIndex];

  // Play audio chime for cookie cracking / cube rolling
  const playChime = (freq1 = 587.33, freq2 = 880) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq1, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Crack Fortune Cookie
  const handleCrackCookie = () => {
    if (cookieState === 'cracking') return;
    setCookieState('cracking');
    playChime(523.25, 783.99);

    setTimeout(() => {
      setCookieState('opened');
      setCookiesCrackedCount((prev) => prev + 1);
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#fbbf24', '#f43f5e', '#ec4899', '#fbcfe8'],
      });
    }, 400);
  };

  const handleCrackAnotherCookie = () => {
    let next = Math.floor(Math.random() * FORTUNE_COOKIES.length);
    if (next === currentCookieIndex && FORTUNE_COOKIES.length > 1) {
      next = (next + 1) % FORTUNE_COOKIES.length;
    }
    setCurrentCookieIndex(next);
    setCookieState('closed');
  };

  // Roll Wisdom Cube
  const handleRollWisdomCube = () => {
    if (cubeState === 'rolling') return;
    setCubeState('rolling');
    setIsRollingCube(true);
    playChime(440, 659.25);

    setTimeout(() => {
      let next = Math.floor(Math.random() * HISTORICAL_QUOTES.length);
      if (next === wisdomIndex && HISTORICAL_QUOTES.length > 1) {
        next = (next + 1) % HISTORICAL_QUOTES.length;
      }
      setWisdomIndex(next);
      setCubeState('revealed');
      setIsRollingCube(false);
      setRollCount((prev) => prev + 1);
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.55 },
        colors: ['#a855f7', '#8b5cf6', '#ec4899', '#fbcfe8'],
      });
    }, 400);
  };

  const handleRollAnotherCube = () => {
    let next = Math.floor(Math.random() * HISTORICAL_QUOTES.length);
    if (next === wisdomIndex && HISTORICAL_QUOTES.length > 1) {
      next = (next + 1) % HISTORICAL_QUOTES.length;
    }
    setWisdomIndex(next);
    setCubeState('ready');
  };

  // Save quote to user ideas list
  const handleSaveToFavorites = (text: string, author: string) => {
    onAddIdea({
      date: new Date().toISOString().split('T')[0],
      title: text,
      content: author,
      category: 'Quotes',
      tags: ['Wisdom', author.replace(/\s+/g, '')],
      pinned: true,
      colorTheme: 'amber',
      sticker: '✨',
    });
    setSavedToastMsg(`Saved to your favorite quotes! ♡`);
    setTimeout(() => setSavedToastMsg(null), 3000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add Custom Quote
  const handleCreateCustomQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuoteText.trim()) return;

    onAddIdea({
      date: new Date().toISOString().split('T')[0],
      title: customQuoteText.trim(),
      content: customQuoteAuthor.trim() || 'Personal',
      category: 'Quotes',
      tags: ['CustomQuote'],
      pinned: true,
      colorTheme: 'rose',
      sticker: '💖',
    });

    setCustomQuoteText('');
    setCustomQuoteAuthor('');
    setIsAddingQuote(false);
    setSavedToastMsg(`Added your personal quote! ✨`);
    setTimeout(() => setSavedToastMsg(null), 3000);
  };

  const handleSaveEdit = (ideaId: string) => {
    if (!editingQuoteText.trim()) return;
    onUpdateIdea(ideaId, { title: editingQuoteText.trim() });
    setEditingIdeaId(null);
  };

  return (
    <div className="space-y-5">
      
      {/* ========================================================
          PAGE HEADER (Full English, Crisp & Elegant)
         ======================================================== */}
      <div className="pb-3 border-b border-pink-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-rose-400 text-white flex items-center justify-center text-xl shadow-md shadow-amber-200/60 shrink-0">
            🥠
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-pink-950 font-serif tracking-tight flex items-center gap-2">
              <span>Daily Boost & Fortune Cookies</span>
              <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                Wisdom Studio
              </span>
            </h2>
            <p className="text-xs text-pink-700/80 mt-0.5">
              Crack your fortune cookie and roll timeless wisdom from history's greatest minds ♡
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingQuote(true)}
          className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Quote</span>
        </button>
      </div>

      {savedToastMsg && (
        <div className="py-1.5 px-4 rounded-xl bg-pink-100 text-pink-900 text-xs font-semibold text-center border border-pink-300 animate-in fade-in">
          {savedToastMsg}
        </div>
      )}

      {/* ========================================================
          TWO INTERACTIVE STATIONS:
          1. THE CRACK-THE-COOKIE BOX 🥠
          2. THE WISDOM CUBE 🎲 (Roll Einstein, Churchill, Wilde...)
         ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* STATION 1: FORTUNE COOKIE 🥠 */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#fff9eb] via-[#fffdf7] to-[#fff2f5] border-2 border-amber-300/80 shadow-xs flex flex-col justify-between text-center relative">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/60">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <span>🥠</span>
              <span>Fortune Cookie</span>
            </span>
            <span className="text-[10px] font-mono text-amber-700">
              Cracked: {cookiesCrackedCount}
            </span>
          </div>

          <div className="my-auto py-3">
            {cookieState === 'closed' && (
              <div 
                onClick={handleCrackCookie}
                className="group cursor-pointer inline-block transition transform hover:scale-105 active:scale-95"
                title="Click to crack open the fortune cookie!"
              >
                <div className="text-6xl select-none filter drop-shadow-md group-hover:rotate-6 transition-all duration-300">
                  🥠
                </div>
                <p className="text-xs font-bold text-amber-950 mt-2 flex items-center justify-center gap-1">
                  <span>Crack your fortune cookie</span>
                  <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                </p>
                <p className="text-[11px] text-amber-700/80 mt-0.5 font-script">
                  Click to reveal today's auspicious fortune
                </p>
              </div>
            )}

            {cookieState === 'cracking' && (
              <div className="py-4 space-y-2 animate-pulse">
                <div className="text-6xl animate-bounce">🥠💥</div>
                <p className="text-xs font-bold text-amber-900">Cracking your cookie...</p>
              </div>
            )}

            {cookieState === 'opened' && (
              <div className="space-y-3 animate-in zoom-in-95 duration-300">
                {/* Clean fortune slip - strictly NO quotes marks */}
                <div className="p-4 bg-[#fffef7] border-2 border-amber-300 rounded-2xl shadow-md text-left">
                  <div className="text-[9.5px] text-amber-500 font-mono mb-1">
                    #FORTUNE-{activeCookie.id}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-stone-900 leading-relaxed font-serif">
                    {activeCookie.fortune}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex items-center justify-between text-[10.5px] text-amber-900">
                    <span className="font-medium">Lucky Numbers:</span>
                    <div className="flex items-center gap-1 font-mono font-bold">
                      {activeCookie.luckyNumbers.map((num) => (
                        <span key={num} className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] border border-amber-300">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleCrackAnotherCookie}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Crack Another 🥠</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveToFavorites(activeCookie.fortune, 'Fortune Cookie')}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-pink-900 border border-pink-200 font-semibold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1"
                  >
                    <Heart className="w-3 h-3 text-pink-500" />
                    <span>Save</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(activeCookie.fortune, activeCookie.id)}
                    className="p-1.5 px-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs shadow-2xs transition cursor-pointer flex items-center gap-1"
                    title="Copy fortune"
                  >
                    {copiedId === activeCookie.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STATION 2: THE WISDOM CUBE 🎲 (Interactive 3D click-to-roll for Einstein, Churchill, Wilde, Aurelius...) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#f8f6ff] via-[#fffdfd] to-[#fff2f6] border-2 border-purple-200/80 shadow-xs flex flex-col justify-between text-center relative">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-100">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
              <span>🎲</span>
              <span>Wisdom Cube</span>
            </span>
            <span className="text-[10px] font-mono text-purple-700">
              {rollCount > 0 ? `Rolled: ${rollCount}` : 'Ready to roll'}
            </span>
          </div>

          <div className="my-auto py-3">
            {cubeState === 'ready' && (
              <div 
                onClick={handleRollWisdomCube}
                className="group cursor-pointer inline-block transition transform hover:scale-105 active:scale-95"
                title="Click to roll the Wisdom Cube!"
              >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center text-4xl shadow-xl shadow-purple-300/60 group-hover:rotate-12 transition-all duration-300 border-2 border-white/50 select-none">
                  🎲
                </div>
                <p className="text-xs font-bold text-purple-950 mt-2 flex items-center justify-center gap-1">
                  <span>Roll the Wisdom Cube</span>
                  <Sparkles className="w-3 h-3 text-purple-500 animate-spin" />
                </p>
                <p className="text-[11px] text-purple-700/80 mt-0.5 font-script">
                  Click to roll timeless wisdom from Churchill, Einstein, Wilde & more
                </p>
              </div>
            )}

            {cubeState === 'rolling' && (
              <div className="py-4 space-y-2 animate-pulse">
                <div className="text-6xl animate-spin">🎲✨</div>
                <p className="text-xs font-bold text-purple-900">Rolling timeless wisdom...</p>
              </div>
            )}

            {cubeState === 'revealed' && (
              <div className="space-y-3 animate-in zoom-in-95 duration-300 text-left">
                {/* Author pill & Avatar */}
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center text-base border border-purple-200 shadow-2xs">
                    {activeWisdom.avatar}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 leading-tight">
                      {activeWisdom.author}
                    </h4>
                    <p className="text-[10px] text-stone-500 font-sans">
                      {activeWisdom.titleOrEra}
                    </p>
                  </div>
                </div>

                {/* The Historical Quote - strictly NO quotation marks */}
                <div className="p-4 bg-white rounded-2xl border-2 border-purple-200/80 shadow-md">
                  <p className="text-xs sm:text-sm font-serif font-bold text-stone-900 leading-relaxed">
                    {activeWisdom.quote}
                  </p>
                  <div className="mt-2 text-right">
                    <span className="text-[10.5px] font-script text-purple-800 font-bold">
                      — {activeWisdom.author}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleRollAnotherCube}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                    title="Click to roll again"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Roll Again 🎲</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveToFavorites(activeWisdom.quote, activeWisdom.author)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-pink-50 text-pink-900 border border-pink-200 font-semibold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1"
                  >
                    <Heart className="w-3 h-3 text-pink-500" />
                    <span>Save</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(`${activeWisdom.quote} — ${activeWisdom.author}`, activeWisdom.id)}
                    className="p-1.5 px-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs shadow-2xs transition cursor-pointer flex items-center gap-1"
                    title="Copy quote"
                  >
                    {copiedId === activeWisdom.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================
          MY CHERISHED QUOTES & WISDOM (Saved by user or custom added)
         ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-pink-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <span className="text-base">💖</span>
            <h3 className="text-xs sm:text-sm font-bold text-pink-950 font-serif">
              My Cherished Quotes & Fortunes ({ideas.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingQuote(true)}
            className="text-xs text-pink-700 hover:text-pink-950 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3 text-pink-500" />
            <span>Add Quote</span>
          </button>
        </div>

        {/* Add Quote Inline Modal */}
        {isAddingQuote && (
          <form onSubmit={handleCreateCustomQuote} className="p-3.5 rounded-2xl bg-pink-50/70 border-2 border-pink-300 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-950">Add a memorable quote or personal motto:</span>
              <button
                type="button"
                onClick={() => setIsAddingQuote(false)}
                className="text-stone-400 hover:text-stone-700 text-xs px-1"
              >
                ✕
              </button>
            </div>

            <textarea
              rows={2}
              value={customQuoteText}
              onChange={(e) => setCustomQuoteText(e.target.value)}
              placeholder="Enter the quote text..."
              className="w-full p-2 text-xs bg-white rounded-xl border border-pink-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-pink-500"
              autoFocus
              required
            />

            <input
              type="text"
              value={customQuoteAuthor}
              onChange={(e) => setCustomQuoteAuthor(e.target.value)}
              placeholder="Author (e.g. Albert Einstein, Maya Angelou, Personal)..."
              className="w-full p-2 text-xs bg-white rounded-xl border border-pink-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingQuote(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-pink-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!customQuoteText.trim()}
                className="px-4 py-1.5 text-xs font-bold bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white rounded-xl shadow-2xs transition cursor-pointer"
              >
                Save Quote ✨
              </button>
            </div>
          </form>
        )}

        {/* Saved Quotes List */}
        {ideas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {ideas.map((idea) => {
              const isEditing = editingIdeaId === idea.id;
              return (
                <div
                  key={idea.id}
                  className="p-3 rounded-2xl bg-[#fffcfd] border border-pink-200/80 shadow-2xs hover:border-pink-300 transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm select-none">{idea.sticker || '✨'}</span>
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIdeaId(idea.id);
                            setEditingQuoteText(idea.title);
                          }}
                          className="p-1 text-stone-400 hover:text-pink-600 rounded cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteIdea(idea.id)}
                          className="p-1 text-stone-400 hover:text-rose-500 rounded cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={editingQuoteText}
                          onChange={(e) => setEditingQuoteText(e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-pink-300 rounded-lg text-stone-900"
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingIdeaId(null)}
                            className="px-2 py-0.5 text-[10px] text-stone-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(idea.id)}
                            className="px-2.5 py-0.5 text-[10px] bg-pink-500 text-white rounded-lg font-bold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-serif font-bold text-pink-950 leading-relaxed">
                        {idea.title}
                      </p>
                    )}

                    {idea.content && !isEditing && (
                      <p className="text-[11px] text-pink-800/80 mt-1 italic font-script">
                        — {idea.content}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-pink-600/70 mt-2.5 pt-1.5 border-t border-pink-100/60">
                    <span>{idea.date}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${idea.title} ${idea.content ? `— ${idea.content}` : ''}`, idea.id)}
                      className="hover:text-pink-900 flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedId === idea.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-pink-400 italic bg-pink-50/20 rounded-2xl border border-dashed border-pink-200">
            No saved quotes yet. Crack a fortune cookie or roll the wisdom cube above to save your favorites! ♡
          </div>
        )}
      </div>

    </div>
  );
};
