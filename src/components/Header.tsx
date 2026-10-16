import React from 'react';
import { RefreshCw, Settings, Download, WifiOff } from 'lucide-react';
import { ExchangeRates } from '../types/currency';

interface HeaderProps {
  ratesData: ExchangeRates | null;
  onRefreshRates: () => Promise<void>;
  isRefreshing: boolean;
  isOnline: boolean;
  onOpenSettings: () => void;
  onInstallApp?: () => void;
  isInstallable?: boolean;
  activeTab: string;
  onSelectTab: (tab: 'converter' | 'watchlist' | 'trends' | 'travel' | 'alerts') => void;
}

export const Header: React.FC<HeaderProps> = ({
  ratesData,
  onRefreshRates,
  isRefreshing,
  isOnline,
  onOpenSettings,
  onInstallApp,
  isInstallable,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-emerald-400 font-extrabold text-lg leading-none font-mono">$</span>
            </div>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
            Valuta<span className="text-emerald-400">Pro</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links for Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('converter')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'converter' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Converter
          </button>
          <button
            onClick={() => onSelectTab('watchlist')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'watchlist' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Watchlist
          </button>
          <button
            onClick={() => onSelectTab('trends')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'trends' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => onSelectTab('travel')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'travel' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Travel & Fees
          </button>
          <button
            onClick={() => onSelectTab('alerts')}
            className={`whitespace-nowrap transition-colors ${
              activeTab === 'alerts' ? 'text-white font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Alerts
          </button>
        </nav>

        {/* Zone 3: Actions (Refresh, Status, Install, Settings) */}
        <div className="flex items-center gap-2 shrink-0">
          {!isOnline && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Mode</span>
            </div>
          )}

          <button
            onClick={onRefreshRates}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            title={`Refresh Rates (Last: ${ratesData?.lastUpdatedDate || 'Now'})`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {isInstallable && onInstallApp && (
            <button
              onClick={onInstallApp}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors shadow-sm shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Settings & Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
