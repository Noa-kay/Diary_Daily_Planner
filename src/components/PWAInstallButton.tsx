import React, { useState } from 'react';
import { Download, Monitor, CheckCircle, Info, X, GitBranch, Smartphone, Laptop, WifiOff, FileCode } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { loadJournalDatabase, exportStandaloneHtmlFile } from '../services/storage';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [isExportingOffline, setIsExportingOffline] = useState(false);
  const [offlineExportMessage, setOfflineExportMessage] = useState<string | null>(null);

  // When downloaded / installed as standalone PWA app, hide button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowManualGuide(true);
      }
    } else {
      setShowManualGuide(true);
    }
  };

  const handleDownloadOfflineFile = async () => {
    try {
      setIsExportingOffline(true);
      setOfflineExportMessage(null);
      const db = loadJournalDatabase();
      await exportStandaloneHtmlFile(db);
      setOfflineExportMessage('הקובץ העצמאי הורד בהצלחה! שמרי אותו בשולחן העבודה ולחצי דאבל-קליק.');
      setTimeout(() => setOfflineExportMessage(null), 5000);
    } catch (err: unknown) {
      setOfflineExportMessage(err instanceof Error ? err.message : 'שגיאה בהורדת הקובץ');
    } finally {
      setIsExportingOffline(false);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="התקנת היומן כאפליקציה עצמאית למחשב או לטלפון (Desktop / Mobile App)"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">התקן אפליקציה</span>
        <span className="sm:hidden">התקנה 📲</span>
      </button>

      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-pink-200 text-stone-900 scrollbar-thin">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-pink-100 rounded-2xl text-pink-700">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-pink-950">
                    איך להוריד את היומן כאפליקציה רגילה?
                  </h3>
                  <p className="text-[11px] text-pink-700">בלי להריץ שום דבר ובלי שיימחק שום דבר לעולם!</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualGuide(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-stone-700 leading-relaxed text-right">
              {/* Option 1: Instant 100% Offline Single-File HTML Download */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-pink-50 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500 text-white rounded-xl shadow-2xs">
                      <WifiOff className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-emerald-950">
                        קובץ יומן עצמאי למחשב (100% ללא אינטרנט!)
                      </h4>
                      <p className="text-[10px] text-emerald-800">
                        עובד לנצח ישירות מהמחשב, בלי שרתים, בלי רשת ובלי פקודות!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadOfflineFile}
                    disabled={isExportingOffline}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExportingOffline ? 'מכין קובץ...' : 'הורד קובץ יומן (.html)'}</span>
                  </button>
                </div>
                {offlineExportMessage && (
                  <div className="p-2 bg-white/90 rounded-xl border border-emerald-300 text-[11px] font-semibold text-emerald-900 animate-in fade-in">
                    ✓ {offlineExportMessage}
                  </div>
                )}
                <p className="text-[10px] text-stone-600 leading-relaxed">
                  💡 <strong>איך זה עובד?</strong> יורד לך קובץ אחד בשם <code>my_planner.html</code> המכיל את כל היומן והרשומות שלך. שומרים אותו בשולחן העבודה, לוחצים עליו דאבל-קליק, והוא נפתח מיד ועובד מקומית בכל מצב!
                </p>
              </div>

              {/* Option 2: What the friend meant with Git (Localhost Offline) */}
              <div className="p-3.5 bg-violet-50/80 rounded-2xl border border-violet-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-violet-950 text-xs">
                  <GitBranch className="w-4 h-4 text-violet-600" />
                  <span>מה החברה שלך התכוונה לגבי פקודות ב-Git ללא אינטרנט:</span>
                </div>
                <div className="text-[11px] text-violet-900 leading-relaxed pr-1 space-y-1.5">
                  <p>
                    החברה שלך התכוונה שתוכלי להוריד (Clone) את תיקיית הקוד של היומן מ-Git ישירות למחשב האישי שלך, ולהריץ אותו מהטרמינל ללא צורך בשום חיבור רשת:
                  </p>
                  <div className="bg-white p-2.5 rounded-xl border border-violet-200 font-mono text-[10px] text-violet-950 space-y-1 select-all" dir="ltr">
                    <div>git clone &lt;כתובת הריפוזיטורי שלך מ-GitHub&gt;</div>
                    <div>npm install</div>
                    <div>npm run dev</div>
                  </div>
                  <p>
                    כשמריצים את הפקודות האלו, המחשב שלך מפעיל את היומן מקומית (בכתובת <code>localhost:3000</code>). זה עובד ישירות מתוך הכונן הקשיח של המחשב, <strong>בלי שום צורך באינטרנט</strong>, והכל נשמר אצלך במחשב לתמיד!
                  </p>
                </div>
              </div>

              {/* Option 3: Installed App (PWA) Offline Cache */}
              <div className="p-3.5 bg-pink-50/50 rounded-2xl border border-pink-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-pink-950 text-xs">
                  <Laptop className="w-4 h-4 text-pink-600" />
                  <span>התקנת אפליקציה למחשב (גם היא עובדת Offline ללא אינטרנט!):</span>
                </div>
                <div className="text-[11px] text-stone-700 space-y-1 pr-2">
                  <p>
                    האפליקציה שומרת את כל הקבצים שלה בזיכרון המטמון (Offline Cache) של המחשב.
                    ברגע שהתקנת אותה (דרך <strong>Chrome / Edge</strong> עם אייקון המחשב 🖥️, או ב-<strong>Mac</strong> דרך <code>File ➔ Add to Dock</code>):
                  </p>
                  <p className="text-pink-800 font-semibold pt-0.5">
                    🌸 את יכולה לנתק לגמרי את האינטרנט ולכבות את ה-Wi-Fi — האפליקציה תיפתח כרגיל משולחן העבודה שלך ותפעל באופן מלא!
                  </p>
                </div>
              </div>

              {/* Option 4: Permanent 24/7 Cloud link */}
              <div className="p-3 bg-pink-50/60 rounded-2xl border border-pink-200/90 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-pink-950">
                  <span>🌐 הקישור הקבוע בענן (זמין 24/7):</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-pink-200 text-[10px] font-mono text-pink-900 break-all select-all text-left" dir="ltr">
                  https://ais-pre-agokwkosnk7bvajfrptbx3-138158329068.europe-west1.run.app
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowManualGuide(false)}
              className="mt-5 w-full py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs transition shadow-xs cursor-pointer"
            >
              הבנתי, תודה רבה! 💕
            </button>
          </div>
        </div>
      )}
    </>
  );
};
