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


@router.get("/communities/compare")
async def compare_communities():
    """So sánh cả 3 thuật toán community detection (có cache)"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    
    # Check cache trước
    cached_result = graph_builder.get_cached('community_comparison')
    if cached_result is not None:
        return cached_result
    
    # Nếu không có cache, tính toán
    comparison = CommunityDetectionService.compare_all_algorithms(graph)
    
    # Loại bỏ communities dict để response nhẹ hơn
    result = {
        'louvain': {
            'num_communities': comparison['louvain']['num_communities'],
            'modularity': comparison['louvain']['modularity'],
            'execution_time': comparison['louvain']['execution_time'],
        },
        'label_propagation': {
            'num_communities': comparison['label_propagation']['num_communities'],
            'modularity': comparison['label_propagation']['modularity'],
            'execution_time': comparison['label_propagation']['execution_time'],
        },
        'girvan_newman': {
            'num_communities': comparison['girvan_newman']['num_communities'],
            'modularity': comparison['girvan_newman']['modularity'],
            'execution_time': comparison['girvan_newman']['execution_time'],
        },
        'best_algorithm': comparison['best_algorithm'],
        'best_modularity': comparison['best_modularity'],
    }
    
    # Lưu vào cache
    graph_builder.set_cached('community_comparison', result)
    
    return result


@router.get("/communities/best")
async def get_best_communities():
    """Lấy kết quả communities từ thuật toán tốt nhất"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    
    communities, modularity, algorithm_name = CommunityDetectionService.get_best_communities(graph)
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
    
    return {
        'algorithm': algorithm_name,
        'num_communities': len(stats),
        'communities': [c.model_dump() for c in community_list],
        'modularity': modularity,
        'statistics': stats,
    }
