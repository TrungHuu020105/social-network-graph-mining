import React from 'react';
import { GCNTrainResponse } from '../../types/gcn';

interface TrainingPanelProps {
  training: boolean;
  trainResult: GCNTrainResponse | null;
  onTrain: () => Promise<void>;
}

export const TrainingPanel: React.FC<TrainingPanelProps> = ({ training, trainResult, onTrain }) => {
  const classMetrics = trainResult?.class_metrics ?? [];
  const classNameMap: Record<number, string> = {
    0: 'Non-Partner (0)',
    1: 'Partner (1)',
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Bảng huấn luyện</h3>
      <button
        onClick={onTrain}
        disabled={training}
        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600"
      >
        {training ? 'Đang huấn luyện...' : 'Huấn luyện GCN'}
      </button>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-700 p-3">
          <p className="text-xs text-slate-300">Độ chính xác</p>
          <p className="text-xl font-bold text-emerald-400">{trainResult ? trainResult.accuracy.toFixed(4) : '-'}</p>
        </div>
        <div className="rounded-lg bg-slate-700 p-3">
          <p className="text-xs text-slate-300">Hàm mất mát</p>
          <p className="text-xl font-bold text-amber-400">{trainResult ? trainResult.loss.toFixed(6) : '-'}</p>
        </div>
        <div className="rounded-lg bg-slate-700 p-3">
          <p className="text-xs text-slate-300">Trạng thái huấn luyện</p>
          <p className="text-xl font-bold text-cyan-400">{training ? 'Đang huấn luyện' : trainResult ? 'Đã hoàn tất' : 'Chưa bắt đầu'}</p>
        </div>
      </div>

      {classMetrics.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-700">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/70 text-slate-100">
              <tr>
                <th className="px-3 py-2 font-semibold">Nhóm kênh</th>
                <th className="px-3 py-2 font-semibold">Precision</th>
                <th className="px-3 py-2 font-semibold">Recall</th>
                <th className="px-3 py-2 font-semibold">F1-Score</th>
              </tr>
            </thead>
            <tbody>
              {classMetrics
                .slice()
                .sort((a, b) => a.label - b.label)
                .map((metric) => (
                  <tr key={metric.label} className="border-t border-slate-700 bg-slate-800/50">
                    <td className="px-3 py-3 font-semibold text-slate-100">{classNameMap[metric.label] ?? `Lớp ${metric.label}`}</td>
                    <td className="px-3 py-3">{metric.precision.toFixed(2)}</td>
                    <td className="px-3 py-3">{metric.recall.toFixed(2)}</td>
                    <td className="px-3 py-3">{metric.f1_score.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {trainResult && classMetrics.length === 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          Chưa có bảng Precision/Recall/F1 từ backend. Hãy khởi động lại backend và nhấn Huấn luyện GCN lại.
        </div>
      )}
    </section>
  );
};
