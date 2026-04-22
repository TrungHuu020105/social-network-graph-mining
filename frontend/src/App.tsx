// App.tsx
import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { CommunityAnalysis } from './components/community/CommunityAnalysis';
import { UserExplorer } from './components/users/UserExplorer';
import { RecommendationExplorer } from './components/recommendations/RecommendationExplorer';
import { ComparisonPanel } from './components/comparison/ComparisonPanel';
import { EvaluationPanel } from './components/evaluation/EvaluationPanel';
import { DatasetManager } from './components/dataset/DatasetManager';

type PageType = 'overview' | 'community' | 'users' | 'recommendations' | 'comparison' | 'evaluation' | 'dataset';

const pageConfig: Record<PageType, { title: string; description: string }> = {
  overview: {
    title: 'Tổng Quan',
    description: 'Thống kê tổng quát về mạng xã hội',
  },
  community: {
    title: 'Phân Tích Cộng Đồng',
    description: 'Phát hiện và phân tích các cộng đồng trong mạng',
  },
  users: {
    title: 'Khám Phá Người Dùng',
    description: 'Xem thông tin chi tiết về người dùng',
  },
  recommendations: {
    title: 'Gợi Ý Kết Nối',
    description: 'Gợi ý những kết nối tiềm năng',
  },
  comparison: {
    title: 'So Sánh Thuật Toán',
    description: 'So sánh hiệu suất các thuật toán',
  },
  evaluation: {
    title: 'Đánh Giá Kết Quả',
    description: 'Đánh giá chất lượng recommendations',
  },
  dataset: {
    title: 'Quản Lý Dữ Liệu',
    description: 'Upload và quản lý dataset',
  },
};

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case 'evaluation':
        return <EvaluationPanel />;
      case 'dataset':
        return <DatasetManager />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Topbar */}
        <Topbar title={config.title} description={config.description} />

        {/* Page Content */}
        <div className="bg-slate-900">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
