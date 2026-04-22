"""
Routes cho Algorithm Comparison
"""

from fastapi import APIRouter, Query
from app.core.data_storage import get_graph_builder
from app.services.comparison_service import ComparisonService

router = APIRouter(prefix="/api", tags=["comparison"])


@router.get("/comparison/community")
async def compare_community_algorithms():
    """So sánh các community detection algorithms"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    
    result = ComparisonService.compare_community_algorithms(graph)
    
    return result


@router.get("/comparison/recommendation")
async def compare_recommendation_algorithms(
    source_id: str = Query(...),
    top_k: int = Query(10, ge=1, le=50)
):
    """So sánh các recommendation algorithms"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    result = ComparisonService.compare_recommendation_algorithms(
        graph, nodes_data, source_id, top_k=top_k
    )
    
    return result
