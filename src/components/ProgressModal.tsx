import React, { useRef, useState } from 'react';
import { UserProgressData, exportProgressToJson, validateAndParseImportJson } from '../utils/storage';
import { X, Download, Upload, RotateCcw, AlertTriangle, Check } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgressData;
  onImportProgress: (imported: UserProgressData) => void;
  onResetProgress: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  onClose,
  progress,
  onImportProgress,
  onResetProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string }>({});

  if (!isOpen) return null;

  const handleExport = () => {
    exportProgressToJson(progress);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = validateAndParseImportJson(text);
      if (parsed) {
        onImportProgress(parsed);
        setImportStatus({ success: true, message: '進捗データを正常にインポートしました！' });
      } else {
        setImportStatus({ success: false, message: 'JSONフォーマットが正しくありません。' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="font-extrabold text-slate-100 text-lg">学習データ管理 & インポート / エクスポート</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Export */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-sky-400" />
              進捗バックアップ (JSON)
            </h4>
            <p className="text-slate-400 leading-relaxed">
              現在の習得状況やターゲット選択状態をJSON形式のファイルとしてダウンロード保存します。
            </p>
            <button
              onClick={handleExport}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
            >
              エクスポート実行
            </button>
          </div>

          {/* Import */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" />
              進捗の復元 (JSONインポート)
            </h4>
            <p className="text-slate-400 leading-relaxed">
              過去に保存したJSONファイルを選択して進捗状況を復元します。
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg transition"
            >
              JSONファイルを選択...
            </button>

            {importStatus.message && (
              <div
                className={`p-2.5 rounded-lg flex items-center gap-2 font-medium ${
                  importStatus.success
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950 border border-rose-800 text-rose-300'
                }`}
              >
                {importStatus.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          {/* Reset */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              進捗リセット
            </h4>
            <p className="text-slate-400 leading-relaxed">
              すべての習得フラグおよびクイズ回答履歴を初期化します。
            </p>
            <button
              onClick={() => {
                if (window.confirm('学習進捗をすべてリセットしてもよろしいですか？')) {
                  onResetProgress();
                  onClose();
                }
              }}
              className="w-full py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold rounded-lg transition"
            >
              全進捗をリセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
