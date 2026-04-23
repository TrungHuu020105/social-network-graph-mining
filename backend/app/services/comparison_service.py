"""
Algorithm Comparison Service
"""

import networkx as nx
import time
from typing import Dict, List
from app.services.community_service import CommunityDetectionService
from app.services.recommendation_service import RecommendationService
from app.utils.graph_utils import get_graph_stats


class ComparisonService:
    """Dịch vụ so sánh các thuật toán"""
    
    @staticmethod
    def compare_community_algorithms(graph: nx.Graph) -> Dict:
        """So sánh các thuật toán community detection"""
        
        if graph.number_of_nodes() == 0:
            return {
                'comparison_type': 'community',
                'algorithms': []
            }
        
        results = []
        
        # Louvain
        comm_louvain, modularity_louvain, time_louvain = CommunityDetectionService.louvain(graph)
        results.append({
            'algorithm_name': 'Louvain',
            'num_communities': len(set(comm_louvain.values())),
            'modularity': round(modularity_louvain, 4),
            'execution_time': round(time_louvain, 4),
            'quality_score': round(modularity_louvain * 100, 2),
        })
        
        # Label Propagation
        comm_lp, modularity_lp, time_lp = CommunityDetectionService.label_propagation(graph)
        results.append({
            'algorithm_name': 'Label Propagation',
            'num_communities': len(set(comm_lp.values())),
            'modularity': round(modularity_lp, 4),
            'execution_time': round(time_lp, 4),
            'quality_score': round(modularity_lp * 100, 2),
        })
        
        return {
            'comparison_type': 'community',
            'algorithms': results,
        }
    
    @staticmethod
    def compare_recommendation_algorithms(
        graph: nx.Graph,
        nodes_data: Dict,
        source_node: str,
        top_k: int = 10,
    ) -> Dict:
        """So sánh các thuật toán recommendation"""
        
        if graph.number_of_nodes() == 0:
            return {
                'comparison_type': 'recommendation',
                'algorithms': []
            }
        
        results = []
        algorithms = RecommendationService.get_supported_algorithms()
        
        for algo in algorithms:
            start_time = time.time()
            recs, exec_time = RecommendationService.get_recommendations(
                graph, nodes_data, source_node, algorithm=algo, top_k=top_k
            )
            elapsed_time = time.time() - start_time
            
            # Tính average score
            avg_score = sum(r['score'] for r in recs) / len(recs) if recs else 0
            
            results.append({
                'algorithm': algo,
                'algorithm_name': RecommendationService.get_algorithm_label(algo),
                'algorithm_label': RecommendationService.get_algorithm_label(algo),
                'num_recommendations': len(recs),
                'average_score': round(avg_score, 4),
                'execution_time': round(elapsed_time, 4),
                'recommendations': recs,
            })
        
        return {
            'comparison_type': 'recommendation',
            'source_node': source_node,
            'algorithms': results,
        }
