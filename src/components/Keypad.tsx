import React from 'react';
import { Delete, Equal } from 'lucide-react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onEvaluate: () => void;
}

export const Keypad: React.FC<KeypadProps> = ({
  onKeyPress,
  onClear,
  onBackspace,
  onEvaluate,
}) => {
  const keys = [
    { label: 'C', action: onClear, type: 'action', color: 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30' },
    { label: '÷', action: () => onKeyPress('/'), type: 'operator', color: 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30' },
    { label: '×', action: () => onKeyPress('*'), type: 'operator', color: 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30' },
    { label: '⌫', action: onBackspace, type: 'action', icon: <Delete className="w-5 h-5 mx-auto" />, color: 'text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-600/80' },
    
    { label: '7', action: () => onKeyPress('7'), type: 'num' },
    { label: '8', action: () => onKeyPress('8'), type: 'num' },
    { label: '9', action: () => onKeyPress('9'), type: 'num' },
    { label: '-', action: () => onKeyPress('-'), type: 'operator', color: 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30' },
    
    { label: '4', action: () => onKeyPress('4'), type: 'num' },
    { label: '5', action: () => onKeyPress('5'), type: 'num' },
    { label: '6', action: () => onKeyPress('6'), type: 'num' },
    { label: '+', action: () => onKeyPress('+'), type: 'operator', color: 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30' },
    
    { label: '1', action: () => onKeyPress('1'), type: 'num' },
    { label: '2', action: () => onKeyPress('2'), type: 'num' },
    { label: '3', action: () => onKeyPress('3'), type: 'num' },
    { label: '=', action: onEvaluate, type: 'equal', icon: <Equal className="w-5 h-5 mx-auto" />, color: 'text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 font-bold' },
    
    { label: '0', action: () => onKeyPress('0'), type: 'num', wide: true },
    { label: '.', action: () => onKeyPress('.'), type: 'num' },
  ];

  return (
    <div className="w-full grid grid-cols-4 gap-2 pt-2 pb-1 select-none">
      {keys.map((k, idx) => {
        const isNum = k.type === 'num';
        const defaultStyle = isNum
          ? 'text-white bg-slate-800/90 hover:bg-slate-700/90 active:bg-slate-600/90 font-medium'
          : k.color;

        return (
          <button
            key={idx}
            type="button"
            onClick={k.action}
            className={`min-h-[50px] sm:min-h-[56px] rounded-xl flex items-center justify-center text-lg sm:text-xl font-mono transition-transform active:scale-95 cursor-pointer shadow-sm ${
              k.wide ? 'col-span-2' : ''
            } ${defaultStyle}`}
          >
            {k.icon ? k.icon : k.label}
          </button>
        );
      })}
    </div>
  );
};
