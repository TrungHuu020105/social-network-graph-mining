"""
Routes cho Recommendations
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List
from app.core.data_storage import get_graph_builder
from app.services.recommendation_service import RecommendationService
from app.services.explanation_service import ExplanationService
from app.services.community_service import CommunityDetectionService

router = APIRouter(prefix="/api", tags=["recommendations"])


@router.get("/recommendations/{user_id}")
async def get_recommendations(
    user_id: str,
    algorithm: str = Query("adamic_adar"),
    top_k: int = Query(10, ge=1, le=50)
):
    """Lấy gợi ý kết nối cho user"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    if user_id not in graph.nodes():
        raise HTTPException(status_code=404, detail="User not found")
    
    recommendations, exec_time = RecommendationService.get_recommendations(
        graph, nodes_data, user_id, algorithm=algorithm, top_k=top_k
    )
    
    return {
        'source_id': user_id,
        'algorithm': algorithm,
        'recommendations': recommendations,
        'num_recommendations': len(recommendations),
        'execution_time': round(exec_time, 4),
    }


@router.get("/recommendations/{user_id}/explain")
async def explain_recommendation(
    user_id: str,
    target: str = Query(...),
):
    """Giải thích vì sao một gợi ý được tạo ra"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    if user_id not in graph.nodes() or target not in graph.nodes():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Lấy communities
    communities, _, _ = CommunityDetectionService.louvain(graph)
    
    explanation = ExplanationService.explain_recommendation(
        graph, nodes_data, user_id, target, communities
    )
    
    return explanation
