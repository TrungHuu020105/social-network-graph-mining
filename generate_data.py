"""
Script để tạo sinh dữ liệu social network có 2105 node
Tạo sinh dữ liệu hợp lí dựa trên mô hình scale-free network
"""

import networkx as nx
import pandas as pd
from pathlib import Path
import random

# Danh sách tên Việt Nam phổ biến
FIRST_NAMES = [
    'Nguyễn', 'Trần', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ',
    'Dương', 'Lê', 'Lý', 'Mai', 'Tô', 'Tạ', 'Tây', 'Khương', 'Kiều', 'Đinh'
]

LAST_NAMES = [
    'Minh', 'Hùng', 'Huy', 'Anh', 'Duy', 'Tùng', 'Quang', 'Hiệp', 'Thái', 'Phúc',
    'Linh', 'Hân', 'Hà', 'Thanh', 'Tâm', 'Trang', 'Hiền', 'Hòa', 'Hương', 'Hảo',
    'Đức', 'Kiên', 'Khánh', 'Khôi', 'Khoa', 'Thắng', 'Tiến', 'Tuấn', 'Tú', 'Vân',
    'Khang', 'Vân', 'Hào', 'Vũ', 'Xuân', 'Hữu', 'Ý'
]

def generate_vietnamese_name():
    """Tạo sinh tên Việt Nam"""
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    middle = random.choice(LAST_NAMES) if random.random() > 0.3 else ''
    
    if middle:
        return f"{first} {middle} {last}"
    return f"{first} {last}"

def generate_username(name):
    """Tạo sinh username từ tên"""
    # Loại bỏ dấu và chuyển thành lowercase
    name = name.lower().replace(' ', '_')
    # Thêm số ngẫu nhiên để đảm bảo unique
    name = f"{name}{random.randint(100, 9999)}"
    return name

def create_dataset(num_nodes=2105):
    """
    Tạo sinh mạng xã hội scale-free với num_nodes node
    Scale-free network là mô hình hợp lí cho mạng xã hội
    """
    print(f"Tạo sinh mạng với {num_nodes} nodes...")
    
    # Tạo Barabási-Albert network (scale-free)
    # m=5 nghĩa là mỗi node mới kết nối với 5 node cũ (hợp lí cho mạng xã hội)
    G = nx.barabasi_albert_graph(num_nodes, m=5)
    
    print(f"Mạng có {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    
    # Tạo nodes với tên
    nodes_data = []
    for node_id in G.nodes():
        name = generate_vietnamese_name()
        nodes_data.append({
            'id': node_id,
            'name': name,
            'username': generate_username(name)
        })
    
    # Tạo edges
    edges_data = []
    for source, target in G.edges():
        edges_data.append({
            'source': source,
            'target': target
        })
    
    # Tạo DataFrame
    nodes_df = pd.DataFrame(nodes_data)
    edges_df = pd.DataFrame(edges_data)
    
    # Lưu CSV
    output_dir = Path('')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    nodes_path = output_dir / f'sample_nodes_{num_nodes}.csv'
    edges_path = output_dir / f'sample_edges_{num_nodes}.csv'
    
    nodes_df.to_csv(nodes_path, index=False)
    edges_df.to_csv(edges_path, index=False)
    
    print(f"\n✅ Dữ liệu đã được tạo và lưu:")
    print(f"   - Nodes: {nodes_path}")
    print(f"   - Edges: {edges_path}")
    print(f"\n📊 Thống kê:")
    print(f"   - Số nodes: {len(nodes_df)}")
    print(f"   - Số edges: {len(edges_df)}")
    print(f"   - Mật độ: {nx.density(G):.4f}")
    print(f"   - Đường kính: {nx.diameter(G) if nx.is_connected(G) else 'N/A (không liên thông)'}")
    print(f"   - Độ trung bình: {sum(dict(G.degree()).values()) / G.number_of_nodes():.2f}")
    
    return nodes_df, edges_df, G

if __name__ == '__main__':
    random.seed(42)  # Để reproducible
    create_dataset(105)
