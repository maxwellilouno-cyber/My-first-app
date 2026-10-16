import { BASELINE_RATES_USD, CURRENCY_MAP } from '../data/currencies';
import { ExchangeRates, HistoricalRate, RateStats, Timeframe } from '../types/currency';

const STORAGE_KEY = 'valutapro_exchange_rates_v1';
const ALERTS_STORAGE_KEY = 'valutapro_rate_alerts_v1';
const EXPENSES_STORAGE_KEY = 'valutapro_travel_expenses_v1';
const SETTINGS_STORAGE_KEY = 'valutapro_app_settings_v1';

export async function fetchLiveRates(): Promise<ExchangeRates> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    if (data && data.rates) {
      // Merge baseline with API rates so any missing custom coins/currencies remain supported
      const mergedRates: Record<string, number> = {
        ...BASELINE_RATES_USD,
        ...data.rates,
      };

      const result: ExchangeRates = {
        base: 'USD',
        rates: mergedRates,
        timestamp: Date.now(),
        lastUpdatedDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'Open Exchange Rates (Global Interbank)',
        isCached: false,
      };

      // Save to cache
      saveCachedRates(result);
      return result;
    }
  } catch (err) {
    console.warn('Primary exchange rates API failed, trying fallback...', err);
  }

  // Backup fallback endpoint
  try {
    const backupRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (backupRes.ok) {
      const backupData = await backupRes.json();
      if (backupData && backupData.rates) {
        const mergedRates: Record<string, number> = {
          ...BASELINE_RATES_USD,
          ...backupData.rates,
        };

        const result: ExchangeRates = {
          base: 'USD',
          rates: mergedRates,
          timestamp: Date.now(),
          lastUpdatedDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'ExchangeRate API Network',
          isCached: false,
        };
        saveCachedRates(result);
        return result;
      }
    }
  } catch (fallbackErr) {
    console.warn('Backup exchange rates API also unavailable. Using cached/offline baseline.', fallbackErr);
  }

  // Check LocalStorage cache
  const cached = getCachedRates();
  if (cached) {
    return {
      ...cached,
      isCached: true,
    };
  }

  // Fallback to embedded baseline rates
  return {
    base: 'USD',
    rates: BASELINE_RATES_USD,
    timestamp: Date.now(),
    lastUpdatedDate: 'Offline Baseline',
    source: 'Offline Interbank Benchmark',
    isCached: true,
  };
}

export function saveCachedRates(rates: ExchangeRates): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
  } catch (e) {
    console.error('Failed to save rates to cache', e);
  }
}

export function getCachedRates(): ExchangeRates | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Calculates exchange rate from fromCode to toCode using USD baseline rates
 */
export function getExchangeRate(fromCode: string, toCode: string, rates: Record<string, number>): number {
  if (fromCode === toCode) return 1.0;
  const fromRate = rates[fromCode] || BASELINE_RATES_USD[fromCode] || 1.0;
  const toRate = rates[toCode] || BASELINE_RATES_USD[toCode] || 1.0;
  
  // Since rates are based on 1 USD = X:
  // 1 fromCode = (1 / fromRate) USD
  // In toCode = (toRate / fromRate)
  return toRate / fromRate;
}

/**
 * Convert an amount from fromCode to toCode
 */
export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: Record<string, number>,
  markupFeePercent = 0
): number {
  const rate = getExchangeRate(fromCode, toCode, rates);
  const rawConverted = amount * rate;
  if (markupFeePercent > 0) {
    // Bank markup gives less converted foreign currency or costs more
    return rawConverted * (1 - markupFeePercent / 100);
  }
  return rawConverted;
}

/**
 * Formats a currency amount with proper symbol, commas, and precision
 */
export function formatAmount(amount: number, currencyCode: string, customDecimals?: number): string {
  if (isNaN(amount) || !isFinite(amount)) return '0.00';
  
  const currency = CURRENCY_MAP[currencyCode];
  const decimals = customDecimals !== undefined 
    ? customDecimals 
    : (currency?.decimalDigits !== undefined ? currency.decimalDigits : 2);

  // Large cryptos might need more decimals
  if (amount < 0.001 && amount > 0) {
    return amount.toFixed(6);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Math.min(decimals, 2),
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format exchange rate display (e.g. 1.0825)
 */
export function formatRateDisplay(rate: number): string {
  if (rate >= 1000) return rate.toFixed(2);
  if (rate >= 100) return rate.toFixed(3);
  if (rate >= 1) return rate.toFixed(4);
  if (rate >= 0.001) return rate.toFixed(6);
  return rate.toExponential(4);
}

/**
 * Generates realistic historical rates for a pair over a timeframe
 */
export function generateHistoricalData(
  fromCode: string,
  toCode: string,
  rates: Record<string, number>,
  timeframe: Timeframe
): { history: HistoricalRate[]; stats: RateStats } {
  const currentRate = getExchangeRate(fromCode, toCode, rates);
  
  let days = 7;
  let pointsCount = 7;
  let volatility = 0.006; // 0.6% daily volatility baseline

  switch (timeframe) {
    case '7D':
      days = 7;
      pointsCount = 7;
      volatility = 0.004;
      break;
    case '1M':
      days = 30;
      pointsCount = 15;
      volatility = 0.012;
      break;
    case '3M':
      days = 90;
      pointsCount = 20;
      volatility = 0.025;
      break;
    case '1Y':
      days = 365;
      pointsCount = 30;
      volatility = 0.045;
      break;
    case '5Y':
      days = 1825;
      pointsCount = 40;
      volatility = 0.09;
      break;
  }

  // Generate pseudo-deterministic seed based on currency codes so the curve is consistent across re-renders
  const pairSeed = (fromCode.charCodeAt(0) * 17 + toCode.charCodeAt(0) * 31) % 100;
  const history: HistoricalRate[] = [];

  let highest = currentRate;
  let lowest = currentRate;
  let sum = 0;

  const now = new Date();

  // Create smooth historical trend points leading up to current rate
  for (let i = pointsCount - 1; i >= 0; i--) {
    const fraction = i / (pointsCount - 1); // 1 = furthest back, 0 = today
    const dateOffsetDays = Math.round(fraction * days);
    const pointDate = new Date(now.getTime() - dateOffsetDays * 24 * 60 * 60 * 1000);
    
    // Wave function with noise for natural financial market movement
    const wave1 = Math.sin((fraction * Math.PI * 2.5) + (pairSeed / 10));
    const wave2 = Math.cos((fraction * Math.PI * 4.2) + (pairSeed / 20));
    const randomVariation = ((wave1 * 0.6 + wave2 * 0.4)) * volatility;
    
    // The final point (i=0) MUST be the exact currentRate
    const simulatedRate = i === 0 ? currentRate : currentRate * (1 - randomVariation);
    
    if (simulatedRate > highest) highest = simulatedRate;
    if (simulatedRate < lowest) lowest = simulatedRate;
    sum += simulatedRate;

    const dateLabel = timeframe === '7D'
      ? pointDate.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' })
      : pointDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: timeframe === '5Y' ? '2-digit' : undefined });

    history.push({
      date: dateLabel,
      rate: simulatedRate,
    });
  }

  const firstPointRate = history[0].rate;
  const changeValue = currentRate - firstPointRate;
  const changePercent = (changeValue / firstPointRate) * 100;

  const stats: RateStats = {
    current: currentRate,
    high: highest,
    low: lowest,
    average: sum / history.length,
    changePercent,
    changeValue,
  };

  return { history, stats };
}

// Storage helpers for Rate Alerts
export function loadRateAlerts() {
  try {
    const data = localStorage.getItem(ALERTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRateAlerts(alerts: unknown[]) {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error('Failed to save rate alerts', e);
  }
}

// Storage helpers for Travel Expenses
export function loadTravelExpenses() {
  try {
    const data = localStorage.getItem(EXPENSES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTravelExpenses(expenses: unknown[]) {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save travel expenses', e);
  }
}

// Storage for App Settings
export interface AppSettings {
  defaultBase: string;
  defaultTarget: string;
  decimalPrecision: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: 'dark' | 'light';
  keypadMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultBase: 'USD',
  defaultTarget: 'EUR',
  decimalPrecision: 2,
  soundEnabled: true,
  hapticsEnabled: true,
  theme: 'dark',
  keypadMode: true,
};

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
