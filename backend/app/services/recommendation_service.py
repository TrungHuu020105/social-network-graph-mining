"""
Link prediction & recommendation services (single baseline).
"""

import time
from typing import Dict, List, Tuple

import networkx as nx

from app.utils.graph_utils import adamic_adar_score, get_common_neighbors

BASELINE_ALGORITHM = "adamic_adar"


class RecommendationService:
    @staticmethod
    def normalize_algorithm(algorithm: str) -> str:
        return BASELINE_ALGORITHM

    @staticmethod
    def get_non_neighbors(graph: nx.Graph, node: str) -> List[str]:
        neighbors = set(graph.neighbors(node))
        neighbors.add(node)
        return list(set(graph.nodes()) - neighbors)

    @staticmethod
    def baseline_score(graph: nx.Graph, node1: str, node2: str) -> float:
        return adamic_adar_score(graph, node1, node2)

    @staticmethod
    def get_recommendations(
        graph: nx.Graph,
        nodes_data: Dict,
        source_node: str,
        algorithm: str = BASELINE_ALGORITHM,
        top_k: int = 10,
    ) -> Tuple[List[Dict], float]:
        start_time = time.time()
        _ = RecommendationService.normalize_algorithm(algorithm)

        non_neighbors = RecommendationService.get_non_neighbors(graph, source_node)

        scores: Dict[str, float] = {}
        for target_node in non_neighbors:
            scores[target_node] = RecommendationService.baseline_score(graph, source_node, target_node)

        sorted_recommendations = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        recommendations = []
        for target_node, score in sorted_recommendations:
            if score <= 0:
                continue
            target_key = str(target_node)
            target_info = nodes_data.get(target_key, {})
            common = get_common_neighbors(graph, source_node, target_key)

            recommendations.append(
                {
                    "target_id": target_key,
                    "target_username": target_info.get("username", target_key),
                    "target_name": target_info.get("name", ""),
                    "score": round(float(score), 4),
                    "common_neighbors": list(common),
                    "num_common_neighbors": len(common),
                }
            )

        elapsed_time = time.time() - start_time
        return recommendations, elapsed_time
