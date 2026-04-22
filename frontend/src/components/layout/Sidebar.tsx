// components/layout/Sidebar.tsx
import React from 'react';
import { Menu, X, BarChart3, Network, Users, Share2, GitCompare, TrendingUp, Database } from 'lucide-react';

type PageType = 'overview' | 'community' | 'users' | 'recommendations' | 'comparison' | 'evaluation' | 'dataset';

interface NavItem {
  id: PageType;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, isOpen, onToggle }) => {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Tổng Quan', icon: <BarChart3 size={20} /> },
    { id: 'community', label: 'Cộng Đồng', icon: <Network size={20} /> },
    { id: 'users', label: 'Người Dùng', icon: <Users size={20} /> },
    { id: 'recommendations', label: 'Gợi Ý', icon: <Share2 size={20} /> },
    { id: 'comparison', label: 'So Sánh', icon: <GitCompare size={20} /> },
    { id: 'evaluation', label: 'Đánh Giá', icon: <TrendingUp size={20} /> },
    { id: 'dataset', label: 'Dữ Liệu', icon: <Database size={20} /> },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-slate-800 text-white rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-slate-900 text-white transition-transform duration-300 z-30 md:z-auto md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Network size={28} />
            SocialGraph
          </h1>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  onToggle();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};
