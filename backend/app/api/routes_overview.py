"""
Routes cho Overview endpoint
"""

from fastapi import APIRouter, Depends
from app.core.data_storage import get_graph_builder
from app.schemas.models import OverviewStats
from app.utils.graph_utils import get_graph_stats

router = APIRouter(prefix="/api", tags=["overview"])


@router.get("/overview", response_model=OverviewStats)
async def get_overview():
    """Lấy thống kê tổng quan"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    
    # Tính thống kê
    stats = get_graph_stats(graph)
    
    return OverviewStats(
        num_nodes=stats['num_nodes'],
        num_edges=stats['num_edges'],
        density=stats['density'],
        avg_degree=stats['avg_degree'],
        isolated_nodes=stats['isolated_nodes'],
        diameter=stats['diameter'],
        avg_clustering_coefficient=stats['avg_clustering_coefficient'],
    )
