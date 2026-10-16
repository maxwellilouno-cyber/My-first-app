import React, { useState } from 'react';
import { ArrowUpDown, Copy, Check, Share2, Sparkles, SlidersHorizontal, Calculator, LineChart } from 'lucide-react';
import { CURRENCY_MAP } from '../data/currencies';
import { getExchangeRate, convertCurrency, formatAmount, formatRateDisplay } from '../services/ratesService';
import { CurrencyPickerModal } from './CurrencyPickerModal';
import { Keypad } from './Keypad';

interface ConverterViewProps {
  fromCode: string;
  toCode: string;
  rates: Record<string, number>;
  onSwapCurrencies: () => void;
  onSelectFromCurrency: (code: string) => void;
  onSelectToCurrency: (code: string) => void;
  onNavigateToTrends: () => void;
  onKeySound: () => void;
  onSuccessSound: () => void;
  keypadMode: boolean;
  onToggleKeypadMode: () => void;
}

export const ConverterView: React.FC<ConverterViewProps> = ({
  fromCode,
  toCode,
  rates,
  onSwapCurrencies,
  onSelectFromCurrency,
  onSelectToCurrency,
  onNavigateToTrends,
  onKeySound,
  onSuccessSound,
  keypadMode,
  onToggleKeypadMode,
}) => {
  const [expression, setExpression] = useState<string>('100');
  const [isFromPickerOpen, setIsFromPickerOpen] = useState(false);
  const [isToPickerOpen, setIsToPickerOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [markupPercent, setMarkupPercent] = useState<number>(0);
  const [swapRotated, setSwapRotated] = useState(false);

  const fromCurr = CURRENCY_MAP[fromCode] || { code: fromCode, name: fromCode, flag: '🌐', symbol: '$' };
  const toCurr = CURRENCY_MAP[toCode] || { code: toCode, name: toCode, flag: '🌐', symbol: '€' };

  // Calculate evaluated numeric value from expression safely
  const evaluatedAmount = React.useMemo(() => {
    if (!expression) return 0;
    try {
      // Clean expression to only allow safe arithmetic characters: digits, ., +, -, *, /
      const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
      if (!sanitized) return 0;
      
      // Simple safe evaluation of arithmetic expressions without eval()
      // Tokenize by operators
      const tokens = sanitized.match(/(\d+\.?\d*|[+\-*/])/g);
      if (!tokens) return parseFloat(sanitized) || 0;

      // Quick fallback parser
      // If trailing operator, ignore it for live calculation
      let total = 0;
      let currentOp = '+';
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (['+', '-', '*', '/'].includes(token)) {
          currentOp = token;
        } else {
          const num = parseFloat(token);
          if (!isNaN(num)) {
            if (currentOp === '+') total += num;
            else if (currentOp === '-') total -= num;
            else if (currentOp === '*') total *= num;
            else if (currentOp === '/') total = num !== 0 ? total / num : total;
          }
        }
      }
      return total;
    } catch {
      return 0;
    }
  }, [expression]);

  const convertedValue = convertCurrency(evaluatedAmount, fromCode, toCode, rates, markupPercent);
  const forwardRate = getExchangeRate(fromCode, toCode, rates);
  const reverseRate = getExchangeRate(toCode, fromCode, rates);

  const handleKeyPress = (key: string) => {
    onKeySound();
    if (expression === '0' && key !== '.') {
      setExpression(key);
    } else {
      setExpression((prev) => prev + key);
    }
  };

  const handleClear = () => {
    onKeySound();
    setExpression('0');
  };

  const handleBackspace = () => {
    onKeySound();
    setExpression((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEvaluate = () => {
    onKeySound();
    setExpression(evaluatedAmount.toString());
  };

  const handleSwap = () => {
    setSwapRotated((prev) => !prev);
    onSwapCurrencies();
  };

  const handleCopyConverted = () => {
    const formatted = formatAmount(convertedValue, toCode);
    navigator.clipboard.writeText(`${formatted} ${toCode}`).catch(() => {});
    setIsCopied(true);
    onSuccessSound();
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `${expression} ${fromCode} = ${formatAmount(convertedValue, toCode)} ${toCode} (Rate: 1 ${fromCode} = ${formatRateDisplay(forwardRate)} ${toCode})`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Currency Conversion',
          text,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      setIsCopied(true);
      onSuccessSound();
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Upper & Lower Conversion Surfaces */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle decorative gradient glow behind base */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Source Currency Input Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>You Send / Base Currency</span>
            <span className="text-[11px] text-slate-400">
              Symbol: <span className="text-white font-mono">{fromCurr.symbol}</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
            {/* Currency Selector Button */}
            <button
              type="button"
              onClick={() => setIsFromPickerOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 bg-slate-700/60 hover:bg-slate-700 rounded-xl transition-colors shrink-0 text-left"
            >
              <span className="text-2xl" role="img" aria-label={fromCurr.name}>
                {fromCurr.flag}
              </span>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-base font-bold text-white font-mono tracking-tight">
                    {fromCurr.code}
                  </span>
                  <span className="text-slate-400 text-xs">▼</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[85px] sm:max-w-[120px]">
                  {fromCurr.name}
                </div>
              </div>
            </button>

            {/* Expression / Amount Display or Input */}
            <div className="flex-1 text-right min-w-0">
              <input
                type="text"
                readOnly={keypadMode}
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent text-right text-2xl sm:text-4xl font-extrabold text-white font-mono tabular-nums focus:outline-none truncate tracking-tight"
              />
              {expression.match(/[+\-*/]/) && (
                <div className="text-xs text-emerald-400 font-mono tabular-nums">
                  = {evaluatedAmount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Swap Divider */}
        <div className="relative py-3 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <button
            type="button"
            onClick={handleSwap}
            className="relative z-10 p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white rounded-2xl border border-slate-700 shadow-lg flex items-center justify-center transition-transform cursor-pointer"
            title="Swap currencies"
          >
            <ArrowUpDown
              className={`w-5 h-5 text-emerald-400 transition-transform duration-300 ${
                swapRotated ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>
        </div>

        {/* Target Currency Converted Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Recipient Gets / Converted</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyConverted}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                title="Copy converted value"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                title="Share calculation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 transition-all">
            {/* Currency Selector Button */}
            <button
              type="button"
              onClick={() => setIsToPickerOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 bg-slate-700/60 hover:bg-slate-700 rounded-xl transition-colors shrink-0 text-left"
            >
              <span className="text-2xl" role="img" aria-label={toCurr.name}>
                {toCurr.flag}
              </span>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-base font-bold text-white font-mono tracking-tight">
                    {toCurr.code}
                  </span>
                  <span className="text-slate-400 text-xs">▼</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[85px] sm:max-w-[120px]">
                  {toCurr.name}
                </div>
              </div>
            </button>

            {/* Converted Output Amount */}
            <div className="flex-1 text-right min-w-0">
              <div className="text-2xl sm:text-4xl font-extrabold text-emerald-400 font-mono tabular-nums tracking-tight truncate">
                {formatAmount(convertedValue, toCode)}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {toCurr.symbol} {toCurr.code}
              </div>
            </div>
          </div>
        </div>

        {/* Live Inverse Rate & Historical Shortcut */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-slate-300 font-mono flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold">1 {fromCode}</span>
            <span>=</span>
            <span className="text-emerald-400 font-semibold">{formatRateDisplay(forwardRate)} {toCode}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">1 {toCode} = {formatRateDisplay(reverseRate)} {fromCode}</span>
          </div>

          <button
            type="button"
            onClick={onNavigateToTrends}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors self-start sm:self-auto"
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>View Rate Chart</span>
          </button>
        </div>
      </div>

      {/* Quick Amount Chips & Keypad Toggle Strip */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[10, 50, 100, 500, 1000, 5000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => {
                onKeySound();
                setExpression(amt.toString());
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-colors shrink-0 ${
                evaluatedAmount === amt && !expression.match(/[+\-*/]/)
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {fromCurr.symbol}{amt.toLocaleString()}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleKeypadMode}
          className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 border ${
            keypadMode
              ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
          title="Toggle native touch keypad"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Keypad {keypadMode ? 'On' : 'Off'}</span>
        </button>
      </div>

      {/* Bank Fee Markup Adjustment Strip */}
      <div className="p-3 bg-slate-900/90 border border-slate-800/90 rounded-2xl flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">Fee Model:</span>
        </div>

        <div className="flex items-center gap-1">
          {[
            { label: '0% Mid-Market', fee: 0 },
            { label: '1.5% Travel Card', fee: 1.5 },
            { label: '3% Standard Bank', fee: 3.0 },
          ].map((item) => (
            <button
              key={item.fee}
              type="button"
              onClick={() => {
                onKeySound();
                setMarkupPercent(item.fee);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                markupPercent === item.fee
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Built-in Tactile Native Keypad */}
      {keypadMode && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-3 shadow-xl animate-in slide-in-from-bottom-2 duration-200">
          <Keypad
            onKeyPress={handleKeyPress}
            onClear={handleClear}
            onBackspace={handleBackspace}
            onEvaluate={handleEvaluate}
          />
        </div>
      )}

      {/* Pickers */}
      <CurrencyPickerModal
        isOpen={isFromPickerOpen}
        onClose={() => setIsFromPickerOpen(false)}
        onSelect={(c) => onSelectFromCurrency(c.code)}
        selectedCode={fromCode}
        title="Send Currency"
      />

      <CurrencyPickerModal
        isOpen={isToPickerOpen}
        onClose={() => setIsToPickerOpen(false)}
        onSelect={(c) => onSelectToCurrency(c.code)}
        selectedCode={toCode}
        title="Receive Currency"
      />
    </div>
  );
};
