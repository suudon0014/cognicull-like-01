import React, { useState, useMemo } from 'react';
import { KnowledgeNode, NodeStatus } from '../types/curriculum';
import { MathFormula } from './MathFormula';
import { CheckCircle2, Circle, ArrowLeft, HelpCircle, Check, X, Target, Award, BookOpen } from 'lucide-react';

interface TopicReaderViewProps {
  node: KnowledgeNode;
  allNodes: KnowledgeNode[];
  nodeStatuses: Map<string, NodeStatus>;
  isMastered: boolean;
  isTarget: boolean;
  savedQuizAnswer: number | undefined;
  onToggleMastered: (nodeId: string) => void;
  onSetTarget: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onSaveQuizAnswer: (nodeId: string, optionIndex: number) => void;
}

export const TopicReaderView: React.FC<TopicReaderViewProps> = ({
  node,
  allNodes,
  nodeStatuses,
  isMastered,
  isTarget,
  savedQuizAnswer,
  onToggleMastered,
  onSetTarget,
  onSelectNode,
  onSaveQuizAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(
    savedQuizAnswer !== undefined ? savedQuizAnswer : null
  );
  const [showExplanation, setShowExplanation] = useState<boolean>(savedQuizAnswer !== undefined);

  React.useEffect(() => {
    setSelectedOption(savedQuizAnswer !== undefined ? savedQuizAnswer : null);
    setShowExplanation(savedQuizAnswer !== undefined);
  }, [node.id, savedQuizAnswer]);

  const nodeMap = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes]);

  const prerequisitesNodes = useMemo(() => {
    return node.prerequisites.map((pId) => nodeMap.get(pId)).filter(Boolean) as KnowledgeNode[];
  }, [node.prerequisites, nodeMap]);

  const handleSelectOption = (idx: number) => {
    setSelectedOption(idx);
    setShowExplanation(true);
    onSaveQuizAnswer(node.id, idx);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-sky-950 text-sky-400 border border-sky-800 rounded-full text-xs font-bold uppercase tracking-wider">
              Level {node.level} • {node.category}
            </span>
            {isTarget && (
              <span className="px-3 py-1 bg-sky-600 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                <Target className="w-3.5 h-3.5" />
                現在のターゲット
              </span>
            )}
            {isMastered && (
              <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                習得済み
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isTarget && (
              <button
                onClick={() => onSetTarget(node.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Target className="w-4 h-4 text-sky-400" />
                ターゲットに指定
              </button>
            )}
            <button
              onClick={() => onToggleMastered(node.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-md ${
                isMastered
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isMastered ? '習得完了 (解体済み)' : '理解した (ツリーを刈り込む)'}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 mb-2">{node.title}</h2>
          <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            {node.summary}
          </p>
        </div>
      </div>

      {/* Main Content Grid: Micro-Learning Text + Formula & Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Markdown & Key Formula (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <BookOpen className="w-4 h-4" />
              マイクロ解説
            </div>
            <div className="text-slate-200 text-sm md:text-base leading-relaxed space-y-3 font-normal">
              {node.content}
            </div>

            {node.keyFormula && (
              <div className="pt-4 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  コア数式 (Key Formula)
                </span>
                <div className="bg-slate-950 p-4 rounded-xl border border-sky-900/50 flex justify-center items-center shadow-inner">
                  <MathFormula formula={node.keyFormula} displayMode={true} />
                </div>
              </div>
            )}
          </div>

          {/* Prerequisites Cards */}
          {prerequisitesNodes.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 text-slate-400" />
                直前の前提知識 ({prerequisitesNodes.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prerequisitesNodes.map((pNode) => {
                  const pStatus = nodeStatuses.get(pNode.id) || 'locked';
                  return (
                    <button
                      key={pNode.id}
                      onClick={() => onSelectNode(pNode.id)}
                      className="text-left bg-slate-950 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-slate-400">L{pNode.level}</span>
                        {pStatus === 'mastered' || pStatus === 'pruned' ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> 習得
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold text-[10px]">未習得</span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-200 group-hover:text-sky-300 text-sm line-clamp-1">
                        {pNode.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quiz Check Card (1 col) */}
        <div className="space-y-6">
          {node.quiz && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  セルフチェック クイズ
                </span>
                {selectedOption !== null && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    回答済み
                  </span>
                )}
              </div>

              <p className="text-slate-100 text-sm font-medium leading-relaxed">{node.quiz.question}</p>

              <div className="space-y-2">
                {node.quiz.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === node.quiz!.correctIndex;

                  let btnStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60';
                  if (selectedOption !== null) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-600 text-emerald-200 font-semibold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-950/80 border-rose-600 text-rose-200';
                    } else {
                      btnStyle = 'bg-slate-950 border-slate-900 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={selectedOption !== null}
                      className={`w-full text-left p-3 rounded-xl border text-xs md:text-sm transition flex items-start gap-2.5 ${btnStyle}`}
                    >
                      <span className="mt-0.5">
                        {selectedOption !== null ? (
                          isCorrect ? (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isSelected ? (
                            <X className="w-4 h-4 text-rose-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                          )
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </span>
                      <span className="flex-1 leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 animate-fadeIn ${
                    selectedOption === node.quiz.correctIndex
                      ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
                      : 'bg-amber-950/50 border-amber-800/80 text-amber-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1">
                    {selectedOption === node.quiz.correctIndex ? (
                      <>
                        <Award className="w-4 h-4 text-emerald-400" /> 正解です！
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-4 h-4 text-amber-400" /> 解説
                      </>
                    )}
                  </div>
                  <p className="text-slate-300">{node.quiz.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
