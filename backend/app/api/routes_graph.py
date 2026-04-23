"""
Routes for graph endpoint.
"""

from collections import defaultdict
from typing import Any, Dict, List, Set

import networkx as nx
from fastapi import APIRouter, Query

from app.core.data_storage import get_graph_builder
from app.services.community_service import CommunityDetectionService
from app.services.gcn_service import get_gcn_service

router = APIRouter(prefix="/api", tags=["graph"])


def _resolve_communities(graph: nx.Graph, community_alg: str) -> Dict[str, int]:
    if community_alg == "best":
        communities, _, _ = CommunityDetectionService.get_best_communities(graph)
    elif community_alg == "label_propagation":
        communities, _, _ = CommunityDetectionService.label_propagation(graph)
    else:
        communities, _, _ = CommunityDetectionService.louvain(graph)
    return communities


def _sample_nodes_by_pagerank_and_community(
    graph: nx.Graph,
    communities: Dict[str, int],
    pagerank: Dict[str, float],
    max_nodes: int,
) -> Set[str]:
    if graph.number_of_nodes() <= max_nodes:
        return {str(node_id) for node_id in graph.nodes()}

    total_nodes = graph.number_of_nodes()
    groups: Dict[int, List[str]] = defaultdict(list)
    for node_id in graph.nodes():
        node_key = str(node_id)
        groups[communities.get(node_key, -1)].append(node_key)

    selected: Set[str] = set()
    for _, members in groups.items():
        if not members:
            continue
        members_sorted = sorted(members, key=lambda n: pagerank.get(n, 0.0), reverse=True)
        proportional_quota = int(max_nodes * (len(members) / total_nodes))
        quota = max(1, proportional_quota)
        selected.update(members_sorted[:quota])

    if len(selected) > max_nodes:
        selected = set(sorted(selected, key=lambda n: pagerank.get(n, 0.0), reverse=True)[:max_nodes])

    if len(selected) < max_nodes:
        candidates = sorted((str(n) for n in graph.nodes()), key=lambda n: pagerank.get(n, 0.0), reverse=True)
        for node_id in candidates:
            if len(selected) >= max_nodes:
                break
            selected.add(node_id)

    return selected


def _build_graph_payload(
    graph: nx.Graph,
    communities: Dict[str, int],
    pagerank: Dict[str, float],
    selected_nodes: Set[str],
) -> Dict[str, Any]:
    predictions = get_gcn_service().get_prediction_snapshot()
    community_ids = sorted({communities.get(node_id, 0) for node_id in selected_nodes})

    nodes: List[Dict[str, Any]] = []
    for node_id in selected_nodes:
        prediction = predictions.get(node_id, {})
        nodes.append(
            {
                "id": node_id,
                "label": node_id,
                "community": communities.get(node_id, 0),
                "degree": int(graph.degree(node_id)),
                "pagerank": round(float(pagerank.get(node_id, 0.0)), 8),
                "prediction": prediction.get("predicted_label"),
                "probability": prediction.get("probability"),
            }
        )

    links: List[Dict[str, str]] = []
    selected_lookup = set(selected_nodes)
    for source, target in graph.edges():
        source_key = str(source)
        target_key = str(target)
        if source_key in selected_lookup and target_key in selected_lookup:
            links.append({"source": source_key, "target": target_key})

    return {
        "nodes": nodes,
        "links": links,
        "edges": links,  # compatibility alias
        "meta": {
            "num_nodes": len(nodes),
            "num_edges": len(links),
            "num_communities": len(community_ids),
            "community_ids": community_ids,
        },
    }


@router.get("/graph")
async def get_graph_data(
    community_alg: str = Query("louvain"),
    max_nodes: int = Query(1000, ge=50, le=5000),
):
    graph_builder = get_graph_builder()
    full_graph = graph_builder.get_graph()

    communities = _resolve_communities(full_graph, community_alg)
    pagerank = nx.pagerank(full_graph) if full_graph.number_of_nodes() > 0 else {}
    selected_nodes = _sample_nodes_by_pagerank_and_community(full_graph, communities, pagerank, max_nodes=max_nodes)

    payload = _build_graph_payload(full_graph, communities, pagerank, selected_nodes)
    payload["meta"]["total_nodes"] = full_graph.number_of_nodes()
    payload["meta"]["total_edges"] = full_graph.number_of_edges()
    payload["meta"]["max_nodes"] = max_nodes
    return payload
