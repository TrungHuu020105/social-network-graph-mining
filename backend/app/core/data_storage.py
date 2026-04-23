"""
Global data storage for the application.
"""

from pathlib import Path

from app.core.config import (
    PTBR_EDGES_FILE,
    PTBR_FEATURES_FILE,
    PTBR_TARGET_FILE,
    SAMPLE_EDGES_FILE,
    SAMPLE_NODES_FILE,
    TWITCH_PT_EDGES_FILE,
    TWITCH_PT_FEATURES_FILE,
    TWITCH_PT_TARGET_FILE,
)
from app.core.graph_builder import GraphBuilder

_graph_builder: GraphBuilder = None


def _resolve_twitch_dataset_files():
    edge_candidates = [TWITCH_PT_EDGES_FILE, PTBR_EDGES_FILE]
    feature_candidates = [TWITCH_PT_FEATURES_FILE, PTBR_FEATURES_FILE]
    target_candidates = [TWITCH_PT_TARGET_FILE, PTBR_TARGET_FILE]

    edge_file = next((f for f in edge_candidates if Path(f).exists()), None)
    feature_file = next((f for f in feature_candidates if Path(f).exists()), None)
    target_file = next((f for f in target_candidates if Path(f).exists()), None)

    if edge_file and feature_file and target_file:
        return edge_file, feature_file, target_file
    return None


def _load_default_dataset(builder: GraphBuilder) -> None:
    twitch_files = _resolve_twitch_dataset_files()
    if twitch_files is not None:
        edge_file, feature_file, target_file = twitch_files
        builder.load_twitch_dataset(edge_file, feature_file, target_file)
        return

    if Path(SAMPLE_NODES_FILE).exists() and Path(SAMPLE_EDGES_FILE).exists():
        builder.load_from_csv(SAMPLE_NODES_FILE, SAMPLE_EDGES_FILE)
        return

    raise FileNotFoundError(
        "No dataset found. Expected Twitch/PTBR files or sample_nodes.csv + sample_edges.csv."
    )


def get_graph_builder() -> GraphBuilder:
    global _graph_builder
    if _graph_builder is None:
        _graph_builder = GraphBuilder()
        _load_default_dataset(_graph_builder)
    return _graph_builder


def reset_graph() -> None:
    global _graph_builder
    if _graph_builder is not None:
        _graph_builder.reset()
        _load_default_dataset(_graph_builder)
