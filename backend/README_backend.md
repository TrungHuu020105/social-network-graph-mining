# Backend - SocialGraph Analytics API

## 🎯 Giới Thiệu

Backend được xây dựng bằng **FastAPI** cung cấp các API endpoints cho Graph Mining, Community Detection, và Link Prediction.

---

## 📦 Cấu Trúc Backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI app
│   ├── api/
│   │   ├── routes_overview.py           # GET /overview
│   │   ├── routes_graph.py              # GET /graph
│   │   ├── routes_community.py          # Community endpoints
│   │   ├── routes_users.py              # User endpoints
│   │   ├── routes_recommendations.py    # Recommendation endpoints
│   │   ├── routes_comparison.py         # Comparison endpoints
│   │   ├── routes_evaluation.py         # Evaluation endpoints
│   │   └── routes_dataset.py            # Dataset management
│   ├── core/
│   │   ├── config.py                    # Configuration
│   │   ├── graph_builder.py             # Graph loading
│   │   └── data_storage.py              # Global storage
│   ├── services/
│   │   ├── community_service.py         # Community detection algorithms
│   │   ├── centrality_service.py        # Centrality measures
│   │   ├── recommendation_service.py    # Link prediction algorithms
│   │   ├── explanation_service.py       # Explain recommendations
│   │   ├── comparison_service.py        # Algorithm comparison
│   │   └── evaluation_service.py        # Evaluation metrics
│   ├── schemas/
│   │   └── models.py                    # Pydantic models
│   └── utils/
│       └── graph_utils.py               # Utility functions
├── data/
│   ├── sample_nodes.csv
│   └── sample_edges.csv
├── requirements.txt
└── README_backend.md
```

---

## 🚀 Cài Đặt & Chạy

### 1. Tạo Virtual Environment
```bash
cd backend
python -m venv venv

# Kích hoạt
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 2. Cài Đặt Dependencies
```bash
pip install -r requirements.txt
```

### 3. Chạy Server
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Hoặc từ PyCharm: Run → Run app.main

### 4. Kiểm Tra
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

---

## 📋 API Endpoints

### Overview
```
GET /api/overview
```
Response:
```json
{
  "num_nodes": 34,
  "num_edges": 78,
  "density": 0.1360,
  "avg_degree": 4.59,
  "isolated_nodes": 0,
  "diameter": 5,
  "avg_clustering_coefficient": 0.5706
}
```

### Graph Data
```
GET /api/graph?community_alg=louvain
```

### Communities
```
GET /api/communities?algorithm=louvain
GET /api/communities/stats
```

### Users
```
GET /api/users/top-influential?metric=pagerank&limit=10
GET /api/users/{user_id}
GET /api/users/{user_id}/neighbors?depth=1
```

### Recommendations
```
GET /api/recommendations/{user_id}?algorithm=adamic_adar&top_k=10
GET /api/recommendations/explain?source=0&target=1
```

### Comparison
```
GET /api/comparison/community
GET /api/comparison/recommendation?source_id=0&top_k=10
```

### Evaluation
```
GET /api/evaluation/recommendation?algorithm=adamic_adar&top_k=10&hidden_edge_ratio=0.1
GET /api/evaluation/multiple?top_k=10&hidden_edge_ratio=0.1
```

### Dataset
```
GET /api/dataset/info
POST /api/dataset/upload (multipart/form-data)
POST /api/dataset/reset
```

---

## 🔧 Development

### Hot Reload
Server tự động reload khi code thay đổi (enable `--reload`)

### Logging
Tất cả requests được log tại:
```
level=INFO message=...
```

### Testing
```bash
# Với curl
curl http://localhost:8000/api/overview

# Với Python
import requests
r = requests.get('http://localhost:8000/api/overview')
print(r.json())
```

---

## 🧬 Graph Algorithms Implemented

### Community Detection
- **Louvain**: `community_service.louvain()`
- **Label Propagation**: `community_service.label_propagation()`
- **Girvan-Newman**: `community_service.girvan_newman()`

### Centrality Measures
- **Degree**: `centrality_service.degree_centrality()`
- **Betweenness**: `centrality_service.betweenness_centrality()`
- **Closeness**: `centrality_service.closeness_centrality()`
- **PageRank**: `centrality_service.pagerank()`
- **Eigenvector**: `centrality_service.eigenvector_centrality()`

### Link Prediction
- **Common Neighbors**: `recommendation_service.common_neighbors_score()`
- **Jaccard**: `recommendation_service.jaccard_score()`
- **Adamic-Adar**: `recommendation_service.adamic_adar_score()`
- **Preferential Attachment**: `recommendation_service.preferential_attachment_score()`
- **Resource Allocation**: `recommendation_service.resource_allocation_score()`

---

## 📊 Data Flow

```
CSV Files
    ↓
GraphBuilder (graph_builder.py)
    ↓
NetworkX Graph (in-memory)
    ↓
Services (community, centrality, recommendation)
    ↓
API Routes (FastAPI)
    ↓
JSON Response → Frontend
```

---

## ⚙️ Configuration

Sửa file `app/core/config.py`:

```python
# CORS
CORS_ORIGINS = ["*"]  # Hoặc ["http://localhost:5173"]

# API
API_PREFIX = "/api"
API_TITLE = "SocialGraph Analytics API"
```

---

## 🐛 Debugging

### Issue: Port 8000 đã bị dùng
```bash
# Windows: Tìm process
netstat -ano | findstr :8000

# Dùng port khác
python -m uvicorn app.main:app --port 8001
```

### Issue: ModuleNotFoundError
```bash
# Kiểm tra environment đúng chưa
which python  # or where python
pip list
```

### Issue: CORS Error
```python
# Sửa trong main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
)
```

---

## 📈 Performance Tips

1. **Caching**: Communities được tính 1 lần, reuse cho nhiều endpoints
2. **Lazy Loading**: Graph chỉ load khi cần
3. **Pagination**: Có thể thêm để handle large datasets
4. **Async**: Có thể convert route to async_def

---

## 🧪 Testing

Kiểm tra từ Swagger UI: http://localhost:8000/docs

Hoặc dùng `curl`:
```bash
curl -X GET "http://localhost:8000/api/overview"
curl -X GET "http://localhost:8000/api/graph?community_alg=louvain"
```

---

## 📝 Dependencies

- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **pydantic**: Data validation
- **networkx**: Graph algorithms
- **pandas**: CSV processing
- **python-multipart**: File upload

---

**Phiên bản:** 1.0.0  
**Tối ưu cho:** CPU-based processing, small-medium graphs (< 10,000 nodes)
