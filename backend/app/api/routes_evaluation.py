"""
Routes cho Evaluation
"""

from fastapi import APIRouter, Query
from app.core.data_storage import get_graph_builder
from app.services.evaluation_service import EvaluationService

router = APIRouter(prefix="/api", tags=["evaluation"])


@router.get("/evaluation/recommendation")
async def evaluate_recommendation(
    algorithm: str = Query("adamic_adar"),
    top_k: int = Query(10, ge=1, le=50),
    hidden_edge_ratio: float = Query(0.1, ge=0.01, le=0.5)
):
    """Đánh giá chất lượng recommendations"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    result = EvaluationService.evaluate_recommendations(
        graph, nodes_data, 
        algorithm=algorithm, 
        top_k=top_k,
        hidden_edge_ratio=hidden_edge_ratio
    )
    
    return result


@router.get("/evaluation/multiple")
async def evaluate_multiple_algorithms(
    top_k: int = Query(10, ge=1, le=50),
    hidden_edge_ratio: float = Query(0.1, ge=0.01, le=0.5)
):
    """Đánh giá tất cả recommendation algorithms"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    result = EvaluationService.evaluate_multiple_algorithms(
        graph, nodes_data,
        top_k=top_k,
        hidden_edge_ratio=hidden_edge_ratio
    )
    
    return result
