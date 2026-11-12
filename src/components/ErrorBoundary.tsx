import React, { Component, ErrorInfo, ReactNode } from 'react';
import { scanAllStorageForJournals, loadJournalDatabase } from '../services/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Diary Planner:', error, errorInfo);
  }

  private handleResetCache = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
    } catch {}
    window.location.reload();
  };

  private handleEmergencyExport = () => {
    try {
      const db = loadJournalDatabase();
      const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planner_emergency_rescue_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Could not export backup: ' + String(err));
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fff5f7] flex items-center justify-center p-6 text-stone-900 font-sans" dir="rtl">
          <div className="max-w-lg w-full bg-white rounded-3xl p-7 shadow-xl border border-pink-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🌸
            </div>
            <h1 className="text-2xl font-bold text-pink-950">
              יומן אישי - שחזור והפעלה מחדש
            </h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              התרחשה שגיאה רגעית בטעינת הדפדפן. כל הנתונים והרשימות שלך שמורים היטב במחשב ובזיכרון המקומי!
            </p>

            <div className="p-3 bg-pink-50/70 rounded-2xl border border-pink-200 text-right text-xs text-pink-900 overflow-x-auto max-h-32">
              <span className="font-bold">פרטי השגיאה:</span> {this.state.error?.message || 'Unknown error'}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
              <button
                type="button"
                onClick={this.handleResetCache}
                className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                רענון והפעלה מחדש 🔄
              </button>
              <button
                type="button"
                onClick={this.handleEmergencyExport}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-pink-900 font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                הורדת גיבוי חירום למחשב 💾
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
