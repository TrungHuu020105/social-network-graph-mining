// components/recommendations/RecommendationExplorer.tsx
import React, { useState, useEffect } from 'react';
import { getDatasetInfo, getRecommendations, explainRecommendation } from '../../api/endpoints';
import { Recommendation, ExplanationData } from '../../types';
import { ChevronRight, Share2 } from 'lucide-react';
import { RecommendationGraph } from './RecommendationGraph';

export const RecommendationExplorer: React.FC = () => {
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState('adamic_adar');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);

  const algorithms = [
    { value: 'common_neighbors', label: 'Common Neighbors' },
    { value: 'jaccard', label: 'Jaccard Coefficient' },
    { value: 'adamic_adar', label: 'Adamic-Adar' },
    { value: 'preferential_attachment', label: 'Preferential Attachment' },
    { value: 'resource_allocation', label: 'Resource Allocation' },
  ];

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getDatasetInfo();
        setUsers(data.node_list);
        if (data.node_list.length > 0) {
          setSelectedUser(data.node_list[0]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadRecommendations();
    }
  }, [selectedUser, algorithm]);

  const loadRecommendations = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const data = await getRecommendations(selectedUser, algorithm, 10);
      console.log('Recommendations loaded:', data.recommendations);
      setRecommendations(data.recommendations);
      
      // Auto-select first recommendation
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

  // Load explanation when selected recommendation changes
  useEffect(() => {
    if (selectedRecommendation && selectedUser) {
      loadExplanation(selectedUser, selectedRecommendation.target_id);
    } else {
      setExplanation(null);
    }
  }, [selectedRecommendation, selectedUser]);

  const loadExplanation = async (userId: string, targetId: string) => {
    setExplanationLoading(true);
    try {
      console.log(`Loading explanation for user ${userId} -> ${targetId}`);
      const exp = await explainRecommendation(userId, targetId);
      console.log('Explanation loaded:', exp);
      setExplanation(exp);
    } catch (error) {
      console.error('Error loading explanation:', error);
      setExplanation(null);
    } finally {
      setExplanationLoading(false);
    }
  };

  const handleRecommendationSelect = (rec: Recommendation) => {
    setSelectedRecommendation(rec);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white text-sm font-medium mb-2">Chọn Người Dùng</label>
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
          >
            {users.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-white text-sm font-medium mb-2">Thuật Toán</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
          >
            {algorithms.map(algo => (
              <option key={algo.value} value={algo.value}>{algo.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recommendations & Explanation */}
      <div className="space-y-6">
        {/* Top Section - Recommendations List & Explanation Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommendations List */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Gợi Ý Kết Nối</h3>
            {loading ? (
              <div className="text-center text-slate-400">Đang tải...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recommendations.map(rec => (
                  <button
                    key={rec.target_id}
                    onClick={() => handleRecommendationSelect(rec)}
                    className={`w-full text-left px-4 py-3 rounded transition-colors border ${
                      selectedRecommendation?.target_id === rec.target_id
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{rec.target_id} ({rec.target_name})</p>
                        <p className="text-slate-400 text-sm">@{rec.target_username}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-300 font-bold">{rec.score.toFixed(4)}</p>
                        <p className="text-xs text-slate-500">{rec.num_common_neighbors} bạn chung</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            {explanationLoading ? (
              <div className="text-center text-slate-400 h-full flex items-center justify-center">
                <div>
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  <p>Đang tải giải thích...</p>
                </div>
              </div>
            ) : explanation ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Giải Thích</h3>
                
                {/* Reason */}
                <div className="p-4 bg-slate-700/50 rounded border border-slate-600">
                  <p className="text-slate-300 text-sm">{explanation.explanation_text}</p>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                    <span className="text-slate-400">Bạn Chung</span>
                    <span className="text-white font-bold">{explanation.num_common_neighbors}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                    <span className="text-slate-400">Jaccard Coefficient</span>
                    <span className="text-white font-bold">{explanation.jaccard_coefficient.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                    <span className="text-slate-400">Adamic-Adar</span>
                    <span className="text-white font-bold">{explanation.adamic_adar_score.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                    <span className="text-slate-400">Cùng Cộng Đồng</span>
                    <span className={explanation.same_community ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      {explanation.same_community ? 'Có' : 'Không'}
                    </span>
                  </div>
                </div>

                {/* Common Friends */}
                {explanation.common_neighbors.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Bạn Chung:</p>
                    <div className="flex flex-wrap gap-2">
                      {explanation.common_neighbors.slice(0, 5).map(friend => (
                        <span
                          key={friend}
                          className="px-2 py-1 bg-blue-600/20 border border-blue-500/50 rounded text-blue-300 text-xs"
                        >
                          {friend}
                        </span>
                      ))}
                      {explanation.common_neighbors.length > 5 && (
                        <span className="px-2 py-1 text-slate-400 text-xs">
                          +{explanation.common_neighbors.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 h-full flex items-center justify-center">
                Chọn một gợi ý để xem giải thích
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Relationship Graph (Full Width) */}
        {explanation && selectedRecommendation && selectedUser && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Mối Quan Hệ</h3>
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
