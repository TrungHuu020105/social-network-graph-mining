// components/dashboard/DashboardOverview.tsx
import React, { useEffect, useState } from 'react';
import { getOverview, getTopInfluential } from '../../api/endpoints';
import { OverviewStats, InfluentialUser } from '../../types';
import { StatCard } from './StatCard';
import { GraphPanel } from '../graph/GraphPanel';
import { UserExplorer } from '../users/UserExplorer';
import { Network, Users, Link2, Radio, Zap, Activity } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [topUsers, setTopUsers] = useState<InfluentialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overviewData = await getOverview();
        setStats(overviewData);

        const topInfluential = await getTopInfluential('pagerank', 5);
        setTopUsers(topInfluential.users);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6 text-white">Đang tải...</div>;
  }

  if (!stats) {
    return <div className="p-6 text-red-400">Không thể tải dữ liệu</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng Người Dùng"
          value={stats.num_nodes}
          icon={<Users />}
          color="blue"
        />
        <StatCard
          label="Tổng Kết Nối"
          value={stats.num_edges}
          icon={<Link2 />}
          color="green"
        />
        <StatCard
          label="Mật Độ Mạng"
          value={stats.density.toFixed(3)}
          icon={<Activity />}
          color="purple"
        />
        <StatCard
          label="Độ Trung Bình"
          value={stats.avg_degree.toFixed(2)}
          icon={<Radio />}
          color="orange"
        />
      </div>

      {/* More Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Người Dùng Cô Lập"
          value={stats.isolated_nodes}
          icon={<Users />}
          color="red"
        />
        <StatCard
          label="Đường Kính Mạng"
          value={stats.diameter}
          icon={<Network />}
          color="blue"
        />
        <StatCard
          label="Hệ Số Gom Cụm"
          value={stats.avg_clustering_coefficient.toFixed(4)}
          icon={<Zap />}
          color="green"
        />
      </div>

      {/* Graph */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Đồ Thị Mạng Xã Hội (Click node để xem chi tiết)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <GraphPanel 
              communityAlgorithm="louvain"
              onNodeClick={(nodeId) => setSelectedUserId(nodeId)}
            />
          </div>
          
          {/* User Detail Panel */}
          {selectedUserId && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-fit">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-white">Chi Tiết Người Dùng</h4>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="text-slate-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
              <UserExplorer initialUserId={selectedUserId} />
            </div>
          )}
        </div>
      </div>

      {/* Top Influential Users */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Top 5 Người Có Ảnh Hưởng (PageRank)</h3>
        <div className="space-y-2">
          {topUsers.map((user, idx) => (
            <div key={user.user_id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
              <div>
                <p className="text-white font-medium">#{idx + 1} {user.name}</p>
                <p className="text-slate-400 text-sm">@{user.username}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-400 font-bold">{user.score.toFixed(4)}</p>
                <p className="text-slate-500 text-sm">{user.degree} kết nối</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
