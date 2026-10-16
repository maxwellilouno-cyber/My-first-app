import React, { useState, useMemo } from 'react';
import { Search, X, Check, Star } from 'lucide-react';
import { Currency } from '../types/currency';
import { CURRENCIES } from '../data/currencies';

interface CurrencyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (currency: Currency) => void;
  selectedCode: string;
  title?: string;
  excludeCode?: string;
}

const REGIONS = [
  'All',
  'Popular',
  'Americas',
  'Europe',
  'Asia-Pacific',
  'Middle East & Africa',
  'Global / Crypto',
] as const;

export const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCode,
  title = 'Select Currency',
  excludeCode,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  const filteredCurrencies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CURRENCIES.filter((c) => {
      if (excludeCode && c.code === excludeCode) return false;

      // Filter by region if not 'All'
      if (selectedRegion === 'Popular' && !c.isPopular) return false;
      if (selectedRegion !== 'All' && selectedRegion !== 'Popular' && c.region !== selectedRegion) {
        return false;
      }

      if (!q) return true;

      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
      );
    });
  }, [search, selectedRegion, excludeCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[88vh] sm:max-h-[82vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Grab Handle */}
        <div className="pt-3 pb-2 px-6 flex flex-col border-b border-slate-800">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close currency picker"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mt-3 mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, country, or currency (e.g. EUR, Yen, $)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {REGIONS.map((region) => {
              const active = selectedRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                    active
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {region === 'Popular' && <Star className="w-3 h-3 inline mr-1 -mt-0.5" />}
                  {region}
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-800/60">
          {filteredCurrencies.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No currencies match "{search}"
            </div>
          ) : (
            filteredCurrencies.map((currency) => {
              const isSelected = currency.code === selectedCode;
              return (
                <button
                  key={currency.code}
                  onClick={() => {
                    onSelect(currency);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group ${
                    isSelected
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'hover:bg-slate-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl select-none shrink-0" role="img" aria-label={currency.country}>
                      {currency.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white font-mono tracking-tight">
                          {currency.code}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {currency.symbol}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {currency.name} · <span className="text-slate-500">{currency.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    {currency.isPopular && !isSelected && (
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded">
                        Major
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
