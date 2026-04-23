import React from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { GCNEmbeddingPoint } from '../../types/gcn';

interface EmbeddingChartProps {
  points: GCNEmbeddingPoint[];
}

type PlotPoint = GCNEmbeddingPoint & {
  x_plot: number;
  y_plot: number;
};

const stableHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1000003;
  }
  return hash;
};

const jitterFromNodeId = (nodeId: string, scale: number): { dx: number; dy: number } => {
  const h1 = stableHash(`${nodeId}:x`);
  const h2 = stableHash(`${nodeId}:y`);
  const dx = ((h1 % 1000) / 1000 - 0.5) * scale;
  const dy = ((h2 % 1000) / 1000 - 0.5) * scale;
  return { dx, dy };
};

const spreadDenseCluster = (arr: GCNEmbeddingPoint[], binSize: number, spreadStep: number): PlotPoint[] => {
  const bins = new Map<string, GCNEmbeddingPoint[]>();

  arr.forEach((p) => {
    const bx = Math.round(p.x / binSize);
    const by = Math.round(p.y / binSize);
    const key = `${bx}:${by}`;
    if (!bins.has(key)) bins.set(key, []);
    bins.get(key)!.push(p);
  });

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const result: PlotPoint[] = [];

  bins.forEach((group) => {
    group
      .slice()
      .sort((a, b) => stableHash(String(a.node_id)) - stableHash(String(b.node_id)))
      .forEach((p, idx) => {
        const jitter = jitterFromNodeId(String(p.node_id), spreadStep * 0.22);
        const radius = Math.sqrt(idx) * spreadStep;
        const angle = idx * goldenAngle;
        result.push({
          ...p,
          x_plot: p.x + radius * Math.cos(angle) + jitter.dx,
          y_plot: p.y + radius * Math.sin(angle) + jitter.dy,
        });
      });
  });

  return result;
};

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
  const allClass0 = points.filter((p) => p.predicted_label === 0);
  const allClass1 = points.filter((p) => p.predicted_label === 1);

  const class0: PlotPoint[] = spreadDenseCluster(allClass0, 0.2, 0.065);
  const class1: PlotPoint[] = spreadDenseCluster(allClass1, 0.2, 0.06);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Embedding Visualization (PCA)</h3>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="x_plot" type="number" stroke="#94a3b8" />
            <YAxis dataKey="y_plot" type="number" stroke="#94a3b8" />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={class0} fill="#3b82f6" fillOpacity={0.58} shape="circle" />
            <Scatter data={class1} fill="#ef4444" fillOpacity={0.9} shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
