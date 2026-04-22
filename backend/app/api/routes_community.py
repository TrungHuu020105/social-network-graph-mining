"""
Routes cho Community Analysis
"""

from fastapi import APIRouter, Query
from typing import List
from app.core.data_storage import get_graph_builder
from app.services.community_service import CommunityDetectionService
from app.schemas.models import Community, CommunityStats

router = APIRouter(prefix="/api", tags=["community"])


@router.get("/communities")
async def get_communities(algorithm: str = Query("louvain")):
    """Lấy danh sách communities"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    
    # Chạy algorithm
    if algorithm == "louvain":
        communities, modularity, exec_time = CommunityDetectionService.louvain(graph)
    elif algorithm == "label_propagation":
        communities, modularity, exec_time = CommunityDetectionService.label_propagation(graph)
    elif algorithm == "girvan_newman":
        communities, modularity, exec_time = CommunityDetectionService.girvan_newman(graph)
    else:
        communities, modularity, exec_time = CommunityDetectionService.louvain(graph)
    
    # Lấy stats
    stats = CommunityDetectionService.get_community_stats(graph, communities)
    
    # Tạo Community objects
    community_list = []
    for stat in stats:
        community_list.append(
            Community(
                id=stat['id'],
                size=stat['size'],
                members=stat['members'],
                modularity=stat.get('modularity'),
                density=stat['density'],
            )
        )
    
    return CommunityStats(
        num_communities=len(stats),
        communities=community_list,
        algorithm=algorithm,
        modularity=round(modularity, 4),
        execution_time=round(exec_time, 4),
    )


@router.get("/communities/stats")
async def get_community_stats():
    """Lấy thống kê chi tiết communities"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    
    # Louvain as default
    communities, modularity, exec_time = CommunityDetectionService.louvain(graph)
    stats = CommunityDetectionService.get_community_stats(graph, communities)
    
    return {
        'num_communities': len(stats),
        'statistics': stats,
        'modularity': round(modularity, 4),
    }
