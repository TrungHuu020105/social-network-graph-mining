import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { evaluateMultipleAlgorithms, evaluateRecommendation } from '../../api/endpoints';

export const EvaluationPanel: React.FC = () => {
  const [evaluationType, setEvaluationType] = useState<'single' | 'multiple'>('multiple');
  const [algorithm, setAlgorithm] = useState('adamic_adar');
  const [topK, setTopK] = useState(10);
  const [hiddenRatio, setHiddenRatio] = useState(0.1);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const algorithms = [
    { value: 'adamic_adar', label: 'Adamic-Adar (AA)' },
    { value: 'resource_allocation', label: 'Resource Allocation (RA)' },
    { value: 'preferential_attachment', label: 'Preferential Attachment (PA)' },
    { value: 'gcn', label: 'GCN Link Prediction' },
  ];

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      if (evaluationType === 'single') {
        const data = await evaluateRecommendation(algorithm, topK, hiddenRatio);
        setResults([data]);
      } else {
        const data = await evaluateMultipleAlgorithms(topK, hiddenRatio);
        setResults(data.results);
      }
    } catch (error) {
      console.error('Error evaluating:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartResults = (results || []).map((result: any) => {
    const key = String(result.algorithm || '').toLowerCase();
    let short = result.algorithm_label ?? result.algorithm;
    if (key === 'adamic_adar') short = 'AA';
    else if (key === 'resource_allocation') short = 'RA';
    else if (key === 'preferential_attachment') short = 'PA';
    else if (key === 'gcn') short = 'GCN';
    return { ...result, algorithm_short: short };
  });

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-4 text-xl font-bold text-white">Cấu hình đánh giá</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Loại đánh giá</label>
            <select
              value={evaluationType}
              onChange={(e) => setEvaluationType(e.target.value as 'single' | 'multiple')}
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="single">Một thuật toán</option>
              <option value="multiple">Nhiều thuật toán</option>
            </select>
          </div>

          {evaluationType === 'single' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Thuật toán</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {algorithms.map((algo) => (
                  <option key={algo.value} value={algo.value}>
                    {algo.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-white">Top K</label>
            <input
              type="number"
              value={topK}
              onChange={(e) => setTopK(Math.max(1, parseInt(e.target.value || '1', 10)))}
              min="1"
              max="50"
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white">Tỷ lệ ẩn (%)</label>
            <input
              type="number"
              value={Math.round(hiddenRatio * 100)}
              onChange={(e) => setHiddenRatio(Math.max(1, Math.min(50, parseInt(e.target.value || '10', 10))) / 100)}
              min="1"
              max="50"
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={loading}
          className="mt-4 rounded bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-600"
        >
          {loading ? 'Đang đánh giá...' : 'Bắt đầu đánh giá'}
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-white">Thuật toán</th>
                  <th className="px-4 py-3 text-right text-white">Precision@K</th>
                  <th className="px-4 py-3 text-right text-white">Hit Rate</th>
                  <th className="px-4 py-3 text-right text-white">Số cạnh ẩn</th>
                  <th className="px-4 py-3 text-right text-white">Thời gian (s)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-700/50' : ''}>
                    <td className="px-4 py-3 font-medium text-white">{result.algorithm_label ?? result.algorithm}</td>
                    <td className="px-4 py-3 text-right text-blue-300">{result.precision_at_k.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right text-green-300">{result.hit_rate.toFixed(4)}</td>
                    <td className="px-4 py-3 text-right text-yellow-300">{result.num_edges_hidden}</td>
                    <td className="px-4 py-3 text-right text-purple-300">{result.execution_time.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-4 text-lg font-bold text-white">Precision@K</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="algorithm_short" stroke="#999" interval={0} />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Bar dataKey="precision_at_k" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-4 text-lg font-bold text-white">Hit Rate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="algorithm_short" stroke="#999" interval={0} />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Bar dataKey="hit_rate" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
