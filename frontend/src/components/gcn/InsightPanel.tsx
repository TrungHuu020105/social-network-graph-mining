import React from 'react';
import { GCNPrediction } from '../../types/gcn';

interface InsightPanelProps {
  predictions: GCNPrediction[];
}

export const InsightPanel: React.FC<InsightPanelProps> = ({ predictions }) => {
  const count = predictions.length;
  const class0 = predictions.filter((p) => p.predicted_label === 0).length;
  const class1 = predictions.filter((p) => p.predicted_label === 1).length;
  const avgConfidence =
    count > 0 ? predictions.reduce((sum, p) => sum + p.probability, 0) / count : 0;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Bảng tổng quan</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-700 p-3 text-slate-200">
          <p className="text-xs text-slate-400">Phân bố lớp 0</p>
          <p className="text-xl font-bold text-blue-300">{class0}</p>
        </div>
        <div className="rounded-lg bg-slate-700 p-3 text-slate-200">
          <p className="text-xs text-slate-400">Phân bố lớp 1</p>
          <p className="text-xl font-bold text-red-300">{class1}</p>
        </div>
        <div className="rounded-lg bg-slate-700 p-3 text-slate-200">
          <p className="text-xs text-slate-400">Độ tin cậy trung bình</p>
          <p className="text-xl font-bold text-emerald-300">{(avgConfidence * 100).toFixed(2)}%</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-300">
        GCN học thông tin từ cả đặc trưng node và cấu trúc liên kết trong mạng. Node có kết nối giống nhau và ngữ cảnh
        tương tự sẽ có embedding gần nhau, từ đó cải thiện dự đoán nhãn.
      </p>
    </section>
  );
};
