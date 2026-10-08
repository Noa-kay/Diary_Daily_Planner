import { useEffect, useState, useRef, useCallback } from 'react';
import { Task, DayLog } from '../types';
import { formatDateKey, getEventStringsForDate, parseEventItem } from '../services/storage';
import { playGentleChime, extractTimeInMinutes } from '../services/soundService';

export type ReminderStage = '10m' | '5m' | '0m';

export interface ApproachingReminder {
  id: string; // Unique stage ID: `${baseId}-stage-${stage}`
  baseId: string; // The underlying task, event or schedule item ID
  title: string;
  timeLabel: string;
  minutesLeft: number;
  stage: ReminderStage;
  stageLabel: string;
}

export function useTimeReminders(
  tasks: Task[],
  dayLogs: Record<string, DayLog>,
  soundEnabled: boolean = true
) {
  const [activeAlert, setActiveAlert] = useState<ApproachingReminder | null>(null);
  const alertedStagesRef = useRef<Set<string>>(new Set());
  const mutedBaseIdsRef = useRef<Set<string>>(new Set());

  // Load muted IDs for today from sessionStorage if available
  useEffect(() => {
    try {
      const todayKey = formatDateKey(new Date());
      const saved = sessionStorage.getItem(`my_planner_muted_reminders_${todayKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => mutedBaseIdsRef.current.add(id));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  // Mute future reminders for a specific task / event
  const muteReminder = useCallback((baseId: string) => {
    mutedBaseIdsRef.current.add(baseId);
    try {
      const todayKey = formatDateKey(new Date());
      sessionStorage.setItem(
        `my_planner_muted_reminders_${todayKey}`,
        JSON.stringify(Array.from(mutedBaseIdsRef.current))
      );
    } catch {
      // ignore
    }
    setActiveAlert((prev) => (prev?.baseId === baseId ? null : prev));
  }, []);

  const triggerTestSound = useCallback(() => {
    playGentleChime();
    setActiveAlert({
      id: 'test-chime-' + Date.now(),
      baseId: 'test-chime',
      title: 'Sound Test: Gentle Reminder Chime 🎀',
      timeLabel: 'Now',
      minutesLeft: 0,
      stage: '0m',
      stageLabel: 'Sound Test',
    });
  }, []);

  useEffect(() => {
    if (!soundEnabled) return;

    const checkUpcomingReminders = () => {
      const now = new Date();
      const todayKey = formatDateKey(now);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const candidateReminders: { baseId: string; title: string; targetMinutes: number; timeLabel: string }[] = [];

      // 1. Check today's uncompleted tasks with times
      const todayTasks = tasks.filter((t) => t.date === todayKey && !t.completed);
      for (const t of todayTasks) {
        let mins = t.time ? extractTimeInMinutes(t.time) : null;
        if (mins === null) {
          mins = extractTimeInMinutes(t.title);
        }
        if (mins !== null) {
          candidateReminders.push({
            baseId: `task-${t.id}`,
            title: t.title,
            targetMinutes: mins,
            timeLabel: t.time || `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`,
          });
        }
      }

      // 2. Check today's important events with times (e.g. "Dentist 14:00 🦷")
      const todayEvents = getEventStringsForDate(todayKey, dayLogs);
      for (let i = 0; i < todayEvents.length; i++) {
        const evt = todayEvents[i];
        const mins = extractTimeInMinutes(evt);
        if (mins !== null) {
          const parsed = parseEventItem(evt);
          candidateReminders.push({
            baseId: `event-${todayKey}-${i}`,
            title: `${parsed.icon} ${parsed.title}`,
            targetMinutes: mins,
            timeLabel: `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`,
          });
        }
      }

      // 3. Check today's hourly schedule blocks
      const todaySchedule = dayLogs[todayKey]?.schedule || {};
      for (const [timeSlot, note] of Object.entries(todaySchedule)) {
        if (note && note.trim()) {
          const mins = extractTimeInMinutes(timeSlot);
          if (mins !== null) {
            candidateReminders.push({
              baseId: `sched-${todayKey}-${timeSlot}`,
              title: note,
              targetMinutes: mins,
              timeLabel: timeSlot,
            });
          }
        }
      }

      // Check each candidate for the 3 stages: 10 minutes before, 5 minutes before, on time (0m)
      for (const item of candidateReminders) {
        // If user muted future reminders for this item, skip completely!
        if (mutedBaseIdsRef.current.has(item.baseId)) {
          continue;
        }

        const diff = item.targetMinutes - currentMinutes;

        let detectedStage: ReminderStage | null = null;
        let stageLabel = '';

        // Stage 1: 10 minutes before (window 9 to 10 min)
        if (diff >= 9 && diff <= 10) {
          detectedStage = '10m';
          stageLabel = 'In 10 minutes';
        }
        // Stage 2: 5 minutes before (window 4 to 5 min)
        else if (diff >= 4 && diff <= 5) {
          detectedStage = '5m';
          stageLabel = 'In 5 minutes';
        }
        // Stage 3: On time (window -1 to 0 min)
        else if (diff >= -1 && diff <= 0) {
          detectedStage = '0m';
          stageLabel = 'Starting now!';
        }

        if (detectedStage) {
          const stageKey = `${item.baseId}-stage-${detectedStage}`;
          if (!alertedStagesRef.current.has(stageKey)) {
            alertedStagesRef.current.add(stageKey);
            playGentleChime();
            setActiveAlert({
              id: stageKey,
              baseId: item.baseId,
              title: item.title,
              timeLabel: item.timeLabel,
              minutesLeft: Math.max(0, diff),
              stage: detectedStage,
              stageLabel,
            });
            break; // trigger one alert per check interval
          }
        }
      }
    };

    // Run check immediately and every 10 seconds for high precision
    checkUpcomingReminders();
    const interval = setInterval(checkUpcomingReminders, 10000);
    return () => clearInterval(interval);
  }, [tasks, dayLogs, soundEnabled]);

  // Auto dismiss after 12 seconds if not interacted
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 12000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  return {
    activeAlert,
    dismissAlert,
    muteReminder,
    triggerTestSound,
  };
}
