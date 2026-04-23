import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Link2, Network, Radio, Search, Users, Zap } from 'lucide-react';
import { compareCommunityAlgorithmsDirect, getDatasetInfo, getOverview, getTopInfluential } from '../../api/endpoints';
import { InfluentialUser, OverviewStats } from '../../types';
import { GraphPanel } from '../graph/GraphPanel';
import { StatCard } from './StatCard';

interface CommunityComparison {
  louvain: { num_communities: number; modularity: number; execution_time: number };
  label_propagation: { num_communities: number; modularity: number; execution_time: number };
  best_algorithm: string;
  best_modularity: number;
}

export const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [topUsers, setTopUsers] = useState<InfluentialUser[]>([]);
  const [communityComparison, setCommunityComparison] = useState<CommunityComparison | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('louvain');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, topInfluential, comparison, datasetInfo] = await Promise.all([
          getOverview(),
          getTopInfluential('pagerank', 5),
          compareCommunityAlgorithmsDirect(),
          getDatasetInfo(),
        ]);
        setStats(overviewData);
        setTopUsers(topInfluential.users);
        setCommunityComparison(comparison);
        setSelectedAlgorithm(comparison.best_algorithm || 'louvain');
        const nodeList = datasetInfo.node_list || [];
        setUsers(nodeList);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAlgorithmChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAlgorithm(event.target.value);
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return [];
    return users
      .filter((u) => u.id.toLowerCase().includes(keyword) || u.name.toLowerCase().includes(keyword))
      .slice(0, 8);
  }, [users, searchQuery]);

  if (loading) {
    return <div className="p-6 text-white">Dang tai...</div>;
  }

  if (!stats) {
    return <div className="p-6 text-red-400">Khong the tai du lieu</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tong Nguoi Dung" value={stats.num_nodes} icon={<Users />} color="blue" />
        <StatCard label="Tong Ket Noi" value={stats.num_edges} icon={<Link2 />} color="green" />
        <StatCard label="Mat Do Mang" value={stats.density.toFixed(3)} icon={<Activity />} color="purple" />
        <StatCard label="Do Trung Binh" value={stats.avg_degree.toFixed(2)} icon={<Radio />} color="orange" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Nguoi Dung Co Lap" value={stats.isolated_nodes} icon={<Users />} color="red" />
        <StatCard label="Duong Kinh Mang" value={stats.diameter} icon={<Network />} color="blue" />
        <StatCard
          label="He So Gom Cum"
          value={stats.avg_clustering_coefficient.toFixed(4)}
          icon={<Zap />}
          color="green"
        />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <h3 className="text-xl font-bold text-white">Do Thi Cong Dong</h3>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Chon thuat toan</label>
            <select
              value={selectedAlgorithm}
              onChange={handleAlgorithmChange}
              className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white"
            >
              <option value="louvain">
                Louvain {communityComparison?.best_algorithm === 'louvain' && 'BEST'}
              </option>
              <option value="label_propagation">
                Label Propagation {communityComparison?.best_algorithm === 'label_propagation' && 'BEST'}
              </option>
            </select>
          </div>

          <div className="relative min-w-[280px] flex-1 max-w-[420px]">
            <label className="mb-1 block text-xs text-slate-400">Tim node theo ID/ten</label>
            <Search className="pointer-events-none absolute left-3 top-[34px] text-slate-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowSearchSuggestions(false), 120);
              }}
              placeholder="Nhap ID node..."
              className="w-full rounded border border-slate-600 bg-slate-700 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
            {showSearchSuggestions && filteredUsers.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded border border-slate-600 bg-slate-800 shadow-xl">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(u.id);
                      setSearchQuery(u.id);
                      setShowSearchSuggestions(false);
                    }}
                    className="block w-full border-b border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                  >
                    {u.id} ({u.name})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <GraphPanel
          communityAlgorithm={selectedAlgorithm}
          selectedNodeId={selectedNodeId}
          onNodeClick={(nodeId) => {
            setSelectedNodeId(nodeId);
            setSearchQuery(nodeId);
          }}
        />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-4 text-xl font-bold text-white">Top 5 Nguoi Co Anh Huong (PageRank)</h3>
        <div className="space-y-2">
          {topUsers.map((user, idx) => (
            <div key={user.user_id} className="flex items-center justify-between rounded bg-slate-700/50 p-3">
              <div>
                <p className="font-medium text-white">
                  #{idx + 1} {user.name}
                </p>
                <p className="text-sm text-slate-400">@{user.username}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-400">{user.score.toFixed(4)}</p>
                <p className="text-sm text-slate-500">{user.degree} ket noi</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
