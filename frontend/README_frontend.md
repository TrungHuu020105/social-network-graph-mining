# Frontend - SocialGraph Analytics Dashboard

## 🎨 Giới Thiệu

Frontend được xây dựng bằng **React 18 + Vite + TypeScript + Tailwind CSS** cung cấp giao diện đẹp, responsive, và tương tác cao.

---

## 📦 Cấu Trúc Frontend

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts                     # Axios config
│   │   └── endpoints.ts                  # API functions
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx               # Navigation
│   │   │   └── Topbar.tsx                # Header
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx              # Stats card
│   │   │   └── DashboardOverview.tsx     # Overview page
│   │   ├── graph/
│   │   │   └── GraphPanel.tsx            # Cytoscape graph
│   │   ├── users/
│   │   │   └── UserExplorer.tsx          # User search & detail
│   │   ├── community/
│   │   │   └── CommunityAnalysis.tsx     # Community detection
│   │   ├── recommendations/
│   │   │   └── RecommendationExplorer.tsx # Link prediction
│   │   ├── comparison/
│   │   │   └── ComparisonPanel.tsx       # Algorithm comparison
│   │   ├── evaluation/
│   │   │   └── EvaluationPanel.tsx       # Evaluation results
│   │   └── dataset/
│   │       └── DatasetManager.tsx        # Dataset upload/reset
│   ├── types/
│   │   └── index.ts                      # TypeScript interfaces
│   ├── hooks/                            # Custom hooks (extensible)
│   ├── utils/                            # Utilities (extensible)
│   ├── App.tsx                           # Main app component
│   ├── main.tsx                          # Entry point
│   └── index.css                         # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README_frontend.md
```

---

## 🚀 Cài Đặt & Chạy

### 1. Cài Đặt Dependencies
```bash
cd frontend
npm install
```

### 2. Chạy Development Server
```bash
npm run dev
```

Mở browser: **http://localhost:5173**

### 3. Build Production
```bash
npm run build
```

Output: `dist/` folder

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🎨 Giao Diện

### Màu Sắc
- **Background**: Dark slate (#0f172a, #1e293b)
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f97316)
- **Danger**: Red (#ef4444)

### Typography
- **Font**: System default (Segoe UI, Roboto, etc.)
- **Headings**: Font-weight bold
- **Body**: Regular weight

### Layout
- **Desktop**: Sidebar left (256px) + Main content
- **Mobile**: Hamburger menu + Full-width content
- **Responsive**: Tailwind breakpoints (sm, md, lg, xl)

---

## 📄 Trang Chính

### 1. **Tổng Quan** (Overview)
- 8 stat cards (nodes, edges, density, etc.)
- Top 5 influential users
- 📍 File: `DashboardOverview.tsx`

### 2. **Phân Tích Cộng Đồng** (Community Analysis)
- Chọn thuật toán (Louvain, Label Prop, Girvan-Newman)
- Pie chart + Bar chart
- Bảng chi tiết cộng đồng
- 📍 File: `CommunityAnalysis.tsx`

### 3. **Người Dùng** (User Explorer)
- Search box
- Chi tiết user (centrality scores)
- Danh sách hàng xóm
- 📍 File: `UserExplorer.tsx`

### 4. **Gợi Ý** (Recommendations)
- Chọn user + algorithm
- Danh sách top-10 gợi ý
- Panel giải thích chi tiết
- 📍 File: `RecommendationExplorer.tsx`

### 5. **So Sánh** (Comparison)
- Tab: Community vs Recommendation
- Bảng so sánh
- Biểu đồ runtime & quality metrics
- 📍 File: `ComparisonPanel.tsx`

### 6. **Đánh Giá** (Evaluation)
- Cấu hình: top-k, hidden edge ratio
- Bảng metrics (Precision@K, Hit Rate)
- Bar charts
- 📍 File: `EvaluationPanel.tsx`

### 7. **Dữ Liệu** (Dataset Manager)
- Upload CSV (nodes + edges)
- Reset về mẫu
- Thông tin dataset hiện tại
- 📍 File: `DatasetManager.tsx`

---

## 📊 Components

### StatCard
Hiển thị 1 chỉ số với icon, giá trị, màu sắc
```tsx
<StatCard
  label="Tổng Người Dùng"
  value={34}
  icon={<Users />}
  color="blue"
/>
```

### GraphPanel
Visualize đồ thị bằng Cytoscape
```tsx
<GraphPanel
  communityAlgorithm="louvain"
  onNodeClick={(nodeId) => console.log(nodeId)}
/>
```

### Sidebar & Topbar
Layout components điều hướng

---

## 🔌 API Integration

### Client Setup
```typescript
// api/client.ts
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api'
});
```

### Endpoints
```typescript
// api/endpoints.ts
export const getOverview = async () => { ... }
export const getRecommendations = async (userId, algo, topK) => { ... }
export const explainRecommendation = async (source, target) => { ... }
// ... 15+ endpoints
```

### Usage trong Component
```typescript
const [stats, setStats] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    const data = await getOverview();
    setStats(data);
  };
  fetchData();
}, []);
```

---

## 🎯 State Management

Component-level state với `useState`:
- Simple, no external library needed
- Mỗi page quản lý state riêng
- Context API có thể thêm nếu cần global state

---

## 📈 Charts

Sử dụng **Recharts**:

### Pie Chart
```tsx
<PieChart>
  <Pie data={data} />
  <Tooltip />
</PieChart>
```

### Bar Chart
```tsx
<BarChart data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  <Bar dataKey="value" fill="#3b82f6" />
</BarChart>
```

---

## 🌐 Responsive Design

Tailwind breakpoints:
```css
/* Mobile first */
.grid { display: grid; grid-template-columns: 1fr; }

@media (md) { /* >= 768px */
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (lg) { /* >= 1024px */
  .grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 🚀 Optimizations

1. **Code Splitting**: Vite tự động split theo route
2. **Lazy Loading**: useEffect cho async data
3. **Memoization**: React.memo cho components heavy
4. **CSS**: Tailwind purge unused styles

---

## 🐛 Debugging

### Browser DevTools
- React Developer Tools: Check components tree
- Network tab: Monitor API calls
- Console: Check errors

### VS Code
- ESLint extension
- Prettier extension
- TypeScript support built-in

---

## 📝 Styling Guidelines

### Tailwind Classes
```tsx
// ✅ Good
<div className="p-6 bg-slate-800 rounded-lg border border-slate-700">

// ❌ Avoid inline styles
<div style={{padding: '24px'}}>
```

### Colors
```
bg-slate-* (grays)
bg-blue-* (primary)
bg-green-* (success)
bg-orange-* (warning)
bg-red-* (danger)
```

### Spacing
```
p-* (padding)
m-* (margin)
gap-* (flex gap)
```

---

## 🔐 TypeScript

Tất cả components typed:
```tsx
interface Props {
  title: string;
  value: number;
  onSubmit: (data: FormData) => void;
}

const MyComponent: React.FC<Props> = ({ title, value, onSubmit }) => {
  // ...
};
```

---

## 📦 Building & Deployment

### Build
```bash
npm run build
# → dist/ folder (production ready)
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
- Connect Git repo → Auto deploy

---

## 🧪 Testing (Optional)

Có thể thêm:
```bash
npm install --save-dev vitest @testing-library/react
```

---

## 🎓 Best Practices

1. **Components**: Functional, pure, reusable
2. **Hooks**: useEffect, useState, useContext
3. **Types**: Mọi Props đều typed
4. **Styling**: Tailwind + CSS modules
5. **API**: Centralized endpoints.ts
6. **Error Handling**: Try-catch, toast notifications (có thể thêm)

---

**Phiên bản:** 1.0.0  
**Node version**: 16+  
**Vite version**: 5.0+
