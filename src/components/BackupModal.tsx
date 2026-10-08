import React, { useRef, useState } from 'react';
import { Download, Upload, ShieldCheck, HardDrive, AlertTriangle, CheckCircle, RefreshCw, X, FileJson, Globe, Monitor, Sparkles } from 'lucide-react';
import { JournalDatabase } from '../types';
import { exportToJsonFile, exportStandaloneHtmlFile, importFromJsonFile } from '../services/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: JournalDatabase;
  onRestoreDatabase: (db: JournalDatabase) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  database,
  onRestoreDatabase,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isExportingHtml, setIsExportingHtml] = useState(false);

  if (!isOpen) return null;

  const handleExportJson = () => {
    exportToJsonFile(database);
  };

  const handleExportStandaloneHtml = async () => {
    try {
      setIsExportingHtml(true);
      setImportError(null);
      await exportStandaloneHtmlFile(database);
      setImportStatus('Standalone HTML planner downloaded successfully! You can now open it on your PC/Mac anytime with no internet needed.');
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Could not prepare standalone HTML file');
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      setImportStatus('Reading backup file from your computer...');
      const importedDb = await importFromJsonFile(file);
      onRestoreDatabase(importedDb);
      setImportStatus('Planner data restored successfully!');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setImportStatus(null);
      setImportError(err instanceof Error ? err.message : 'Error importing file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const taskCount = database.tasks.length;
  const completedTaskCount = database.tasks.filter((t) => t.completed).length;
  const ideasCount = database.ideas.length;
  const cycleCount = Object.keys(database.cycleLogs || {}).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-pink-200 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100 text-pink-700">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-base text-pink-950">
                Backup, Offline & Independent Access
              </h3>
              <p className="text-xs text-pink-800/70">
                Save your data, download a standalone offline file, or restore backups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Data summary */}
        <div className="my-4">
          <h4 className="text-xs font-medium text-pink-900 mb-2">
            Current Planner Summary:
          </h4>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-100 text-center">
              <div className="text-lg font-bold text-pink-950">{taskCount}</div>
              <div className="text-[10px] text-pink-800/70">Tasks</div>
            </div>
            <div className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-100 text-center">
              <div className="text-lg font-bold text-pink-950">{completedTaskCount}</div>
              <div className="text-[10px] text-pink-800/70">Completed</div>
            </div>
            <div className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-100 text-center">
              <div className="text-lg font-bold text-pink-950">{ideasCount}</div>
              <div className="text-[10px] text-pink-800/70">Journal Notes</div>
            </div>
            <div className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-100 text-center">
              <div className="text-lg font-bold text-pink-950">{cycleCount}</div>
              <div className="text-[10px] text-pink-800/70">Tracked Days 🌸</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Standalone HTML Download */}
          <div className="p-4 rounded-xl border border-pink-300 bg-gradient-to-r from-pink-50/60 to-rose-50/40 hover:from-pink-50 hover:to-rose-50 transition shadow-2xs">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-semibold text-sm text-pink-950 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-pink-600" />
                  <span>Download Standalone Planner (.html)</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-pink-200 text-pink-900 font-bold">100% Offline</span>
                </h5>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Downloads a single HTML file with your entire planner and all current entries. Save it on your computer and double-click to open anytime — <strong>never goes to sleep and works forever without internet or servers!</strong>
                </p>
              </div>
              <button
                onClick={handleExportStandaloneHtml}
                disabled={isExportingHtml}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium text-xs shadow-xs transition cursor-pointer shrink-0 ml-3 disabled:opacity-50"
              >
                {isExportingHtml ? 'Preparing...' : 'Download .html'}
              </button>
            </div>
          </div>

          {/* Export JSON */}
          <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/20 hover:bg-pink-50/40 transition">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-medium text-sm text-pink-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-pink-600" />
                  <span>Download Backup Data (.json)</span>
                </h5>
                <p className="text-xs text-stone-500 mt-1">
                  Exports your planner database as a private JSON file saved to your Downloads.
                </p>
              </div>
              <button
                onClick={handleExportJson}
                className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium text-xs shadow-xs transition cursor-pointer shrink-0 ml-3"
              >
                Export JSON
              </button>
            </div>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl border border-pink-200 bg-pink-50/20 hover:bg-pink-50/40 transition">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-medium text-sm text-pink-950 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-pink-600" />
                  <span>Restore from Backup File</span>
                </h5>
                <p className="text-xs text-stone-500 mt-1">
                  Select a previously downloaded JSON backup file to restore all your notes and tasks.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-pink-50 text-pink-900 border border-pink-200 font-medium text-xs shadow-2xs transition cursor-pointer shrink-0 ml-3"
                >
                  Choose File
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Note about AI Studio Hibernation */}
        <div className="mt-4 p-3.5 rounded-xl bg-pink-50/70 border border-pink-200 text-xs text-pink-950 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-pink-900">
            <Globe className="w-4 h-4 text-pink-600 shrink-0" />
            <span>Why did the planner sleep when closing your PC?</span>
          </div>
          <p className="text-[11px] text-pink-900/80 leading-relaxed">
            The URL containing <code>ais-dev</code> is a temporary sandbox that sleeps when you're away. Your data is 100% safe in your browser's local memory. For daily use with no waking up needed:
          </p>
          <ul className="text-[11px] text-stone-700 list-disc list-inside space-y-0.5 pt-1">
            <li><strong>Standalone HTML:</strong> Download the .html file above to keep on your Desktop and open anytime offline.</li>
            <li><strong>Shared URL (24/7):</strong> Use the permanent link <code>ais-pre-...</code> instead of the dev link.</li>
            <li><strong>Free Hosting:</strong> You can host the build on Vercel or Netlify for free with 100% permanent uptime.</li>
          </ul>
        </div>

        {/* Status messages */}
        {importStatus && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}
        {importError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-pink-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Offline & Private (Local Storage)</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-stone-600 hover:text-stone-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
