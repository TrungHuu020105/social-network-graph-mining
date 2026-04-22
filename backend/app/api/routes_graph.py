"""
Routes cho Graph endpoint
"""

from fastapi import APIRouter
from typing import Dict, List, Any
from app.core.data_storage import get_graph_builder
from app.services.community_service import CommunityDetectionService
from app.schemas.models import GraphData

router = APIRouter(prefix="/api", tags=["graph"])


def _build_cytoscape_data(graph, communities, nodes_data) -> Dict[str, Any]:
    """Convert graph data to Cytoscape.js format"""
    
    # Build nodes
    nodes = []
    community_colors = CommunityDetectionService.get_community_colors(
        len(set(communities.values()))
    )
    
    for node_id in graph.nodes():
        node_info = nodes_data.get(node_id, {})
        community_id = communities.get(node_id, 0)
        color = community_colors.get(community_id, "#808080")
        
        nodes.append({
            'data': {
                'id': str(node_id),
                'label': node_info.get('name', str(node_id)),
                'username': node_info.get('username', str(node_id)),
                'degree': graph.degree(node_id),
                'community': community_id,
                'style': {
                    'background-color': color,
                }
            }
        })
    
    # Build edges
    edges = []
    for source, target in graph.edges():
        edges.append({
            'data': {
                'id': f"{source}-{target}",
                'source': str(source),
                'target': str(target),
            }
        })
    
    return {
        'nodes': nodes,
        'edges': edges,
        'communities': communities,
        'community_colors': community_colors,
    }


@router.get("/graph")
async def get_graph_data(community_alg: str = "best"):
    """Lấy dữ liệu graph để visualize"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    # Lấy communities
    if community_alg == "best":
        communities, _, _ = CommunityDetectionService.get_best_communities(graph)
    elif community_alg == "louvain":
        communities, _, _ = CommunityDetectionService.louvain(graph)
    elif community_alg == "label_propagation":
        communities, _, _ = CommunityDetectionService.label_propagation(graph)
    elif community_alg == "girvan_newman":
        communities, _, _ = CommunityDetectionService.girvan_newman(graph)
    else:
        communities, _, _ = CommunityDetectionService.get_best_communities(graph)
    
    cytoscape_data = _build_cytoscape_data(graph, communities, nodes_data)
    
    return cytoscape_data
