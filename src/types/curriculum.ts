export interface KnowledgeNode {
  id: string;                    // 一意な識別子 (例: "eigenvalues-eigenvectors")
  title: string;                 // ノードタイトル
  summary: string;               // 1〜2文の要約・直感的な定義
  content: string;               // マイクロラーニング用マークダウン本文 (約300〜600文字)
  prerequisites: string[];       // 直前の前提ノードID一覧
  category: string;              // カテゴリ/分野
  level: number;                 // 階層深度 (1: 最も基礎的な概念)
  keyFormula?: string;           // コアとなるLaTeX数式 ($...$)
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface CurriculumData {
  domain: string;
  version: string;
  nodes: KnowledgeNode[];
}

export type NodeStatus = 'target' | 'mastered' | 'ready' | 'locked' | 'pruned';
