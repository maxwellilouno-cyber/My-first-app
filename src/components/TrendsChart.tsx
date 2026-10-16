import React, { useState, useMemo, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, RefreshCw } from 'lucide-react';
import { Timeframe } from '../types/currency';
import { generateHistoricalData, formatRateDisplay } from '../services/ratesService';
import { CURRENCY_MAP } from '../data/currencies';

interface TrendsChartProps {
  fromCode: string;
  toCode: string;
  rates: Record<string, number>;
  onInvertPair: () => void;
}

const TIMEFRAMES: Timeframe[] = ['7D', '1M', '3M', '1Y', '5Y'];

export const TrendsChart: React.FC<TrendsChartProps> = ({
  fromCode,
  toCode,
  rates,
  onInvertPair,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fromCurr = CURRENCY_MAP[fromCode] || { code: fromCode, name: fromCode, flag: '🌐' };
  const toCurr = CURRENCY_MAP[toCode] || { code: toCode, name: toCode, flag: '🌐' };

  const { history, stats } = useMemo(() => {
    return generateHistoricalData(fromCode, toCode, rates, timeframe);
  }, [fromCode, toCode, rates, timeframe]);

  const isPositive = stats.changePercent >= 0;
  const activePoint = hoverIndex !== null ? history[hoverIndex] : history[history.length - 1];

  // SVG Chart Dimensions & Math
  const width = 600;
  const height = 220;
  const paddingX = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const minRate = stats.low * 0.998;
  const maxRate = stats.high * 1.002;
  const range = maxRate - minRate || 0.0001;

  const points = useMemo(() => {
    return history.map((pt, idx) => {
      const x = paddingX + (idx / (history.length - 1)) * (width - paddingX * 2);
      const y = paddingTop + (1 - (pt.rate - minRate) / range) * (height - paddingTop - paddingBottom);
      return { x, y, pt, idx };
    });
  }, [history, minRate, range, width, height, paddingX, paddingTop, paddingBottom]);

  // Construct SVG Path
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((path, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      // Smooth curve with cubic beziers
      const prev = points[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${path} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = height - paddingBottom;
    return `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [linePath, points, height, paddingBottom]);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clientX / rect.width));
    const closestIdx = Math.round(ratio * (history.length - 1));
    setHoverIndex(closestIdx);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  // 52-week position indicator
  const rangePercent = Math.max(0, Math.min(100, ((stats.current - stats.low) / (stats.high - stats.low || 1)) * 100));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="currency flags">
              {fromCurr.flag} → {toCurr.flag}
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {fromCode} / {toCode} Trends
            </h3>
            <button
              onClick={onInvertPair}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
              title="Invert currency pair"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>Interbank spot price</span>
            <span>·</span>
            <span>Live market fluctuations</span>
          </div>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl self-start sm:self-auto border border-slate-700/60">
          {TIMEFRAMES.map((tf) => {
            const active = timeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  setHoverIndex(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  active
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Rate & Scrubber Callout */}
      <div className="pt-4 pb-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {formatRateDisplay(activePoint.rate)}
            <span className="text-xs font-normal text-slate-400 font-sans ml-2">
              {toCode} per 1 {fromCode}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {stats.changePercent.toFixed(2)}%
              </span>
              <span className="text-slate-400 font-mono font-normal">
                ({isPositive ? '+' : ''}
                {formatRateDisplay(stats.changeValue)})
              </span>
            </div>
            <span className="text-xs text-slate-400">past {timeframe}</span>
          </div>
        </div>

        {/* Scrubber Date Indicator */}
        <div className="text-xs text-slate-400 font-medium">
          Date: <span className="text-white font-semibold">{activePoint.date}</span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div ref={containerRef} className="relative w-full pt-2 pb-1 select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <linearGradient id="chartGradientEmerald" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="chartGradientRose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingTop}
            x2={width - paddingX}
            y2={paddingTop}
            stroke="#334155"
            strokeDasharray="4 4"
            strokeOpacity="0.5"
          />
          <line
            x1={paddingX}
            y1={(paddingTop + height - paddingBottom) / 2}
            x2={width - paddingX}
            y2={(paddingTop + height - paddingBottom) / 2}
            stroke="#334155"
            strokeDasharray="4 4"
            strokeOpacity="0.3"
          />
          <line
            x1={paddingX}
            y1={height - paddingBottom}
            x2={width - paddingX}
            y2={height - paddingBottom}
            stroke="#334155"
            strokeOpacity="0.4"
          />

          {/* Area Fill */}
          <path
            d={areaPath}
            fill={isPositive ? 'url(#chartGradientEmerald)' : 'url(#chartGradientRose)'}
          />

          {/* Smooth Line */}
          <path
            d={linePath}
            fill="none"
            stroke={isPositive ? '#10b981' : '#f43f5e'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Scrubber Vertical Line & Circle */}
          {hoverIndex !== null && points[hoverIndex] && (
            <g>
              <line
                x1={points[hoverIndex].x}
                y1={paddingTop}
                x2={points[hoverIndex].x}
                y2={height - paddingBottom}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={points[hoverIndex].x}
                cy={points[hoverIndex].y}
                r="6"
                fill="#ffffff"
                stroke={isPositive ? '#10b981' : '#f43f5e'}
                strokeWidth="3"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Quantitative Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/80">
          <div className="text-slate-400 font-medium">Period High</div>
          <div className="text-sm font-bold text-white font-mono tabular-nums mt-0.5">
            {formatRateDisplay(stats.high)}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/80">
          <div className="text-slate-400 font-medium">Period Low</div>
          <div className="text-sm font-bold text-white font-mono tabular-nums mt-0.5">
            {formatRateDisplay(stats.low)}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/80">
          <div className="text-slate-400 font-medium">Period Average</div>
          <div className="text-sm font-bold text-white font-mono tabular-nums mt-0.5">
            {formatRateDisplay(stats.average)}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/80">
          <div className="text-slate-400 font-medium">Volatility Index</div>
          <div className="text-sm font-bold text-emerald-400 font-mono tabular-nums mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {(Math.abs(stats.changePercent) / 2.5).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Range Position Bar */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span>Range Position ({timeframe})</span>
          <span className="font-mono text-white font-medium">{rangePercent.toFixed(0)}% of range</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${rangePercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>Low: {formatRateDisplay(stats.low)}</span>
          <span>High: {formatRateDisplay(stats.high)}</span>
        </div>
      </div>
    </div>
  );
};
