"""
Evaluation Service - Đánh giá chất lượng recommendations
"""

import networkx as nx
import time
from typing import Dict, List, Tuple
from app.services.recommendation_service import RecommendationService
from app.utils.graph_utils import remove_edges_for_evaluation


class EvaluationService:
    """Dịch vụ đánh giá recommendations"""
    
    @staticmethod
    def evaluate_recommendations(
        graph: nx.Graph,
        nodes_data: Dict,
        algorithm: str = 'adamic_adar',
        top_k: int = 10,
        hidden_edge_ratio: float = 0.1,
    ) -> Dict:
        """
        Đánh giá chất lượng recommendation bằng cách ẩn edges và test
        
        Args:
            graph: Input graph
            nodes_data: Node information
            algorithm: Recommendation algorithm
            top_k: Số gợi ý
            hidden_edge_ratio: Tỷ lệ edges cần ẩn để test
        
        Returns:
            Dict với các evaluation metrics
        """
        
        start_time = time.time()
        
        if graph.number_of_nodes() == 0:
            return {
                'algorithm': algorithm,
                'top_k': top_k,
                'hidden_edge_ratio': hidden_edge_ratio,
                'precision_at_k': 0,
                'hit_rate': 0,
                'num_edges_hidden': 0,
                'num_edges_predicted': 0,
                'execution_time': 0,
            }
        
        # Ẩn một số edges
        test_graph, hidden_edges = remove_edges_for_evaluation(graph, ratio=hidden_edge_ratio)
        
        num_edges_hidden = len(hidden_edges)
        
        # Tính recommendations dựa trên test graph
        hidden_edge_dict = set(hidden_edges)
        
        # Đếm bao nhiêu hidden edges được dự đoán
        num_correct_predictions = 0
        total_predictions = 0
        
        # Để test chính xác, ta check cho từng hidden edge xem nó có được gợi ý không
        for source, target in hidden_edges:
            recs, _ = RecommendationService.get_recommendations(
                test_graph, nodes_data, source, algorithm=algorithm, top_k=top_k
            )
            
            # Check xem target có trong gợi ý không
            recommended_targets = [r['target_id'] for r in recs]
            
            if target in recommended_targets:
                num_correct_predictions += 1
            
            total_predictions += 1
        
        # Tính metrics
        hit_rate = num_correct_predictions / num_edges_hidden if num_edges_hidden > 0 else 0
        precision_at_k = num_correct_predictions / total_predictions if total_predictions > 0 else 0
        
        elapsed_time = time.time() - start_time
        
        return {
            'algorithm': algorithm,
            'top_k': top_k,
            'hidden_edge_ratio': hidden_edge_ratio,
            'precision_at_k': round(precision_at_k, 4),
            'hit_rate': round(hit_rate, 4),
            'num_edges_hidden': num_edges_hidden,
            'num_edges_predicted': total_predictions,
            'num_correct_predictions': num_correct_predictions,
            'execution_time': round(elapsed_time, 4),
        }
    
    @staticmethod
    def evaluate_multiple_algorithms(
        graph: nx.Graph,
        nodes_data: Dict,
        top_k: int = 10,
        hidden_edge_ratio: float = 0.1,
    ) -> Dict:
        """Đánh giá nhiều algorithms"""
        
        algorithms = [
            'common_neighbors',
            'jaccard',
            'adamic_adar',
            'preferential_attachment',
            'resource_allocation',
        ]
        
        results = []
        for algo in algorithms:
            try:
                eval_result = EvaluationService.evaluate_recommendations(
                    graph, nodes_data, algorithm=algo, 
                    top_k=top_k, hidden_edge_ratio=hidden_edge_ratio
                )
                results.append(eval_result)
            except Exception as e:
                # Skip nếu có lỗi
                pass
        
        return {
            'evaluation_type': 'multiple_algorithms',
            'top_k': top_k,
            'hidden_edge_ratio': hidden_edge_ratio,
            'results': results,
        }
