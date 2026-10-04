/**
 * Sound Service for gentle offline time reminders.
 * Synthesized with Web Audio API - 100% offline, zero network requests, crystal clear quality.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a delicate, elegant chime chord (C5 -> E5 -> G5 -> C6)
 * Soft, pleasant bell-like timbre suited for an aesthetic personal diary.
 */
export function playGentleChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, timeOffset: 0.0, duration: 1.4, gain: 0.18 }, // C5
      { freq: 659.25, timeOffset: 0.12, duration: 1.5, gain: 0.20 }, // E5
      { freq: 783.99, timeOffset: 0.24, duration: 1.6, gain: 0.22 }, // G5
      { freq: 1046.5, timeOffset: 0.36, duration: 1.8, gain: 0.24 }, // C6
    ];

    const now = ctx.currentTime;

    notes.forEach(({ freq, timeOffset, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Sine wave for pure bell resonance
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + timeOffset);

      // Soft envelope: fast smooth attack, long exponential decay
      const startTime = now + timeOffset;
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

/**
 * Extracts a time representation from text (e.g. "14:30", "2:30 PM", "9:00 AM", "16:00")
 * Returns the minute of the day (0 - 1439) or null if no valid time detected.
 */
export function extractTimeInMinutes(text: string): number | null {
  if (!text) return null;

  // Pattern 1: 12-hour format with AM/PM (e.g. "2:30 PM", "9 AM", "11:45 am")
  const ampmRegex = /(\b(?:1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*([ap]\.?m\.?)\b)/i;
  const ampmMatch = text.match(ampmRegex);
  if (ampmMatch) {
    const parts = ampmMatch[0].trim().toLowerCase();
    const isPM = parts.includes('p');
    const timeMatch = parts.match(/(\d+)(?::(\d+))?/);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      return hour * 60 + minute;
    }
  }

  // Pattern 2: 24-hour format (e.g. "14:30", "09:15", "18:00")
  const hour24Regex = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/;
  const hour24Match = text.match(hour24Regex);
  if (hour24Match) {
    const hour = parseInt(hour24Match[1], 10);
    const minute = parseInt(hour24Match[2], 10);
    return hour * 60 + minute;
  }

  return null;
}
