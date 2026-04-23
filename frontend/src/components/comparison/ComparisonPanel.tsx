import React, { useEffect, useState } from 'react';
import { compareCommunityAlgorithms } from '../../api/endpoints';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EvaluationPanel } from '../evaluation/EvaluationPanel';

export const ComparisonPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'community' | 'recommendation'>('community');
  const [communityData, setCommunityData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'community') {
      loadCommunityComparison();
    }
  }, [activeTab]);

  const loadCommunityComparison = async () => {
    setLoading(true);
    try {
      const data = await compareCommunityAlgorithms();
      setCommunityData(data);
    } catch (error) {
      console.error('Error loading community comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('community')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'community'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          So Sanh Community Detection
        </button>
        <button
          onClick={() => setActiveTab('recommendation')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'recommendation'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          So Sanh Recommendation
        </button>
      </div>

      <div>
        {activeTab === 'community' ? (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-slate-400">Dang tai...</div>
            ) : communityData ? (
              <>
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-white">Thuat Toan</th>
                        <th className="px-4 py-3 text-right text-white">So Cong Dong</th>
                        <th className="px-4 py-3 text-right text-white">Modularity</th>
                        <th className="px-4 py-3 text-right text-white">Thoi Gian (s)</th>
                        <th className="px-4 py-3 text-right text-white">Diem Chat Luong</th>
                      </tr>
                    </thead>
                    <tbody>
                      {communityData.algorithms.map((algo: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-700/50' : ''}>
                          <td className="px-4 py-3 text-white font-medium">{algo.algorithm_name}</td>
                          <td className="px-4 py-3 text-right text-blue-300">{algo.num_communities}</td>
                          <td className="px-4 py-3 text-right text-green-300">{algo.modularity.toFixed(4)}</td>
                          <td className="px-4 py-3 text-right text-yellow-300">{algo.execution_time.toFixed(4)}</td>
                          <td className="px-4 py-3 text-right text-purple-300">{algo.quality_score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Thoi Gian Thuc Thi</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={communityData.algorithms}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="algorithm_name" stroke="#999" />
                        <YAxis stroke="#999" />
                        <Tooltip />
                        <Bar dataKey="execution_time" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Modularity</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={communityData.algorithms}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="algorithm_name" stroke="#999" />
                        <YAxis stroke="#999" />
                        <Tooltip />
                        <Bar dataKey="modularity" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <EvaluationPanel />
        )}
      </div>
    </div>
  );
};
