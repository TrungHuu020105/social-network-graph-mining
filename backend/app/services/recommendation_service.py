"""
Link prediction & recommendation services (single baseline).
"""

import time
from typing import Dict, List, Tuple

import networkx as nx

from app.utils.graph_utils import adamic_adar_score, get_common_neighbors

BASELINE_ALGORITHM = "adamic_adar"
SUPPORTED_ALGORITHMS = (
    "adamic_adar",
    "resource_allocation",
    "preferential_attachment",
    "gcn",
)
ALGORITHM_LABELS = {
    "adamic_adar": "Adamic-Adar",
    "resource_allocation": "Resource Allocation (RA)",
    "preferential_attachment": "Preferential Attachment (PA)",
    "gcn": "GCN Link Prediction",
}
ALGORITHM_ALIASES = {
    "aa": "adamic_adar",
    "adamic_adar": "adamic_adar",
    "resource_allocation": "resource_allocation",
    "ra": "resource_allocation",
    "preferential_attachment": "preferential_attachment",
    "pa": "preferential_attachment",
    "gcn": "gcn",
}


class RecommendationService:
    @staticmethod
    def get_supported_algorithms() -> List[str]:
        return list(SUPPORTED_ALGORITHMS)

    @staticmethod
    def get_algorithm_label(algorithm: str) -> str:
        normalized = RecommendationService.normalize_algorithm(algorithm)
        return ALGORITHM_LABELS.get(normalized, normalized)

    @staticmethod
    def normalize_algorithm(algorithm: str) -> str:
        key = (algorithm or "").strip().lower()
        return ALGORITHM_ALIASES.get(key, BASELINE_ALGORITHM)

    @staticmethod
    def get_non_neighbors(graph: nx.Graph, node: str) -> List[str]:
        neighbors = set(graph.neighbors(node))
        neighbors.add(node)
        return list(set(graph.nodes()) - neighbors)

    @staticmethod
    def baseline_score(graph: nx.Graph, node1: str, node2: str) -> float:
        return adamic_adar_score(graph, node1, node2)

    @staticmethod
    def score_pair(graph: nx.Graph, node1: str, node2: str, algorithm: str) -> float:
        normalized = RecommendationService.normalize_algorithm(algorithm)
        source = str(node1)
        target = str(node2)

        if normalized == "resource_allocation":
            result = next(nx.resource_allocation_index(graph, [(source, target)]), None)
            return float(result[2]) if result else 0.0

        if normalized == "preferential_attachment":
            result = next(nx.preferential_attachment(graph, [(source, target)]), None)
            return float(result[2]) if result else 0.0

        if normalized == "gcn":
            from app.services.gcn_link_service import get_gcn_link_service

            link_service = get_gcn_link_service()
            return link_service.score_pair(source, target)

        result = next(nx.adamic_adar_index(graph, [(source, target)]), None)
        return float(result[2]) if result else 0.0

    @staticmethod
    def _score_non_neighbors(
        graph: nx.Graph,
        source_node: str,
        non_neighbors: List[str],
        algorithm: str,
    ) -> Dict[str, float]:
        algorithm = RecommendationService.normalize_algorithm(algorithm)
        if not non_neighbors:
            return {}

        pairs = [(source_node, target) for target in non_neighbors]
        scores: Dict[str, float] = {target: 0.0 for target in non_neighbors}

        if algorithm == "resource_allocation":
            for _, target, score in nx.resource_allocation_index(graph, pairs):
                scores[str(target)] = float(score)
            return scores

        if algorithm == "preferential_attachment":
            for _, target, score in nx.preferential_attachment(graph, pairs):
                scores[str(target)] = float(score)
            return scores

        if algorithm == "gcn":
            from app.services.gcn_link_service import get_gcn_link_service

            link_service = get_gcn_link_service()
            return link_service.score_candidates(str(source_node), [str(target) for target in non_neighbors])

        for _, target, score in nx.adamic_adar_index(graph, pairs):
            scores[str(target)] = float(score)
        return scores

    @staticmethod
    def get_recommendations(
        graph: nx.Graph,
        nodes_data: Dict,
        source_node: str,
        algorithm: str = BASELINE_ALGORITHM,
        top_k: int = 10,
    ) -> Tuple[List[Dict], float]:
        start_time = time.time()
        normalized_algorithm = RecommendationService.normalize_algorithm(algorithm)

        non_neighbors = RecommendationService.get_non_neighbors(graph, source_node)
        scores = RecommendationService._score_non_neighbors(
            graph=graph,
            source_node=source_node,
            non_neighbors=non_neighbors,
            algorithm=normalized_algorithm,
        )

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
                    "algorithm": normalized_algorithm,
                }
            )

        elapsed_time = time.time() - start_time
        return recommendations, elapsed_time
