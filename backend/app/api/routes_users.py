"""
Routes cho User endpoints
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.core.data_storage import get_graph_builder
from app.services.centrality_service import CentralityService
from app.services.community_service import CommunityDetectionService

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/users/top-influential")
async def get_top_influential(
    metric: str = Query("pagerank"),
    limit: int = Query(10, ge=1, le=100)
):
    """Lấy top influential users"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    normalized_metric = "degree" if metric == "degree" else "pagerank"

    top_users = CentralityService.get_top_influential_users(
        graph, nodes_data, metric=normalized_metric, limit=limit
    )
    
    return {
        'metric': normalized_metric,
        'limit': limit,
        'users': top_users,
    }


@router.get("/users/{user_id}")
async def get_user_detail(user_id: str):
    """Lấy chi tiết một user"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    if user_id not in graph.nodes():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Lấy community
    communities, _, _ = CommunityDetectionService.louvain(graph)
    community_id = communities.get(user_id, 0)
    
    # Lấy centrality scores
    all_centralities = CentralityService.get_all_centralities(graph)
    
    centrality_scores = {}
    for metric_name, metric_values in all_centralities.items():
        centrality_scores[metric_name] = round(metric_values.get(user_id, 0), 4)
    
    neighbors = list(graph.neighbors(user_id))
    
    user_info = nodes_data.get(user_id, {})
    
    return {
        'id': user_id,
        'name': user_info.get('name', user_id),
        'username': user_info.get('username', user_id),
        'degree': graph.degree(user_id),
        'neighbors': neighbors,
        'community': community_id,
        'centrality_scores': centrality_scores,
    }


@router.get("/users/{user_id}/neighbors")
async def get_user_neighbors(user_id: str, depth: int = Query(1, ge=1, le=2)):
    """Lấy hàng xóm của user"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    if user_id not in graph.nodes():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Lấy neighbors
    if depth == 1:
        neighbors = list(graph.neighbors(user_id))
    else:  # depth == 2
        neighbors_1 = set(graph.neighbors(user_id))
        neighbors_2 = set()
        for n in neighbors_1:
            neighbors_2.update(graph.neighbors(n))
        neighbors_2.discard(user_id)  # Loại bỏ chính nó
        neighbors = list(neighbors_1 | neighbors_2)
    
    neighbor_list = []
    for neighbor_id in neighbors:
        n_info = nodes_data.get(neighbor_id, {})
        neighbor_list.append({
            'id': neighbor_id,
            'name': n_info.get('name', neighbor_id),
            'username': n_info.get('username', neighbor_id),
            'degree': graph.degree(neighbor_id),
        })
    
    return {
        'user_id': user_id,
        'depth': depth,
        'neighbors': neighbor_list,
        'num_neighbors': len(neighbor_list),
    }
