import React from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { GCNEmbeddingPoint } from '../../types/gcn';

interface EmbeddingChartProps {
  points: GCNEmbeddingPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as GCNEmbeddingPoint;
  return (
    <div className="rounded border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100">
      <p>node_id: {point.node_id}</p>
      <p>class: {point.predicted_label}</p>
      <p>prob: {(point.probability * 100).toFixed(2)}%</p>
    </div>
  );
};

export const EmbeddingChart: React.FC<EmbeddingChartProps> = ({ points }) => {
  const class0 = points.filter((p) => p.predicted_label === 0);
  const class1 = points.filter((p) => p.predicted_label === 1);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Embedding Visualization (PCA)</h3>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="x" type="number" stroke="#94a3b8" />
            <YAxis dataKey="y" type="number" stroke="#94a3b8" />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={class0} fill="#3b82f6" />
            <Scatter data={class1} fill="#ef4444" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
