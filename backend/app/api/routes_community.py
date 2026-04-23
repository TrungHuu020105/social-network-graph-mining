"""
Routes for community analysis.
"""

from fastapi import APIRouter, Query

from app.core.data_storage import get_graph_builder
from app.schemas.models import Community, CommunityStats
from app.services.community_service import CommunityDetectionService

router = APIRouter(prefix="/api", tags=["community"])


@router.get("/communities")
async def get_communities(algorithm: str = Query("louvain")):
    graph = get_graph_builder().get_graph()

    if algorithm == "label_propagation":
        communities, modularity, exec_time = CommunityDetectionService.label_propagation(graph)
    else:
        communities, modularity, exec_time = CommunityDetectionService.louvain(graph)
        algorithm = "louvain"

    stats = CommunityDetectionService.get_community_stats(graph, communities)
    community_list = [
        Community(
            id=stat["id"],
            size=stat["size"],
            members=stat["members"],
            modularity=stat.get("modularity"),
            density=stat["density"],
        )
        for stat in stats
    ]

    return CommunityStats(
        num_communities=len(stats),
        communities=community_list,
        algorithm=algorithm,
        modularity=round(modularity, 4),
        execution_time=round(exec_time, 4),
    )


@router.get("/communities/stats")
async def get_community_stats():
    graph = get_graph_builder().get_graph()
    communities, modularity, _ = CommunityDetectionService.louvain(graph)
    stats = CommunityDetectionService.get_community_stats(graph, communities)
    return {
        "num_communities": len(stats),
        "statistics": stats,
        "modularity": round(modularity, 4),
    }


@router.get("/communities/compare")
async def compare_communities():
    graph_builder = get_graph_builder()
    cached_result = graph_builder.get_cached("community_comparison")
    if cached_result is not None:
        return cached_result

    graph = graph_builder.get_graph()
    comparison = CommunityDetectionService.compare_all_algorithms(graph)
    result = {
        "louvain": {
            "num_communities": comparison["louvain"]["num_communities"],
            "modularity": comparison["louvain"]["modularity"],
            "execution_time": comparison["louvain"]["execution_time"],
        },
        "label_propagation": {
            "num_communities": comparison["label_propagation"]["num_communities"],
            "modularity": comparison["label_propagation"]["modularity"],
            "execution_time": comparison["label_propagation"]["execution_time"],
        },
        "best_algorithm": comparison["best_algorithm"],
        "best_modularity": comparison["best_modularity"],
    }
    graph_builder.set_cached("community_comparison", result)
    return result


@router.get("/communities/best")
async def get_best_communities():
    graph = get_graph_builder().get_graph()
    communities, modularity, algorithm_name = CommunityDetectionService.get_best_communities(graph)
    stats = CommunityDetectionService.get_community_stats(graph, communities)

    community_list = [
        Community(
            id=stat["id"],
            size=stat["size"],
            members=stat["members"],
            modularity=stat.get("modularity"),
            density=stat["density"],
        )
        for stat in stats
    ]

    return {
        "algorithm": algorithm_name,
        "num_communities": len(stats),
        "communities": [c.model_dump() for c in community_list],
        "modularity": modularity,
        "statistics": stats,
    }
