"""
Centrality & Influencer Services
"""

import networkx as nx
from typing import Dict, List, Tuple
import time


class CentralityService:
    """Dịch vụ tính toán centrality measures"""
    
    @staticmethod
    def degree_centrality(graph: nx.Graph) -> Dict[str, float]:
        """Tính Degree Centrality"""
        return nx.degree_centrality(graph)
    
    @staticmethod
    def betweenness_centrality(graph: nx.Graph) -> Dict[str, float]:
        """Tính Betweenness Centrality"""
        if graph.number_of_nodes() == 0:
            return {}
        return nx.betweenness_centrality(graph)
    
    @staticmethod
    def closeness_centrality(graph: nx.Graph) -> Dict[str, float]:
        """Tính Closeness Centrality"""
        if graph.number_of_nodes() == 0:
            return {}
        
        if not nx.is_connected(graph):
            # Cho đồ thị không liên thông, tính riêng lẻ
            centrality = {}
            for node in graph.nodes():
                # Tính cho largest connected component chứa node
                if node in graph.nodes():
                    try:
                        c = nx.closeness_centrality(graph, u=node)
                        centrality[node] = c
                    except:
                        centrality[node] = 0.0
            return centrality
        else:
            return nx.closeness_centrality(graph)
    
    @staticmethod
    def pagerank(graph: nx.Graph) -> Dict[str, float]:
        """Tính PageRank"""
        if graph.number_of_nodes() == 0:
            return {}
        return nx.pagerank(graph)
    
    @staticmethod
    def eigenvector_centrality(graph: nx.Graph) -> Dict[str, float]:
        """Tính Eigenvector Centrality"""
        if graph.number_of_nodes() == 0:
            return {}
        
        try:
            return nx.eigenvector_centrality(graph, max_iter=100)
        except:
            # Fallback nếu không hội tụ
            return nx.degree_centrality(graph)
    
    @staticmethod
    def get_all_centralities(graph: nx.Graph) -> Dict[str, Dict[str, float]]:
        """Tính tất cả các centrality measures"""
        return {
            'degree_centrality': CentralityService.degree_centrality(graph),
            'betweenness_centrality': CentralityService.betweenness_centrality(graph),
            'closeness_centrality': CentralityService.closeness_centrality(graph),
            'pagerank': CentralityService.pagerank(graph),
            'eigenvector_centrality': CentralityService.eigenvector_centrality(graph),
        }
    
    @staticmethod
    def get_top_influential_users(
        graph: nx.Graph,
        nodes_data: Dict,
        metric: str = 'pagerank',
        limit: int = 10
    ) -> List[Dict]:
        """Lấy top N users theo metric"""
        
        # Tính centrality
        if metric == 'degree':
            centrality = CentralityService.degree_centrality(graph)
        elif metric == 'betweenness':
            centrality = CentralityService.betweenness_centrality(graph)
        elif metric == 'closeness':
            centrality = CentralityService.closeness_centrality(graph)
        elif metric == 'pagerank':
            centrality = CentralityService.pagerank(graph)
        elif metric == 'eigenvector':
            centrality = CentralityService.eigenvector_centrality(graph)
        else:
            centrality = CentralityService.pagerank(graph)
        
        # Sort and get top N
        sorted_users = sorted(
            centrality.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        result = []
        for user_id, score in sorted_users:
            user_info = nodes_data.get(user_id, {})
            result.append({
                'user_id': user_id,
                'username': user_info.get('username', user_id),
                'name': user_info.get('name', ''),
                'degree': graph.degree(user_id),
                'score': round(score, 4),
                'metric': metric,
            })
        
        return result
    
    @staticmethod
    def get_combined_score(graph: nx.Graph, nodes_data: Dict) -> Dict[str, Dict]:
        """
        Tính combined score từ tất cả centrality measures
        Weighted average của tất cả metrics
        """
        
        all_centralities = CentralityService.get_all_centralities(graph)
        
        # Weights cho từng metric
        weights = {
            'degree_centrality': 0.15,
            'betweenness_centrality': 0.25,
            'closeness_centrality': 0.20,
            'pagerank': 0.25,
            'eigenvector_centrality': 0.15,
        }
        
        combined_scores = {}
        for node in graph.nodes():
            score = 0.0
            for metric_name, metric_values in all_centralities.items():
                if node in metric_values:
                    score += metric_values[node] * weights.get(metric_name, 0)
            combined_scores[node] = round(score, 4)
        
        return combined_scores
