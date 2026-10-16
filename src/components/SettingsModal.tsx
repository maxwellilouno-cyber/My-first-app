import React, { useState } from 'react';
import { X, Volume2, VolumeX, Smartphone, RefreshCw, Check, Layers, Sliders, Info } from 'lucide-react';
import { AppSettings } from '../services/ratesService';
import { ExchangeRates } from '../types/currency';
import { CurrencyPickerModal } from './CurrencyPickerModal';
import { CURRENCY_MAP } from '../data/currencies';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  ratesData: ExchangeRates | null;
  onRefreshRates: () => Promise<void>;
  isRefreshing: boolean;
  onInstallApp?: () => void;
  isInstallable?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  ratesData,
  onRefreshRates,
  isRefreshing,
  onInstallApp,
  isInstallable,
}) => {
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(settings);
  const [isBasePickerOpen, setIsBasePickerOpen] = useState(false);
  const [isTargetPickerOpen, setIsTargetPickerOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key: keyof AppSettings) => {
    const updated = {
      ...currentSettings,
      [key]: !currentSettings[key],
    };
    setCurrentSettings(updated);
    onSaveSettings(updated);
  };

  const handleDecimalChange = (decimals: number) => {
    const updated = {
      ...currentSettings,
      decimalPrecision: decimals,
    };
    setCurrentSettings(updated);
    onSaveSettings(updated);
  };

  const handleBaseChange = (code: string) => {
    const updated = {
      ...currentSettings,
      defaultBase: code,
    };
    setCurrentSettings(updated);
    onSaveSettings(updated);
  };

  const handleTargetChange = (code: string) => {
    const updated = {
      ...currentSettings,
      defaultTarget: code,
    };
    setCurrentSettings(updated);
    onSaveSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Preferences & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Rate Cache & Data Source */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Interbank Exchange Rates</span>
                <span className="text-xs text-slate-400">
                  Last updated: {ratesData?.lastUpdatedDate || 'Live'}
                </span>
              </div>
              <button
                onClick={onRefreshRates}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Updating...' : 'Update Now'}</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-400 border-t border-slate-700/60 pt-2 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Provider: {ratesData?.source || 'Open Global Interbank Feed'}</span>
            </div>
          </div>

          {/* Default Currencies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Currency Pair</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsBasePickerOpen(true)}
                className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-left hover:bg-slate-800"
              >
                <span className="text-[11px] text-slate-400 block">Default Base</span>
                <span className="text-base font-bold text-white font-mono">
                  {currentSettings.defaultBase}
                </span>
              </button>

              <button
                onClick={() => setIsTargetPickerOpen(true)}
                className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-left hover:bg-slate-800"
              >
                <span className="text-[11px] text-slate-400 block">Default Target</span>
                <span className="text-base font-bold text-white font-mono">
                  {currentSettings.defaultTarget}
                </span>
              </button>
            </div>
          </div>

          {/* Decimal Precision */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Display Precision</h3>
            <div className="grid grid-cols-3 gap-2">
              {[2, 4, 6].map((digits) => (
                <button
                  key={digits}
                  onClick={() => handleDecimalChange(digits)}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-semibold border transition-colors ${
                    currentSettings.decimalPrecision === digits
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {digits} Decimals
                </button>
              ))}
            </div>
          </div>

          {/* Haptics & Audio */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Haptics & Tactile Feedback</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-white font-medium block">Keypad Audio Click</span>
                    <span className="text-[11px] text-slate-400">Synthesized micro-clicks on buttons</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('soundEnabled')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    currentSettings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      currentSettings.soundEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-white font-medium block">Haptic Vibration</span>
                    <span className="text-[11px] text-slate-400">Tactile pulse on touch (supported mobile devices)</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('hapticsEnabled')}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    currentSettings.hapticsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      currentSettings.hapticsEnabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Install App Section */}
          {isInstallable && onInstallApp && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Install ValutaPro Native App</span>
                <span className="text-xs text-slate-300">Run offline with native launcher icon</span>
              </div>
              <button
                onClick={onInstallApp}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                Install App
              </button>
            </div>
          )}

          {/* About ValutaPro */}
          <div className="pt-2 text-center text-xs text-slate-500">
            <div>ValutaPro Currency Converter · Native Progressive Web App</div>
            <div className="mt-0.5">Real-time interbank foreign exchange engine & offline storage</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      <CurrencyPickerModal
        isOpen={isBasePickerOpen}
        onClose={() => setIsBasePickerOpen(false)}
        onSelect={(c) => handleBaseChange(c.code)}
        selectedCode={currentSettings.defaultBase}
        title="Select Default Base Currency"
      />

      <CurrencyPickerModal
        isOpen={isTargetPickerOpen}
        onClose={() => setIsTargetPickerOpen(false)}
        onSelect={(c) => handleTargetChange(c.code)}
        selectedCode={currentSettings.defaultTarget}
        title="Select Default Target Currency"
      />
    </div>
  );
};
