"""
Centrality & influencer services (lightweight set).
"""

from typing import Dict, List

import networkx as nx


class CentralityService:
    @staticmethod
    def degree_centrality(graph: nx.Graph) -> Dict[str, float]:
        if graph.number_of_nodes() == 0:
            return {}
        return nx.degree_centrality(graph)

    @staticmethod
    def pagerank(graph: nx.Graph) -> Dict[str, float]:
        if graph.number_of_nodes() == 0:
            return {}
        return nx.pagerank(graph)

    @staticmethod
    def get_all_centralities(graph: nx.Graph) -> Dict[str, Dict[str, float]]:
        return {
            "degree_centrality": CentralityService.degree_centrality(graph),
            "pagerank": CentralityService.pagerank(graph),
        }

    @staticmethod
    def get_top_influential_users(
        graph: nx.Graph,
        nodes_data: Dict,
        metric: str = "pagerank",
        limit: int = 10,
    ) -> List[Dict]:
        metric = "degree" if metric == "degree" else "pagerank"
        centrality = (
            CentralityService.degree_centrality(graph)
            if metric == "degree"
            else CentralityService.pagerank(graph)
        )

        sorted_users = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:limit]
        result = []
        for user_id, score in sorted_users:
            user_key = str(user_id)
            user_info = nodes_data.get(user_key, {})
            result.append(
                {
                    "user_id": user_key,
                    "username": user_info.get("username", user_key),
                    "name": user_info.get("name", ""),
                    "degree": graph.degree(user_key),
                    "score": round(float(score), 4),
                    "metric": metric,
                }
            )
        return result
