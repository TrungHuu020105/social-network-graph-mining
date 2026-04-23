import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { explainRecommendation, getDatasetInfo, getRecommendations } from '../../api/endpoints';
import { ExplanationData, Recommendation } from '../../types';
import { RecommendationGraph } from './RecommendationGraph';

export const RecommendationExplorer: React.FC = () => {
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState('adamic_adar');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);

  const algorithms = [{ value: 'adamic_adar', label: 'Adamic-Adar (Baseline)' }];

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getDatasetInfo();
        const nodeList = data.node_list || [];
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
    if (!selectedUser) return;
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const data = await getRecommendations(selectedUser, algorithm, 10);
        setRecommendations(data.recommendations);
        if (data.recommendations.length > 0) {
          setSelectedRecommendation(data.recommendations[0]);
        } else {
          setSelectedRecommendation(null);
          setExplanation(null);
        }
      } catch (error) {
        console.error('Error loading recommendations:', error);
        setRecommendations([]);
        setSelectedRecommendation(null);
        setExplanation(null);
      } finally {
        setLoading(false);
      }
    };
    loadRecommendations();
  }, [selectedUser, algorithm]);

  useEffect(() => {
    if (!selectedRecommendation || !selectedUser) {
      setExplanation(null);
      return;
    }
    const loadExplanation = async () => {
      setExplanationLoading(true);
      try {
        const exp = await explainRecommendation(selectedUser, selectedRecommendation.target_id);
        setExplanation(exp);
      } catch (error) {
        console.error('Error loading explanation:', error);
        setExplanation(null);
      } finally {
        setExplanationLoading(false);
      }
    };
    loadExplanation();
  }, [selectedRecommendation, selectedUser]);

  const filteredUsers = users.filter((u) => {
    const keyword = userSearch.trim().toLowerCase();
    if (!keyword) return true;
    return u.id.toLowerCase().includes(keyword) || u.name.toLowerCase().includes(keyword);
  });

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-white">Chon Nguoi Dung</label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Tim theo ID hoac ten..."
              className="w-full rounded border border-slate-600 bg-slate-700 py-2 pl-9 pr-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {userSearch.trim() && (
            <div className="mb-2 max-h-40 overflow-y-auto rounded border border-slate-600 bg-slate-800">
              {filteredUsers.slice(0, 8).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u.id);
                    setUserSearch(u.id);
                  }}
                  className="block w-full border-b border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700"
                >
                  {u.id} ({u.name})
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-400">Khong tim thay nguoi dung phu hop</div>
              )}
            </div>
          )}
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            {filteredUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id} ({u.name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white">Thuat Toan</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            {algorithms.map((algo) => (
              <option key={algo.value} value={algo.value}>
                {algo.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Goi Y Ket Noi</h3>
            {loading ? (
              <div className="text-center text-slate-400">Dang tai...</div>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {recommendations.map((rec) => (
                  <button
                    key={rec.target_id}
                    onClick={() => setSelectedRecommendation(rec)}
                    className={`w-full rounded border px-4 py-3 text-left transition-colors ${
                      selectedRecommendation?.target_id === rec.target_id
                        ? 'border-blue-500 bg-blue-600'
                        : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {rec.target_id} ({rec.target_name})
                        </p>
                        <p className="text-sm text-slate-400">@{rec.target_username}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-300">{rec.score.toFixed(4)}</p>
                        <p className="text-xs text-slate-500">{rec.num_common_neighbors} ban chung</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            {explanationLoading ? (
              <div className="flex h-full items-center justify-center text-center text-slate-400">
                <div>
                  <div className="mb-2 text-2xl">⏳</div>
                  <p>Dang tai giai thich...</p>
                </div>
              </div>
            ) : explanation ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Giai Thich</h3>
                <div className="rounded border border-slate-600 bg-slate-700/50 p-4">
                  <p className="text-sm text-slate-300">{explanation.explanation_text}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded bg-slate-700/50 p-3">
                    <span className="text-slate-400">Ban Chung</span>
                    <span className="font-bold text-white">{explanation.num_common_neighbors}</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-slate-700/50 p-3">
                    <span className="text-slate-400">Jaccard Coefficient</span>
                    <span className="font-bold text-white">{explanation.jaccard_coefficient.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-slate-700/50 p-3">
                    <span className="text-slate-400">Adamic-Adar</span>
                    <span className="font-bold text-white">{explanation.adamic_adar_score.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-slate-700/50 p-3">
                    <span className="text-slate-400">Cung Cong Dong</span>
                    <span className={explanation.same_community ? 'font-bold text-green-400' : 'font-bold text-red-400'}>
                      {explanation.same_community ? 'Co' : 'Khong'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-slate-400">
                Chon mot goi y de xem giai thich
              </div>
            )}
          </div>
        </div>

        {explanation && selectedRecommendation && selectedUser && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Moi Quan He</h3>
            <RecommendationGraph
              userId={selectedUser}
              targetId={selectedRecommendation.target_id}
              userName={selectedUser}
              targetName={selectedRecommendation.target_name}
              explanation={explanation}
            />
          </div>
        )}
      </div>
    </div>
  );
};
