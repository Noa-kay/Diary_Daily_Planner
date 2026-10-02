import React, { useState } from 'react';
import { 
  Lightbulb, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Tag, 
  Calendar, 
  Sparkles, 
  Heart, 
  BookOpen, 
  X, 
  Check, 
  Pin,
  Quote,
  Compass,
  Star,
  Bookmark,
  MessageCircleHeart
} from 'lucide-react';
import { IdeaEntry, IdeaCategory, MoodType } from '../types';
import { formatDateKey, formatHebrewDateString } from '../services/storage';

interface IdeasJournalProps {
  ideas: IdeaEntry[];
  onAddIdea: (idea: Omit<IdeaEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateIdea: (id: string, partial: Partial<IdeaEntry>) => void;
  onDeleteIdea: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onNavigateToDay?: (date: string) => void;
}

const CATEGORIES: { id: IdeaCategory; label: string; icon: string }[] = [
  { id: 'Reflection', label: 'Reflection', icon: '🌸' },
  { id: 'Idea', label: 'Idea', icon: '💡' },
  { id: 'Project', label: 'Project', icon: '✨' },
  { id: 'Inspiration', label: 'Inspiration', icon: '🎀' },
  { id: 'Insight', label: 'Insight', icon: '📜' },
  { id: 'Dream', label: 'Dream', icon: '☁️' },
  { id: 'Creative', label: 'Creative', icon: '🎨' },
];

const DAILY_PROMPTS = [
  'What made you feel truly peaceful or happy today?',
  'If there were zero limits, what dream project would you start this year?',
  'What is a gentle piece of wisdom you want to remember forever?',
  'Describe a moment today that felt magical or sweet.',
  'What are three things you love about your life right now?',
];

export const IdeasJournal: React.FC<IdeasJournalProps> = ({
  ideas,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
  onTogglePin,
  onNavigateToDay,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('Reflection');
  const [tagsInput, setTagsInput] = useState('');
  const [pinned, setPinned] = useState(false);

  // Daily prompt state
  const [promptIndex, setPromptIndex] = useState(0);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('Reflection');
    setTagsInput('');
    setPinned(false);
    setEditingId(null);
    setIsCreating(false);
  };

  const handleStartEdit = (entry: IdeaEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category);
    setTagsInput(entry.tags.join(', '));
    setPinned(Boolean(entry.pinned));
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
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        category,
        tags,
        pinned,
      });
    } else {
      onAddIdea({
        date: formatDateKey(new Date()),
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
        category,
        tags,
        pinned,
      });
    }

    resetForm();
  };

  const handleUsePrompt = () => {
    setTitle(DAILY_PROMPTS[promptIndex]);
    setCategory('Reflection');
    setIsCreating(true);
  };

  const getCategoryLabel = (cat: IdeaCategory) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    if (found) return found.label;
    const legacyMap: Record<string, string> = {
      'מחשבה': 'Reflection',
      'רעיון': 'Idea',
      'פרויקט': 'Project',
      'השראה': 'Inspiration',
      'תובנה': 'Insight',
      'חלום': 'Dream',
      'יצירה': 'Creative',
    };
    return legacyMap[cat] || cat;
  };

  // Filtered Ideas
  const filteredIdeas = ideas
    .filter((item) => {
      const catLabel = getCategoryLabel(item.category);
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory || catLabel === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="relative max-w-4xl mx-auto rounded-3xl bg-[#fffbfc] p-3 sm:p-7 shadow-xs border border-pink-200/80 animate-in fade-in-50 duration-300">
      
      {/* Decorative Ribbon in Corner */}
      <div className="absolute -top-3.5 left-6 text-2xl select-none animate-bounce duration-1000">🎀</div>
      <div className="absolute -top-3.5 right-6 text-2xl select-none">🎀</div>

      {/* HEADER: Inspired by Creative Scrapbook & Planner */}
      <div className="text-center pb-4 mb-4 border-b border-pink-200/80">
        <p className="text-xs text-pink-500 font-script tracking-widest uppercase mb-0.5">
          ♥ CREATIVE SPACE ♥
        </p>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-pink-950 tracking-tight my-1">
          IDEAS & <span className="font-script text-pink-500 italic font-normal text-4xl sm:text-5xl">Reflections</span>
        </h1>
        <p className="text-xs font-script text-pink-600 tracking-wide mb-3">
          Spark your creativity • Capture your dreams • Cherish your thoughts ♡
        </p>

        {/* Action Button */}
        <button
          onClick={() => {
            resetForm();
            setIsCreating(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-semibold shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Write New Thought or Idea</span>
          <span className="text-xs">✨</span>
        </button>
      </div>

      {/* CREATIVE INSPIRATION PROMPT BANNER */}
      <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#fff3f6] via-[#fdf5f8] to-[#fff3f6] border border-pink-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
            <MessageCircleHeart className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-pink-500">
              Creative Prompt of the Day
            </div>
            <p className="text-xs text-pink-950 font-medium font-serif mt-0.5">
              "{DAILY_PROMPTS[promptIndex]}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setPromptIndex((prev) => (prev + 1) % DAILY_PROMPTS.length)}
            className="px-2.5 py-1 text-xs text-pink-700 hover:text-pink-950 hover:bg-pink-100 rounded-lg transition"
            title="Next Prompt"
          >
            Next ✨
          </button>
          <button
            onClick={handleUsePrompt}
            className="px-3 py-1 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium shadow-2xs transition"
          >
            Answer This
          </button>
        </div>
      </div>

      {/* 4 STICKY NOTE MEMO TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div
          onClick={() => {
            setTitle('Sudden Spark 💡');
            setCategory('Idea');
            setIsCreating(true);
          }}
          className="p-3 rounded-2xl bg-[#fffef0] border border-amber-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between h-24 relative overflow-hidden"
        >
          <div className="w-8 h-2 bg-amber-200/80 mx-auto -mt-2 rounded-xs" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Brain Sparks</span>
            <span>💡</span>
          </div>
          <p className="text-[10px] text-amber-800/80 leading-tight">
            Sudden epiphanies & quick thoughts
          </p>
          <span className="text-[9px] text-amber-600 font-bold group-hover:translate-x-1 transition">
            + Jot down
          </span>
        </div>

        <div
          onClick={() => {
            setTitle('Dream Project ✨');
            setCategory('Project');
            setIsCreating(true);
          }}
          className="p-3 rounded-2xl bg-[#fff2f6] border border-pink-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between h-24 relative overflow-hidden"
        >
          <div className="w-8 h-2 bg-pink-200/80 mx-auto -mt-2 rounded-xs" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-900">Dream Project</span>
            <span>☁️</span>
          </div>
          <p className="text-[10px] text-pink-800/80 leading-tight">
            Future visions & creative goals
          </p>
          <span className="text-[9px] text-pink-600 font-bold group-hover:translate-x-1 transition">
            + Jot down
          </span>
        </div>

        <div
          onClick={() => {
            setTitle('Heart Quotes 📜');
            setCategory('Inspiration');
            setIsCreating(true);
          }}
          className="p-3 rounded-2xl bg-[#fdf5ff] border border-purple-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between h-24 relative overflow-hidden"
        >
          <div className="w-8 h-2 bg-purple-200/80 mx-auto -mt-2 rounded-xs" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900">Heart Quotes</span>
            <span>📜</span>
          </div>
          <p className="text-[10px] text-purple-800/80 leading-tight">
            Words & lyrics that touch your soul
          </p>
          <span className="text-[9px] text-purple-600 font-bold group-hover:translate-x-1 transition">
            + Jot down
          </span>
        </div>

        <div
          onClick={() => {
            setTitle('Mindset Reminder 🌸');
            setCategory('Reflection');
            setIsCreating(true);
          }}
          className="p-3 rounded-2xl bg-[#f4fbf7] border border-emerald-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer group flex flex-col justify-between h-24 relative overflow-hidden"
        >
          <div className="w-8 h-2 bg-emerald-200/80 mx-auto -mt-2 rounded-xs" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">Self-Kindness</span>
            <span>🌸</span>
          </div>
          <p className="text-[10px] text-emerald-800/80 leading-tight">
            Affirmations & mindful notes
          </p>
          <span className="text-[9px] text-emerald-600 font-bold group-hover:translate-x-1 transition">
            + Jot down
          </span>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTER BAR */}
      <div className="p-3 rounded-2xl bg-white border border-pink-200/80 shadow-2xs mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thoughts, ideas and tags..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-pink-50/30 border border-pink-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-300 text-pink-950"
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

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-pink-500 text-white font-semibold shadow-2xs'
                  : 'bg-pink-50/70 hover:bg-pink-100 text-pink-900 border border-pink-200/60'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  selectedCategory === cat.id
                    ? 'bg-pink-500 text-white font-semibold shadow-2xs'
                    : 'bg-pink-50/70 hover:bg-pink-100 text-pink-900 border border-pink-200/60'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* INLINE WRITING DESK (When user is adding/editing) */}
      {isCreating && (
        <form
          onSubmit={handleSave}
          className="mb-4 p-4 sm:p-5 rounded-2xl bg-white border-2 border-pink-300 shadow-md space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-pink-100 pb-2">
            <h3 className="font-bold text-sm text-pink-950 flex items-center gap-1.5">
              <span>✍️</span>
              <span>{editingId ? 'Edit Thought Entry' : 'Write a Thought or Reflection'}</span>
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title or topic..."
            className="w-full p-2.5 text-sm bg-pink-50/20 border border-pink-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-300 text-pink-950 font-medium"
          />

          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts freely on this lined paper..."
            className="w-full p-3 text-xs bg-white border border-pink-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-300 text-pink-950 leading-relaxed resize-y lined-paper"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-pink-950 mb-1">
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                className="w-full p-1.5 text-xs rounded-xl border border-pink-200 bg-white text-pink-950"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-pink-950 mb-1">
                Tags (comma separated):
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="dreams, career, mindset, travel..."
                className="w-full p-1.5 text-xs rounded-xl border border-pink-200 bg-white text-pink-950"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-pink-100">
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border cursor-pointer ${
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
                className="px-3 py-1 text-xs text-pink-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium shadow-xs"
              >
                {editingId ? 'Update Note' : 'Save Thought ♡'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* JOURNAL ENTRIES FEED */}
      {filteredIdeas.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white border border-pink-100 space-y-2">
          <BookOpen className="w-8 h-8 text-pink-300 mx-auto" />
          <h4 className="text-sm font-bold text-pink-950">Your Journal is Clear & Peaceful</h4>
          <p className="text-xs text-pink-800/70 max-w-sm mx-auto">
            Use the prompt above or choose one of the sticky notes to capture your dreams and thoughts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredIdeas.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl bg-white border transition flex flex-col justify-between relative shadow-2xs hover:shadow-xs ${
                item.pinned
                  ? 'border-pink-300 ring-1 ring-pink-200 bg-linear-to-b from-[#fff7f9] to-white'
                  : 'border-pink-200/80'
              }`}
            >
              {/* Top Pin Badge if pinned */}
              {item.pinned && (
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-bold shadow-2xs flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5 fill-white" />
                  <span>Pinned</span>
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-sm text-pink-950 flex-1">
                    {item.title}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-pink-50 border border-pink-100 text-pink-800 font-medium shrink-0">
                    {getCategoryLabel(item.category)}
                  </span>
                </div>

                <p className="text-xs text-pink-900/85 leading-relaxed whitespace-pre-line mb-3 font-normal">
                  {item.content}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-1.5 py-0.2 rounded-md bg-pink-50/50 text-pink-600 border border-pink-100"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-pink-100 flex items-center justify-between text-[11px] text-pink-800/70">
                <span className="text-[10px] text-pink-400 font-mono">
                  {item.date}
                </span>

                <div className="flex items-center gap-1.5">
                  {onTogglePin && (
                    <button
                      onClick={() => onTogglePin(item.id)}
                      className="p-1 hover:text-pink-950 transition cursor-pointer"
                      title={item.pinned ? 'Unpin' : 'Pin to Top'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${item.pinned ? 'fill-pink-500 text-pink-500' : 'text-stone-400'}`} />
                    </button>
                  )}
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="p-1 hover:text-pink-950 transition cursor-pointer"
                    title="Edit entry"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteIdea(item.id)}
                    className="p-1 hover:text-rose-600 transition cursor-pointer"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Inspiration Quote */}
      <div className="text-center mt-4 pt-3 border-t border-pink-100 text-xs font-script text-pink-600 tracking-wide">
        ♥ Capture the thoughts that bring light to your soul. ♥
      </div>
    </div>
  );
};
