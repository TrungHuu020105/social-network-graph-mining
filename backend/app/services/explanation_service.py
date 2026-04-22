"""
Explanation Service - Giải thích vì sao được gợi ý
"""

import networkx as nx
from typing import Dict, List, Tuple
from app.utils.graph_utils import (
    get_common_neighbors,
    jaccard_coefficient,
    adamic_adar_score,
    shortest_path_distance,
    get_ego_network,
    node_has_common_community,
)


class ExplanationService:
    """Dịch vụ giải thích gợi ý"""
    
    @staticmethod
    def explain_recommendation(
        graph: nx.Graph,
        nodes_data: Dict,
        source_id: str,
        target_id: str,
        communities: Dict[str, int] = None,
    ) -> Dict:
        """
        Giải thích tại sao user target được gợi ý cho source
        """
        
        source_info = nodes_data.get(source_id, {})
        target_info = nodes_data.get(target_id, {})
        
        # Tính các metrics
        common_neighbors_list = list(get_common_neighbors(graph, source_id, target_id))
        jaccard = jaccard_coefficient(graph, source_id, target_id)
        adamic_adar = adamic_adar_score(graph, source_id, target_id)
        
        # Shortest path
        path_distance, shortest_path = shortest_path_distance(graph, source_id, target_id)
        
        # Check same community
        same_community = False
        if communities:
            same_community = node_has_common_community(communities, source_id, target_id)
        
        # Ego network
        ego_subgraph = get_ego_network(graph, source_id, radius=2)
        
        scores = {
            'jaccard_coefficient': round(jaccard, 4),
            'adamic_adar': round(adamic_adar, 4),
            'common_neighbors_count': len(common_neighbors_list),
            'degree_source': graph.degree(source_id),
            'degree_target': graph.degree(target_id),
        }
        
        return {
            'source_id': source_id,
            'source_name': source_info.get('name', source_id),
            'source_username': source_info.get('username', source_id),
            'target_id': target_id,
            'target_name': target_info.get('name', target_id),
            'target_username': target_info.get('username', target_id),
            'jaccard_coefficient': round(jaccard, 4),
            'adamic_adar_score': round(adamic_adar, 4),
            'common_neighbors': common_neighbors_list,
            'num_common_neighbors': len(common_neighbors_list),
            'same_community': same_community,
            'shortest_path_distance': int(path_distance) if path_distance != float('inf') else -1,
            'shortest_path': shortest_path,
            'scores': scores,
            'explanation_text': ExplanationService._generate_explanation_text(
                source_info, target_info, common_neighbors_list, 
                jaccard, adamic_adar, same_community
            ),
        }
    
    @staticmethod
    def _generate_explanation_text(
        source_info: Dict,
        target_info: Dict,
        common_neighbors: List[str],
        jaccard: float,
        adamic_adar: float,
        same_community: bool,
    ) -> str:
        """Tạo text giải thích"""
        
        source_name = source_info.get('name', 'User')
        target_name = target_info.get('name', 'User')
        
        reasons = []
        
        if len(common_neighbors) > 0:
            reasons.append(
                f"Có {len(common_neighbors)} bạn chung"
            )
        
        if jaccard > 0.1:
            reasons.append(
                f"Giống nhau {round(jaccard*100, 1)}% (Jaccard)"
            )
        
        if adamic_adar > 0.5:
            reasons.append(
                f"Điểm Adamic-Adar cao ({adamic_adar:.2f})"
            )
        
        if same_community:
            reasons.append("Cùng cộng đồng")
        
        if not reasons:
            reasons.append("Có khả năng kết nối dựa trên cấu trúc mạng")
        
        return " • ".join(reasons)
    
    @staticmethod
    def get_ego_network_data(
        graph: nx.Graph,
        nodes_data: Dict,
        center_node: str,
        radius: int = 1,
    ) -> Dict:
        """Lấy dữ liệu ego network để visualize"""
        
        ego_graph = get_ego_network(graph, center_node, radius=radius)
        
        # Chuẩn bị nodes
        nodes = []
        for node in ego_graph.nodes():
            info = nodes_data.get(node, {})
            nodes.append({
                'id': node,
                'label': info.get('name', node),
                'username': info.get('username', node),
                'degree': ego_graph.degree(node),
                'is_center': node == center_node,
            })
        
        # Chuẩn bị edges
        edges = []
        for source, target in ego_graph.edges():
            edges.append({
                'source': source,
                'target': target,
            })
        
        return {
            'center_node': center_node,
            'radius': radius,
            'nodes': nodes,
            'edges': edges,
            'num_nodes': ego_graph.number_of_nodes(),
            'num_edges': ego_graph.number_of_edges(),
        }
