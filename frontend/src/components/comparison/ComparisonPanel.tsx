// components/comparison/ComparisonPanel.tsx
import React, { useState, useEffect } from 'react';
import { compareCommunityAlgorithms, compareRecommendationAlgorithms, getDatasetInfo } from '../../api/endpoints';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

export const ComparisonPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'community' | 'recommendation'>('community');
  const [communityData, setCommunityData] = useState<any>(null);
  const [recommendationData, setRecommendationData] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getDatasetInfo();
        const nodeList = Array.isArray(data.node_list) ? data.node_list : [];
        setUsers(nodeList);
        if (nodeList.length > 0) {
          setSelectedUser(nodeList[0].id);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'community') {
      loadCommunityComparison();
    } else if (activeTab === 'recommendation' && selectedUser) {
      loadRecommendationComparison();
    }
  }, [activeTab, selectedUser]);

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

  const loadRecommendationComparison = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const data = await compareRecommendationAlgorithms(selectedUser);
      setRecommendationData(data);
    } catch (error) {
      console.error('Error loading recommendation comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('community')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'community'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          So Sánh Community Detection
        </button>
        <button
          onClick={() => setActiveTab('recommendation')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'recommendation'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          So Sánh Recommendation
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'community' ? (
          // Community Comparison
          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-slate-400">Đang tải...</div>
            ) : communityData ? (
              <>
                {/* Comparison Table */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-white">Thuật Toán</th>
                        <th className="px-4 py-3 text-right text-white">Số Cộng Đồng</th>
                        <th className="px-4 py-3 text-right text-white">Modularity</th>
                        <th className="px-4 py-3 text-right text-white">Thời Gian (s)</th>
                        <th className="px-4 py-3 text-right text-white">Điểm Chất Lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {communityData.algorithms.map((algo: any, idx: number) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? 'bg-slate-700/50' : ''}
                        >
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

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Runtime Comparison */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Thời Gian Thực Thi</h3>
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

                  {/* Modularity vs Communities */}
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
          // Recommendation Comparison
          <div className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Chọn Người Dùng</label>
              <select
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full md:w-64 px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id} ({u.name})
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center text-slate-400">Đang tải...</div>
            ) : recommendationData ? (
              <>
                {/* Comparison Table */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-white">Thuật Toán</th>
                        <th className="px-4 py-3 text-right text-white">Số Gợi Ý</th>
                        <th className="px-4 py-3 text-right text-white">Điểm TB</th>
                        <th className="px-4 py-3 text-right text-white">Thời Gian (s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendationData.algorithms.map((algo: any, idx: number) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? 'bg-slate-700/50' : ''}
                        >
                          <td className="px-4 py-3 text-white font-medium">{algo.algorithm_name}</td>
                          <td className="px-4 py-3 text-right text-blue-300">{algo.num_recommendations}</td>
                          <td className="px-4 py-3 text-right text-green-300">{algo.average_score.toFixed(4)}</td>
                          <td className="px-4 py-3 text-right text-yellow-300">{algo.execution_time.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
