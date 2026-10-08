export interface Affirmation {
  id: string;
  quote: string;
  theme: string;
  emoji: string;
}

export const AFFIRMATIONS_COLLECTION: Affirmation[] = [
  {
    id: 'aff-1',
    quote: "You are allowed to take up space, speak your truth, and live life at your own gentle pace.",
    theme: "Self-Worth",
    emoji: "🌸",
  },
  {
    id: 'aff-2',
    quote: "Small, consistent steps lead to breathtaking destinations. Be patient with your blooming.",
    theme: "Progress & Dreams",
    emoji: "✨",
  },
  {
    id: 'aff-3',
    quote: "Breathe in calm, exhale worry. You have handled hard days before, and today is full of grace.",
    theme: "Inner Peace",
    emoji: "🕊️",
  },
  {
    id: 'aff-4',
    quote: "Your body is a sanctuary that works tirelessly for you. Treat it with immense love and gratitude.",
    theme: "Body Sanctuary",
    emoji: "💖",
  },
  {
    id: 'aff-5',
    quote: "You do not need to prove your worth to anyone. Being authentically yourself is your greatest power.",
    theme: "Authenticity",
    emoji: "🎀",
  },
  {
    id: 'aff-6',
    quote: "Celebrate how far you have come. The courage it took to reach this day is worthy of quiet reverence.",
    theme: "Celebration",
    emoji: "🌷",
  },
  {
    id: 'aff-7',
    quote: "Give yourself permission to rest. Rest is not a reward to earn; it is an essential rhythm of life.",
    theme: "Gentle Rest",
    emoji: "☕",
  },
  {
    id: 'aff-8',
    quote: "Trust the timing of your life. What is genuinely meant for you will never miss you.",
    theme: "Trust & Hope",
    emoji: "☁️",
  },
  {
    id: 'aff-9',
    quote: "Today, I choose peace over perfection, joy over comparison, and presence over hurry.",
    theme: "Serene Mindset",
    emoji: "🌿",
  },
  {
    id: 'aff-10',
    quote: "You hold a universe of creativity and wisdom within you. Let yourself experiment fearlessly.",
    theme: "Creative Spark",
    emoji: "🎨",
  },
  {
    id: 'aff-11',
    quote: "Softness is not weakness; it is the ultimate quiet strength in an overwhelming world.",
    theme: "Gentle Strength",
    emoji: "🦢",
  },
  {
    id: 'aff-12',
    quote: "Something wonderful is quietly unfolding behind the scenes. Keep your heart open to miracles.",
    theme: "Wonder & Magic",
    emoji: "🌟",
  },
  {
    id: 'aff-13',
    quote: "You are the author of your day. Begin with kindness towards yourself, and let the rest flow.",
    theme: "Fresh Start",
    emoji: "📖",
  },
  {
    id: 'aff-14',
    quote: "Your feelings are valid, but they are visitors, not your permanent identity. Welcome them and let them pass.",
    theme: "Emotional Harmony",
    emoji: "🌊",
  },
  {
    id: 'aff-15',
    quote: "Notice the golden light, the warm mug, the soft breath. Magic lives in ordinary moments.",
    theme: "Present Gratitude",
    emoji: "✨",
  },
  {
    id: 'aff-16',
    quote: "Saying 'no' to what drains you is a holy 'yes' to what protects your vitality.",
    theme: "Sacred Boundaries",
    emoji: "🛡️",
  },
  {
    id: 'aff-17',
    quote: "You are allowed to start over as many times as you need today. Each breath is a clean slate.",
    theme: "Renewed Grace",
    emoji: "🌱",
  },
  {
    id: 'aff-18',
    quote: "I honor the wisdom of my feminine rhythm. Every season of energy has its unique gift.",
    theme: "Natural Cycles",
    emoji: "🌙",
  },
  {
    id: 'aff-19',
    quote: "You are deserving of love, warmth, laughter, and ease, just as you are right now.",
    theme: "Unconditional Love",
    emoji: "💌",
  },
  {
    id: 'aff-20',
    quote: "May today surprise you with joyful serendipities, sweet conversations, and deep calm.",
    theme: "Serendipity",
    emoji: "🍀",
  },
  {
    id: 'aff-21',
    quote: "Release what you cannot control. Channel your radiant energy into what you can nourish.",
    theme: "Inner Freedom",
    emoji: "🍃",
  },
  {
    id: 'aff-22',
    quote: "You do not have to carry the whole mountain today. Just take one single, faithful step.",
    theme: "One Step",
    emoji: "⛰️",
  },
  {
    id: 'aff-23',
    quote: "Your voice, your thoughts, and your creative dreams make this world a richer, softer place.",
    theme: "Unique Light",
    emoji: "💎",
  },
  {
    id: 'aff-24',
    quote: "Protect your morning energy like gold. Fill your own well first before pouring into others.",
    theme: "Nourished Soul",
    emoji: "🍯",
  },
  {
    id: 'aff-25',
    quote: "Everything you need to navigate today is already within you. Trust your intuition.",
    theme: "Intuitive Wisdom",
    emoji: "🔮",
  },
  {
    id: 'aff-26',
    quote: "It is okay to pause in the middle of the day. A 5-minute breather can transform your afternoon.",
    theme: "Midday Pause",
    emoji: "☀️",
  },
  {
    id: 'aff-27',
    quote: "You are doing much better than you give yourself credit for. Look back and smile with pride.",
    theme: "Loving Reflection",
    emoji: "👑",
  },
  {
    id: 'aff-28',
    quote: "Let your mind be a peaceful garden rather than an anxious battlefield. Tend to your thoughts kindly.",
    theme: "Mind Garden",
    emoji: "🪴",
  },
  {
    id: 'aff-29',
    quote: "Radiate your own warmth. The world is thirsty for genuine, unassuming kindness.",
    theme: "Golden Radiance",
    emoji: "🌻",
  },
  {
    id: 'aff-30',
    quote: "Endings and pauses are not failures; they are soil for fresh, vibrant beginnings.",
    theme: "Rebirth & Bloom",
    emoji: "🌺",
  },
  {
    id: 'aff-31',
    quote: "Your worth is measured by who you are, never by a checklist of unfinished tasks.",
    theme: "Being Over Doing",
    emoji: "🕊️",
  },
  {
    id: 'aff-32',
    quote: "Joy is not frivolous; joy is medicine. Give yourself permission to giggle and delight today.",
    theme: "Playful Heart",
    emoji: "🎈",
  },
];

/**
 * Returns a deterministic affirmation for any given date key (YYYY-MM-DD).
 * Every day of the year naturally gets a unique affirmation!
 */
export function getAffirmationForDate(dateStr: string): Affirmation {
  if (!dateStr) return AFFIRMATIONS_COLLECTION[0];
  
  // Calculate a stable hash from date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  
  const index = hash % AFFIRMATIONS_COLLECTION.length;
  return AFFIRMATIONS_COLLECTION[index];
}

export function getRandomAffirmation(excludeIndex?: number): { affirmation: Affirmation; index: number } {
  let nextIndex: number;
  do {
    nextIndex = Math.floor(Math.random() * AFFIRMATIONS_COLLECTION.length);
  } while (excludeIndex !== undefined && nextIndex === excludeIndex && AFFIRMATIONS_COLLECTION.length > 1);
  
  return {
    affirmation: AFFIRMATIONS_COLLECTION[nextIndex],
    index: nextIndex,
  };
}
