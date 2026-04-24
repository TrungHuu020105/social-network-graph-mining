import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getCommunities } from '../../api/endpoints';

export const CommunityAnalysis: React.FC = () => {
  const [algorithm, setAlgorithm] = useState('louvain');
  const [communityData, setCommunityData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const algorithms = [
    { value: 'louvain', label: 'Louvain' },
    { value: 'label_propagation', label: 'Label Propagation' },
  ];

  useEffect(() => {
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
    loadCommunities();
  }, [algorithm]);

  const chartData =
    communityData?.communities.map((c: any) => ({
      name: `Cộng đồng ${c.id}`,
      value: c.size,
    })) || [];

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <label className="mb-4 block text-sm font-medium text-white">Chọn thuật toán</label>
        <div className="flex flex-wrap gap-3">
          {algorithms.map((algo) => (
            <button
              key={algo.value}
              onClick={() => setAlgorithm(algo.value)}
              className={`rounded px-6 py-2 font-medium transition-colors ${
                algorithm === algo.value ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center">
              <p className="text-sm text-slate-400">Số cộng đồng</p>
              <p className="mt-2 text-3xl font-bold text-blue-400">{communityData.num_communities}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center">
              <p className="text-sm text-slate-400">Modularity</p>
              <p className="mt-2 text-3xl font-bold text-green-400">{communityData.modularity.toFixed(4)}</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-center">
              <p className="text-sm text-slate-400">Thời gian (s)</p>
              <p className="mt-2 text-3xl font-bold text-orange-400">{communityData.execution_time.toFixed(4)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-4 text-lg font-bold text-white">Phân bố kích thước cộng đồng</h3>
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
                    {chartData.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-4 text-lg font-bold text-white">Kích thước cộng đồng</h3>
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

          <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
            <h3 className="p-6 pb-0 text-lg font-bold text-white">Chi tiết cộng đồng</h3>
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-white">ID</th>
                  <th className="px-6 py-3 text-right text-white">Kích thước</th>
                  <th className="px-6 py-3 text-right text-white">Mật độ</th>
                  <th className="px-6 py-3 text-left text-white">Thành viên (mẫu)</th>
                </tr>
              </thead>
              <tbody>
                {communityData.communities.map((community: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-700/50' : ''}>
                    <td className="px-6 py-3 font-medium text-white">{community.id}</td>
                    <td className="px-6 py-3 text-right text-blue-300">{community.size}</td>
                    <td className="px-6 py-3 text-right text-green-300">{community.density?.toFixed(4) || 'N/A'}</td>
                    <td className="px-6 py-3 text-sm text-slate-400">
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
