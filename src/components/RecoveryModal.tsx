import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  X, 
  Search, 
  Copy, 
  ClipboardPaste, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  HardDrive, 
  Download, 
  Upload, 
  Sparkles, 
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { JournalDatabase } from '../types';
import { 
  scanAllStorageForJournals, 
  CandidateDatabase, 
  getAutomaticSnapshots, 
  StorageSnapshot,
  copyDatabaseToClipboard,
  importDatabaseFromText,
  exportToJsonFile,
  exportStandaloneHtmlFile,
  importFromJsonFile,
  loadFromIndexedDB
} from '../services/storage';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDatabase: JournalDatabase;
  onRestoreDatabase: (db: JournalDatabase) => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  currentDatabase,
  onRestoreDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'urls' | 'snapshots' | 'export'>('scan');
  const [candidates, setCandidates] = useState<CandidateDatabase[]>([]);
  const [snapshots, setSnapshots] = useState<StorageSnapshot[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [idbCandidate, setIdbCandidate] = useState<JournalDatabase | null>(null);

  const devUrl = 'https://ais-dev-agokwkosnk7bvajfrptbx3-138158329068.europe-west1.run.app';
  const preUrl = 'https://ais-pre-agokwkosnk7bvajfrptbx3-138158329068.europe-west1.run.app';

  const isCurrentDev = typeof window !== 'undefined' && window.location.href.includes('ais-dev');

  const runScan = async () => {
    setIsScanning(true);
    setRestoreSuccess(null);
    try {
      const found = scanAllStorageForJournals();
      setCandidates(found);
      const snaps = getAutomaticSnapshots();
      setSnapshots(snaps);

      // Check IndexedDB
      const idbDb = await loadFromIndexedDB();
      if (idbDb && (idbDb.tasks.length > 0 || idbDb.ideas.length > 0)) {
        setIdbCandidate(idbDb);
      }
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyClipboard = async () => {
    const ok = await copyDatabaseToClipboard(currentDatabase);
    if (ok) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 4000);
    }
  };

  const handlePasteRestore = () => {
    setPasteError(null);
    try {
      const parsed = importDatabaseFromText(pasteInput);
      onRestoreDatabase(parsed);
      setRestoreSuccess('Planner data successfully restored from pasted text! 🌸');
      setPasteInput('');
      setTimeout(() => {
        setRestoreSuccess(null);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setPasteError(err instanceof Error ? err.message : 'Invalid planner data format');
    }
  };

  const handleRestoreCandidate = (candidate: CandidateDatabase) => {
    onRestoreDatabase(candidate.db);
    setRestoreSuccess(`Restored ${candidate.taskCount} tasks and ${candidate.ideaCount} notes successfully! 🌸`);
    setTimeout(() => {
      setRestoreSuccess(null);
      onClose();
    }, 2000);
  };

  const handleRestoreSnapshot = (snap: StorageSnapshot) => {
    onRestoreDatabase(snap.data);
    setRestoreSuccess(`Restored snapshot from ${snap.dateStr}! 🌸`);
    setTimeout(() => {
      setRestoreSuccess(null);
      onClose();
    }, 2000);
  };

  const handleDownloadHtml = async () => {
    try {
      setIsExportingHtml(true);
      await exportStandaloneHtmlFile(currentDatabase);
      setRestoreSuccess('Standalone HTML file downloaded! You can open it anytime offline.');
      setTimeout(() => setRestoreSuccess(null), 4000);
    } catch (err: unknown) {
      setPasteError(err instanceof Error ? err.message : 'Error preparing standalone file');
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleDownloadJson = () => {
    exportToJsonFile(currentDatabase);
  };

  const handleUploadJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJsonFile(file);
      onRestoreDatabase(imported);
      setRestoreSuccess('Planner restored successfully from backup file! 🌸');
      setTimeout(() => {
        setRestoreSuccess(null);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setPasteError(err instanceof Error ? err.message : 'Failed to import backup file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200" dir="ltr">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-pink-200 flex flex-col max-h-[92vh] overflow-hidden text-stone-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-md shadow-pink-200">
              <LifeBuoy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-pink-950 flex items-center gap-2">
                <span>Data Recovery & Backup Center</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium">Safe Vault 🌸</span>
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Scan your browser's local memory, transfer data across app URLs, and restore snapshots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {restoreSuccess && (
          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm flex items-center gap-2.5 font-medium animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{restoreSuccess}</span>
          </div>
        )}

        {/* Error Alert */}
        {pasteError && (
          <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 text-sm flex items-center gap-2.5 font-medium animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{pasteError}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-pink-50/70 rounded-2xl border border-pink-100 my-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'scan'
                ? 'bg-white text-pink-900 shadow-xs border border-pink-200/60'
                : 'text-stone-600 hover:text-pink-900'
            }`}
          >
            <Search className="w-4 h-4 text-pink-500" />
            <span>Deep Storage Scan</span>
            {candidates.length > 0 && (
              <span className="text-[10px] bg-pink-500 text-white rounded-full px-1.5 py-0.2">
                {candidates.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('urls')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'urls'
                ? 'bg-white text-pink-900 shadow-xs border border-pink-200/60'
                : 'text-stone-600 hover:text-pink-900'
            }`}
          >
            <ExternalLink className="w-4 h-4 text-pink-500" />
            <span>App URLs & Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('snapshots')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'snapshots'
                ? 'bg-white text-pink-900 shadow-xs border border-pink-200/60'
                : 'text-stone-600 hover:text-pink-900'
            }`}
          >
            <Clock className="w-4 h-4 text-pink-500" />
            <span>Auto Snapshots ({snapshots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-white text-pink-900 shadow-xs border border-pink-200/60'
                : 'text-stone-600 hover:text-pink-900'
            }`}
          >
            <Download className="w-4 h-4 text-pink-500" />
            <span>Backup Files</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1">
          
          {/* TAB 1: SCAN ALL STORAGE */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 text-xs sm:text-sm leading-relaxed">
                <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>How browser memory works:</span>
                </div>
                Your planner data is stored in your browser's private offline storage. We scanned all local memory keys and backup slots on your computer to locate any prior journal records.
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                  Found Storage Copies & Backups:
                </h4>
                <button
                  onClick={runScan}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-900 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isScanning ? 'Scanning...' : 'Re-Scan Storage'}</span>
                </button>
              </div>

              {candidates.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-pink-200 bg-pink-50/30">
                  <p className="text-sm font-semibold text-pink-950">
                    No additional storage copies found on this domain.
                  </p>
                  <p className="text-xs text-stone-600 mt-2 max-w-md mx-auto">
                    If you wrote entries on the other URL (e.g. inside the editor or the shared link), visit the <strong>"App URLs & Sync"</strong> tab to transfer your entries across URLs in seconds.
                  </p>
                  <button
                    onClick={() => setActiveTab('urls')}
                    className="mt-4 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium text-xs shadow-sm transition cursor-pointer"
                  >
                    Check Other App URL ↗
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50/40 via-white to-pink-50/20 hover:border-pink-300 transition shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-pink-950">
                            {cand.sourceKey === 'journal_emergency_recovery_vault'
                              ? '🛡️ Emergency Safety Vault'
                              : cand.sourceKey === 'offline_personal_journal_v1'
                              ? '⭐ Current Active Storage'
                              : `📁 Backup: ${cand.sourceKey}`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-medium">
                            {cand.sourceType}
                          </span>
                        </div>
                        <div className="text-xs text-stone-600 flex flex-wrap gap-x-3 gap-y-1">
                          <span>📝 <strong>{cand.taskCount}</strong> tasks</span>
                          <span>💡 <strong>{cand.ideaCount}</strong> notes/ideas</span>
                          <span>📅 <strong>{cand.dayLogCount}</strong> recorded days</span>
                          {cand.cycleLogCount > 0 && <span>🌸 <strong>{cand.cycleLogCount}</strong> cycle logs</span>}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          Last updated: {new Date(cand.lastUpdated).toLocaleString('en-US')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRestoreCandidate(cand)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-pink-200 transition cursor-pointer shrink-0"
                      >
                        Restore This Version! ✨
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* IndexedDB Candidate if available */}
              {idbCandidate && (
                <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-purple-950">
                      💾 IndexedDB Browser Database Backup
                    </h5>
                    <p className="text-xs text-purple-800 mt-0.5">
                      Contains {idbCandidate.tasks.length} tasks and {idbCandidate.ideas.length} notes
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onRestoreDatabase(idbCandidate);
                      setRestoreSuccess('Restored successfully from IndexedDB!');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Restore from IndexedDB
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: URLS & CROSS-ORIGIN SYNC */}
          {activeTab === 'urls' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs sm:text-sm leading-relaxed">
                <div className="font-bold text-sky-900 mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-sky-600" />
                  <span>Important: Two Separate Web URLs</span>
                </div>
                Web browsers keep local storage strictly segregated by web domain:
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-xs">
                  <li><strong>Development URL:</strong> Contains <code>ais-dev</code>.</li>
                  <li><strong>Shared Public URL:</strong> Contains <code>ais-pre</code>.</li>
                </ul>
                If you wrote notes on one URL and opened the other, your entries are safe on the first URL! Use the sync tool below to copy them over.
              </div>

              {/* URL cards */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl border border-pink-200 bg-white flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-pink-950 flex items-center gap-1.5">
                      <span>Development URL (ais-dev)</span>
                      {isCurrentDev && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Current App
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono mt-0.5 break-all">
                      {devUrl}
                    </div>
                  </div>
                  <a
                    href={devUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-900 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <span>Open URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3.5 rounded-2xl border border-pink-200 bg-white flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-pink-950 flex items-center gap-1.5">
                      <span>Shared Permanent URL (ais-pre)</span>
                      {!isCurrentDev && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Current App
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono mt-0.5 break-all">
                      {preUrl}
                    </div>
                  </div>
                  <a
                    href={preUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-900 text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <span>Open URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Transfer Tool */}
              <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-200 space-y-3">
                <div className="font-bold text-sm text-pink-950 flex items-center gap-1.5">
                  <ClipboardPaste className="w-4 h-4 text-pink-600" />
                  <span>One-Click Cross-App Sync Tool</span>
                </div>
                <p className="text-xs text-stone-600">
                  If your data was written on the other URL:
                  <br />
                  1. Open that URL and click <strong>"Copy All Planner Data"</strong>.
                  <br />
                  2. Return here, paste below, and click <strong>"Paste & Restore Planner"</strong>.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyClipboard}
                    className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedSuccess ? 'Copied to Clipboard! ✓' : 'Copy All Planner Data'}</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-pink-200/70">
                  <label className="text-xs font-bold text-stone-700 block">
                    Paste data copied from the other URL:
                  </label>
                  <textarea
                    value={pasteInput}
                    onChange={(e) => setPasteInput(e.target.value)}
                    placeholder="Paste copied planner data here (Ctrl+V)..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl border border-pink-200 text-xs font-mono bg-white focus:outline-pink-500"
                  />
                  <button
                    onClick={handlePasteRestore}
                    disabled={!pasteInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-40"
                  >
                    Paste & Restore Planner Now! ✨
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SNAPSHOTS */}
          {activeTab === 'snapshots' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-200 text-xs leading-relaxed text-pink-950">
                The planner automatically captures rolling restore points as you work so you can roll back anytime.
              </div>

              {snapshots.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs">
                  No auto snapshots captured yet in current browser session.
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3.5 rounded-2xl border border-pink-200 bg-white hover:bg-pink-50/30 transition flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-xs text-pink-950 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-pink-500" />
                          <span>Snapshot from {snap.dateStr}</span>
                          <span className="text-[10px] text-stone-400">
                            ({new Date(snap.timestamp).toLocaleDateString('en-US')})
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-600 mt-0.5">
                          {snap.taskCount} tasks, {snap.ideaCount} notes, {snap.dayLogCount} days logged
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="px-3.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-900 font-bold text-xs transition cursor-pointer shrink-0"
                      >
                        Restore Snapshot
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPORT TO PC */}
          {activeTab === 'export' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-pink-50/80 border border-pink-200 text-xs text-pink-950 leading-relaxed">
                <div className="font-bold text-pink-900 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Permanent Offline Files on Your Computer</span>
                </div>
                Download a permanent standalone file to keep on your computer that runs forever without internet or servers.
              </div>

              {/* Standalone HTML */}
              <div className="p-4 rounded-2xl border border-pink-300 bg-gradient-to-r from-pink-50/60 to-rose-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-sm text-pink-950 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-pink-600" />
                    <span>Download Standalone Planner (.html)</span>
                  </h5>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    A single HTML file containing your entire planner and all notes. Double-click to open anytime — <strong>never goes to sleep and works 100% offline!</strong>
                  </p>
                </div>
                <button
                  onClick={handleDownloadHtml}
                  disabled={isExportingHtml}
                  className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isExportingHtml ? 'Preparing...' : 'Download .html'}
                </button>
              </div>

              {/* JSON Backup */}
              <div className="p-4 rounded-2xl border border-pink-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-sm text-pink-950 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-pink-600" />
                    <span>Export JSON Backup File (.json)</span>
                  </h5>
                  <p className="text-xs text-stone-600 mt-1">
                    Exports raw backup data file directly to your Downloads folder.
                  </p>
                </div>
                <button
                  onClick={handleDownloadJson}
                  className="px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                >
                  Download .json
                </button>
              </div>

              {/* Restore JSON */}
              <div className="p-4 rounded-2xl border border-pink-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-sm text-pink-950 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-pink-600" />
                    <span>Restore from JSON File</span>
                  </h5>
                  <p className="text-xs text-stone-600 mt-1">
                    Select a previously exported JSON backup file from your computer.
                  </p>
                </div>
                <label className="px-4 py-2.5 rounded-xl bg-white hover:bg-pink-50 text-pink-900 border border-pink-300 font-bold text-xs shadow-2xs transition cursor-pointer shrink-0 text-center">
                  Choose File
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleUploadJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-pink-100 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-1.5 text-pink-800">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>Protected with dual-storage local vault</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
