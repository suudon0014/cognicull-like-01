import { useState, useMemo, useEffect } from 'react';
import curriculumData from './data/curriculum.json';
import { CurriculumData, KnowledgeNode } from './types/curriculum';
import { calculateGraphState } from './utils/pruningEngine';
import { loadUserProgress, saveUserProgress, resetUserProgress, UserProgressData } from './utils/storage';
import { HUDHeader } from './components/HUDHeader';
import { DagTreeView } from './components/DagTreeView';
import { TopicReaderView } from './components/TopicReaderView';
import { TaxonomyView } from './components/TaxonomyView';
import { ProgressModal } from './components/ProgressModal';

const curriculum = curriculumData as CurriculumData;
const defaultTargetId = 'schwarzschild-metric'; // 質点周りのブラックホール解を初期ターゲットに設定

export function App() {
  const [progress, setProgress] = useState<UserProgressData>(() => loadUserProgress(defaultTargetId));
  const [activeView, setActiveView] = useState<'tree' | 'reader' | 'taxonomy'>('tree');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(progress.targetId || defaultTargetId);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const nodes = curriculum.nodes;
  const nodeMap = useMemo(() => new Map<string, KnowledgeNode>(nodes.map((n) => [n.id, n])), [nodes]);

  // Compute graph state and pruning dynamically
  const graphState = useMemo(() => {
    return calculateGraphState(nodes, progress.masteredIds, progress.targetId);
  }, [nodes, progress.masteredIds, progress.targetId]);

  // Save progress changes to localStorage
  useEffect(() => {
    saveUserProgress(progress);
  }, [progress]);

  // Sync dark class on root document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handlers
  const handleToggleMastered = (nodeId: string) => {
    setProgress((prev) => {
      const set = new Set(prev.masteredIds);
      if (set.has(nodeId)) {
        set.delete(nodeId);
      } else {
        set.add(nodeId);
      }
      return {
        ...prev,
        masteredIds: Array.from(set),
      };
    });
  };

  const handleSetTarget = (nodeId: string) => {
    setProgress((prev) => ({ ...prev, targetId: nodeId }));
    setSelectedNodeId(nodeId);
  };

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setActiveView('reader');
  };

  const handleSaveQuizAnswer = (nodeId: string, optionIndex: number) => {
    setProgress((prev) => ({
      ...prev,
      quizAnswers: {
        ...prev.quizAnswers,
        [nodeId]: optionIndex,
      },
    }));
  };

  const handleImportProgress = (imported: UserProgressData) => {
    setProgress(imported);
    if (imported.targetId) {
      setSelectedNodeId(imported.targetId);
    }
  };

  const handleResetProgress = () => {
    const reset = resetUserProgress(defaultTargetId);
    setProgress(reset);
    setSelectedNodeId(defaultTargetId);
  };

  const selectedNode = nodeMap.get(selectedNodeId) || nodes[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Sticky Header with Real-time HUD Load Meter */}
      <HUDHeader
        nodes={nodes}
        targetId={progress.targetId}
        activeView={activeView}
        remainingLoadPercentage={graphState.remainingLoadPercentage}
        unmasteredCount={graphState.unmasteredCountInPath}
        totalPathCount={graphState.totalNodesInPath}
        isDarkMode={isDarkMode}
        onSetTarget={handleSetTarget}
        onChangeView={setActiveView}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Body Canvas View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {activeView === 'tree' && (
          <DagTreeView
            nodes={nodes}
            nodeStatuses={graphState.nodeStatuses}
            targetId={progress.targetId}
            selectedNodeId={selectedNodeId}
            targetSubGraphIds={graphState.targetSubGraphIds}
            onSelectNode={handleSelectNode}
            onToggleMastered={handleToggleMastered}
            onSetTarget={handleSetTarget}
          />
        )}

        {activeView === 'reader' && selectedNode && (
          <TopicReaderView
            node={selectedNode}
            allNodes={nodes}
            nodeStatuses={graphState.nodeStatuses}
            isMastered={graphState.effectiveMasteredIds.has(selectedNode.id)}
            isTarget={selectedNode.id === progress.targetId}
            savedQuizAnswer={progress.quizAnswers[selectedNode.id]}
            onToggleMastered={handleToggleMastered}
            onSetTarget={handleSetTarget}
            onSelectNode={handleSelectNode}
            onSaveQuizAnswer={handleSaveQuizAnswer}
          />
        )}

        {activeView === 'taxonomy' && (
          <TaxonomyView
            nodes={nodes}
            nodeStatuses={graphState.nodeStatuses}
            targetId={progress.targetId}
            onSelectNode={handleSelectNode}
            onToggleMastered={handleToggleMastered}
            onSetTarget={handleSetTarget}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Cognicull Relativity — 概念分解＆前提ツリー刈り込み学習 Web Application</p>
      </footer>

      {/* Progress Settings Modal */}
      <ProgressModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        progress={progress}
        onImportProgress={handleImportProgress}
        onResetProgress={handleResetProgress}
      />
    </div>
  );
}

export default App;
