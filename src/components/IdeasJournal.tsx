import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Sparkles, 
  X, 
  Check, 
  Pin,
  Star,
  Dices,
  Palette,
  CheckSquare,
  Square,
  LayoutGrid,
  Kanban,
  Tag,
  ArrowUpRight,
  Filter,
  Smile,
  Zap,
  Bookmark,
  Shuffle,
  Cookie,
  Flame,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { IdeaEntry, IdeaCategory, MoodType, IdeaStatus, IdeaCheckItem } from '../types';
import { formatDateKey } from '../services/storage';

interface IdeasJournalProps {
  ideas: IdeaEntry[];
  onAddIdea: (idea: Omit<IdeaEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateIdea: (id: string, partial: Partial<IdeaEntry>) => void;
  onDeleteIdea: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onNavigateToDay?: (date: string) => void;
}

const STICKERS = ['✨', '💡', '🚀', '🎨', '🌸', '🎀', '💎', '🔥', '☁️', '☕', '🪄', '🎯', '🥑', '🦋'];

const FORTUNE_WISDOMS = [
  { fortune: "Your next great spark will arrive while doing the dishes or daydreaming. Give yourself permission to pause.", category: 'Reflection' as IdeaCategory },
  { fortune: "A creative risk you take this month will bloom into unexpected joy and pride.", category: 'Dream' as IdeaCategory },
  { fortune: "Don't polish the idea before it has had a chance to be wildly messy and playful.", category: 'Creative' as IdeaCategory },
  { fortune: "Someone around you is quietly inspired by the graceful way you bring warmth into small everyday moments.", category: 'Inspiration' as IdeaCategory },
  { fortune: "The secret to unlocking your next project is taking the first 5-minute microscopic step today.", category: 'Project' as IdeaCategory },
  { fortune: "A seed of curious inspiration is quietly sprouting in your mind — write it down before it slips away!", category: 'Idea' as IdeaCategory },
  { fortune: "What you crave most deeply right now is gentle slowness and space to play without deadlines.", category: 'Reflection' as IdeaCategory },
  { fortune: "You are allowed to reinvent any area of your life at any moment you choose.", category: 'Inspiration' as IdeaCategory },
];

const CATEGORIES: { id: IdeaCategory; label: string; icon: string; desc: string }[] = [
  { id: 'Idea', label: 'Sparks & Inventions', icon: '💡', desc: 'Sudden epiphanies & clever concepts' },
  { id: 'Project', label: 'Dream Projects', icon: '🚀', desc: 'Creative endeavors & ambitions' },
  { id: 'Creative', label: 'Art & Writing', icon: '🎨', desc: 'Crafts, designs, poems & sketches' },
  { id: 'Inspiration', label: 'Heart Quotes & Lyrics', icon: '📜', desc: 'Words that make your heart beat faster' },
  { id: 'Reflection', label: 'Life Epiphanies', icon: '🌸', desc: 'Soul reflections & quiet wisdom' },
  { id: 'Dream', label: 'Vision & Bucket List', icon: '☁️', desc: 'Places to visit, adventures to live' },
  { id: 'Quotes', label: 'Witticisms & Wisdom', icon: '✨', desc: 'Memorable thoughts & sayings' },
];

const CREATIVE_SPARK_PROMPTS = [
  { text: "What is a physical product or craft you've always wished existed in the real world?", category: 'Idea' as IdeaCategory },
  { text: "If you had an entire uninterrupted weekend with zero chores, what creative project would you dive into?", category: 'Project' as IdeaCategory },
  { text: "What is an unconventional habit or cozy ritual that drastically elevates your mood?", category: 'Reflection' as IdeaCategory },
  { text: "A personalized, deeply thoughtful surprise gift idea for someone you cherish.", category: 'Idea' as IdeaCategory },
  { text: "If fear of failure didn't exist, what adventurous dream would you begin this month?", category: 'Dream' as IdeaCategory },
  { text: "A quote, song lyric, or phrase that gave you goosebumps when you first heard it.", category: 'Inspiration' as IdeaCategory },
  { text: "What is one belief you let go of recently that made your life noticeably lighter and sweeter?", category: 'Reflection' as IdeaCategory },
  { text: "Design a whimsical cafe, boutique bookstore, or secret garden in your mind. What does it look like?", category: 'Creative' as IdeaCategory },
  { text: "What skill or craft would your 10-year-old self be proud to see you explore today?", category: 'Creative' as IdeaCategory },
  { text: "What simple mystery or curious question has been on your mind lately?", category: 'Idea' as IdeaCategory },
];

const COLOR_THEMES: {
  id: 'pink' | 'amber' | 'lavender' | 'emerald' | 'rose' | 'sky';
  label: string;
  bgClass: string;
  borderClass: string;
  tapeClass: string;
  accentText: string;
}[] = [
  { id: 'pink', label: 'Blush Pink', bgClass: 'bg-[#fff5f8]', borderClass: 'border-pink-200', tapeClass: 'bg-pink-300/60', accentText: 'text-pink-700' },
  { id: 'amber', label: 'Warm Honey', bgClass: 'bg-[#fffdf0]', borderClass: 'border-amber-200', tapeClass: 'bg-amber-300/60', accentText: 'text-amber-800' },
  { id: 'lavender', label: 'Dream Lavender', bgClass: 'bg-[#f7f5ff]', borderClass: 'border-purple-200', tapeClass: 'bg-purple-300/60', accentText: 'text-purple-800' },
  { id: 'emerald', label: 'Sage Whisper', bgClass: 'bg-[#f2faf5]', borderClass: 'border-emerald-200', tapeClass: 'bg-emerald-300/60', accentText: 'text-emerald-800' },
  { id: 'sky', label: 'Morning Sky', bgClass: 'bg-[#f2f8fd]', borderClass: 'border-sky-200', tapeClass: 'bg-sky-300/60', accentText: 'text-sky-800' },
  { id: 'rose', label: 'Velvet Rose', bgClass: 'bg-[#fff0f3]', borderClass: 'border-rose-200', tapeClass: 'bg-rose-300/60', accentText: 'text-rose-800' },
];

const STATUS_OPTIONS: { id: IdeaStatus; label: string; badgeClass: string }[] = [
  { id: 'spark', label: 'Sprouting 🌱', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'in_progress', label: 'In Progress 🚀', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'cherished', label: 'Cherished 💎', badgeClass: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'completed', label: 'Realized 🌟', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
];

export const IdeasJournal: React.FC<IdeasJournalProps> = ({
  ideas,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  onTogglePin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'grid'>('board');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('Idea');
  const [tagsInput, setTagsInput] = useState('');
  const [pinned, setPinned] = useState(false);
  const [colorTheme, setColorTheme] = useState<'pink' | 'amber' | 'lavender' | 'emerald' | 'sky' | 'rose'>('pink');
  const [sparkRating, setSparkRating] = useState<number>(3);
  const [status, setStatus] = useState<IdeaStatus>('spark');
  const [sticker, setSticker] = useState<string>('✨');
  const [checkItems, setCheckItems] = useState<IdeaCheckItem[]>([]);
  const [newCheckItemText, setNewCheckItemText] = useState('');

  // Spark Prompt Wheel
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [isRollingPrompt, setIsRollingPrompt] = useState(false);

  // Fortune Cookie Feature
  const [isCrackingCookie, setIsCrackingCookie] = useState(false);
  const [crackedFortune, setCrackedFortune] = useState<typeof FORTUNE_WISDOMS[0] | null>(null);

  // Quick Spark Sticky Notes
  const [quickSparkText, setQuickSparkText] = useState('');

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('Idea');
    setTagsInput('');
    setPinned(false);
    setColorTheme('pink');
    setSparkRating(3);
    setStatus('spark');
    setSticker('✨');
    setCheckItems([]);
    setNewCheckItemText('');
    setEditingId(null);
    setIsCreating(false);
  };

  const handleStartEdit = (entry: IdeaEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category);
    setTagsInput((entry.tags || []).join(', '));
    setPinned(Boolean(entry.pinned));
    setColorTheme(entry.colorTheme || 'pink');
    setSparkRating(entry.sparkRating || 3);
    setStatus(entry.status || 'spark');
    setSticker(entry.sticker || '✨');
    setCheckItems(entry.checkItems || []);
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingId) {
      onUpdateIdea(editingId, {
        title: title.trim() || 'Untitled Spark',
        content: content.trim(),
        category,
        tags,
        pinned,
        colorTheme,
        sparkRating,
        status,
        sticker,
        checkItems,
      });
    } else {
      onAddIdea({
        date: formatDateKey(new Date()),
        title: title.trim() || 'Untitled Spark',
        content: content.trim(),
        category,
        tags,
        pinned,
        colorTheme,
        sparkRating,
        status,
        sticker,
        checkItems,
      });
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f472b6', '#fbbf24', '#c084fc', '#34d399', '#f97316'],
      });
    }

    resetForm();
  };

  const handleCrackCookie = () => {
    setIsCrackingCookie(true);
    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * FORTUNE_WISDOMS.length);
      setCrackedFortune(FORTUNE_WISDOMS[randomIdx]);
      setIsCrackingCookie(false);
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#f59e0b', '#f472b6'],
      });
    }, 450);
  };

  const handleKeepFortuneAsSpark = () => {
    if (!crackedFortune) return;
    onAddIdea({
      date: formatDateKey(new Date()),
      title: 'Fortune Cookie Epiphany 🥠',
      content: crackedFortune.fortune,
      category: crackedFortune.category,
      tags: ['fortune', 'wisdom', 'serendipity'],
      colorTheme: 'amber',
      sticker: '🥠',
      sparkRating: 5,
      status: 'cherished',
      pinned: true,
      checkItems: [],
    });
    setCrackedFortune(null);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f472b6'],
    });
  };

  const handleQuickSparkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSparkText.trim()) return;

    onAddIdea({
      date: formatDateKey(new Date()),
      title: quickSparkText.trim().slice(0, 45) + (quickSparkText.trim().length > 45 ? '...' : ''),
      content: quickSparkText.trim(),
      category: 'Idea',
      tags: ['quick-spark', 'sticky-note'],
      colorTheme: 'amber',
      sticker: '⚡',
      sparkRating: 4,
      status: 'spark',
      pinned: false,
      checkItems: [],
    });
    setQuickSparkText('');
    confetti({
      particleCount: 20,
      spread: 40,
      origin: { y: 0.7 },
      colors: ['#fbbf24', '#f472b6'],
    });
  };

  const handleRollPrompt = () => {
    setIsRollingPrompt(true);
    let nextIdx: number;
    do {
      nextIdx = Math.floor(Math.random() * CREATIVE_SPARK_PROMPTS.length);
    } while (nextIdx === currentPromptIdx && CREATIVE_SPARK_PROMPTS.length > 1);

    setTimeout(() => {
      setCurrentPromptIdx(nextIdx);
      setIsRollingPrompt(false);
    }, 200);
  };

  const handleUsePrompt = (promptItem: typeof CREATIVE_SPARK_PROMPTS[0]) => {
    setTitle(promptItem.text);
    setCategory(promptItem.category);
    setColorTheme(promptItem.category === 'Reflection' ? 'rose' : promptItem.category === 'Project' ? 'sky' : 'amber');
    setSticker(promptItem.category === 'Reflection' ? '🌸' : promptItem.category === 'Project' ? '🚀' : '💡');
    setIsCreating(true);
  };

  const handleAddCheckItem = () => {
    if (!newCheckItemText.trim()) return;
    const newItem: IdeaCheckItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newCheckItemText.trim(),
      done: false,
    };
    setCheckItems([...checkItems, newItem]);
    setNewCheckItemText('');
  };

  const handleToggleCheckItemInForm = (id: string) => {
    setCheckItems(checkItems.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  };

  const handleRemoveCheckItemInForm = (id: string) => {
    setCheckItems(checkItems.filter((c) => c.id !== id));
  };

  const handleToggleCardCheckItem = (ideaId: string, checkId: string) => {
    const target = ideas.find((i) => i.id === ideaId);
    if (!target || !target.checkItems) return;
    const updated = target.checkItems.map((c) => (c.id === checkId ? { ...c, done: !c.done } : c));
    onUpdateIdea(ideaId, { checkItems: updated });
  };

  const filteredIdeas = ideas
    .filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  const currentPrompt = CREATIVE_SPARK_PROMPTS[currentPromptIdx];

  // Stats
  const totalSparks = ideas.length;
  const realizedCount = ideas.filter(i => i.status === 'completed').length;
  const inProgressCount = ideas.filter(i => i.status === 'in_progress').length;

  return (
    <div className="relative max-w-5xl mx-auto rounded-3xl bg-[#fffbfc] p-3 sm:p-7 shadow-xs border border-pink-200/80 animate-in fade-in-50 duration-300 font-sans">
      
      {/* Decorative Ribbon Bows */}
      <div className="absolute -top-3.5 left-6 text-2xl select-none">🎀</div>
      <div className="absolute -top-3.5 right-6 text-2xl select-none">🎀</div>

      {/* HEADER: Sparks & Vision Creative Workshop */}
      <div className="text-center pb-5 mb-5 border-b border-pink-200/80">
        <p className="text-xs text-pink-500 font-script tracking-widest uppercase mb-0.5">
          ✦ CREATIVE SPARK & VISION STUDIO ✦
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-pink-950 tracking-tight my-1">
          SPARKS & <span className="font-script text-pink-500 italic font-normal text-4xl sm:text-5xl">Vision Board</span>
        </h1>
        <p className="text-xs text-pink-700/80 max-w-lg mx-auto mb-3">
          Your playful laboratory for sudden epiphanies, creative inventions, fortune cookies, and dreams taking flight.
        </p>

        {/* Studio Mini Stats Strip */}
        <div className="inline-flex items-center gap-3 sm:gap-6 px-4 py-1.5 rounded-full bg-pink-50/80 border border-pink-200/70 text-[11px] text-pink-900 mb-3 shadow-2xs">
          <span className="flex items-center gap-1 font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>{totalSparks} Sparks Captured</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-pink-300" />
          <span className="flex items-center gap-1 font-medium">
            <Zap className="w-3.5 h-3.5 text-indigo-500" />
            <span>{inProgressCount} In Progress</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-pink-300" />
          <span className="flex items-center gap-1 font-medium">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>{realizedCount} Realized 🌟</span>
          </span>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-semibold shadow-xs hover:shadow transition-all duration-200 cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Craft New Spark</span>
            <span className="text-xs">✨</span>
          </button>

          <button
            onClick={handleCrackCookie}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-amber-100/80 hover:from-amber-100 hover:to-amber-200/90 border border-amber-300/80 text-amber-950 text-xs font-semibold transition cursor-pointer shadow-2xs ${
              isCrackingCookie ? 'scale-95 animate-pulse' : ''
            }`}
            title="Crack a virtual inspiration fortune cookie"
          >
            <Cookie className="w-3.5 h-3.5 text-amber-600" />
            <span>Crack Fortune Cookie 🥠</span>
          </button>

          <button
            onClick={handleRollPrompt}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-pink-50 border border-pink-200 text-pink-900 text-xs font-semibold transition cursor-pointer shadow-2xs ${
              isRollingPrompt ? 'animate-spin' : ''
            }`}
            title="Roll for a random creative thought prompt"
          >
            <Dices className="w-3.5 h-3.5 text-pink-500" />
            <span>Roll Creative Dice</span>
          </button>
        </div>
      </div>

      {/* FORTUNE COOKIE REVEAL MODAL / BANNER */}
      {crackedFortune && (
        <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-[#fffbeb] to-amber-50 border-2 border-amber-300 shadow-md relative animate-in zoom-in-95 duration-200 overflow-hidden">
          <button
            onClick={() => setCrackedFortune(null)}
            className="absolute top-2.5 right-2.5 p-1 text-amber-700/60 hover:text-amber-900 rounded-full hover:bg-amber-100 transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-white border border-amber-300 text-amber-700 flex items-center justify-center text-3xl shadow-xs shrink-0 select-none">
              🥠
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                  Fortune Cookie Wisdom
                </span>
                <span className="text-xs text-amber-600 font-script">✦ Serendipity Slip ✦</span>
              </div>
              <p className="font-serif italic text-base text-amber-950 leading-relaxed font-semibold">
                "{crackedFortune.fortune}"
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleKeepFortuneAsSpark}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-serif font-bold text-xs shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Pin to Board</span>
                <span>📌</span>
              </button>
              <button
                onClick={handleCrackCookie}
                className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold transition"
                title="Crack another cookie"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SPARK STICKY NOTE BAR (Super Fast One-Tap Capture) */}
      <div className="mb-5 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-pink-50/40 to-amber-50/70 border border-amber-200/80 shadow-2xs">
        <form onSubmit={handleQuickSparkSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-amber-900 shrink-0">
            <span className="text-base select-none">⚡</span>
            <span>Quick Sticky Spark:</span>
          </div>
          <input
            type="text"
            value={quickSparkText}
            onChange={(e) => setQuickSparkText(e.target.value)}
            placeholder="Jot down a fleeting thought, funny phrase, or quick idea in 5 seconds..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-amber-300/70 text-xs text-pink-950 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-sans shadow-inner"
          />
          <button
            type="submit"
            disabled={!quickSparkText.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-serif font-bold text-xs shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
          >
            <span>Sticky Pin</span>
            <span>📌</span>
          </button>
        </form>
      </div>

      {/* INTERACTIVE SPARK GENERATOR PROMPT BANNER */}
      <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#fff0f4] via-[#fcf5f8] to-[#fff3f7] border border-pink-200/90 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-pink-200 text-pink-600 flex items-center justify-center shrink-0 shadow-2xs text-lg">
              🎲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-100/80 px-2 py-0.5 rounded-md border border-pink-200/60">
                  Daily Creative Spark
                </span>
                <span className="text-[10px] text-pink-400 font-mono">
                  #{currentPromptIdx + 1}
                </span>
              </div>
              <p className="text-sm font-serif font-medium text-pink-950 mt-1 leading-snug">
                "{currentPrompt.text}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={handleRollPrompt}
              className="px-3 py-1.5 text-xs text-pink-700 hover:text-pink-950 hover:bg-white rounded-xl transition border border-transparent hover:border-pink-200"
            >
              Shuffle 🎲
            </button>
            <button
              onClick={() => handleUsePrompt(currentPrompt)}
              className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium shadow-2xs transition flex items-center gap-1 cursor-pointer"
            >
              <span>Jot This Down</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK BRAINSTORM PRESETS (One-Tap Inventions & Concepts) */}
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-pink-900/60 mb-2 flex items-center gap-1">
          <span>✦</span>
          <span>Inspiration Launchpads</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            {
              title: 'Novel Invention',
              cat: 'Idea' as IdeaCategory,
              theme: 'amber' as const,
              emoji: '💡',
              desc: 'Clever gadget, app idea, or physical life hack',
            },
            {
              title: 'Dream Project',
              cat: 'Project' as IdeaCategory,
              theme: 'sky' as const,
              emoji: '🚀',
              desc: 'Long-term vision, workshop or craft dream',
            },
            {
              title: 'Whimsical Wish',
              cat: 'Dream' as IdeaCategory,
              theme: 'lavender' as const,
              emoji: '☁️',
              desc: 'Places to explore, bucket list & stargazing',
            },
            {
              title: 'Witty Epiphany',
              cat: 'Reflection' as IdeaCategory,
              theme: 'rose' as const,
              emoji: '🌸',
              desc: 'Soul wisdom, funny quotes, or gentle mindset shift',
            },
          ].map((card, idx) => (
            <div
              key={idx}
              onClick={() => {
                setTitle(`${card.title} ${card.emoji}`);
                setCategory(card.cat);
                setColorTheme(card.theme);
                setSticker(card.emoji);
                setIsCreating(true);
              }}
              className="p-3 rounded-2xl bg-white border border-pink-200/80 shadow-2xs hover:shadow-xs hover:border-pink-300 transition-all cursor-pointer group flex flex-col justify-between h-24 relative overflow-hidden"
            >
              <div className="w-8 h-1.5 bg-pink-200/70 mx-auto -mt-2 rounded-xs group-hover:bg-pink-300 transition" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-950 group-hover:text-pink-600 transition">
                  {card.title}
                </span>
                <span className="text-base">{card.emoji}</span>
              </div>
              <p className="text-[10px] text-stone-500 line-clamp-2 leading-tight">
                {card.desc}
              </p>
              <span className="text-[9px] text-pink-600 font-bold group-hover:translate-x-1 transition flex items-center gap-0.5">
                + Launch Spark
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CONTROLS: SEARCH, FILTER, VIEW SWITCHER */}
      <div className="p-3.5 rounded-2xl bg-white border border-pink-200/80 shadow-2xs mb-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sparks, dreams, tags or keywords..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-pink-50/30 border border-pink-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-300 text-pink-950 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-pink-50/70 p-1 rounded-xl border border-pink-200/60 shrink-0">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  viewMode === 'board'
                    ? 'bg-white text-pink-950 font-bold shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Stationery Corkboard View"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Corkboard</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-pink-950 font-bold shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Structured Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 mt-2 border-t border-pink-100/70 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-pink-500 text-white font-semibold shadow-2xs'
                : 'bg-pink-50/60 hover:bg-pink-100 text-pink-900 border border-pink-200/60'
            }`}
          >
            All Sparks ({ideas.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = ideas.filter((i) => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  selectedCategory === cat.id
                    ? 'bg-pink-500 text-white font-semibold shadow-2xs'
                    : 'bg-pink-50/60 hover:bg-pink-100 text-pink-900 border border-pink-200/60'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {count > 0 && <span className="opacity-70 text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* CREATE / EDIT DIALOG FORM */}
      {isCreating && (
        <form
          onSubmit={handleSave}
          className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-pink-300 shadow-md mb-6 animate-in fade-in-50 duration-200 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-pink-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{sticker}</span>
              <h3 className="font-serif font-bold text-base sm:text-lg text-pink-950">
                {editingId ? 'Edit Your Spark' : 'Craft a New Spark or Invention'}
              </h3>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 rounded-full text-pink-400 hover:text-pink-600 hover:bg-pink-50 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Spark Title or Core Epiphany..."
              className="w-full p-2.5 text-sm sm:text-base bg-pink-50/20 border border-pink-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 text-pink-950 font-serif font-bold"
            />

            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Elaborate your vision, ingredients, blueprints, sketches of thought, or feelings freely..."
              className="w-full p-3 text-xs sm:text-sm bg-[#fffdfb] border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-pink-950 leading-relaxed resize-y lined-paper font-sans"
            />
          </div>

          {/* Decorative Sticker Picker */}
          <div>
            <label className="block text-[11px] font-bold text-pink-950 mb-1">
              Select Spark Sticker:
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-pink-50/40 rounded-xl border border-pink-100">
              {STICKERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSticker(s)}
                  className={`w-7 h-7 rounded-lg text-base flex items-center justify-center transition cursor-pointer ${
                    sticker === s
                      ? 'bg-white border-2 border-pink-400 scale-110 shadow-xs'
                      : 'hover:bg-white/70'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Checklist / Action Steps */}
          <div className="p-3 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-2">
            <span className="text-xs font-bold text-pink-950 flex items-center gap-1.5">
              <span>✦</span>
              <span>Action Steps & Milestones (Optional)</span>
            </span>

            {checkItems.length > 0 && (
              <div className="space-y-1.5">
                {checkItems.map((chk) => (
                  <div
                    key={chk.id}
                    className="flex items-center justify-between gap-2 p-1.5 px-2 bg-white rounded-xl border border-pink-200/80 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleCheckItemInForm(chk.id)}
                      className="flex items-center gap-2 text-stone-800 hover:text-pink-600 transition flex-1 text-left"
                    >
                      {chk.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-300 shrink-0" />
                      )}
                      <span className={chk.done ? 'line-through text-stone-400' : ''}>
                        {chk.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCheckItemInForm(chk.id)}
                      className="text-stone-400 hover:text-rose-500 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCheckItemText}
                onChange={(e) => setNewCheckItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCheckItem();
                  }
                }}
                placeholder="Add an actionable step (e.g. 'Sketch layout', 'Research tools')..."
                className="flex-1 p-1.5 px-3 rounded-xl border border-pink-200 bg-white text-xs text-pink-950 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCheckItem}
                className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
              >
                + Add Step
              </button>
            </div>
          </div>

          {/* Metadata Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-pink-950 mb-1">
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                className="w-full p-2 text-xs rounded-xl border border-pink-200 bg-white text-pink-950"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-pink-950 mb-1">
                Aura Color:
              </label>
              <div className="flex items-center gap-1.5 py-1">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setColorTheme(theme.id)}
                    className={`w-6 h-6 rounded-full border-2 transition ${theme.bgClass} ${
                      colorTheme === theme.id ? 'ring-2 ring-pink-500 scale-110 border-pink-400' : 'border-stone-200'
                    }`}
                    title={theme.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-pink-950 mb-1">
                Spark Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IdeaStatus)}
                className="w-full p-2 text-xs rounded-xl border border-pink-200 bg-white text-pink-950"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-pink-950 mb-1">
                Tags (comma separated):
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="invention, design, cozy, future..."
                className="w-full p-2 text-xs rounded-xl border border-pink-200 bg-white text-pink-950"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-pink-950 mb-1">
                Excitement Level:
              </label>
              <div className="flex items-center gap-1 pt-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSparkRating(lvl)}
                    className="p-1 hover:scale-110 transition cursor-pointer text-base"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        sparkRating >= lvl
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-pink-100">
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition ${
                pinned
                  ? 'bg-rose-50 border-rose-300 text-rose-600 font-bold'
                  : 'bg-white border-pink-200 text-pink-700'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${pinned ? 'fill-rose-500' : ''}`} />
              <span>Pin to Top</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-1.5 text-xs text-pink-700 hover:bg-pink-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-xs"
              >
                {editingId ? 'Update Spark ✦' : 'Pin to Board ♡'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SPARKS DISPLAY FEED */}
      {filteredIdeas.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-pink-100 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-400 flex items-center justify-center mx-auto text-2xl">
            💡
          </div>
          <h4 className="text-base font-bold text-pink-950">Your Idea Board is Peaceful</h4>
          <p className="text-xs text-pink-800/70 max-w-sm mx-auto">
            Click "Craft New Spark", type a quick sticky note, or crack a fortune cookie to start filling your vision board.
          </p>
        </div>
      ) : viewMode === 'board' ? (
        /* Corkboard / Stationery Aesthetic Board */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIdeas.map((item) => {
            const themeConfig =
              COLOR_THEMES.find((t) => t.id === item.colorTheme) || COLOR_THEMES[0];
            const statusConfig =
              STATUS_OPTIONS.find((s) => s.id === item.status) || STATUS_OPTIONS[0];

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-3xl border-2 transition-all duration-200 relative flex flex-col justify-between shadow-2xs hover:shadow-md ${
                  themeConfig.bgClass
                } ${themeConfig.borderClass} ${
                  item.pinned ? 'ring-2 ring-pink-400/80 -rotate-0.5' : 'hover:-translate-y-0.5'
                }`}
              >
                {/* Washi Tape Strip on Top */}
                <div
                  className={`w-14 h-3.5 mx-auto -mt-6 mb-2 rounded-xs shadow-2xs opacity-85 select-none ${themeConfig.tapeClass}`}
                />

                {/* Top Header Badge & Pin */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.sticker && (
                      <span className="text-base select-none leading-none mr-0.5">
                        {item.sticker}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/90 border border-stone-200/80 text-stone-800 shadow-2xs">
                      {item.category}
                    </span>
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold border shadow-2xs ${statusConfig.badgeClass}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {item.pinned && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-bold shadow-2xs">
                      <Pin className="w-2.5 h-2.5 fill-white" />
                      <span>Pinned</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h4 className="font-serif font-bold text-base sm:text-lg text-pink-950 mb-1.5 leading-snug">
                  {item.title}
                </h4>

                {/* Content */}
                <p className="text-xs sm:text-[13px] text-pink-950/85 leading-relaxed whitespace-pre-line mb-3 font-normal">
                  {item.content}
                </p>

                {/* Interactive Action Steps / Checklist if any */}
                {item.checkItems && item.checkItems.length > 0 && (
                  <div className="my-2 p-2.5 rounded-2xl bg-white/80 border border-pink-200/70 space-y-1">
                    <div className="text-[10px] font-bold text-pink-900/70 uppercase tracking-wider mb-1">
                      Action Steps ({item.checkItems.filter((c) => c.done).length}/{item.checkItems.length})
                    </div>
                    {item.checkItems.map((chk) => (
                      <button
                        key={chk.id}
                        onClick={() => handleToggleCardCheckItem(item.id, chk.id)}
                        className="flex items-center gap-2 text-xs text-left w-full py-0.5 hover:text-pink-600 transition"
                      >
                        {chk.done ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                        )}
                        <span className={chk.done ? 'line-through text-stone-400' : 'text-stone-800'}>
                          {chk.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Spark Rating & Tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-stone-200/50">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          (item.sparkRating || 3) >= s
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-stone-200'
                        }`}
                      />
                    ))}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((t, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/70 text-pink-700 border border-pink-100"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Toolbar */}
                <div className="pt-2 mt-2 border-t border-stone-200/50 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="text-[10px] font-mono text-stone-400">
                    {item.date}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {onTogglePin && (
                      <button
                        onClick={() => onTogglePin(item.id)}
                        className="p-1 hover:text-pink-600 transition cursor-pointer"
                        title={item.pinned ? 'Unpin' : 'Pin to Top'}
                      >
                        <Pin
                          className={`w-3.5 h-3.5 ${
                            item.pinned ? 'fill-pink-500 text-pink-500' : 'text-stone-400'
                          }`}
                        />
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1 hover:text-pink-600 transition cursor-pointer"
                      title="Edit this spark"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteIdea(item.id)}
                      className="p-1 hover:text-rose-600 transition cursor-pointer"
                      title="Delete this spark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Structured Compact Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredIdeas.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-pink-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1">
                    {item.sticker && <span>{item.sticker}</span>}
                    <span className="text-[10px] font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                      {item.category}
                    </span>
                  </div>
                  {item.pinned && <Pin className="w-3 h-3 fill-pink-500 text-pink-500" />}
                </div>
                <h4 className="font-bold text-sm text-pink-950 mb-1">{item.title}</h4>
                <p className="text-xs text-stone-600 line-clamp-3 mb-2">{item.content}</p>
              </div>

              <div className="pt-2 border-t border-pink-100 flex items-center justify-between text-[10px] text-stone-400">
                <span>{item.date}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleStartEdit(item)} className="hover:text-pink-600">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDeleteIdea(item.id)} className="hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Inspiration Footer */}
      <div className="text-center mt-6 pt-4 border-t border-pink-100 text-xs font-script text-pink-600 tracking-wide">
        ♥ An idea in your notebook is a seed planted in the garden of your future. ♥
      </div>
    </div>
  );
};
