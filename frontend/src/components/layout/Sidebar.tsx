import React from 'react';
import {
  BarChart3,
  BrainCircuit,
  Database,
  GitCompare,
  Menu,
  Network,
  Share2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { PageType } from '../../App';

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
    { id: 'overview', label: 'Tong Quan', icon: <BarChart3 size={20} /> },
    { id: 'community', label: 'Cong Dong', icon: <Network size={20} /> },
    { id: 'users', label: 'Nguoi Dung', icon: <Users size={20} /> },
    { id: 'recommendations', label: 'Goi Y', icon: <Share2 size={20} /> },
    { id: 'comparison', label: 'So Sanh', icon: <GitCompare size={20} /> },
    { id: 'evaluation', label: 'Danh Gia', icon: <TrendingUp size={20} /> },
    { id: 'dataset', label: 'Du Lieu', icon: <Database size={20} /> },
    { id: 'gcn', label: 'GCN Prediction', icon: <BrainCircuit size={20} /> },
  ];

  return (
    <>
      <button onClick={onToggle} className="fixed left-4 top-4 z-40 rounded-lg bg-slate-800 p-2 text-white md:hidden">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed left-0 top-0 z-30 h-full w-64 bg-slate-900 text-white transition-transform duration-300 md:relative md:z-auto md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <h1 className="mb-8 flex items-center gap-2 text-2xl font-bold">
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
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  currentPage === item.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {isOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={onToggle} />}
    </>
  );
};
