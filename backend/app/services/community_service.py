"""
Community detection services.
"""

import time
from collections import defaultdict
from typing import Dict, List, Tuple

import networkx as nx


class CommunityDetectionService:
    COLORS = [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#FFA07A",
        "#98D8C8",
        "#F7DC6F",
        "#BB8FCE",
        "#85C1E2",
        "#F8B88B",
        "#A8E6CF",
        "#FFD3B6",
        "#FFAAA5",
        "#FF8B94",
        "#A8DADC",
        "#F1FAEE",
        "#E63946",
        "#457B9D",
        "#1D3557",
    ]

    @staticmethod
    def louvain(graph: nx.Graph) -> Tuple[Dict[str, int], float, float]:
        start_time = time.time()
        if graph.number_of_nodes() == 0:
            return {}, 0.0, 0.0

        communities_list = list(nx.community.greedy_modularity_communities(graph))
        communities: Dict[str, int] = {}
        for comm_id, nodes in enumerate(communities_list):
            for node in nodes:
                communities[str(node)] = comm_id

        modularity = nx.community.modularity(graph, communities_list)
        elapsed_time = time.time() - start_time
        return communities, modularity, elapsed_time

    @staticmethod
    def label_propagation(graph: nx.Graph) -> Tuple[Dict[str, int], float, float]:
        start_time = time.time()
        if graph.number_of_nodes() == 0:
            return {}, 0.0, 0.0

        communities_list = list(nx.community.label_propagation_communities(graph))
        communities: Dict[str, int] = {}
        for comm_id, nodes in enumerate(communities_list):
            for node in nodes:
                communities[str(node)] = comm_id

        modularity = nx.community.modularity(graph, communities_list)
        elapsed_time = time.time() - start_time
        return communities, modularity, elapsed_time

    @staticmethod
    def get_community_stats(graph: nx.Graph, communities: Dict[str, int]) -> List[Dict]:
        community_groups: Dict[int, List[str]] = defaultdict(list)
        for node, comm_id in communities.items():
            community_groups[int(comm_id)].append(str(node))

        stats = []
        for comm_id, members in sorted(community_groups.items()):
            subgraph = graph.subgraph(members)
            size = len(members)
            num_edges = subgraph.number_of_edges()
            density = (2 * num_edges) / (size * (size - 1)) if size > 1 else 0.0
            stats.append(
                {
                    "id": comm_id,
                    "size": size,
                    "members": sorted(members),
                    "num_edges": num_edges,
                    "density": round(density, 4),
                }
            )
        return stats

    @staticmethod
    def get_community_colors(num_communities: int) -> Dict[int, str]:
        colors: Dict[int, str] = {}
        for i in range(num_communities):
            colors[i] = CommunityDetectionService.COLORS[i % len(CommunityDetectionService.COLORS)]
        return colors

    @staticmethod
    def compare_all_algorithms(graph: nx.Graph) -> Dict:
        results: Dict[str, Dict] = {}
        best_modularity = -1.0
        best_algorithm = "louvain"

        communities_louvain, modularity_louvain, time_louvain = CommunityDetectionService.louvain(graph)
        results["louvain"] = {
            "num_communities": len(set(communities_louvain.values())),
            "modularity": round(modularity_louvain, 4),
            "execution_time": round(time_louvain, 4),
            "communities": communities_louvain,
        }
        if modularity_louvain > best_modularity:
            best_modularity = modularity_louvain
            best_algorithm = "louvain"

        communities_lp, modularity_lp, time_lp = CommunityDetectionService.label_propagation(graph)
        results["label_propagation"] = {
            "num_communities": len(set(communities_lp.values())),
            "modularity": round(modularity_lp, 4),
            "execution_time": round(time_lp, 4),
            "communities": communities_lp,
        }
        if modularity_lp > best_modularity:
            best_modularity = modularity_lp
            best_algorithm = "label_propagation"

        results["best_algorithm"] = best_algorithm
        results["best_modularity"] = round(best_modularity, 4)
        return results

    @staticmethod
    def get_best_communities(graph: nx.Graph) -> Tuple[Dict[str, int], float, str]:
        comparison = CommunityDetectionService.compare_all_algorithms(graph)
        best_algo = comparison["best_algorithm"]
        if best_algo == "louvain":
            return comparison["louvain"]["communities"], comparison["louvain"]["modularity"], "louvain"
        return (
            comparison["label_propagation"]["communities"],
            comparison["label_propagation"]["modularity"],
            "label_propagation",
        )
