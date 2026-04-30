# PROJECT CODE STRUCTURE (Code-first)

Cập nhật theo code hiện tại trong repo (ngày: 2026-04-29).
Nguồn chuẩn là mã nguồn; tài liệu này chỉ tóm tắt để tra cứu nhanh.

## Phạm vi
- Có liệt kê: `backend/app`, `frontend/src`, `generate_data.py`, và config frontend chính.
- Không liệt kê: `venv/`, `node_modules/`, `dist/`.

## Cây thư mục

```text
DoAn/
├─ generate_data.py
├─ backend/
│  └─ app/
│     ├─ __init__.py
│     ├─ main.py
│     ├─ api/
│     │  ├─ __init__.py
│     │  ├─ routes_overview.py
│     │  ├─ routes_graph.py
│     │  ├─ routes_community.py
│     │  ├─ routes_users.py
│     │  ├─ routes_recommendations.py
│     │  ├─ routes_comparison.py
│     │  ├─ routes_evaluation.py
│     │  ├─ routes_dataset.py
│     │  └─ routes_gcn.py
│     ├─ core/
│     │  ├─ __init__.py
│     │  ├─ config.py
│     │  ├─ data_storage.py
│     │  └─ graph_builder.py
│     ├─ schemas/
│     │  ├─ __init__.py
│     │  └─ models.py
│     ├─ services/
│     │  ├─ __init__.py
│     │  ├─ centrality_service.py
│     │  ├─ community_service.py
│     │  ├─ comparison_service.py
│     │  ├─ evaluation_service.py
│     │  ├─ explanation_service.py
│     │  ├─ recommendation_service.py
│     │  ├─ gcn_service.py
│     │  └─ gcn_link_service.py
│     └─ utils/
│        ├─ __init__.py
│        └─ graph_utils.py
└─ frontend/
   ├─ vite.config.ts
   ├─ tailwind.config.js
   ├─ postcss.config.js
   └─ src/
      ├─ main.tsx
      ├─ App.tsx
      ├─ vite-env.d.ts
      ├─ api/
      │  ├─ client.ts
      │  ├─ endpoints.ts
      │  └─ gcn.ts
      ├─ types/
      │  ├─ index.ts
      │  └─ gcn.ts
      ├─ pages/
      │  └─ GCNPage.tsx
      └─ components/
         ├─ layout/
         │  ├─ Sidebar.tsx
         │  └─ Topbar.tsx
         ├─ dashboard/
         │  ├─ DashboardOverview.tsx
         │  └─ StatCard.tsx
         ├─ graph/
         │  └─ GraphPanel.tsx
         ├─ community/
         │  └─ CommunityAnalysis.tsx
         ├─ users/
         │  └─ UserExplorer.tsx
         ├─ recommendations/
         │  ├─ RecommendationExplorer.tsx
         │  └─ RecommendationGraph.tsx
         ├─ comparison/
         │  └─ ComparisonPanel.tsx
         ├─ evaluation/
         │  └─ EvaluationPanel.tsx
         ├─ dataset/
         │  └─ DatasetManager.tsx
         └─ gcn/
            ├─ TrainingPanel.tsx
            ├─ PredictionPanel.tsx
            ├─ InsightPanel.tsx
            ├─ EmbeddingChart.tsx
            └─ GCNGraphPanel.tsx
```

## Chức năng từng file

## Root
- `generate_data.py`: Sinh dữ liệu mẫu phục vụ demo/khởi tạo nhanh.

## Backend

### `backend/app`
- `__init__.py`: Khai báo package.
- `main.py`: Tạo app FastAPI, cấu hình CORS, gắn toàn bộ router, có `/` và `/health`.

### `backend/app/api`
- `__init__.py`: Khai báo package API.
- `routes_overview.py`: Endpoint `/api/overview`, trả thống kê tổng quan đồ thị.
- `routes_graph.py`: Endpoint `/api/graph`, chọn thuật toán community, sampling node/edge, trả payload trực quan.
- `routes_community.py`: Endpoints community (`/communities`, `/stats`, `/compare`, `/best`).
- `routes_users.py`: Endpoints user (`top-influential`, user detail, neighbors depth 1/2).
- `routes_recommendations.py`: Endpoints recommendation và explanation theo cặp node.
- `routes_comparison.py`: Endpoints so sánh thuật toán community/recommendation.
- `routes_evaluation.py`: Endpoints evaluate recommendation (1 thuật toán / nhiều thuật toán).
- `routes_dataset.py`: Endpoints quản lý dataset (info, upload graph, upload ML, reset).
- `routes_gcn.py`: Endpoints train/predict GCN node classification + GCN link prediction.

### `backend/app/core`
- `__init__.py`: Khai báo package core.
- `config.py`: Biến cấu hình API/CORS và đường dẫn dữ liệu.
- `data_storage.py`: Singleton `GraphBuilder`, load dataset mặc định, reset và cache graph-level.
- `graph_builder.py`: Tải dữ liệu CSV/PTBR, dựng graph + adjacency matrix + feature matrix + label vector.

### `backend/app/schemas`
- `__init__.py`: Khai báo package schema.
- `models.py`: Pydantic models cho dữ liệu API (overview, graph, user, recommendation, comparison, evaluation, dataset).

### `backend/app/services`
- `__init__.py`: Khai báo package services.
- `centrality_service.py`: Tính `degree_centrality`, `pagerank`, lấy top influential theo metric.
- `community_service.py`: Community detection bằng `greedy_modularity_communities` (đặt tên louvain trong code) và `label_propagation_communities`; so sánh/chọn best.
- `comparison_service.py`: So sánh chất lượng/thời gian giữa các thuật toán.
- `evaluation_service.py`: Ẩn một phần cạnh để đánh giá recommendation (`precision_at_k`, `hit_rate`, số dự đoán đúng).
- `explanation_service.py`: Sinh giải thích cho recommendation dựa trên láng giềng chung, đường đi, điểm số graph.
- `recommendation_service.py`: Tính recommendation với `adamic_adar`, `resource_allocation`, `preferential_attachment`, hoặc `gcn`.
- `gcn_service.py`: Huấn luyện và suy luận GCN cho node classification; xuất predictions/embeddings.
- `gcn_link_service.py`: Huấn luyện và chấm điểm GCN cho link prediction.

### `backend/app/utils`
- `__init__.py`: Khai báo package utils.
- `graph_utils.py`: Hàm tiện ích thống kê và đo quan hệ trên đồ thị (neighbors, jaccard, adamic-adar, shortest path, remove edges for eval, ...).

## Frontend

### `frontend` (config)
- `vite.config.ts`: Cấu hình build/dev Vite.
- `tailwind.config.js`: Cấu hình Tailwind.
- `postcss.config.js`: Cấu hình PostCSS.

### `frontend/src`
- `main.tsx`: Mount React app.
- `App.tsx`: Điều phối layout + chuyển trang theo `PageType`.
- `vite-env.d.ts`: Type declarations cho Vite env.

### `frontend/src/api`
- `client.ts`: Axios client, base URL, interceptor lỗi.
- `endpoints.ts`: Hàm gọi API cho dashboard/graph/community/users/recommendation/comparison/evaluation/dataset.
- `gcn.ts`: Hàm gọi API riêng cho GCN.

### `frontend/src/types`
- `index.ts`: Kiểu dữ liệu chung của app.
- `gcn.ts`: Kiểu dữ liệu cho train/predict/embeddings GCN.

### `frontend/src/pages`
- `GCNPage.tsx`: Trang GCN tổng hợp (train, predict, graph color by prediction, embeddings, insight).

### `frontend/src/components/layout`
- `Sidebar.tsx`: Menu điều hướng module.
- `Topbar.tsx`: Thanh tiêu đề và mô tả trang.

### `frontend/src/components/dashboard`
- `DashboardOverview.tsx`: Tổng hợp chỉ số overview và community.
- `StatCard.tsx`: Card hiển thị metric tái sử dụng.

### `frontend/src/components/graph`
- `GraphPanel.tsx`: Vẽ và tương tác graph chính (layout, scale, hover, coloring, refresh).

### `frontend/src/components/community`
- `CommunityAnalysis.tsx`: UI phân tích/so sánh community.

### `frontend/src/components/users`
- `UserExplorer.tsx`: Tra cứu user, xem detail + neighbors.

### `frontend/src/components/recommendations`
- `RecommendationExplorer.tsx`: Chạy recommendation + xem explanation.
- `RecommendationGraph.tsx`: Trực quan hóa subgraph recommendation.

### `frontend/src/components/comparison`
- `ComparisonPanel.tsx`: UI so sánh thuật toán.

### `frontend/src/components/evaluation`
- `EvaluationPanel.tsx`: UI evaluate recommendation metrics.

### `frontend/src/components/dataset`
- `DatasetManager.tsx`: Upload/reset dataset và đọc info dataset.

### `frontend/src/components/gcn`
- `TrainingPanel.tsx`: UI trigger train GCN + hiển thị kết quả.
- `PredictionPanel.tsx`: UI dự đoán node cụ thể.
- `InsightPanel.tsx`: Thống kê/insight từ predictions.
- `EmbeddingChart.tsx`: Scatter chart embeddings 2D.
- `GCNGraphPanel.tsx`: Panel đồ thị cho ngữ cảnh GCN.

## Quy ước cập nhật
- Khi thêm/sửa/xóa file code: cập nhật ngay tài liệu này trong cùng PR.
- Nếu mô tả khác code, ưu tiên sửa tài liệu theo code (không ngược lại).
