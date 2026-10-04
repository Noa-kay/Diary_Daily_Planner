import { useEffect, useState, useRef, useCallback } from 'react';
import { Task, DayLog } from '../types';
import { formatDateKey } from '../services/storage';
import { playGentleChime, extractTimeInMinutes } from '../services/soundService';

export interface ApproachingReminder {
  id: string;
  title: string;
  timeLabel: string;
  minutesLeft: number;
}

export function useTimeReminders(
  tasks: Task[],
  dayLogs: Record<string, DayLog>,
  soundEnabled: boolean = true
) {
  const [activeAlert, setActiveAlert] = useState<ApproachingReminder | null>(null);
  const alertedIdsRef = useRef<Set<string>>(new Set());

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const triggerTestSound = useCallback(() => {
    playGentleChime();
    setActiveAlert({
      id: 'test-chime-' + Date.now(),
      title: 'Sound Test: Gentle Reminder Chime 🎀',
      timeLabel: 'Now',
      minutesLeft: 0,
    });
  }, []);

  useEffect(() => {
    if (!soundEnabled) return;

    const checkUpcomingReminders = () => {
      const now = new Date();
      const todayKey = formatDateKey(now);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const candidateReminders: { id: string; title: string; targetMinutes: number; timeLabel: string }[] = [];

      // 1. Check today's uncompleted tasks with times
      const todayTasks = tasks.filter((t) => t.date === todayKey && !t.completed);
      for (const t of todayTasks) {
        let mins = t.time ? extractTimeInMinutes(t.time) : null;
        if (mins === null) {
          mins = extractTimeInMinutes(t.title);
        }
        if (mins !== null) {
          candidateReminders.push({
            id: `task-${t.id}-${mins}`,
            title: t.title,
            targetMinutes: mins,
            timeLabel: t.time || `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`,
          });
        }
      }

      // 2. Check today's important events with times (e.g. "Dentist 14:00 🦷" or "Meeting 2:00 PM")
      const todayEvents = dayLogs[todayKey]?.importantEvents || [];
      for (let i = 0; i < todayEvents.length; i++) {
        const evt = todayEvents[i];
        const mins = extractTimeInMinutes(evt);
        if (mins !== null) {
          candidateReminders.push({
            id: `event-${todayKey}-${i}-${mins}`,
            title: evt,
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
              id: `sched-${todayKey}-${timeSlot}-${mins}`,
              title: note,
              targetMinutes: mins,
              timeLabel: timeSlot,
            });
          }
        }
      }

      // Look for any item approaching in the next 10 minutes (0 to 10 min window)
      for (const item of candidateReminders) {
        const diff = item.targetMinutes - currentMinutes;

        // If scheduled within the next 10 minutes (or right now within +1 minute)
        if (diff >= -1 && diff <= 10) {
          if (!alertedIdsRef.current.has(item.id)) {
            alertedIdsRef.current.add(item.id);
            playGentleChime();
            setActiveAlert({
              id: item.id,
              title: item.title,
              timeLabel: item.timeLabel,
              minutesLeft: Math.max(0, diff),
            });
            break; // trigger one alert per check
          }
        }
      }
    };

    // Run check immediately and then every 30 seconds
    checkUpcomingReminders();
    const interval = setInterval(checkUpcomingReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks, dayLogs, soundEnabled]);

  // Auto dismiss after 9 seconds
  useEffect(() => {
    if (!activeAlert) return;
    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeAlert]);

  return {
    activeAlert,
    dismissAlert,
    triggerTestSound,
  };
}
