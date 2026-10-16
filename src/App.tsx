import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { ConverterView } from './components/ConverterView';
import { WatchlistView } from './components/WatchlistView';
import { TrendsChart } from './components/TrendsChart';
import { TravelExpensesView } from './components/TravelExpensesView';
import { RateAlertsView } from './components/RateAlertsView';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { fetchLiveRates, getCachedRates, loadSettings, saveSettings, AppSettings } from './services/ratesService';
import { ExchangeRates } from './types/currency';
import { useSoundAndHaptics } from './hooks/useSoundAndHaptics';
import { usePWAInstall } from './hooks/usePWAInstall';
import { BASELINE_RATES_USD } from './data/currencies';
import { WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [ratesData, setRatesData] = useState<ExchangeRates | null>(() => getCachedRates());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('converter');
  
  // Active Currency Pair for Converter & Trends
  const [fromCode, setFromCode] = useState(settings.defaultBase || 'USD');
  const [toCode, setToCode] = useState(settings.defaultTarget || 'EUR');

  // Keypad toggle
  const [keypadMode, setKeypadMode] = useState(settings.keypadMode ?? true);

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sound & Haptics Hook
  const { playKeypadSound, playSwapSound, playSuccessSound } = useSoundAndHaptics(
    settings.soundEnabled,
    settings.hapticsEnabled
  );

  // PWA Install
  const { isInstallable, install } = usePWAInstall();

  // Show Toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Rates loader
  const loadRates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchLiveRates();
      setRatesData(data);
    } catch (e) {
      console.error('Failed to load rates', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      loadRates();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial rates fetch
    loadRates();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadRates]);

  // Handle Swap
  const handleSwapCurrencies = () => {
    playSwapSound();
    setFromCode(toCode);
    setToCode(fromCode);
  };

  // Handle Settings Save
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSelectPairForChart = (from: string, to: string) => {
    setFromCode(from);
    setToCode(to);
    setActiveTab('trends');
  };

  const rates = ratesData?.rates || BASELINE_RATES_USD;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        ratesData={ratesData}
        onRefreshRates={loadRates}
        isRefreshing={isRefreshing}
        isOnline={isOnline}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onInstallApp={install}
        isInstallable={isInstallable}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12">
        {/* PWA Install Banner */}
        <PWAInstallBanner />

        {/* Offline Notice if disconnected */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-300 text-xs font-medium">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>You are currently offline. Conversions are using saved local exchange rates.</span>
          </div>
        )}

        {/* Desktop 2-Column Responsive Layout & Mobile Single View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Always Converter on desktop, or activeTab === 'converter' on mobile */}
          <div className={`lg:col-span-6 w-full ${activeTab === 'converter' ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Instant Currency Converter
              </h2>
              <span className="text-xs text-emerald-400 font-mono">
                {ratesData?.isCached ? 'Cached Benchmark' : 'Live Interbank'}
              </span>
            </div>

            <ConverterView
              fromCode={fromCode}
              toCode={toCode}
              rates={rates}
              onSwapCurrencies={handleSwapCurrencies}
              onSelectFromCurrency={setFromCode}
              onSelectToCurrency={setToCode}
              onNavigateToTrends={() => setActiveTab('trends')}
              onKeySound={playKeypadSound}
              onSuccessSound={playSuccessSound}
              keypadMode={keypadMode}
              onToggleKeypadMode={() => setKeypadMode(!keypadMode)}
            />
          </div>

          {/* Right Column: Auxiliary Views (Watchlist, Trends, Travel, Alerts) */}
          <div
            className={`w-full ${
              activeTab !== 'converter' ? 'lg:col-span-6 block' : 'lg:col-span-6 hidden lg:block'
            }`}
          >
            {/* Desktop Section Selector Tabs */}
            <div className="hidden lg:flex items-center justify-between gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-4">
              {[
                { id: 'watchlist' as TabType, label: 'Watchlist' },
                { id: 'trends' as TabType, label: 'Trends & Chart' },
                { id: 'travel' as TabType, label: 'Travel & Fees' },
                { id: 'alerts' as TabType, label: 'Rate Alerts' },
              ].map((tab) => {
                const isActive = activeTab === tab.id || (activeTab === 'converter' && tab.id === 'watchlist');
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* View Switching logic */}
            {(activeTab === 'watchlist' || (activeTab === 'converter')) && (
              <div className={activeTab === 'converter' ? 'hidden lg:block' : 'block'}>
                <div className="lg:hidden flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Multi-Currency Watchlist
                  </h2>
                </div>
                <WatchlistView
                  baseCode={fromCode}
                  onSetBaseCode={setFromCode}
                  rates={rates}
                  onSelectPairForChart={handleSelectPairForChart}
                />
              </div>
            )}

            {activeTab === 'trends' && (
              <div>
                <div className="lg:hidden flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Historical Rate Trends
                  </h2>
                </div>
                <TrendsChart
                  fromCode={fromCode}
                  toCode={toCode}
                  rates={rates}
                  onInvertPair={handleSwapCurrencies}
                />
              </div>
            )}

            {activeTab === 'travel' && (
              <div>
                <div className="lg:hidden flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Travel Budget & Hidden Fees
                  </h2>
                </div>
                <TravelExpensesView
                  rates={rates}
                  defaultHomeCode={settings.defaultBase}
                  defaultTripCode={settings.defaultTarget}
                />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div>
                <div className="lg:hidden flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Target Rate Alerts
                  </h2>
                </div>
                <RateAlertsView
                  rates={rates}
                  onTriggerNotify={showToast}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold text-white animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Bottom Tab Navigation */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        ratesData={ratesData}
        onRefreshRates={loadRates}
        isRefreshing={isRefreshing}
        onInstallApp={install}
        isInstallable={isInstallable}
      />
    </div>
  );
}
