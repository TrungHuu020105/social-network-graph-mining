"""
Các hàm tiện ích cho graph processing
"""

import networkx as nx
from typing import Dict, List, Set, Tuple
import random
import math


def get_graph_stats(graph: nx.Graph) -> Dict:
    """Tính thống kê tổng quan của graph"""
    
    if graph.number_of_nodes() == 0:
        return {
            'num_nodes': 0,
            'num_edges': 0,
            'density': 0,
            'avg_degree': 0,
            'isolated_nodes': 0,
            'diameter': 0,
            'avg_clustering_coefficient': 0,
        }
    
    num_nodes = graph.number_of_nodes()
    num_edges = graph.number_of_edges()
    density = nx.density(graph)
    avg_degree = 2 * num_edges / num_nodes if num_nodes > 0 else 0
    isolated_nodes = len(list(nx.isolates(graph)))
    
    # Diameter only for connected component
    if nx.is_connected(graph):
        diameter = nx.diameter(graph)
    else:
        # Lấy diameter của largest connected component
        largest_cc = max(nx.connected_components(graph), key=len)
        subgraph = graph.subgraph(largest_cc)
        diameter = nx.diameter(subgraph) if subgraph.number_of_nodes() > 1 else 1
    
    avg_clustering = nx.average_clustering(graph)
    
    return {
        'num_nodes': num_nodes,
        'num_edges': num_edges,
        'density': round(density, 4),
        'avg_degree': round(avg_degree, 2),
        'isolated_nodes': isolated_nodes,
        'diameter': diameter,
        'avg_clustering_coefficient': round(avg_clustering, 4),
    }


def get_common_neighbors(graph: nx.Graph, node1: str, node2: str) -> Set[str]:
    """Lấy danh sách bạn chung giữa hai node"""
    neighbors1 = set(graph.neighbors(node1))
    neighbors2 = set(graph.neighbors(node2))
    return neighbors1 & neighbors2


def jaccard_coefficient(graph: nx.Graph, node1: str, node2: str) -> float:
    """Tính Jaccard coefficient giữa hai node"""
    neighbors1 = set(graph.neighbors(node1)) | {node1}
    neighbors2 = set(graph.neighbors(node2)) | {node2}
    
    if len(neighbors1 | neighbors2) == 0:
        return 0.0
    
    return len(neighbors1 & neighbors2) / len(neighbors1 | neighbors2)


def adamic_adar_score(graph: nx.Graph, node1: str, node2: str) -> float:
    """Tính Adamic-Adar score giữa hai node"""
    common_neighbors = get_common_neighbors(graph, node1, node2)
    
    score = 0.0
    for cn in common_neighbors:
        degree = graph.degree(cn)
        if degree > 1:
            score += 1.0 / math.log(degree)
    
    return round(score, 4)


def shortest_path_distance(graph: nx.Graph, node1: str, node2: str) -> Tuple[int, List]:
    """Tính khoảng cách shortest path và path"""
    try:
        path = nx.shortest_path(graph, node1, node2)
        return len(path) - 1, path
    except nx.NetworkXNoPath:
        return float('inf'), []
    except nx.NodeNotFound:
        return float('inf'), []


def get_ego_network(graph: nx.Graph, node: str, radius: int = 1) -> nx.Graph:
    """Lấy ego network của một node"""
    ego_nodes = nx.ego_graph(graph, node, radius=radius)
    return ego_nodes


def common_neighbor_count(graph: nx.Graph, node1: str, node2: str) -> int:
    """Đếm số bạn chung"""
    return len(get_common_neighbors(graph, node1, node2))


def preferential_attachment_score(graph: nx.Graph, node1: str, node2: str) -> float:
    """Tính Preferential Attachment score"""
    degree1 = graph.degree(node1)
    degree2 = graph.degree(node2)
    return degree1 * degree2


def resource_allocation_score(graph: nx.Graph, node1: str, node2: str) -> float:
    """Tính Resource Allocation score"""
    common_neighbors = get_common_neighbors(graph, node1, node2)
    
    score = 0.0
    for cn in common_neighbors:
        degree = graph.degree(cn)
        if degree > 0:
            score += 1.0 / degree
    
    return round(score, 4)


def remove_edges_for_evaluation(graph: nx.Graph, ratio: float = 0.1) -> Tuple[nx.Graph, List]:
    """
    Ẩn một tỷ lệ edge cho evaluation
    
    Args:
        graph: Graph gốc
        ratio: Tỷ lệ edges cần ẩn (0.1 = 10%)
    
    Returns:
        Tuple(graph_without_hidden_edges, hidden_edges_list)
    """
    all_edges = list(graph.edges())
    num_to_remove = max(1, int(len(all_edges) * ratio))
    hidden_edges = random.sample(all_edges, num_to_remove)
    
    # Tạo graph copy và xóa edges
    test_graph = graph.copy()
    for u, v in hidden_edges:
        test_graph.remove_edge(u, v)
    
    return test_graph, hidden_edges


def node_has_common_community(communities: Dict[str, int], node1: str, node2: str) -> bool:
    """Kiểm tra hai node có cùng cộng đồng không"""
    if node1 not in communities or node2 not in communities:
        return False
    return communities[node1] == communities[node2]
