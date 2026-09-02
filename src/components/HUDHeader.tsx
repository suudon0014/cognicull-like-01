import React from 'react';
import { KnowledgeNode } from '../types/curriculum';
import { Network, BookOpen, Layers, Settings, Sun, Moon, Target, Activity } from 'lucide-react';

interface HUDHeaderProps {
  nodes: KnowledgeNode[];
  targetId: string | null;
  activeView: 'tree' | 'reader' | 'taxonomy';
  remainingLoadPercentage: number;
  unmasteredCount: number;
  totalPathCount: number;
  isDarkMode: boolean;
  onSetTarget: (nodeId: string) => void;
  onChangeView: (view: 'tree' | 'reader' | 'taxonomy') => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  nodes,
  targetId,
  activeView,
  remainingLoadPercentage,
  unmasteredCount,
  totalPathCount,
  isDarkMode,
  onSetTarget,
  onChangeView,
  onToggleTheme,
  onOpenSettings,
}) => {
  const currentTargetNode = nodes.find((n) => n.id === targetId);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        {/* Upper Row: Brand, Target Selector, Nav Tabs, Tools */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-400 flex items-center justify-center font-black text-white shadow-md shadow-sky-500/20">
              C
            </div>
            <div>
              <h1 className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-sky-400 to-teal-300 bg-clip-text text-transparent">
                Cognicull Relativity
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">前提知識ツリー学習 (DAG Cull Engine)</p>
            </div>
          </div>

          {/* View Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => onChangeView('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeView === 'tree'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              前提ツリー
            </button>
            <button
              onClick={() => onChangeView('reader')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeView === 'reader'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              学習リーダー
            </button>
            <button
              onClick={() => onChangeView('taxonomy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeView === 'taxonomy'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              タクソノミー
            </button>
          </div>

          {/* Target Dropdown & Settings */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Target className="w-4 h-4 text-sky-400 shrink-0" />
              <select
                value={targetId || ''}
                onChange={(e) => onSetTarget(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none max-w-[180px] md:max-w-[240px] truncate cursor-pointer"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-900 text-slate-200">
                    L{n.level}: {n.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onToggleTheme}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition"
              title="テーマ切替"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition"
              title="データ管理 & 設定"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Realtime HUD Learning Load Meter Gauge */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
            <span className="text-slate-400">ターゲット負荷 HUD:</span>
            <span className="font-bold text-slate-200">{currentTargetNode?.title || '未選択'}</span>
          </div>

          <div className="flex-1 max-w-md mx-2 flex items-center gap-3">
            <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-teal-400 via-sky-400 to-sky-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(0, 100 - remainingLoadPercentage)}%` }}
              />
            </div>
            <span className="font-mono font-bold text-sky-400 shrink-0">
              残り {unmasteredCount} / {totalPathCount} ノード ({remainingLoadPercentage}%)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
