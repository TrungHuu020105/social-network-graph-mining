# SocialGraph Analytics

Ứng dụng phân tích mạng xã hội bằng Graph Mining và Graph Neural Network (GCN), gồm:
- Backend: FastAPI + NetworkX + PyTorch
- Frontend: React + TypeScript + Vite + Tailwind + Cytoscape

## 1. Tính năng chính

- Tổng quan đồ thị: số node, số cạnh, mật độ, đường kính, hệ số gom cụm.
- Phân tích cộng đồng:
  - Louvain (greedy modularity trong NetworkX)
  - Label Propagation
  - So sánh và chọn thuật toán tốt hơn theo modularity.
- Khám phá người dùng:
  - Thông tin chi tiết user
  - Hàng xóm theo độ sâu 1 hoặc 2
  - Top user ảnh hưởng theo `pagerank` hoặc `degree`.
- Gợi ý kết nối (Link Prediction):
  - Adamic-Adar
  - Resource Allocation
  - Preferential Attachment
  - GCN Link Prediction
  - Có API giải thích vì sao một cặp được gợi ý.
- Đánh giá thuật toán gợi ý:
  - Ẩn một phần cạnh thật (hidden-edge evaluation)
  - Precision@K, Hit Rate.
- GCN Node Classification:
  - Train mô hình GCN
  - Dự đoán nhãn node
  - Lấy toàn bộ prediction
  - Trực quan embedding 2D (PCA).
- Quản lý dataset:
  - Upload dataset đơn giản (`nodes.csv`, `edges.csv`)
  - Upload dataset đầy đủ cho ML (`edges.csv`, `features.json`, `target.csv`)
  - Reset về dataset mặc định.

## 2. Cấu trúc thư mục

```text
DoAn/
├─ backend/
│  ├─ app/
│  │  ├─ api/                  # Các route FastAPI
│  │  ├─ core/                 # Config, GraphBuilder, data storage
│  │  ├─ services/             # Logic cộng đồng, gợi ý, GCN, đánh giá...
│  │  ├─ schemas/              # Pydantic models
│  │  ├─ utils/                # Hàm tiện ích đồ thị
│  │  └─ main.py               # Entry FastAPI
│  ├─ data/                    # Dataset mặc định đang dùng
│  ├─ data1/                   # Dataset phụ
│  ├─ data505/                 # Dataset phụ
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ types/
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ package.json
│  └─ vite.config.ts
├─ generate_data.py
└─ README.md
```

## 3. Yêu cầu môi trường

- Python 3.10+
- Node.js 18+ (khuyến nghị)
- npm

## 4. Cài đặt và chạy dự án

### 4.1. Chạy backend

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```bash
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Cài thư viện và chạy:
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend chạy tại:
- `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

### 4.2. Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại:
- `http://localhost:5173`

Vite đã cấu hình proxy `/api` sang `http://localhost:8000`.

## 5. Dataset mặc định và định dạng dữ liệu

Khi khởi động, backend ưu tiên dataset trong `backend/data/`:
- `PTBR_edges.csv`
- `PTBR_features.json`
- `PTBR_target.csv`

Nếu thiếu bộ trên, hệ thống sẽ thử fallback sang tên file `twitch_pt_*` nếu có.

### 5.1. Upload dataset đơn giản

API: `POST /api/dataset/upload`
- `nodes_file`: CSV có cột `id` (khuyến nghị thêm `name`, `username`)
- `edges_file`: CSV có cặp cột `source,target` hoặc `from,to`

### 5.2. Upload dataset đầy đủ cho ML

API: `POST /api/dataset/upload-ml`
- `edges_file`: CSV `source,target` hoặc `from,to`
- `features_file`: JSON dạng `{ "node_id": [feature_index, ...] }`
- `target_file`: CSV có cột node id (`new_id`/`node_id`/`id`) và nhãn (`partner`/`mature`/`label`/`target`/`y`)

## 6. API chính

### 6.1. Tổng quan và đồ thị
- `GET /api/overview`
- `GET /api/graph?community_alg=louvain&max_nodes=1000`

### 6.2. Cộng đồng
- `GET /api/communities?algorithm=louvain`
- `GET /api/communities/stats`
- `GET /api/communities/compare`
- `GET /api/communities/best`

### 6.3. Người dùng
- `GET /api/users/top-influential?metric=pagerank&limit=10`
- `GET /api/users/{user_id}`
- `GET /api/users/{user_id}/neighbors?depth=1`

### 6.4. Gợi ý kết nối
- `GET /api/recommendations/{user_id}?algorithm=adamic_adar&top_k=10`
- `GET /api/recommendations/{user_id}/explain?target={target_id}&algorithm=adamic_adar`

### 6.5. So sánh và đánh giá
- `GET /api/comparison/community`
- `GET /api/comparison/recommendation?source_id={id}&top_k=10`
- `GET /api/evaluation/recommendation?algorithm=adamic_adar&top_k=10&hidden_edge_ratio=0.1`
- `GET /api/evaluation/multiple?top_k=10&hidden_edge_ratio=0.1`

### 6.6. Dataset
- `GET /api/dataset/info`
- `POST /api/dataset/upload`
- `POST /api/dataset/upload-ml`
- `POST /api/dataset/reset`

### 6.7. GCN
- `GET /api/gcn/train`
- `GET /api/gcn/predict/{node_id}`
- `GET /api/gcn/all-predictions`
- `GET /api/gcn/embeddings`
- `GET /api/gcn/link/train`
- `GET /api/gcn/link/score/{source_id}/{target_id}`

## 7. Công nghệ sử dụng

Backend:
- FastAPI
- NetworkX
- Pandas, NumPy, SciPy
- PyTorch
- Pydantic

Frontend:
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Axios
- Cytoscape
- Recharts
- Lucide React

## 8. Ghi chú quan trọng

- Các file `.md` cũ trong dự án có thể không còn cập nhật; README này đã được viết lại theo code hiện tại.
- Dự án đang chạy theo mô hình in-memory (chưa dùng DB), phù hợp cho demo, nghiên cứu và đồ án.
- Sau khi upload dataset mới cho ML, nên vào trang GCN và train lại để cập nhật kết quả.

---

Cập nhật lần cuối: 2026-04-24
