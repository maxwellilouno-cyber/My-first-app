import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldAlert, CreditCard, Banknote, Calculator, Percent } from 'lucide-react';
import { CURRENCY_MAP } from '../data/currencies';
import { convertCurrency, formatAmount, loadTravelExpenses, saveTravelExpenses } from '../services/ratesService';
import { ExpenseItem } from '../types/currency';
import { CurrencyPickerModal } from './CurrencyPickerModal';

interface TravelExpensesViewProps {
  rates: Record<string, number>;
  defaultHomeCode: string;
  defaultTripCode: string;
}

const COMMON_CATEGORIES: ExpenseItem['category'][] = ['Food', 'Transport', 'Stay', 'Shopping', 'Activities', 'Other'];

export const TravelExpensesView: React.FC<TravelExpensesViewProps> = ({
  rates,
  defaultHomeCode,
  defaultTripCode,
}) => {
  const [homeCode, setHomeCode] = useState(defaultHomeCode);
  const [tripCode, setTripCode] = useState(defaultTripCode);
  const [markupPercent, setMarkupPercent] = useState<number>(3.0);
  const [sampleAmount, setSampleAmount] = useState<number>(500);
  
  // Expenses list
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => loadTravelExpenses());
  const [itemTitle, setItemTitle] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemCategory, setItemCategory] = useState<ExpenseItem['category']>('Food');

  const [isHomePickerOpen, setIsHomePickerOpen] = useState(false);
  const [isTripPickerOpen, setIsTripPickerOpen] = useState(false);

  useEffect(() => {
    saveTravelExpenses(expenses);
  }, [expenses]);

  const homeCurr = CURRENCY_MAP[homeCode] || { code: homeCode, symbol: '$', flag: '🇺🇸' };
  const tripCurr = CURRENCY_MAP[tripCode] || { code: tripCode, symbol: '€', flag: '🇪🇺' };

  // Calculate markup comparison for sampleAmount
  const midMarketConverted = convertCurrency(sampleAmount, tripCode, homeCode, rates, 0);
  const markedUpConverted = convertCurrency(sampleAmount, tripCode, homeCode, rates, -markupPercent); // Costs more home currency
  const hiddenCost = Math.max(0, markedUpConverted - midMarketConverted);

  // Cash denomination calculator for sampleAmount
  const denominations = [100, 50, 20, 10, 5];
  const cashBreakdown = denominations.map((denom) => {
    return {
      bill: denom,
      count: Math.floor(sampleAmount / denom),
    };
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const foreignVal = parseFloat(itemAmount);
    if (!itemTitle.trim() || isNaN(foreignVal) || foreignVal <= 0) return;

    const homeVal = convertCurrency(foreignVal, tripCode, homeCode, rates, -markupPercent);

    const newExpense: ExpenseItem = {
      id: Date.now().toString(),
      title: itemTitle.trim(),
      foreignAmount: foreignVal,
      foreignCode: tripCode,
      homeCode: homeCode,
      homeAmount: homeVal,
      feePercent: markupPercent,
      category: itemCategory,
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    };

    setExpenses([newExpense, ...expenses]);
    setItemTitle('');
    setItemAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((item) => item.id !== id));
  };

  const totalForeign = expenses.reduce((sum, item) => sum + item.foreignAmount, 0);
  const totalHome = expenses.reduce((sum, item) => sum + item.homeAmount, 0);

  return (
    <div className="space-y-4">
      {/* Currency & Fee Setup Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Travel Expense & Fee Calculator</h3>
          </div>
          <span className="text-xs text-slate-400">Avoid airport & card rip-offs</span>
        </div>

        {/* Home & Travel Pair Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Your Home Currency</span>
            <button
              onClick={() => setIsHomePickerOpen(true)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{homeCurr.flag}</span>
                <span className="text-base font-bold text-white font-mono">{homeCurr.code}</span>
              </div>
              <span className="text-xs text-slate-400">Change</span>
            </button>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">Travel Destination Currency</span>
            <button
              onClick={() => setIsTripPickerOpen(true)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{tripCurr.flag}</span>
                <span className="text-base font-bold text-white font-mono">{tripCurr.code}</span>
              </div>
              <span className="text-xs text-slate-400">Change</span>
            </button>
          </div>
        </div>

        {/* Bank Markup Fee Presets */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Bank / Card Markup Fee Preset</span>
            <span className="font-mono text-emerald-400 font-bold">{markupPercent}%</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: '0% Mid-Market', rate: 0, sub: 'Wise / Revolut' },
              { label: '1.5% Low Fee', rate: 1.5, sub: 'Travel Credit Card' },
              { label: '3.0% Standard', rate: 3.0, sub: 'Regular Bank Card' },
              { label: '6.0% Kiosk', rate: 6.0, sub: 'Airport Cash Desk' },
            ].map((preset) => (
              <button
                key={preset.rate}
                onClick={() => setMarkupPercent(preset.rate)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  markupPercent === preset.rate
                    ? 'bg-emerald-500/10 border-emerald-500 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold font-mono">{preset.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{preset.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden Fee Comparison Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Fee Impact Simulator</h4>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sample Purchase:</span>
            <input
              type="number"
              value={sampleAmount}
              onChange={(e) => setSampleAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-20 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono font-bold text-white text-right text-xs"
            />
            <span className="text-slate-400 font-mono">{tripCode}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Real Fair Value (0% Fee)</span>
            <div className="text-base font-bold text-white font-mono mt-1">
              {homeCurr.symbol}{formatAmount(midMarketConverted, homeCode)}
            </div>
            <span className="text-[10px] text-emerald-400">Interbank mid-market rate</span>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Charged with {markupPercent}% Fee</span>
            <div className="text-base font-bold text-white font-mono mt-1">
              {homeCurr.symbol}{formatAmount(markedUpConverted, homeCode)}
            </div>
            <span className="text-[10px] text-slate-400">Actual cost to your card</span>
          </div>

          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/30">
            <span className="text-[11px] text-rose-300 block font-semibold">Hidden Markup Surcharge</span>
            <div className="text-base font-bold text-rose-400 font-mono mt-1">
              +{homeCurr.symbol}{formatAmount(hiddenCost, homeCode)}
            </div>
            <span className="text-[10px] text-rose-300">Lost to fees & spread</span>
          </div>
        </div>
      </div>

      {/* Add Trip Expense Log Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          Log Travel Purchase
        </h4>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="e.g. Sushi Dinner, Taxi, Museum"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-3 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
              {tripCurr.symbol}
            </span>
            <input
              type="number"
              placeholder="Amount"
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value as ExpenseItem['category'])}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {COMMON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full h-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </form>

        {/* Expenses List */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-semibold">
            <span>Trip Purchases ({expenses.length})</span>
            <div className="flex items-center gap-4">
              <span>Total: {tripCurr.symbol}{formatAmount(totalForeign, tripCode)}</span>
              <span className="text-emerald-400 font-mono font-bold">
                ≈ {homeCurr.symbol}{formatAmount(totalHome, homeCode)}
              </span>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No expenses logged yet. Add your foreign purchases above to keep track of spending.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
              {expenses.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-white font-medium flex items-center gap-2">
                      <span>{item.title}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {item.foreignAmount} {item.foreignCode} · {item.date}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-white font-mono font-bold">
                        {homeCurr.symbol}{formatAmount(item.homeAmount, homeCode)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        incl. {item.feePercent}% fee
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(item.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Currency Pickers */}
      <CurrencyPickerModal
        isOpen={isHomePickerOpen}
        onClose={() => setIsHomePickerOpen(false)}
        onSelect={(c) => setHomeCode(c.code)}
        selectedCode={homeCode}
        title="Select Home Currency"
      />

      <CurrencyPickerModal
        isOpen={isTripPickerOpen}
        onClose={() => setIsTripPickerOpen(false)}
        onSelect={(c) => setTripCode(c.code)}
        selectedCode={tripCode}
        title="Select Destination Currency"
      />
    </div>
  );
};
