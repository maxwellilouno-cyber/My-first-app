import React from 'react';
import { ArrowLeftRight, Eye, LineChart, Plane, Bell } from 'lucide-react';

export type TabType = 'converter' | 'watchlist' | 'trends' | 'travel' | 'alerts';

interface NavigationTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    { id: 'converter' as TabType, label: 'Convert', icon: ArrowLeftRight },
    { id: 'watchlist' as TabType, label: 'Watchlist', icon: Eye },
    { id: 'trends' as TabType, label: 'Trends', icon: LineChart },
    { id: 'travel' as TabType, label: 'Travel', icon: Plane },
    { id: 'alerts' as TabType, label: 'Alerts', icon: Bell },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 px-2 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors relative ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
              <span className="text-[10px] tracking-tight mt-1">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
