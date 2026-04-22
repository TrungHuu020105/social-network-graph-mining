// components/dashboard/DashboardOverview.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { getOverview, getTopInfluential, compareCommunityAlgorithmsDirect } from '../../api/endpoints';
import { OverviewStats, InfluentialUser } from '../../types';
import { StatCard } from './StatCard';
import { GraphPanel } from '../graph/GraphPanel';
import { UserExplorer } from '../users/UserExplorer';
import { Network, Users, Link2, Radio, Zap, Activity, TrendingUp, X } from 'lucide-react';

interface CommunityComparison {
  louvain: { num_communities: number; modularity: number; execution_time: number };
  label_propagation: { num_communities: number; modularity: number; execution_time: number };
  girvan_newman: { num_communities: number; modularity: number; execution_time: number };
  best_algorithm: string;
  best_modularity: number;
}

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [topUsers, setTopUsers] = useState<InfluentialUser[]>([]);
  const [communityComparison, setCommunityComparison] = useState<CommunityComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('louvain');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overviewData = await getOverview();
        setStats(overviewData);

        const topInfluential = await getTopInfluential('pagerank', 5);
        setTopUsers(topInfluential.users);

        const comparison = await compareCommunityAlgorithmsDirect();
        setCommunityComparison(comparison);
        // Set initial algorithm to best one
        setSelectedAlgorithm(comparison.best_algorithm || 'louvain');
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedUserId(nodeId);
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

      {/* Graph Section with Controls */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Đồ Thị Mạng Xã Hội (Click node để xem chi tiết)</h3>
          <div className="flex items-center gap-3">
            {/* Select Algorithm Dropdown */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-400 mb-1">Chọn Thuật Toán</label>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 hover:border-slate-500 text-sm font-medium"
              >
                <option value="louvain">
                  Louvain {communityComparison?.best_algorithm === 'louvain' && '⭐ BEST'}
                </option>
                <option value="label_propagation">
                  Label Propagation {communityComparison?.best_algorithm === 'label_propagation' && '⭐ BEST'}
                </option>
                <option value="girvan_newman">
                  Girvan-Newman {communityComparison?.best_algorithm === 'girvan_newman' && '⭐ BEST'}
                </option>
              </select>
            </div>

            {/* Compare Button */}
            <button
              onClick={() => setShowComparisonModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded border border-blue-500 font-medium text-sm flex items-center gap-2 h-fit"
            >
              <TrendingUp className="w-4 h-4" />
              So Sánh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <GraphPanel 
              communityAlgorithm={selectedAlgorithm}
              onNodeClick={handleNodeClick}
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

      {/* Community Algorithm Comparison Modal */}
      {showComparisonModal && communityComparison && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-white">So Sánh Thuật Toán Phát Hiện Cộng Đồng</h2>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                <X />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Best Badge */}
              <div className="bg-green-500/20 border border-green-500 px-4 py-3 rounded text-green-400 font-semibold flex items-center gap-2">
                <span>✓ Thuật Toán Tốt Nhất:</span>
                <span className="text-lg">{communityComparison.best_algorithm.replace('_', ' ').toUpperCase()}</span>
                <span className="ml-auto text-sm">Modularity: {communityComparison.best_modularity.toFixed(4)}</span>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Louvain */}
                <div className={`p-5 rounded-lg border-2 transition-all ${communityComparison.best_algorithm === 'louvain' ? 'bg-green-500/10 border-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-700/50 border-slate-600'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white font-bold text-lg">Louvain</p>
                    {communityComparison.best_algorithm === 'louvain' && (
                      <span className="bg-green-500 text-black px-2 py-1 rounded text-xs font-bold">BEST</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Số Cộng Đồng:</span>
                      <span className="text-white font-bold text-lg">{communityComparison.louvain.num_communities}</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300 text-sm">Modularity:</span>
                        <span className="text-blue-400 font-bold">{communityComparison.louvain.modularity.toFixed(4)}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${communityComparison.louvain.modularity * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Thời Gian:</span>
                      <span className="text-slate-400 font-mono">{communityComparison.louvain.execution_time.toFixed(3)}s</span>
                    </div>
                  </div>
                </div>

                {/* Label Propagation */}
                <div className={`p-5 rounded-lg border-2 transition-all ${communityComparison.best_algorithm === 'label_propagation' ? 'bg-green-500/10 border-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-700/50 border-slate-600'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white font-bold text-lg">Label Propagation</p>
                    {communityComparison.best_algorithm === 'label_propagation' && (
                      <span className="bg-green-500 text-black px-2 py-1 rounded text-xs font-bold">BEST</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Số Cộng Đồng:</span>
                      <span className="text-white font-bold text-lg">{communityComparison.label_propagation.num_communities}</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300 text-sm">Modularity:</span>
                        <span className="text-blue-400 font-bold">{communityComparison.label_propagation.modularity.toFixed(4)}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${communityComparison.label_propagation.modularity * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Thời Gian:</span>
                      <span className="text-slate-400 font-mono">{communityComparison.label_propagation.execution_time.toFixed(3)}s</span>
                    </div>
                  </div>
                </div>

                {/* Girvan-Newman */}
                <div className={`p-5 rounded-lg border-2 transition-all ${communityComparison.best_algorithm === 'girvan_newman' ? 'bg-green-500/10 border-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-700/50 border-slate-600'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white font-bold text-lg">Girvan-Newman</p>
                    {communityComparison.best_algorithm === 'girvan_newman' && (
                      <span className="bg-green-500 text-black px-2 py-1 rounded text-xs font-bold">BEST</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Số Cộng Đồng:</span>
                      <span className="text-white font-bold text-lg">{communityComparison.girvan_newman.num_communities}</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-300 text-sm">Modularity:</span>
                        <span className="text-blue-400 font-bold">{communityComparison.girvan_newman.modularity.toFixed(4)}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${communityComparison.girvan_newman.modularity * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Thời Gian:</span>
                      <span className="text-slate-400 font-mono">{communityComparison.girvan_newman.execution_time.toFixed(3)}s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500 rounded p-4">
                <p className="text-blue-300 text-sm">
                  <strong>💡 Ghi chú:</strong> Độ đo <strong>Modularity</strong> (0-1) đo lường chất lượng phân chia cộng đồng. Giá trị càng cao, phân chia càng tốt. 
                  Thuật toán được chọn tự động sẽ dùng Modularity cao nhất để hiển thị trên biểu đồ.
                </p>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded border border-slate-600 font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
