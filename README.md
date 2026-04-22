# SocialGraph Analytics
## Ứng dụng Graph Mining để phân tích cộng đồng và gợi ý kết nối trong mạng xã hội

**Xây dựng bởi:** [Sinh viên]  
**Ngành:** Khoa Học Dữ Liệu / Công Nghệ Thông Tin  
**Năm học:** 2025-2026

---

## 📋 Giới Thiệu

**SocialGraph Analytics** là một hệ thống hoàn chỉnh để phân tích mạng xã hội bằng **Graph Mining**. Ứng dụng giúp:

✅ **Phát hiện cộng đồng** trong mạng lưới người dùng  
✅ **Xác định người ảnh hưởng** dựa trên các chỉ số trung tâm (Centrality Measures)  
✅ **Gợi ý kết nối mới** giữa những người dùng chưa kết nối  
✅ **So sánh nhiều thuật toán** để tìm giải pháp tối ưu  
✅ **Đánh giá chất lượng** của các thuật toán recommendation  

---

## 🎯 Các Tính Năng Chính

### 1. **Dashboard Tổng Quan**
- Thống kê số lượng người dùng, kết nối, mật độ mạng
- Top 5 người có ảnh hưởng (PageRank)
- Biểu đồ và card thống kê

### 2. **Phân Tích Cộng Đồng**
- Hỗ trợ 3 thuật toán: **Louvain**, **Label Propagation**, **Girvan-Newman**
- Tính modularity và thời gian thực thi
- Visualize cộng đồng trên đồ thị

### 3. **Khám Phá Người Dùng**
- Tìm kiếm và xem chi tiết người dùng
- Hiển thị 5 chỉ số centrality:
  - Degree Centrality
  - Betweenness Centrality
  - Closeness Centrality
  - PageRank
  - Eigenvector Centrality
- Xem danh sách hàng xóm

### 4. **Gợi Ý Kết Nối**
- 5 thuật toán link prediction:
  - **Common Neighbors** - Dựa trên số bạn chung
  - **Jaccard Coefficient** - Độ giống nhau tỷ lệ
  - **Adamic-Adar** - Bạn chung có trọng số
  - **Preferential Attachment** - Hub yêu thích
  - **Resource Allocation** - Lan tỏa tài nguyên
- Giải thích chi tiết lý do được gợi ý

### 5. **So Sánh Thuật Toán**
- So sánh Community Detection Algorithms
- So sánh Recommendation Algorithms
- Biểu đồ runtime, modularity, quality metrics

### 6. **Đánh Giá Kết Quả**
- Hidden-edge evaluation method
- Precision@K, Hit Rate
- Kiểm tra độ chính xác của recommendations

### 7. **Quản Lý Dữ Liệu**
- Upload dataset mới (CSV format)
- Reset về dataset mẫu
- Thông tin dataset hiện tại

### 8. **Visualize Đồ Thị**
- Cytoscape.js: zoom, pan, drag, click
- Tô màu theo cộng đồng
- Legend và controls tương tác

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────┐
│  Frontend (React + Vite + TS)      │
│  ✓ Dashboard đẹp                   │
│  ✓ Graph visualization             │
│  ✓ Charts & tables                 │
└────────────────┬────────────────────┘
                 │ HTTP/JSON
┌────────────────▼────────────────────┐
│  Backend (FastAPI)                  │
│  ✓ 8 route modules                 │
│  ✓ 7 services (graph mining logic) │
│  ✓ CORS enabled                    │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│  Data Layer (NetworkX + CSV)        │
│  ✓ In-memory graph storage         │
│  ✓ CSV import/export               │
│  ✓ Sample datasets                 │
└─────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Thành Phần | Công Nghệ | Phiên Bản |
|-----------|-----------|----------|
| **Backend** | Python | 3.10+ |
| - Framework | FastAPI | 0.104+ |
| - Graph Mining | NetworkX | 3.2 |
| - Data Processing | Pandas | 2.1+ |
| - Type Validation | Pydantic | 2.5+ |
| - Server | Uvicorn | 0.24+ |
| **Frontend** | React | 18.2+ |
| - Build Tool | Vite | 5.0+ |
| - Language | TypeScript | 5.2+ |
| - Styling | Tailwind CSS | 3.3+ |
| - HTTP Client | Axios | 1.6+ |
| - Graph Viz | Cytoscape.js | 3.28+ |
| - Charts | Recharts | 2.10+ |
| - Icons | Lucide React | 0.292+ |

---

## 📁 Cấu Trúc Thư Mục

```
DoAn/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI main app
│   │   ├── api/                       # Route modules
│   │   ├── core/                      # Config & graph builder
│   │   ├── services/                  # Business logic
│   │   ├── schemas/                   # Pydantic models
│   │   └── utils/                     # Helper functions
│   ├── data/
│   │   ├── sample_nodes.csv           # Sample dataset
│   │   └── sample_edges.csv
│   ├── requirements.txt               # Python dependencies
│   └── README_backend.md
│
├── frontend/
│   ├── src/
│   │   ├── api/                       # API client
│   │   ├── components/                # React components
│   │   ├── pages/                     # Pages (via Router)
│   │   ├── types/                     # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── README_frontend.md
│
├── README.md                          # This file
└── DEMO_FLOW.md                       # Demo script
```

---

## 🚀 Cài Đặt & Chạy

### Yêu Cầu
- Python 3.10+
- Node.js 16+
- npm hoặc yarn

### Backend Setup

```bash
# 1. Vào thư mục backend
cd backend

# 2. Tạo virtual environment
python -m venv venv

# 3. Kích hoạt virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Cài đặt dependencies
pip install -r requirements.txt

# 5. Chạy server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend sẽ chạy tại: **http://localhost:8000**  
API Docs (Swagger UI): **http://localhost:8000/docs**

### Frontend Setup

```bash
# 1. Vào thư mục frontend
cd frontend

# 2. Cài đặt dependencies
npm install

# 3. Chạy development server
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173**

### Chạy Cả Hai

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Mở browser: **http://localhost:5173**

---

## 📊 API Endpoints

### Overview
```
GET /api/overview
→ Thống kê tổng quan
```

### Graph Data
```
GET /api/graph?community_alg=louvain
→ Dữ liệu graph với cộng đồng
```

### Communities
```
GET /api/communities?algorithm=louvain
→ Danh sách cộng đồng

GET /api/communities/stats
→ Thống kê cộng đồng
```

### Users
```
GET /api/users/top-influential?metric=pagerank&limit=10
→ Top influential users

GET /api/users/{user_id}
→ Chi tiết user

GET /api/users/{user_id}/neighbors?depth=1
→ Hàng xóm
```

### Recommendations
```
GET /api/recommendations/{user_id}?algorithm=adamic_adar&top_k=10
→ Gợi ý kết nối

GET /api/recommendations/explain?source=0&target=1
→ Giải thích gợi ý
```

### Comparison
```
GET /api/comparison/community
→ So sánh community algorithms

GET /api/comparison/recommendation?source_id=0&top_k=10
→ So sánh recommendation algorithms
```

### Evaluation
```
GET /api/evaluation/recommendation?algorithm=adamic_adar&top_k=10&hidden_edge_ratio=0.1
→ Đánh giá recommendation

GET /api/evaluation/multiple?top_k=10&hidden_edge_ratio=0.1
→ Đánh giá nhiều algorithms
```

### Dataset
```
GET /api/dataset/info
→ Thông tin dataset

POST /api/dataset/upload
→ Upload dataset mới

POST /api/dataset/reset
→ Reset về mẫu
```

---

## 🧪 Demo Flow

Xem [DEMO_FLOW.md](DEMO_FLOW.md) để có script demo chi tiết.

**Quick Demo:**
1. Mở http://localhost:5173
2. Trang **Tổng Quan**: Xem thống kê tổng quát
3. Trang **Phân Tích Cộng Đồng**: Chạy Louvain, xem cộng đồng
4. Trang **Người Dùng**: Chọn 1 user, xem chi tiết
5. Trang **Gợi Ý**: Xem top 10 gợi ý cho user đó
6. Trang **So Sánh**: So sánh các thuật toán
7. Trang **Đánh Giá**: Chạy evaluation

---

## 🧬 Các Thuật Toán Triển Khai

### Community Detection (3 thuật toán)
- **Louvain**: Tối ưu modularity - Nhanh, chất lượng cao
- **Label Propagation**: Đơn giản, không cần các thông số
- **Girvan-Newman**: Hierarchical, dễ diễn giải

### Centrality Measures (5 chỉ số)
- **Degree Centrality**: Số bạn trực tiếp
- **Betweenness Centrality**: Vai trò cầu nối
- **Closeness Centrality**: Gần trung tâm
- **PageRank**: Từ web ranking (phù hợp mạng xã hội)
- **Eigenvector Centrality**: Ảnh hưởng từ những người có ảnh hưởng

### Link Prediction / Recommendation (5 thuật toán)
- **Common Neighbors**: Dựa trên bạn chung
- **Jaccard Coefficient**: Độ giống nhau
- **Adamic-Adar**: Bạn chung có trọng số
- **Preferential Attachment**: Hub yêu thích
- **Resource Allocation**: Lan tỏa tài nguyên

---

## 📈 Dataset Mẫu

### Sample Data
- **34 người dùng** (từ Karate Club Network)
- **78 kết nối**
- **Định dạng CSV**

### Tạo Dataset Mới
Upload 2 file CSV:
1. **nodes.csv**: `id,name,username`
2. **edges.csv**: `source,target`

Ví dụ:
```csv
# nodes.csv
0,Nguyễn Văn A,nguyenvana
1,Trần Thị B,tranthib
...

# edges.csv
0,1
0,2
1,2
...
```

---

## 💡 Hướng Phát Triển Tương Lai

1. **Database** - Lưu trữ vĩnh viễn (PostgreSQL/MongoDB)
2. **Authentication** - Xác thực người dùng
3. **Real-time** - WebSocket cho cập nhật realtime
4. **Advanced Visualization** - 3D graph, timeline
5. **Machine Learning** - Predictive modeling
6. **Mobile App** - React Native
7. **Neo4j Integration** - Graph database native
8. **Performance** - Caching, async processing

---

## 👥 Contributor

**Sinh viên:** [Tên Sinh Viên]  
**Giảng viên hướng dẫn:** [Tên Giảng Viên]  

---

## 📝 Ghi Chú

- ✅ Tất cả thuật toán đã được kiểm thử
- ✅ API hoàn chỉnh với 15 endpoints
- ✅ Frontend responsive (desktop & tablet)
- ✅ Code có comment và dễ hiểu
- ✅ Khả năng mở rộng tốt

---

## 📞 Liên Hệ & Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra log của backend
2. Xem browser console của frontend
3. Đọc README_backend.md và README_frontend.md
4. Kiểm tra đầu vào dữ liệu CSV

---

**Phiên bản:** 1.0.0  
**Cập nhật lần cuối:** 2026-04-22
