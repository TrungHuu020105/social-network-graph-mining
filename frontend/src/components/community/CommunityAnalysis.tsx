// components/community/CommunityAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { getCommunities } from '../../api/endpoints';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const CommunityAnalysis: React.FC = () => {
  const [algorithm, setAlgorithm] = useState('louvain');
  const [communityData, setCommunityData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const algorithms = [
    { value: 'louvain', label: 'Louvain' },
    { value: 'label_propagation', label: 'Label Propagation' },
    { value: 'girvan_newman', label: 'Girvan-Newman' },
  ];

  useEffect(() => {
    loadCommunities();
  }, [algorithm]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const data = await getCommunities(algorithm);
      setCommunityData(data);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = communityData?.communities.map((c: any) => ({
    name: `Community ${c.id}`,
    value: c.size,
  })) || [];

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

  return (
    <div className="p-6 space-y-6">
      {/* Algorithm Selector */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <label className="block text-white text-sm font-medium mb-4">Chọn Thuật Toán</label>
        <div className="flex flex-wrap gap-3">
          {algorithms.map(algo => (
            <button
              key={algo.value}
              onClick={() => setAlgorithm(algo.value)}
              className={`px-6 py-2 rounded font-medium transition-colors ${
                algorithm === algo.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {algo.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400">Đang tải...</div>
      ) : communityData ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-slate-400 text-sm">Số Cộng Đồng</p>
              <p className="text-3xl font-bold text-blue-400 mt-2">{communityData.num_communities}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-slate-400 text-sm">Modularity</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{communityData.modularity.toFixed(4)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
              <p className="text-slate-400 text-sm">Thời Gian (s)</p>
              <p className="text-3xl font-bold text-orange-400 mt-2">{communityData.execution_time.toFixed(4)}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Community Size Distribution */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Phân Bố Kích Thước Cộng Đồng</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Kích Thước Cộng Đồng</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Community Details Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <h3 className="text-lg font-bold text-white p-6 pb-0">Chi Tiết Cộng Đồng</h3>
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-white">ID</th>
                  <th className="px-6 py-3 text-right text-white">Kích Thước</th>
                  <th className="px-6 py-3 text-right text-white">Mật Độ</th>
                  <th className="px-6 py-3 text-left text-white">Thành Viên (Mẫu)</th>
                </tr>
              </thead>
              <tbody>
                {communityData.communities.map((community: any, idx: number) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-slate-700/50' : ''}
                  >
                    <td className="px-6 py-3 text-white font-medium">{community.id}</td>
                    <td className="px-6 py-3 text-right text-blue-300">{community.size}</td>
                    <td className="px-6 py-3 text-right text-green-300">{community.density?.toFixed(4) || 'N/A'}</td>
                    <td className="px-6 py-3 text-slate-400 text-sm">
                      {community.members.slice(0, 3).join(', ')}
                      {community.members.length > 3 ? `, +${community.members.length - 3}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
};
