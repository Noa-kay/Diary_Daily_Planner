import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Lock, 
  Bell, 
  BellOff, 
  Printer, 
  Download, 
  Upload, 
  LifeBuoy, 
  Palette, 
  ShieldCheck, 
  Monitor, 
  Check, 
  FileCode,
  Volume2
} from 'lucide-react';
import { AppTheme, AppSettings, JournalDatabase } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { exportToJsonFile, exportStandaloneHtmlFile, importFromJsonFile } from '../services/storage';
import { GoogleCalendarSyncCard } from './GoogleCalendarSyncCard';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onUpdateTheme: (theme: AppTheme) => void;
  onLockNow: () => void;
  soundAlertsEnabled: boolean;
  onToggleSoundAlerts: () => void;
  onTestChime?: () => void;
  onOpenRecoveryModal: () => void;
  database: JournalDatabase;
  onRestoreDatabase: (db: JournalDatabase) => void;
}

const THEMES: { id: AppTheme; label: string; dotColor: string }[] = [
  { id: 'rose', label: 'Pastel Rose', dotColor: 'bg-pink-300 border-pink-400' },
  { id: 'paper', label: 'Cream Paper', dotColor: 'bg-amber-100 border-amber-300' },
  { id: 'lavender', label: 'Lavender', dotColor: 'bg-purple-200 border-purple-300' },
  { id: 'leather', label: 'Leather', dotColor: 'bg-amber-800 border-amber-900' },
  { id: 'midnight', label: 'Midnight', dotColor: 'bg-stone-800 border-stone-700' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onUpdateTheme,
  onLockNow,
  soundAlertsEnabled,
  onToggleSoundAlerts,
  onTestChime,
  onOpenRecoveryModal,
  database,
  onRestoreDatabase,
}) => {
  const [pinValue, setPinValue] = useState(settings.pinCode || '2006');
  const [pinSaved, setPinSaved] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSavePin = () => {
    if (!pinValue || pinValue.length !== 4) {
      setStatusMsg('PIN must be exactly 4 digits');
      setTimeout(() => setStatusMsg(null), 3000);
      return;
    }
    onUpdateSettings({ pinCode: pinValue });
    setPinSaved(true);
    setStatusMsg('PIN code saved! 🌸');
    setTimeout(() => {
      setPinSaved(false);
      setStatusMsg(null);
    }, 3000);
  };

  const handleExportHtml = async () => {
    try {
      setIsExportingHtml(true);
      await exportStandaloneHtmlFile(database);
      setStatusMsg('Standalone HTML file downloaded! 🌸');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch {
      setStatusMsg('Error downloading file');
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJsonFile(file);
      onRestoreDatabase(imported);
      setStatusMsg('Planner restored successfully! 🌸');
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1500);
    } catch {
      setStatusMsg('Error reading backup file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in" dir="ltr">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-pink-200 flex flex-col max-h-[90vh] overflow-hidden text-stone-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-100 text-pink-700">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-pink-950">
              Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert */}
        {statusMsg && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-pink-100 text-pink-950 text-xs font-bold text-center">
            {statusMsg}
          </div>
        )}

        {/* Simple & Clean Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 py-3">
          
          {/* 1. PIN & Security */}
          <div className="p-3.5 rounded-2xl bg-pink-50/40 border border-pink-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-pink-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-pink-600" />
                <span>Security & Lock</span>
              </span>
              <button
                onClick={() => {
                  onClose();
                  onLockNow();
                }}
                className="py-1 px-2.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Lock className="w-3 h-3" />
                <span>Lock Now 🔒</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-pink-100">
              <span className="text-xs text-stone-700 font-medium">4-Digit PIN:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={4}
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-20 p-1.5 text-center text-sm font-bold font-mono tracking-widest rounded-lg border border-pink-200 focus:outline-pink-500 bg-pink-50/20"
                  placeholder="2006"
                />
                <button
                  onClick={handleSavePin}
                  className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition cursor-pointer"
                >
                  {pinSaved ? 'Saved ✓' : 'Save'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={settings.isPinLocked}
                  onChange={(e) => onUpdateSettings({ isPinLocked: e.target.checked })}
                  className="accent-pink-600 w-3.5 h-3.5 rounded"
                />
                <span>Require PIN when opening</span>
              </label>

              <div className="flex items-center gap-1 text-stone-600">
                <span>Auto-lock:</span>
                <select
                  value={settings.autoLockMinutes ?? 20}
                  onChange={(e) => onUpdateSettings({ autoLockMinutes: Number(e.target.value) })}
                  className="p-1 rounded-md border border-pink-200 text-xs bg-white"
                >
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={20}>20 min</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Data Recovery & Backups */}
          <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                <LifeBuoy className="w-3.5 h-3.5 text-rose-600" />
                <span>Data & Recovery</span>
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenRecoveryModal();
                }}
                className="py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <LifeBuoy className="w-3 h-3" />
                <span>Recovery Center ↗</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={handleExportHtml}
                disabled={isExportingHtml}
                className="p-2 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-pink-950 text-xs font-medium transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs"
                title="Download single offline file"
              >
                <FileCode className="w-4 h-4 text-pink-600" />
                <span className="text-[11px]">Save .html</span>
              </button>

              <button
                onClick={() => exportToJsonFile(database)}
                className="p-2 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-pink-950 text-xs font-medium transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs"
                title="Export backup file"
              >
                <Download className="w-4 h-4 text-pink-600" />
                <span className="text-[11px]">Backup .json</span>
              </button>

              <label className="p-2 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-pink-950 text-xs font-medium transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs text-center">
                <Upload className="w-4 h-4 text-pink-600" />
                <span className="text-[11px]">Restore</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleUploadFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 3. Google Calendar Integration */}
          <GoogleCalendarSyncCard
            database={database}
            onShowMessage={(msg) => {
              setStatusMsg(msg);
              setTimeout(() => setStatusMsg(null), 3500);
            }}
          />

          {/* 4. Audio, Desktop App & Print */}
          <div className="grid grid-cols-3 gap-2">
            {/* Chime */}
            <button
              onClick={onToggleSoundAlerts}
              className={`p-2.5 rounded-2xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow-2xs ${
                soundAlertsEnabled
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : 'bg-stone-50 border-stone-200 text-stone-500'
              }`}
            >
              {soundAlertsEnabled ? <Bell className="w-4 h-4 text-rose-600" /> : <BellOff className="w-4 h-4 text-stone-400" />}
              <span className="text-[11px] font-bold">{soundAlertsEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            {/* Print */}
            <button
              onClick={() => {
                onClose();
                setTimeout(() => window.print(), 300);
              }}
              className="p-2.5 rounded-2xl bg-white hover:bg-pink-50 border border-pink-200 text-stone-700 text-xs font-medium flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              <span className="text-[11px] font-bold">Print Page</span>
            </button>

            {/* Install Desktop */}
            <div className="p-1 rounded-2xl bg-white border border-pink-200 flex flex-col items-center justify-center shadow-2xs overflow-hidden">
              <PWAInstallButton />
            </div>
          </div>

          {/* 4. Themes */}
          <div className="p-3 rounded-2xl bg-white border border-pink-200 space-y-1.5 shadow-2xs">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-pink-600" />
              <span>Theme:</span>
            </span>
            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => onUpdateTheme(th.id)}
                  className={`flex-1 py-1.5 px-1 rounded-xl border text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    settings.theme === th.id
                      ? 'border-pink-500 bg-pink-100/70 text-pink-950 font-bold shadow-2xs'
                      : 'border-pink-100 hover:bg-pink-50/40 text-stone-600'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full border ${th.dotColor}`} />
                  <span className="truncate">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-2.5 border-t border-pink-100 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-1 text-pink-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stored securely on your device</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold transition cursor-pointer text-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
