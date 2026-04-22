"""
Link Prediction & Recommendation Services
"""

import networkx as nx
from typing import Dict, List, Tuple
import time
import math
from app.utils.graph_utils import (
    get_common_neighbors,
    jaccard_coefficient,
    adamic_adar_score,
    preferential_attachment_score,
    resource_allocation_score,
)


class RecommendationService:
    """Dịch vụ gợi ý kết nối"""
    
    @staticmethod
    def get_non_neighbors(graph: nx.Graph, node: str) -> List[str]:
        """Lấy danh sách những người chưa kết nối"""
        neighbors = set(graph.neighbors(node))
        neighbors.add(node)  # Loại bỏ chính nó
        
        all_nodes = set(graph.nodes())
        non_neighbors = list(all_nodes - neighbors)
        
        return non_neighbors
    
    @staticmethod
    def common_neighbors_score(graph: nx.Graph, node1: str, node2: str) -> float:
        """Score dựa trên số bạn chung"""
        common = len(get_common_neighbors(graph, node1, node2))
        return float(common)
    
    @staticmethod
    def jaccard_score(graph: nx.Graph, node1: str, node2: str) -> float:
        """Score dựa trên Jaccard Coefficient"""
        return jaccard_coefficient(graph, node1, node2)
    
    @staticmethod
    def adamic_adar_score(graph: nx.Graph, node1: str, node2: str) -> float:
        """Score dựa trên Adamic-Adar"""
        return adamic_adar_score(graph, node1, node2)
    
    @staticmethod
    def preferential_attachment_score(graph: nx.Graph, node1: str, node2: str) -> float:
        """Score dựa trên Preferential Attachment"""
        score = preferential_attachment_score(graph, node1, node2)
        # Normalize
        max_degree = max(dict(graph.degree()).values()) if graph.number_of_nodes() > 0 else 1
        return score / (max_degree ** 2) if max_degree > 0 else 0.0
    
    @staticmethod
    def resource_allocation_score(graph: nx.Graph, node1: str, node2: str) -> float:
        """Score dựa trên Resource Allocation"""
        return resource_allocation_score(graph, node1, node2)
    
    @staticmethod
    def get_recommendations(
        graph: nx.Graph,
        nodes_data: Dict,
        source_node: str,
        algorithm: str = 'adamic_adar',
        top_k: int = 10,
    ) -> Tuple[List[Dict], float]:
        """
        Lấy danh sách gợi ý kết nối cho một user
        
        Args:
            graph: Input graph
            nodes_data: Node information
            source_node: Node cần gợi ý
            algorithm: Thuật toán tính score
            top_k: Số lượng gợi ý
        
        Returns:
            Tuple(recommendations_list, execution_time)
        """
        start_time = time.time()
        
        # Lấy những người chưa kết nối
        non_neighbors = RecommendationService.get_non_neighbors(graph, source_node)
        
        # Tính score cho từng người
        scores = {}
        for target_node in non_neighbors:
            if algorithm == 'common_neighbors':
                score = RecommendationService.common_neighbors_score(graph, source_node, target_node)
            elif algorithm == 'jaccard':
                score = RecommendationService.jaccard_score(graph, source_node, target_node)
            elif algorithm == 'adamic_adar':
                score = RecommendationService.adamic_adar_score(graph, source_node, target_node)
            elif algorithm == 'preferential_attachment':
                score = RecommendationService.preferential_attachment_score(graph, source_node, target_node)
            elif algorithm == 'resource_allocation':
                score = RecommendationService.resource_allocation_score(graph, source_node, target_node)
            else:
                score = RecommendationService.adamic_adar_score(graph, source_node, target_node)
            
            scores[target_node] = score
        
        # Sort và lấy top K
        sorted_recommendations = sorted(
            scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_k]
        
        # Format result
        recommendations = []
        for target_node, score in sorted_recommendations:
            if score <= 0:
                continue  # Skip nếu score = 0
            
            target_info = nodes_data.get(target_node, {})
            common = get_common_neighbors(graph, source_node, target_node)
            
            recommendations.append({
                'target_id': target_node,
                'target_username': target_info.get('username', target_node),
                'target_name': target_info.get('name', ''),
                'score': round(score, 4),
                'common_neighbors': list(common),
                'num_common_neighbors': len(common),
            })
        
        elapsed_time = time.time() - start_time
        
        return recommendations, elapsed_time
