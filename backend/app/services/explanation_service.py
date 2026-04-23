"""
Explanation Service - generate explanation for why a target is recommended.
"""

from typing import Dict, List

import networkx as nx

from app.services.recommendation_service import RecommendationService
from app.utils.graph_utils import (
    adamic_adar_score,
    get_common_neighbors,
    get_ego_network,
    jaccard_coefficient,
    node_has_common_community,
    shortest_path_distance,
)


class ExplanationService:
    """Service for recommendation explanations."""

    @staticmethod
    def explain_recommendation(
        graph: nx.Graph,
        nodes_data: Dict,
        source_id: str,
        target_id: str,
        algorithm: str = "adamic_adar",
        communities: Dict[str, int] | None = None,
    ) -> Dict:
        source_key = str(source_id)
        target_key = str(target_id)

        source_info = nodes_data.get(source_key, {})
        target_info = nodes_data.get(target_key, {})

        normalized_algorithm = RecommendationService.normalize_algorithm(algorithm)
        ranking_label = RecommendationService.get_algorithm_label(normalized_algorithm)
        ranking_score = RecommendationService.score_pair(
            graph=graph,
            node1=source_key,
            node2=target_key,
            algorithm=normalized_algorithm,
        )

        common_neighbors_list = list(get_common_neighbors(graph, source_key, target_key))
        jaccard = jaccard_coefficient(graph, source_key, target_key)
        adamic_adar = adamic_adar_score(graph, source_key, target_key)
        path_distance, shortest_path = shortest_path_distance(graph, source_key, target_key)

        same_community = False
        if communities:
            same_community = node_has_common_community(communities, source_key, target_key)

        scores = {
            "jaccard_coefficient": round(jaccard, 4),
            "adamic_adar": round(adamic_adar, 4),
            "ranking_score": round(ranking_score, 4),
            "common_neighbors_count": len(common_neighbors_list),
            "degree_source": graph.degree(source_key),
            "degree_target": graph.degree(target_key),
        }

        return {
            "source_id": source_key,
            "source_name": source_info.get("name", source_key),
            "source_username": source_info.get("username", source_key),
            "target_id": target_key,
            "target_name": target_info.get("name", target_key),
            "target_username": target_info.get("username", target_key),
            "algorithm": normalized_algorithm,
            "ranking_label": ranking_label,
            "ranking_score": round(ranking_score, 4),
            "jaccard_coefficient": round(jaccard, 4),
            "adamic_adar_score": round(adamic_adar, 4),
            "common_neighbors": common_neighbors_list,
            "num_common_neighbors": len(common_neighbors_list),
            "same_community": same_community,
            "shortest_path_distance": int(path_distance) if path_distance != float("inf") else -1,
            "shortest_path": shortest_path,
            "scores": scores,
            "explanation_text": ExplanationService._generate_explanation_text(
                common_neighbors=common_neighbors_list,
                jaccard=jaccard,
                adamic_adar=adamic_adar,
                same_community=same_community,
                algorithm=normalized_algorithm,
                ranking_score=ranking_score,
            ),
        }

    @staticmethod
    def _generate_explanation_text(
        common_neighbors: List[str],
        jaccard: float,
        adamic_adar: float,
        same_community: bool,
        algorithm: str,
        ranking_score: float,
    ) -> str:
        reasons: List[str] = []

        if len(common_neighbors) > 0:
            reasons.append(f"Co {len(common_neighbors)} ban chung")

        if jaccard > 0.1:
            reasons.append(f"Giong nhau {round(jaccard * 100, 1)}% (Jaccard)")

        if algorithm == "resource_allocation":
            reasons.append(f"Diem RA {ranking_score:.4f}")
            if len(common_neighbors) > 0:
                reasons.append("RA uu tien ban chung co do pho bien thap")
        elif algorithm == "preferential_attachment":
            reasons.append(f"Diem PA {ranking_score:.4f}")
            reasons.append("PA uu tien cap user co degree cao")
        elif algorithm == "gcn":
            reasons.append(f"Diem GCN similarity {ranking_score:.4f}")
            reasons.append("GCN dua tren embedding hoc tu cau truc do thi")
        else:
            if adamic_adar > 0.5:
                reasons.append(f"Diem Adamic-Adar cao ({adamic_adar:.2f})")

        if same_community:
            reasons.append("Cung cong dong")

        if not reasons:
            reasons.append("Co kha nang ket noi dua tren cau truc mang")

        return " • ".join(reasons)

    @staticmethod
    def get_ego_network_data(
        graph: nx.Graph,
        nodes_data: Dict,
        center_node: str,
        radius: int = 1,
    ) -> Dict:
        ego_graph = get_ego_network(graph, center_node, radius=radius)

        nodes = []
        for node in ego_graph.nodes():
            info = nodes_data.get(node, {})
            nodes.append(
                {
                    "id": node,
                    "label": info.get("name", node),
                    "username": info.get("username", node),
                    "degree": ego_graph.degree(node),
                    "is_center": node == center_node,
                }
            )

        edges = []
        for source, target in ego_graph.edges():
            edges.append({"source": source, "target": target})

        return {
            "center_node": center_node,
            "radius": radius,
            "nodes": nodes,
            "edges": edges,
            "num_nodes": ego_graph.number_of_nodes(),
            "num_edges": ego_graph.number_of_edges(),
        }

