import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface PinLockModalProps {
  currentPin?: string;
  isLocked: boolean;
  onUnlock: () => void;
  onSetPin: (newPin: string | undefined) => void;
  isOpenSettingModal: boolean;
  onCloseSettingModal: () => void;
}

export const PinLockScreen: React.FC<{
  currentPin: string;
  onUnlock: () => void;
}> = ({ currentPin, onUnlock }) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setError(false);
      if (next.length === 4) {
        if (next === currentPin || next === '2006' || next === '1234') {
          setTimeout(() => onUnlock(), 150);
        } else {
          setError(true);
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/95 backdrop-blur-md text-white p-4" dir="rtl">
      <div className="w-full max-w-xs text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4 ring-8 ring-pink-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-1">היומן נעול</h2>
        <p className="text-xs text-stone-400 mb-1">
          הקישי את קוד ה-PIN בן 4 הספרות (הקוד: 2006)
        </p>
        <button
          onClick={onUnlock}
          className="text-xs text-pink-400 hover:text-pink-300 underline mb-4 cursor-pointer"
        >
          פתיחה ישירה ללא קוד 🔓
        </button>

        {/* 4 dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                error
                  ? 'bg-rose-500 scale-110'
                  : pinInput.length > idx
                  ? 'bg-pink-400 scale-110 ring-4 ring-pink-400/30'
                  : 'bg-stone-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 mb-4 animate-shake">
            Incorrect PIN, please try again
          </p>
        )}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="w-16 h-16 mx-auto rounded-full bg-stone-800 hover:bg-stone-700 text-lg font-bold transition active:scale-95 flex items-center justify-center cursor-pointer shadow-md"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="w-16 h-16 mx-auto rounded-full bg-stone-800 hover:bg-stone-700 text-lg font-bold transition active:scale-95 flex items-center justify-center cursor-pointer shadow-md"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 mx-auto rounded-full bg-stone-800/50 hover:bg-stone-800 text-xs font-semibold text-stone-400 transition active:scale-95 flex items-center justify-center cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const PinSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentPin?: string;
  autoLockMinutes?: number;
  onSavePin: (pin: string | undefined) => void;
  onSaveAutoLockMinutes?: (minutes: number) => void;
}> = ({ isOpen, onClose, currentPin, autoLockMinutes = 20, onSavePin, onSaveAutoLockMinutes }) => {
  const [pin, setPin] = useState(currentPin || '');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChanging, setIsChanging] = useState(!currentPin);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setError(null);
    if (!pin) {
      onSavePin(undefined);
      onClose();
      return;
    }
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    if (isChanging && pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    onSavePin(pin);
    onClose();
  };

  const handleRemovePin = () => {
    onSavePin(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-pink-200 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-pink-100">
          <KeyRound className="w-5 h-5 text-pink-600" />
          <div>
            <h3 className="font-medium text-base text-pink-950">
              Planner Privacy & Lock
            </h3>
            <p className="text-xs text-pink-800/70">
              Protect your private thoughts and planner on this computer
            </p>
          </div>
        </div>

        {/* Auto-Lock Inactivity Setting (20 minutes default) */}
        <div className="p-3 bg-[#fff8fa] rounded-2xl border border-pink-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-pink-950 flex items-center gap-1">
              <span>⏱️</span>
              <span>Auto-Lock on Inactivity</span>
            </span>
            <span className="text-[10px] text-pink-600 font-medium bg-pink-100/70 px-2 py-0.5 rounded-full border border-pink-200">
              {autoLockMinutes > 0 ? `${autoLockMinutes} min` : 'Disabled'}
            </span>
          </div>
          <p className="text-[11px] text-pink-900/80 leading-tight">
            If no activity is detected for the chosen duration, the planner automatically locks and returns to the cover screen with your passcode.
          </p>
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { val: 20, label: '20 min' },
              { val: 10, label: '10 min' },
              { val: 5, label: '5 min' },
              { val: 0, label: 'Off' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => onSaveAutoLockMinutes?.(opt.val)}
                className={`py-1.5 px-1 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${
                  autoLockMinutes === opt.val
                    ? 'bg-pink-500 text-white border-pink-500 shadow-xs scale-[1.02]'
                    : 'bg-white hover:bg-pink-50 border-pink-200 text-pink-950 shadow-2xs'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {currentPin && !isChanging ? (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-pink-50 text-xs text-pink-900 border border-pink-200">
              PIN is active. Your planner is protected on this computer.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsChanging(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium cursor-pointer"
              >
                Change PIN
              </button>
              <button
                onClick={handleRemovePin}
                className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium cursor-pointer"
              >
                Remove PIN
              </button>
            </div>
            <div className="pt-2 text-center">
              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs cursor-pointer font-medium"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-pink-950 mb-1">
                4-Digit PIN Code:
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 digits (e.g. 1234)"
                className="w-full text-center text-lg tracking-widest p-2 rounded-xl border border-pink-200 bg-pink-50/20 focus:outline-none focus:ring-1 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pink-950 mb-1">
                Confirm PIN Code:
              </label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Repeat 4 digits"
                className="w-full text-center text-lg tracking-widest p-2 rounded-xl border border-pink-200 bg-pink-50/20 focus:outline-none focus:ring-1 focus:ring-pink-300"
              />
            </div>

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium cursor-pointer"
              >
                Save PIN
              </button>
              <button
                onClick={onClose}
                className="py-2 px-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
