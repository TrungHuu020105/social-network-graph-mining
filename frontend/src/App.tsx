import React, { useEffect, useState } from 'react';
import { CommunityAnalysis } from './components/community/CommunityAnalysis';
import { ComparisonPanel } from './components/comparison/ComparisonPanel';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { DatasetManager } from './components/dataset/DatasetManager';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { RecommendationExplorer } from './components/recommendations/RecommendationExplorer';
import { UserExplorer } from './components/users/UserExplorer';
import { GCNPage } from './pages/GCNPage';

export type PageType =
  | 'overview'
  | 'community'
  | 'users'
  | 'recommendations'
  | 'comparison'
  | 'dataset'
  | 'gcn';

const pageConfig: Record<PageType, { title: string; description: string; path: string }> = {
  overview: {
    title: 'Tong Quan',
    description: 'Thong ke tong quat ve mang xa hoi',
    path: '/',
  },
  community: {
    title: 'Phan Tich Cong Dong',
    description: 'Phat hien va phan tich cac cong dong trong mang',
    path: '/community',
  },
  users: {
    title: 'Kham Pha Nguoi Dung',
    description: 'Xem thong tin chi tiet ve nguoi dung',
    path: '/users',
  },
  recommendations: {
    title: 'Goi Y Ket Noi',
    description: 'Goi y nhung ket noi tiem nang',
    path: '/recommendations',
  },
  comparison: {
    title: 'So Sanh Thuat Toan',
    description: 'So sanh hieu suat cac thuat toan',
    path: '/comparison',
  },
  dataset: {
    title: 'Quan Ly Du Lieu',
    description: 'Upload va quan ly dataset',
    path: '/dataset',
  },
  gcn: {
    title: 'GCN Prediction',
    description: 'Du doan node classification bang Graph Neural Network',
    path: '/gcn',
  },
};

const pathToPage: Record<string, PageType> = {
  '/': 'overview',
  '/community': 'community',
  '/users': 'users',
  '/recommendations': 'recommendations',
  '/comparison': 'comparison',
  '/evaluation': 'comparison',
  '/dataset': 'dataset',
  '/gcn': 'gcn',
};

function resolvePageFromPath(pathname: string): PageType {
  return pathToPage[pathname] ?? 'overview';
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>(() => resolvePageFromPath(window.location.pathname));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(resolvePageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
    const targetPath = pageConfig[page].path;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const config = pageConfig[currentPage];

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <DashboardOverview />;
      case 'community':
        return <CommunityAnalysis />;
      case 'users':
        return <UserExplorer />;
      case 'recommendations':
        return <RecommendationExplorer />;
      case 'comparison':
        return <ComparisonPanel />;
      case 'dataset':
        return <DatasetManager />;
      case 'gcn':
        return <GCNPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 overflow-auto">
        {currentPage !== 'gcn' && <Topbar title={config.title} description={config.description} />}
        <div className="bg-slate-900">{renderPage()}</div>
      </div>
    </div>
  );
}

export default App;
