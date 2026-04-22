# 🎬 DEMO FLOW - Script Trình Bày Trước Giảng Viên

**Thời gian:** ~10-15 phút  
**Mục đích:** Demo toàn bộ tính năng của hệ thống

---

## ⚙️ Chuẩn Bị Trước

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # hoặc venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000

# Đợi khi thấy: "Uvicorn running on http://0.0.0.0:8000"
```

```bash
# Terminal 2 - Frontend
cd frontend
npm run dev

# Đợi khi thấy: "Local: http://localhost:5173"
```

```bash
# Mở browser
http://localhost:5173
```

---

## 📽️ DEMO FLOW (Chi Tiết)

### **Slide 1: Giới Thiệu (30 giây)**

**Nội dung:**
- "Hôm nay em trình bày đề tài: Ứng dụng Graph Mining để phân tích cộng đồng và gợi ý kết nối trong mạng xã hội"
- "Hệ thống bao gồm backend FastAPI với các thuật toán graph mining, và frontend React với dashboard tương tác"

**Hành động:** Đứng trước màn hình, giới thiệu chung

---

### **Slide 2: Tổng Quan (1 phút)**

**Hành động:**
1. Click tab **"Tổng Quan"** (nếu chưa ở đó)
2. Chỉ vào các stat cards:

```
"Hệ thống đang tải 34 người dùng và 78 kết nối"
→ Xem stat card "Tổng Người Dùng: 34" và "Tổng Kết Nối: 78"

"Mật độ mạng là 0.136 - khá thưa"
→ Xem "Mật Độ Mạng: 0.136"

"Độ trung bình mỗi user là 4.59 kết nối"
→ Xem "Độ Trung Bình: 4.59"

"Có 0 user cô lập"
→ Xem "Người Dùng Cô Lập: 0"

"Đường kính mạng là 5 - cần 5 bước tối đa để từ user này đến user kia"
→ Xem "Đường Kính Mạng: 5"

"Hệ số gom cụm là 0.5706 - khá cao, có nhiều tam giác"
→ Xem "Hệ Số Gom Cụm: 0.5706"
```

3. Cuộn xuống xem **"Top 5 Người Có Ảnh Hưởng"**:

```
"Dựa theo PageRank, top 5 người ảnh hưởng nhất là..."
→ Đọc tên từng user: Nguyễn Văn A (0.0267), ...
```

---

### **Slide 3: Phân Tích Cộng Đồng (2 phút)**

**Hành động:**
1. Click tab **"Cộng Đồng"**
2. Chỉ vào các button thuật toán:

```
"Em sẽ dùng 3 thuật toán phát hiện cộng đồng khác nhau"
```

3. Nút "**Louvain**" đã được chọn (giả sử). Nếu chưa, click để chạy:

```
"Louvain tối ưu hóa modularity - là thuật toán phổ biến nhất"
→ Thấy kết quả:
   - Số cộng đồng: 4
   - Modularity: 0.3717
   - Thời gian: ~0.05s
```

4. Giải thích biểu đồ:

```
"Pie chart cho thấy phân bố kích thước các cộng đồng"
→ Xem pie chart

"Bar chart giúp so sánh rõ ràng hơn"
→ Xem bar chart

"Bảng chi tiết liệt kê từng cộng đồng..."
→ Xem bảng (cuộn nếu cần)
```

5. Thử thuật toán khác - Click nút **"Label Propagation"**:

```
"Label Propagation là thuật toán đơn giản hơn"
→ Chạy, thấy kết quả tương tự
```

---

### **Slide 4: Khám Phá Người Dùng (1.5 phút)**

**Hành động:**
1. Click tab **"Người Dùng"**
2. Tìm kiếm user - Click vào search box:

```
"Em sẽ chọn user số 0 (Nguyễn Văn A)"
→ Gõ "0" hoặc click trực tiếp
```

3. Xem chi tiết:

```
"User này có 5 kết nối trực tiếp"
→ Xem Degree: 5

"Người này ở cộng đồng số 0"
→ Xem Community: 0

"Các chỉ số centrality của user này:"
→ Xem bảng:
   - Degree Centrality: 0.1765
   - Betweenness: 0.025
   - Closeness: 0.3889
   - PageRank: 0.0267
   - Eigenvector: ...
```

4. Xem hàng xóm:

```
"Hàng xóm 1-hop là 5 người..."
→ Xem danh sách
```

---

### **Slide 5: Gợi Ý Kết Nối (2 phút)**

**Hành động:**
1. Click tab **"Gợi Ý"**
2. Input vẫn là user 0, chọn thuật toán **"Adamic-Adar"**:

```
"Adamic-Adar tính điểm dựa trên bạn chung có trọng số"
→ Xem thuật toán được chọn
```

3. Xem danh sách gợi ý (bên trái):

```
"Top 10 gợi ý cho user 0 là:"
→ Đọc: User 1 (0.5024), User 2 (0.3863), ...
→ Mỗi người có số bạn chung, điểm số
```

4. Click một gợi ý, ví dụ **User 1**:

```
"Khi click vào User 1, bên phải sẽ hiển thị giải thích"
→ Bên phải hiện ra:
```

5. Giải thích chi tiết:

```
"Lý do được gợi ý: '2 bạn chung • Giống nhau 40%'"

"Chi tiết:"
→ Bạn Chung: 2
→ Jaccard: 0.4
→ Adamic-Adar: 0.5024
→ Cùng Cộng Đồng: Có

"Bạn chung là:" → Xem tên
```

6. Thử thuật toán khác - Chọn **"Common Neighbors"**:

```
"Common Neighbors chỉ đơn giản dựa trên số bạn chung"
→ Thấy điểm số khác
```

---

### **Slide 6: So Sánh Thuật Toán (1.5 phút)**

**Hành động:**
1. Click tab **"So Sánh"**
2. Tab 1: **Community Detection** (default):

```
"Bảng so sánh 3 thuật toán community detection:"
```

Xem bảng:
```
| Thuật Toán    | Số Cộng Đồng | Modularity | Thời Gian |
|---------------|--------------|-----------|-----------|
| Louvain       | 4            | 0.3717    | 0.0523    |
| Label Prop.   | 4            | 0.3702    | 0.0312    |
| Girvan-Newman | 4            | 0.3711    | 0.1245    |
```

```
"Louvain chất lượng cao (modularity 0.3717), tốc độ nhanh"
"Label Propagation nhanh nhất nhưng chất lượng hơi kém"
"Girvan-Newman chậm nhất (hierarchical method)"
```

3. Xem biểu đồ:

```
"Biểu đồ bên trái: Thời gian thực thi"
→ Xem bar chart runtime

"Biểu đồ bên phải: Modularity"
→ Xem bar chart modularity
```

4. Click tab **"So Sánh Recommendation"**:

```
"Chọn user 0, so sánh 5 thuật toán link prediction"
```

```
"Bảng cho thấy:"
- Common Neighbors: 3 gợi ý, điểm TB 1.4
- Jaccard: 10 gợi ý, điểm TB 0.42
- Adamic-Adar: 10 gợi ý, điểm TB 0.36
- Preferential Attachment: 10 gợi ý, điểm TB 0.18
- Resource Allocation: 10 gợi ý, điểm TB 0.22

"Adamic-Adar cân bằng giữa độ chính xác và khả năng giải thích"
```

---

### **Slide 7: Đánh Giá Kết Quả (1 phút)**

**Hành động:**
1. Click tab **"Đánh Giá"**
2. Xem cấu hình:

```
"Cấu hình: Top-K=10, Hidden Edge Ratio=10%"
```

3. Click nút **"Bắt Đầu Đánh Giá"**:

```
"Hệ thống sẽ:"
1. Ẩn ngẫu nhiên 10% cạnh (~8 cạnh)
2. Xây graph không có các cạnh ẩn
3. Dự đoán top-10 user được gợi ý cho mỗi cạnh ẩn
4. Tính Precision@K, Hit Rate
```

4. Xem kết quả:

```
"Bảng đánh giá tất cả 5 algorithms:"
- Precision@K: Tỷ lệ gợi ý đúng / top-10
- Hit Rate: Tỷ lệ cạnh ẩn được dự đoán đúng
- Edges Hidden: 8 cạnh ẩn
```

```
"Adamic-Adar có Precision@K=0.45, Hit Rate=0.375"
"Tức là 45% top-10 gợi ý là đúng"
```

5. Xem biểu đồ:

```
"Biểu đồ Precision@K và Hit Rate"
→ Xem 2 bar charts
```

---

### **Slide 8: Quản Lý Dữ Liệu (1 phút)**

**Hành động:**
1. Click tab **"Dữ Liệu"**
2. Xem thông tin hiện tại:

```
"Dataset hiện tại:"
- 34 người dùng
- 78 kết nối
- Mật độ: 0.136
- Độ TB: 4.59
```

3. Giải thích upload:

```
"Có thể upload dataset mới bằng 2 file CSV:"
- nodes.csv: id,name,username
- edges.csv: source,target
```

4. Nút Reset:

```
"Nút 'Reset Về Dataset Mẫu' để quay lại dữ liệu gốc"
```

---

### **Slide 9: Kết Luận (1 phút)**

```
"Hệ thống bao gồm:"

1. Backend (FastAPI):
   - 7 services
   - 15 API endpoints
   - Các thuật toán: Louvain, Label Prop., Girvan-Newman, 5 centrality, 5 link prediction

2. Frontend (React):
   - 7 pages chính
   - Dashboard tương tác
   - Cytoscape graph visualization
   - Recharts cho biểu đồ
   - Tailwind CSS responsive

3. Thuật toán:
   - Community Detection: 3 algorithms
   - Centrality Measures: 5 metrics
   - Link Prediction: 5 algorithms
   - Evaluation: Hidden-edge validation

4. Tính năng:
   ✓ Phát hiện cộng đồng
   ✓ Xác định người ảnh hưởng
   ✓ Gợi ý kết nối thông minh
   ✓ Giải thích chi tiết
   ✓ So sánh thuật toán
   ✓ Đánh giá chất lượng
   ✓ Quản lý dữ liệu
   ✓ Visualize đẹp

"Cảm ơn đã lắng nghe!"
```

---

## 🎯 Tips Trình Bày

1. **Tốc độ**: Không nên chạy từng API lâu, hãy dùng dữ liệu cached
2. **Giọng nói**: Rõ, tự tin, giải thích khúc khó
3. **Trả lời câu hỏi**: Sẵn sàng giải thích từng thuật toán
4. **Thời gian**: Cắt ngắn nếu giảng viên thắc mắc

---

## 🚨 Backup Plans

Nếu có lỗi:
- Reload page: `Ctrl+F5`
- Restart backend: Stop terminal, chạy lại
- Restart frontend: Stop terminal, chạy lại
- Kiểm tra URL: `http://localhost:5173`

---

## 📊 Screenshots Cần Chuẩn Bị

Để an toàn, chụp screenshots trước:
1. Dashboard overview
2. Graph visualization
3. Community results
4. Recommendations
5. Comparison charts
6. Evaluation results

Nếu live demo gặp lỗi, có thể dùng screenshots làm backup.

---

**Chúc bạn demo thành công! 🎉**
