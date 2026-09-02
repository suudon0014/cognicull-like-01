import React, { useState, useMemo } from 'react';
import { KnowledgeNode, NodeStatus } from '../types/curriculum';
import { Search, Filter, CheckCircle2, Target, BookOpen, Layers } from 'lucide-react';

interface TaxonomyViewProps {
  nodes: KnowledgeNode[];
  nodeStatuses: Map<string, NodeStatus>;
  targetId: string | null;
  onSelectNode: (nodeId: string) => void;
  onToggleMastered: (nodeId: string) => void;
  onSetTarget: (nodeId: string) => void;
}

export const TaxonomyView: React.FC<TaxonomyViewProps> = ({
  nodes,
  nodeStatuses,
  targetId,
  onSelectNode,
  onToggleMastered,
  onSetTarget,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach((n) => set.add(n.category));
    return Array.from(set);
  }, [nodes]);

  // Filtered nodes based on search, category, status
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const status = nodeStatuses.get(node.id) || 'locked';
      const isTarget = node.id === targetId;

      // Category filter
      if (selectedCategory !== 'ALL' && node.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'target' && !isTarget) return false;
        if (selectedStatus === 'mastered' && status !== 'mastered' && status !== 'pruned') return false;
        if (selectedStatus === 'ready' && status !== 'ready') return false;
        if (selectedStatus === 'locked' && status !== 'locked') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = node.title.toLowerCase().includes(q);
        const inSummary = node.summary.toLowerCase().includes(q);
        const inContent = node.content.toLowerCase().includes(q);
        const inCategory = node.category.toLowerCase().includes(q);
        if (!inTitle && !inSummary && !inContent && !inCategory) {
          return false;
        }
      }

      return true;
    });
  }, [nodes, nodeStatuses, targetId, searchQuery, selectedCategory, selectedStatus]);

  // Group nodes by Level for structured taxonomy display
  const nodesByLevel = useMemo(() => {
    const map = new Map<number, KnowledgeNode[]>();
    for (const node of filteredNodes) {
      if (!map.has(node.level)) {
        map.set(node.level, []);
      }
      map.get(node.level)!.push(node);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredNodes]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Search and Filters Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-100 text-lg">
            <Layers className="w-5 h-5 text-sky-400" />
            知識タクソノミー・概念検索
          </div>
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 font-mono">
            表示件数: {filteredNodes.length} / {nodes.length} ノード
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          {/* Keyword Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="キーワード検索（例: ローレンツ, 曲率）..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
            >
              <option value="ALL">全てのカテゴリ ({nodes.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown Filter */}
          <div className="relative flex items-center">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ALL">全てのステータス</option>
              <option value="target">🎯 ターゲット指定中</option>
              <option value="ready">★ 学習可能 (Ready)</option>
              <option value="mastered">✓ 習得済み (Mastered)</option>
              <option value="locked">🔒 前提未完了 (Locked)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Taxonomy Level-grouped Node Grid */}
      {nodesByLevel.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-base font-semibold">該当するノードが見つかりません</p>
          <p className="text-xs text-slate-500">検索キーワードやフィルター条件を変更してみてください。</p>
        </div>
      ) : (
        nodesByLevel.map(([level, levelNodes]) => (
          <div key={level} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-sky-950 text-sky-400 border border-sky-900 rounded-lg font-mono text-xs font-bold">
                階層 Level {level}
              </span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelNodes.map((node) => {
                const status = nodeStatuses.get(node.id) || 'locked';
                const isTarget = node.id === targetId;
                const isMastered = status === 'mastered' || status === 'pruned';

                let cardBorder = 'border-slate-800 hover:border-slate-700 bg-slate-900';
                if (isTarget) {
                  cardBorder = 'border-sky-500 bg-sky-950/20 shadow-lg shadow-sky-950/50';
                } else if (status === 'ready') {
                  cardBorder = 'border-teal-600/80 bg-teal-950/20 shadow-md';
                } else if (isMastered) {
                  cardBorder = 'border-emerald-800/80 bg-emerald-950/10';
                }

                return (
                  <div
                    key={node.id}
                    className={`rounded-2xl border p-5 transition flex flex-col justify-between space-y-3 ${cardBorder}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {node.category}
                        </span>
                        {isTarget ? (
                          <span className="px-2 py-0.5 rounded bg-sky-600 text-white text-[10px] font-bold flex items-center gap-1">
                            <Target className="w-3 h-3" /> ターゲット
                          </span>
                        ) : status === 'ready' ? (
                          <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700 text-[10px] font-bold">
                            ★ 学習可能
                          </span>
                        ) : isMastered ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                            ✓ 習得済み
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-800 text-[10px]">
                            🔒 ロック中
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectNode(node.id)}
                        className="font-bold text-slate-100 text-base hover:text-sky-300 cursor-pointer transition line-clamp-1"
                      >
                        {node.title}
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {node.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <button
                        onClick={() => onSelectNode(node.id)}
                        className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        学習リーダーへ
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleMastered(node.id)}
                          className={`p-1.5 rounded-lg border transition ${
                            isMastered
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-800'
                          }`}
                          title="習得トグル"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSetTarget(node.id)}
                          className={`p-1.5 rounded-lg border transition ${
                            isTarget
                              ? 'bg-sky-600 border-sky-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-sky-400 hover:border-sky-800'
                          }`}
                          title="ターゲット設定"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
