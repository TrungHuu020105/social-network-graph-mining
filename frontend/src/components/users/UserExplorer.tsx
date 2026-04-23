// components/users/UserExplorer.tsx
import React, { useState, useEffect } from 'react';
import { getDatasetInfo, getUserDetail } from '../../api/endpoints';
import { UserDetail } from '../../types';
import { Search } from 'lucide-react';

interface UserExplorerProps {
  initialUserId?: string;
}

export const UserExplorer: React.FC<UserExplorerProps> = ({ initialUserId }) => {
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(initialUserId || null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getDatasetInfo();
        setUsers(data.node_list);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  const handleUserSelect = async (userId: string) => {
    setSelectedUser(userId);
    setLoading(true);
    try {
      const detail = await getUserDetail(userId);
      setUserDetail(detail);
    } catch (error) {
      console.error('Error loading user detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load user detail when initialUserId changes
  useEffect(() => {
    if (initialUserId) {
      handleUserSelect(initialUserId);
    }
  }, [initialUserId]);

  const filteredUsers = users.filter(u => 
    u.id.includes(searchQuery) || u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compact view when used as embedded component
  if (initialUserId) {
    return (
      <div className="space-y-3">
        {loading && !userDetail && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm text-slate-300">
            Dang tai thong tin node...
          </div>
        )}

        {!loading && !userDetail && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm text-slate-300">
            Khong tim thay thong tin node.
          </div>
        )}

        {userDetail && (
          <>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4 text-white">
          <h2 className="text-xl font-bold">{userDetail.name}</h2>
          <p className="text-blue-200 text-sm">@{userDetail.username}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-700 rounded p-2 text-center">
            <p className="text-slate-400 text-xs">Kết Nối</p>
            <p className="text-lg font-bold text-white">{userDetail.degree}</p>
          </div>
          <div className="bg-slate-700 rounded p-2 text-center">
            <p className="text-slate-400 text-xs">Cộng Đồng</p>
            <p className="text-lg font-bold text-white">{userDetail.community}</p>
          </div>
          <div className="bg-slate-700 rounded p-2 text-center">
            <p className="text-slate-400 text-xs">Hàng Xóm</p>
            <p className="text-lg font-bold text-white">{userDetail.neighbors.length}</p>
          </div>
        </div>

        {/* Centrality Scores */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-white">Chỉ Số Trung Tâm</h4>
          {Object.entries(userDetail.centrality_scores).map(([metric, score]) => (
            <div key={metric} className="flex justify-between text-xs">
              <span className="text-slate-400">{metric}</span>
              <span className="text-blue-400">{score.toFixed(4)}</span>
            </div>
          ))}
        </div>

        {/* Neighbors */}
        {userDetail.neighbors.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Hàng Xóm</h4>
            <div className="flex flex-wrap gap-1">
              {userDetail.neighbors.slice(0, 5).map(neighbor => (
                <span
                  key={neighbor}
                  className="px-2 py-1 bg-blue-600/20 border border-blue-500/50 rounded text-blue-300 text-xs"
                >
                  {neighbor}
                </span>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* User List */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-xl font-bold text-white mb-4">Danh Sách Người Dùng</h3>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* User List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user.id)}
              className={`w-full text-left px-3 py-2 rounded transition-colors ${
                selectedUser === user.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {user.id}({user.name})
            </button>
          ))}
        </div>
      </div>

      {/* User Detail */}
      <div className="lg:col-span-2">
        {loading ? (
          <div className="text-center text-white">Đang tải...</div>
        ) : userDetail ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
              <h2 className="text-3xl font-bold">{userDetail.name}</h2>
              <p className="text-blue-200">@{userDetail.username}</p>
              <p className="text-sm text-blue-100 mt-2">ID: {userDetail.id}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">Kết Nối</p>
                <p className="text-2xl font-bold text-white">{userDetail.degree}</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">Cộng Đồng</p>
                <p className="text-2xl font-bold text-white">{userDetail.community}</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-slate-400 text-sm">Hàng Xóm</p>
                <p className="text-2xl font-bold text-white">{userDetail.neighbors.length}</p>
              </div>
            </div>

            {/* Centrality Scores */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Chỉ Số Trung Tâm</h3>
              <div className="space-y-3">
                {Object.entries(userDetail.centrality_scores).map(([metric, score]) => (
                  <div key={metric} className="flex justify-between items-center">
                    <span className="text-slate-400">{metric}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(score * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-white font-mono text-sm w-16 text-right">
                        {score.toFixed(4)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Neighbors */}
            {userDetail.neighbors.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Hàng Xóm ({userDetail.neighbors.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {userDetail.neighbors.slice(0, 10).map(neighbor => (
                    <span
                      key={neighbor}
                      className="px-3 py-1 bg-blue-600/20 border border-blue-500/50 rounded-full text-blue-300 text-sm"
                    >
                      {neighbor}
                    </span>
                  ))}
                  {userDetail.neighbors.length > 10 && (
                    <span className="px-3 py-1 text-slate-400 text-sm">
                      +{userDetail.neighbors.length - 10} người khác
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="text-center text-slate-400 h-96 flex items-center justify-center">
            Chọn một người dùng để xem chi tiết
          </div>
        )}
      </div>
    </div>
  );
};



