import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { GCNPrediction } from '../../types/gcn';

interface PredictionPanelProps {
  nodeId: string;
  predicting: boolean;
  result: GCNPrediction | null;
  nodeOptions: Array<{ id: string; name?: string }>;
  onNodeIdChange: (value: string) => void;
  onPredict: () => Promise<void>;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  nodeId,
  predicting,
  result,
  nodeOptions,
  onNodeIdChange,
  onPredict,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredNodeOptions = useMemo(() => {
    const keyword = nodeId.trim().toLowerCase();
    if (!keyword) return nodeOptions.slice(0, 10);

    return nodeOptions
      .filter((node) => {
        const id = node.id.toLowerCase();
        const name = (node.name ?? '').toLowerCase();
        return id.includes(keyword) || name.includes(keyword);
      })
      .slice(0, 10);
  }, [nodeId, nodeOptions]);

  const predictionExplanation = (() => {
    if (!result) return '';

    const classLabel = result.predicted_label === 1 ? 'lớp Partner (1)' : 'lớp Non-Partner (0)';
    const probabilityPct = (result.probability * 100).toFixed(2);
    const confidenceText =
      result.probability >= 0.85
        ? 'độ tin cậy cao'
        : result.probability >= 0.65
          ? 'độ tin cậy trung bình'
          : 'độ tin cậy thấp, cần kiểm tra thêm';

    return `Mô hình xếp node ${result.node_id} vào ${classLabel} với xác suất ${probabilityPct}% (${confidenceText}). Dự đoán này đến từ việc kết hợp thông tin đặc trưng node và cấu trúc liên kết trong đồ thị.`;
  })();

  const badgeColor =
    result?.predicted_label === 1
      ? 'bg-red-600/20 text-red-300 border-red-500/40'
      : 'bg-blue-600/20 text-blue-300 border-blue-500/40';

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Bảng dự đoán</h3>
      <div className="relative flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-500" size={18} />
          <input
            value={nodeId}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              onNodeIdChange(e.target.value);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setShowSuggestions(false), 120);
            }}
            placeholder="Nhập node_id"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 py-2 pl-10 pr-3 text-white outline-none focus:border-blue-500"
          />
          {showSuggestions && (
            <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-600 bg-slate-800 shadow-lg">
              {filteredNodeOptions.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onNodeIdChange(node.id);
                    setShowSuggestions(false);
                  }}
                  className="block w-full border-b border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                >
                  {node.id} ({node.name ?? `Người dùng ${node.id}`})
                </button>
              ))}
              {filteredNodeOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-400">Không tìm thấy node phù hợp</div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onPredict}
          disabled={predicting || !nodeId}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {predicting ? 'Đang dự đoán...' : 'Dự đoán'}
        </button>
      </div>

      {result && (
        <div className="mt-4 space-y-2 rounded-lg bg-slate-700 p-3 text-sm text-slate-200">
          <p>
            <span className="text-slate-400">Mã node:</span> {result.node_id}
          </p>
          <p>
            <span className="text-slate-400">Nhãn dự đoán:</span>{' '}
            <span className={`rounded border px-2 py-1 text-xs font-semibold ${badgeColor}`}>{result.predicted_label}</span>
          </p>
          <p>
            <span className="text-slate-400">Xác suất:</span> {(result.probability * 100).toFixed(2)}%
          </p>
          <div className="mt-2 rounded-md border border-slate-600 bg-slate-800/60 p-2">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-300">Giải thích</div>
            <p className="text-xs leading-relaxed text-slate-300">{predictionExplanation}</p>
          </div>
        </div>
      )}
    </section>
  );
};
