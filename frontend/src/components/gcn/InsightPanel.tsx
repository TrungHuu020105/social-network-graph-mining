import React, { useMemo } from 'react';
import { GraphNodeData } from '../../types';
import { GCNPrediction } from '../../types/gcn';

interface InsightPanelProps {
  predictions: GCNPrediction[];
  graphNodes: GraphNodeData[];
}

type CommunitySummary = {
  communityId: number;
  size: number;
  avgDegree: number;
  avgPagerank: number;
  partnerCount: number;
  partnerRatio: number;
};

const percentile = (arr: number[], p: number): number => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
};

export const InsightPanel: React.FC<InsightPanelProps> = ({ predictions, graphNodes }) => {
  const count = predictions.length;
  const class0 = predictions.filter((p) => p.predicted_label === 0).length;
  const class1 = predictions.filter((p) => p.predicted_label === 1).length;
  const avgConfidence = count > 0 ? predictions.reduce((sum, p) => sum + p.probability, 0) / count : 0;

  const communitySummaries = useMemo(() => {
    if (graphNodes.length === 0) return [] as CommunitySummary[];

    const grouped = new Map<number, GraphNodeData[]>();
    graphNodes.forEach((node) => {
      const key = Number(node.community ?? 0);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(node);
    });

    const summaries: CommunitySummary[] = [];
    grouped.forEach((nodes, communityId) => {
      const size = nodes.length;
      const avgDegree = size > 0 ? nodes.reduce((s, n) => s + Number(n.degree || 0), 0) / size : 0;
      const avgPagerank = size > 0 ? nodes.reduce((s, n) => s + Number(n.pagerank || 0), 0) / size : 0;
      const partnerCount = nodes.filter((n) => Number(n.prediction) === 1).length;
      const partnerRatio = size > 0 ? partnerCount / size : 0;

      summaries.push({
        communityId,
        size,
        avgDegree,
        avgPagerank,
        partnerCount,
        partnerRatio,
      });
    });

    return summaries.sort((a, b) => a.communityId - b.communityId);
  }, [graphNodes]);

  const thresholds = useMemo(() => {
    const sizes = communitySummaries.map((c) => c.size);
    const degrees = communitySummaries.map((c) => c.avgDegree);
    const partnerRatios = communitySummaries.map((c) => c.partnerRatio);

    return {
      largeSize: percentile(sizes, 75),
      highDegree: percentile(degrees, 70),
      lowDegree: percentile(degrees, 30),
      lowPartner: percentile(partnerRatios, 35),
    };
  }, [communitySummaries]);

  const partnerCentralityInsight = useMemo(() => {
    if (graphNodes.length === 0) return null;

    const partnerNodes = graphNodes.filter((n) => Number(n.prediction) === 1);
    const nonPartnerNodes = graphNodes.filter((n) => Number(n.prediction) === 0);
    if (partnerNodes.length === 0 || nonPartnerNodes.length === 0) return null;

    const avg = (arr: GraphNodeData[], key: 'degree' | 'pagerank') =>
      arr.reduce((s, n) => s + Number(n[key] || 0), 0) / Math.max(1, arr.length);

    const avgDegreePartner = avg(partnerNodes, 'degree');
    const avgDegreeNonPartner = avg(nonPartnerNodes, 'degree');
    const avgPagerankPartner = avg(partnerNodes, 'pagerank');
    const avgPagerankNonPartner = avg(nonPartnerNodes, 'pagerank');

    return {
      avgDegreePartner,
      avgDegreeNonPartner,
      avgPagerankPartner,
      avgPagerankNonPartner,
      partnerMoreCentral: avgDegreePartner >= avgDegreeNonPartner && avgPagerankPartner >= avgPagerankNonPartner,
    };
  }, [graphNodes]);

  const classifyCommunity = (c: CommunitySummary): string => {
    if (c.size >= thresholds.largeSize && c.avgDegree >= thresholds.highDegree) {
      return 'Nhóm kết nối cao';
    }
    if (c.avgDegree <= thresholds.lowDegree && c.partnerRatio <= thresholds.lowPartner) {
      return 'Nhóm kết nối thấp';
    }
    return 'Nhóm kết nối trung bình';
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Insight thực tế sau dự đoán</h3>

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

      <div className="mt-4 rounded-lg border border-slate-700 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-900/70 text-slate-100">
            <tr>
              <th className="px-3 py-2 font-semibold">Community</th>
              <th className="px-3 py-2 font-semibold">Số node</th>
              <th className="px-3 py-2 font-semibold">Degree TB</th>
              <th className="px-3 py-2 font-semibold">PageRank TB</th>
              <th className="px-3 py-2 font-semibold">Partner</th>
              <th className="px-3 py-2 font-semibold">Nhận diện</th>
            </tr>
          </thead>
          <tbody>
            {communitySummaries.map((c) => (
              <tr key={c.communityId} className="border-t border-slate-700 bg-slate-800/50">
                <td className="px-3 py-2 font-semibold text-slate-100">#{c.communityId}</td>
                <td className="px-3 py-2">{c.size}</td>
                <td className="px-3 py-2">{c.avgDegree.toFixed(2)}</td>
                <td className="px-3 py-2">{c.avgPagerank.toFixed(6)}</td>
                <td className="px-3 py-2">{c.partnerCount} ({(c.partnerRatio * 100).toFixed(1)}%)</td>
                <td className="px-3 py-2">{classifyCommunity(c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {partnerCentralityInsight && (
        <p className="mt-4 text-sm text-slate-200">
          Nhóm Partner có degree TB {partnerCentralityInsight.avgDegreePartner.toFixed(2)} (Non-Partner: {partnerCentralityInsight.avgDegreeNonPartner.toFixed(2)})
          và PageRank TB {partnerCentralityInsight.avgPagerankPartner.toFixed(5)} (Non-Partner: {partnerCentralityInsight.avgPagerankNonPartner.toFixed(5)}),
          {partnerCentralityInsight.partnerMoreCentral
            ? ' cho thấy Partner thường nằm ở vùng trung tâm của đồ thị.'
            : ' cho thấy vị trí Partner chưa hoàn toàn trung tâm trên tập dữ liệu hiện tại.'}
        </p>
      )}
    </section>
  );
};
