import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpDown, Copy, Check } from 'lucide-react';
import { CURRENCY_MAP } from '../data/currencies';
import { getExchangeRate, convertCurrency, formatAmount, formatRateDisplay } from '../services/ratesService';
import { CurrencyPickerModal } from './CurrencyPickerModal';
import { Currency } from '../types/currency';

interface WatchlistViewProps {
  baseCode: string;
  onSetBaseCode: (code: string) => void;
  rates: Record<string, number>;
  onSelectPairForChart: (from: string, to: string) => void;
}

const DEFAULT_WATCHLIST = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'AED', 'SGD', 'BTC'];

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  baseCode,
  onSetBaseCode,
  rates,
  onSelectPairForChart,
}) => {
  const [amount, setAmount] = useState<number>(100);
  const [amountStr, setAmountStr] = useState<string>('100');
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isBasePickerOpen, setIsBasePickerOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const baseCurr = CURRENCY_MAP[baseCode] || { code: baseCode, name: baseCode, flag: '🌐', symbol: '$' };

  const handleAmountChange = (val: string) => {
    setAmountStr(val);
    const parsed = parseFloat(val);
    setAmount(isNaN(parsed) ? 0 : parsed);
  };

  const handleAddCurrency = (currency: Currency) => {
    if (!watchlist.includes(currency.code) && currency.code !== baseCode) {
      setWatchlist([...watchlist, currency.code]);
    }
  };

  const handleRemoveCurrency = (code: string) => {
    setWatchlist(watchlist.filter((c) => c !== code));
  };

  const handleCopy = (code: string, formattedVal: string) => {
    navigator.clipboard.writeText(`${formattedVal} ${code}`).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Base Control Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400">Base Currency & Amount</span>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Currency
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Base Currency Selector */}
          <button
            onClick={() => setIsBasePickerOpen(true)}
            className="flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label={baseCurr.name}>
                {baseCurr.flag}
              </span>
              <div>
                <div className="text-sm font-bold text-white font-mono">{baseCurr.code}</div>
                <div className="text-xs text-slate-400 truncate max-w-[150px]">{baseCurr.name}</div>
              </div>
            </div>
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Amount Input */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
              {baseCurr.symbol}
            </span>
            <input
              type="number"
              value={amountStr}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-lg font-bold text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Quick Amount Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-3 pt-3 border-t border-slate-800/80">
          {[10, 50, 100, 500, 1000, 5000].map((quickAmt) => (
            <button
              key={quickAmt}
              onClick={() => {
                setAmount(quickAmt);
                setAmountStr(quickAmt.toString());
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 ${
                amount === quickAmt
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {baseCurr.symbol}{quickAmt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Target Watchlist Rows */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg divide-y divide-slate-800/80">
        <div className="px-5 py-3 bg-slate-800/40 flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span>Target Currencies ({watchlist.length})</span>
          <span>Converted Value</span>
        </div>

        {watchlist.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Your watchlist is empty. Tap &quot;Add Currency&quot; to track rates.
          </div>
        ) : (
          watchlist.map((code) => {
            const curr = CURRENCY_MAP[code] || { code, name: code, flag: '🌐', symbol: code };
            const rate = getExchangeRate(baseCode, code, rates);
            const converted = convertCurrency(amount, baseCode, code, rates);
            const formattedVal = formatAmount(converted, code);
            const isCopied = copiedCode === code;

            return (
              <div
                key={code}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors group"
              >
                {/* Left info */}
                <div 
                  className="flex items-center gap-3 min-w-0 cursor-pointer"
                  onClick={() => onSelectPairForChart(baseCode, code)}
                  title="Click to view rate history chart"
                >
                  <span className="text-2xl shrink-0" role="img" aria-label={curr.name}>
                    {curr.flag}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-white font-mono">{curr.code}</span>
                      <span className="text-xs text-slate-400">{curr.symbol}</span>
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[220px]">
                      1 {baseCode} = {formatRateDisplay(rate)} {curr.code}
                    </div>
                  </div>
                </div>

                {/* Right Value & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                      {formattedVal}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono">
                      {curr.symbol} {curr.code}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(code, formattedVal)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Copy amount"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onSetBaseCode(code)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Make this the base currency"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveCurrency(code)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Currency Modal */}
      <CurrencyPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleAddCurrency}
        selectedCode=""
        title="Add Currency to Watchlist"
        excludeCode={baseCode}
      />

      {/* Base Currency Picker Modal */}
      <CurrencyPickerModal
        isOpen={isBasePickerOpen}
        onClose={() => setIsBasePickerOpen(false)}
        onSelect={(c) => onSetBaseCode(c.code)}
        selectedCode={baseCode}
        title="Select Base Currency"
      />
    </div>
  );
};
