import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getDatasetInfo, getUserDetail } from '../../api/endpoints';
import { UserDetail } from '../../types';

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

  useEffect(() => {
    if (initialUserId) {
      handleUserSelect(initialUserId);
    }
  }, [initialUserId]);

  const filteredUsers = users.filter(
    (u) => u.id.includes(searchQuery) || u.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (initialUserId) {
    return (
      <div className="space-y-3">
        {loading && !userDetail && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm text-slate-300">
            Đang tải thông tin node...
          </div>
        )}

        {!loading && !userDetail && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm text-slate-300">
            Không tìm thấy thông tin node.
          </div>
        )}

        {userDetail && (
          <>
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
              <h2 className="text-xl font-bold">{userDetail.name}</h2>
              <p className="text-sm text-blue-200">@{userDetail.username}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded bg-slate-700 p-2 text-center">
                <p className="text-xs text-slate-400">Kết nối</p>
                <p className="text-lg font-bold text-white">{userDetail.degree}</p>
              </div>
              <div className="rounded bg-slate-700 p-2 text-center">
                <p className="text-xs text-slate-400">Cộng đồng</p>
                <p className="text-lg font-bold text-white">{userDetail.community}</p>
              </div>
              <div className="rounded bg-slate-700 p-2 text-center">
                <p className="text-xs text-slate-400">Hàng xóm</p>
                <p className="text-lg font-bold text-white">{userDetail.neighbors.length}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">Chỉ số trung tâm</h4>
              {Object.entries(userDetail.centrality_scores).map(([metric, score]) => (
                <div key={metric} className="flex justify-between text-xs">
                  <span className="text-slate-400">{metric}</span>
                  <span className="text-blue-400">{score.toFixed(4)}</span>
                </div>
              ))}
            </div>

            {userDetail.neighbors.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-bold text-white">Hàng xóm</h4>
                <div className="flex flex-wrap gap-1">
                  {userDetail.neighbors.slice(0, 5).map((neighbor) => (
                    <span
                      key={neighbor}
                      className="rounded border border-blue-500/50 bg-blue-600/20 px-2 py-1 text-xs text-blue-300"
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
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <h3 className="mb-4 text-xl font-bold text-white">Danh sách người dùng</h3>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-slate-600 bg-slate-700 py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user.id)}
              className={`w-full rounded px-3 py-2 text-left transition-colors ${
                selectedUser === user.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {user.id} ({user.name})
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {loading ? (
          <div className="text-center text-white">Đang tải...</div>
        ) : userDetail ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
              <h2 className="text-3xl font-bold">{userDetail.name}</h2>
              <p className="text-blue-200">@{userDetail.username}</p>
              <p className="mt-2 text-sm text-blue-100">ID: {userDetail.id}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-center">
                <p className="text-sm text-slate-400">Kết nối</p>
                <p className="text-2xl font-bold text-white">{userDetail.degree}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-center">
                <p className="text-sm text-slate-400">Cộng đồng</p>
                <p className="text-2xl font-bold text-white">{userDetail.community}</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-center">
                <p className="text-sm text-slate-400">Hàng xóm</p>
                <p className="text-2xl font-bold text-white">{userDetail.neighbors.length}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-4 text-lg font-bold text-white">Chỉ số trung tâm</h3>
              <div className="space-y-3">
                {Object.entries(userDetail.centrality_scores).map(([metric, score]) => (
                  <div key={metric} className="flex items-center justify-between">
                    <span className="text-slate-400">{metric}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-700">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(score * 100, 100)}%` }} />
                      </div>
                      <span className="w-16 text-right font-mono text-sm text-white">{score.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {userDetail.neighbors.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
                <h3 className="mb-4 text-lg font-bold text-white">Hàng xóm ({userDetail.neighbors.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {userDetail.neighbors.slice(0, 10).map((neighbor) => (
                    <span
                      key={neighbor}
                      className="rounded-full border border-blue-500/50 bg-blue-600/20 px-3 py-1 text-sm text-blue-300"
                    >
                      {neighbor}
                    </span>
                  ))}
                  {userDetail.neighbors.length > 10 && (
                    <span className="px-3 py-1 text-sm text-slate-400">+{userDetail.neighbors.length - 10} người khác</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-96 items-center justify-center text-center text-slate-400">
            Chọn một người dùng để xem chi tiết
          </div>
        )}
      </div>
    </div>
  );
};
