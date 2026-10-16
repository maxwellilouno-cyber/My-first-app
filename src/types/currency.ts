export interface Currency {
  code: string;
  name: string;
  symbol: string;
  nativeSymbol?: string;
  country: string;
  flag: string;
  region: 'Americas' | 'Europe' | 'Asia-Pacific' | 'Middle East & Africa' | 'Global / Crypto';
  decimalDigits?: number;
  isPopular?: boolean;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
  lastUpdatedDate: string;
  source: string;
  isCached?: boolean;
}

export interface HistoricalRate {
  date: string;
  rate: number;
  changePercent?: number;
}

export interface RateStats {
  current: number;
  high: number;
  low: number;
  average: number;
  changePercent: number;
  changeValue: number;
}

export interface RateAlert {
  id: string;
  baseCode: string;
  targetCode: string;
  targetRate: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered?: boolean;
}

export interface ExpenseItem {
  id: string;
  title: string;
  foreignAmount: number;
  foreignCode: string;
  homeCode: string;
  homeAmount: number;
  feePercent: number;
  category: 'Food' | 'Transport' | 'Stay' | 'Shopping' | 'Activities' | 'Other';
  date: string;
}

export type Timeframe = '7D' | '1M' | '3M' | '1Y' | '5Y';
