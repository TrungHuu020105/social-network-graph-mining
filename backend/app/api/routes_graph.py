"""
Routes for graph endpoint.
"""

from collections import defaultdict
from typing import Any, Dict, List, Set, Tuple

import networkx as nx
from fastapi import APIRouter, Query

from app.core.data_storage import get_graph_builder
from app.services.community_service import CommunityDetectionService

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
    max_nodes: int,
) -> Dict[str, Any]:
    try:
        from app.services.gcn_service import get_gcn_service

        predictions = get_gcn_service().get_prediction_snapshot()
    except Exception:
        predictions = {}
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

    links = _sample_links_for_visualization(
        graph=graph,
        selected_nodes=selected_nodes,
        communities=communities,
        pagerank=pagerank,
        max_nodes=max_nodes,
    )

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


def _sample_links_for_visualization(
    graph: nx.Graph,
    selected_nodes: Set[str],
    communities: Dict[str, int],
    pagerank: Dict[str, float],
    max_nodes: int,
) -> List[Dict[str, str]]:
    selected_lookup = set(selected_nodes)
    candidate_edges: List[Tuple[str, str, bool, float]] = []

    for source, target in graph.edges():
        source_key = str(source)
        target_key = str(target)
        if source_key not in selected_lookup or target_key not in selected_lookup:
            continue
        if source_key == target_key:
            continue
        a, b = sorted((source_key, target_key))
        score = float(pagerank.get(a, 0.0)) + float(pagerank.get(b, 0.0))
        is_bridge = communities.get(a, 0) != communities.get(b, 0)
        candidate_edges.append((a, b, is_bridge, score))

    if not candidate_edges:
        return []

    if max_nodes <= 300:
        edge_budget = max(max_nodes * 2, 250)
        per_node_cap = 2
    elif max_nodes <= 600:
        edge_budget = max(max_nodes * 3, 500)
        per_node_cap = 3
    else:
        edge_budget = max_nodes * 5
        per_node_cap = 4

    if len(candidate_edges) <= edge_budget:
        return [{"source": s, "target": t} for s, t, _, _ in candidate_edges]

    adjacency: Dict[str, List[Tuple[str, bool, float]]] = defaultdict(list)
    for source_key, target_key, is_bridge, score in candidate_edges:
        adjacency[source_key].append((target_key, is_bridge, score))
        adjacency[target_key].append((source_key, is_bridge, score))

    selected_edge_set: Set[Tuple[str, str]] = set()

    for node_id, neighbors in adjacency.items():
        neighbors_sorted = sorted(
            neighbors,
            key=lambda item: (item[1], item[2]),
            reverse=True,
        )
        for target_key, _, _ in neighbors_sorted[:per_node_cap]:
            a, b = sorted((node_id, target_key))
            selected_edge_set.add((a, b))

    bridge_edges = sorted(
        ((s, t, score) for s, t, is_bridge, score in candidate_edges if is_bridge),
        key=lambda x: x[2],
        reverse=True,
    )
    bridge_budget = min(len(bridge_edges), max(12, edge_budget // 6))
    for source_key, target_key, _ in bridge_edges[:bridge_budget]:
        selected_edge_set.add((source_key, target_key))
        if len(selected_edge_set) >= edge_budget:
            break

    if len(selected_edge_set) < edge_budget:
        all_sorted = sorted(candidate_edges, key=lambda x: x[3], reverse=True)
        for source_key, target_key, _, _ in all_sorted:
            selected_edge_set.add((source_key, target_key))
            if len(selected_edge_set) >= edge_budget:
                break

    return [{"source": s, "target": t} for s, t in sorted(selected_edge_set)]


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

    payload = _build_graph_payload(full_graph, communities, pagerank, selected_nodes, max_nodes=max_nodes)
    payload["meta"]["total_nodes"] = full_graph.number_of_nodes()
    payload["meta"]["total_edges"] = full_graph.number_of_edges()
    payload["meta"]["max_nodes"] = max_nodes
    return payload
