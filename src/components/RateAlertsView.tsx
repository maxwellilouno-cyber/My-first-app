import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Plus, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CURRENCY_MAP } from '../data/currencies';
import { getExchangeRate, formatRateDisplay, loadRateAlerts, saveRateAlerts } from '../services/ratesService';
import { RateAlert } from '../types/currency';
import { CurrencyPickerModal } from './CurrencyPickerModal';

interface RateAlertsViewProps {
  rates: Record<string, number>;
  onTriggerNotify?: (msg: string) => void;
}

export const RateAlertsView: React.FC<RateAlertsViewProps> = ({
  rates,
  onTriggerNotify,
}) => {
  const [alerts, setAlerts] = useState<RateAlert[]>(() => loadRateAlerts());
  const [baseCode, setBaseCode] = useState('USD');
  const [targetCode, setTargetCode] = useState('EUR');
  const [targetRateInput, setTargetRateInput] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const [isBasePickerOpen, setIsBasePickerOpen] = useState(false);
  const [isTargetPickerOpen, setIsTargetPickerOpen] = useState(false);

  useEffect(() => {
    saveRateAlerts(alerts);
  }, [alerts]);

  const currentRate = getExchangeRate(baseCode, targetCode, rates);
  const baseCurr = CURRENCY_MAP[baseCode] || { code: baseCode, flag: '🌐' };
  const targetCurr = CURRENCY_MAP[targetCode] || { code: targetCode, flag: '🌐' };

  // Set default input value on currency change
  useEffect(() => {
    if (!targetRateInput) {
      setTargetRateInput((currentRate * 1.02).toFixed(4));
    }
  }, [currentRate, targetRateInput]);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRate = parseFloat(targetRateInput);
    if (isNaN(targetRate) || targetRate <= 0) return;

    const newAlert: RateAlert = {
      id: Date.now().toString(),
      baseCode,
      targetCode,
      targetRate,
      condition,
      createdAt: Date.now(),
      triggered: condition === 'above' ? currentRate >= targetRate : currentRate <= targetRate,
    };

    setAlerts([newAlert, ...alerts]);
    if (onTriggerNotify) {
      onTriggerNotify(`Rate alert created for ${baseCode}/${targetCode} at ${formatRateDisplay(targetRate)}`);
    }
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Alert Creator Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Create Rate Alert</h3>
        </div>

        {/* Currency Pair Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setIsBasePickerOpen(true)}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex items-center justify-between text-left"
          >
            <div>
              <span className="text-[11px] text-slate-400 block">From Currency</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl">{baseCurr.flag}</span>
                <span className="text-base font-bold text-white font-mono">{baseCode}</span>
              </div>
            </div>
            <span className="text-xs text-slate-400">Change</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTargetPickerOpen(true)}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex items-center justify-between text-left"
          >
            <div>
              <span className="text-[11px] text-slate-400 block">To Currency</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl">{targetCurr.flag}</span>
                <span className="text-base font-bold text-white font-mono">{targetCode}</span>
              </div>
            </div>
            <span className="text-xs text-slate-400">Change</span>
          </button>
        </div>

        {/* Current Rate Benchmark */}
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 mb-4 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Spot Rate:</span>
          <span className="font-mono font-bold text-white">
            1 {baseCode} = {formatRateDisplay(currentRate)} {targetCode}
          </span>
        </div>

        <form onSubmit={handleCreateAlert} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Condition</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCondition('above')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                    condition === 'above'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Rises Above (≥)
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('below')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                    condition === 'below'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Drops Below (≤)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target Exchange Rate</label>
              <input
                type="number"
                step="any"
                value={targetRateInput}
                onChange={(e) => setTargetRateInput(e.target.value)}
                placeholder={formatRateDisplay(currentRate * 1.02)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Set Rate Alert
          </button>
        </form>
      </div>

      {/* Existing Alerts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-emerald-400" />
            Active Target Watches ({alerts.length})
          </span>
        </h4>

        {alerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No active alerts configured. Set an alert above to get notified when exchange rates reach your target.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const liveRate = getExchangeRate(alert.baseCode, alert.targetCode, rates);
              const isTriggered = alert.condition === 'above' ? liveRate >= alert.targetRate : liveRate <= alert.targetRate;
              const diffPercent = ((liveRate - alert.targetRate) / alert.targetRate) * 100;

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    isTriggered
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-slate-800/40 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">
                        {alert.baseCode} → {alert.targetCode}
                      </span>
                      <span className="text-xs text-slate-400">
                        {alert.condition === 'above' ? '≥' : '≤'} {formatRateDisplay(alert.targetRate)}
                      </span>
                      {isTriggered && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Target Reached
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Live: {formatRateDisplay(liveRate)}</span>
                      <span>·</span>
                      <span className={Math.abs(diffPercent) < 1 ? 'text-amber-400' : 'text-slate-400'}>
                        {Math.abs(diffPercent).toFixed(2)}% away
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pickers */}
      <CurrencyPickerModal
        isOpen={isBasePickerOpen}
        onClose={() => setIsBasePickerOpen(false)}
        onSelect={(c) => setBaseCode(c.code)}
        selectedCode={baseCode}
        title="Select Base Currency"
      />

      <CurrencyPickerModal
        isOpen={isTargetPickerOpen}
        onClose={() => setIsTargetPickerOpen(false)}
        onSelect={(c) => setTargetCode(c.code)}
        selectedCode={targetCode}
        title="Select Target Currency"
      />
    </div>
  );
};
