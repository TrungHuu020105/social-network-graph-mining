import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import networkx as nx
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class GraphBuilder:
    """Build and manage graph plus ML-ready matrices."""

    def __init__(self):
        self.graph: nx.Graph = nx.Graph()
        self.nodes_data: Dict[str, Dict] = {}
        self.edges_data: List[Tuple[str, str]] = []
        self.cache_data: Dict = {}

        self.node_to_index: Dict[str, int] = {}
        self.index_to_node: List[str] = []
        self.feature_matrix: Optional[np.ndarray] = None
        self.label_vector: Optional[np.ndarray] = None
        self.adjacency_matrix: Optional[np.ndarray] = None

    def _reset_graph_state(self) -> None:
        self.graph = nx.Graph()
        self.nodes_data = {}
        self.edges_data = []
        self.node_to_index = {}
        self.index_to_node = []
        self.feature_matrix = None
        self.label_vector = None
        self.adjacency_matrix = None
        self.clear_cache()

    def _build_node_index(self) -> None:
        self.index_to_node = sorted([str(node_id) for node_id in self.graph.nodes()])
        self.node_to_index = {node_id: idx for idx, node_id in enumerate(self.index_to_node)}

    def _build_adjacency_matrix(self) -> None:
        if not self.index_to_node:
            self.adjacency_matrix = np.zeros((0, 0), dtype=np.float32)
            return
        self.adjacency_matrix = nx.to_numpy_array(
            self.graph,
            nodelist=self.index_to_node,
            dtype=np.float32,
        )

    def _init_default_features_labels(self) -> None:
        num_nodes = len(self.index_to_node)
        if num_nodes == 0:
            self.feature_matrix = np.zeros((0, 0), dtype=np.float32)
            self.label_vector = np.array([], dtype=np.int64)
            return

        self.feature_matrix = np.zeros((num_nodes, 2), dtype=np.float32)
        max_degree = max((self.graph.degree(node_id) for node_id in self.index_to_node), default=1)
        max_degree = max(max_degree, 1)

        for node_id in self.index_to_node:
            idx = self.node_to_index[node_id]
            degree = float(self.graph.degree(node_id))
            self.feature_matrix[idx, 0] = degree / max_degree
            self.feature_matrix[idx, 1] = 1.0

        self.label_vector = np.full(num_nodes, -1, dtype=np.int64)

    def _hydrate_matrices_from_graph(self) -> None:
        self._build_node_index()
        self._build_adjacency_matrix()
        self._init_default_features_labels()

    def load_from_csv(self, nodes_file: Path, edges_file: Path) -> nx.Graph:
        """Load generic graph from nodes.csv and edges.csv."""
        self._reset_graph_state()

        try:
            nodes_df = pd.read_csv(nodes_file)
            if "id" not in nodes_df.columns:
                raise ValueError("nodes file must contain 'id' column")

            for row in nodes_df.itertuples(index=False):
                node_id = str(getattr(row, "id"))
                self.graph.add_node(node_id)
                self.nodes_data[node_id] = {
                    "name": str(getattr(row, "name", node_id)),
                    "username": str(getattr(row, "username", node_id)),
                }

            edges_df = pd.read_csv(edges_file)
            source_col, target_col = self._resolve_edge_columns(edges_df.columns)
            for _, row in edges_df.iterrows():
                source = str(row[source_col])
                target = str(row[target_col])
                if source in self.graph.nodes and target in self.graph.nodes and source != target:
                    self.graph.add_edge(source, target)
                    self.edges_data.append((source, target))

            self._hydrate_matrices_from_graph()
            logger.info(
                "Graph loaded from CSV: %s nodes, %s edges",
                self.graph.number_of_nodes(),
                self.graph.number_of_edges(),
            )
            return self.graph
        except Exception as e:
            logger.exception("Error loading graph from CSV: %s", e)
            raise

    @staticmethod
    def _resolve_edge_columns(columns) -> Tuple[str, str]:
        column_set = set(columns)
        if {"source", "target"}.issubset(column_set):
            return "source", "target"
        if {"from", "to"}.issubset(column_set):
            return "from", "to"
        raise ValueError("edges file must contain either (source,target) or (from,to) columns")

    @staticmethod
    def _resolve_label_columns(columns) -> Tuple[str, str]:
        node_candidates = ["new_id", "node_id", "id"]
        # Prefer "partner" for GCN prediction on PTBR dataset, fallback to other common labels.
        label_candidates = ["partner", "mature", "label", "target", "y"]

        node_col = next((c for c in node_candidates if c in columns), None)
        label_col = next((c for c in label_candidates if c in columns), None)
        if not node_col or not label_col:
            raise ValueError("target file must contain a node id column and a label column")
        return node_col, label_col

    @staticmethod
    def _to_binary_label(value) -> int:
        if isinstance(value, (bool, np.bool_)):
            return int(value)
        if isinstance(value, (int, np.integer, float, np.floating)):
            return int(value > 0)

        text = str(value).strip().lower()
        if text in {"1", "true", "yes", "y", "t"}:
            return 1
        return 0

    def load_twitch_dataset(self, edges_file: Path, features_file: Path, target_file: Path) -> nx.Graph:
        """Load Twitch/PTBR dataset and prepare adjacency matrix, X, y."""
        self._reset_graph_state()

        try:
            edges_df = pd.read_csv(edges_file)
            source_col, target_col = self._resolve_edge_columns(edges_df.columns)

            for _, row in edges_df.iterrows():
                source = str(row[source_col])
                target = str(row[target_col])
                if source == target:
                    continue
                self.graph.add_node(source)
                self.graph.add_node(target)
                self.graph.add_edge(source, target)
                self.edges_data.append((source, target))

            self._build_node_index()

            for node_id in self.index_to_node:
                self.nodes_data[node_id] = {
                    "name": f"User {node_id}",
                    "username": f"user_{node_id}",
                }

            num_nodes = len(self.index_to_node)

            with open(features_file, "r", encoding="utf-8") as f:
                raw_features: Dict[str, List[int]] = json.load(f)

            max_feature_idx = -1
            for feature_indices in raw_features.values():
                if feature_indices:
                    max_feature_idx = max(max_feature_idx, max(feature_indices))
            feature_dim = max_feature_idx + 1 if max_feature_idx >= 0 else 1

            self.feature_matrix = np.zeros((num_nodes, feature_dim), dtype=np.float32)
            for node_id, feature_indices in raw_features.items():
                node_key = str(node_id)
                idx = self.node_to_index.get(node_key)
                if idx is None:
                    continue
                valid_indices = [i for i in feature_indices if 0 <= int(i) < feature_dim]
                if valid_indices:
                    self.feature_matrix[idx, valid_indices] = 1.0

            target_df = pd.read_csv(target_file)
            node_col, label_col = self._resolve_label_columns(target_df.columns)
            self.label_vector = np.full(num_nodes, -1, dtype=np.int64)

            for row in target_df.itertuples(index=False):
                node_id = str(getattr(row, node_col))
                idx = self.node_to_index.get(node_id)
                if idx is None:
                    continue
                label = self._to_binary_label(getattr(row, label_col))
                self.label_vector[idx] = label

            self._build_adjacency_matrix()

            logger.info(
                "Twitch/PTBR dataset loaded: %s nodes, %s edges, feature_dim=%s",
                self.graph.number_of_nodes(),
                self.graph.number_of_edges(),
                self.feature_matrix.shape[1],
            )
            return self.graph
        except Exception as e:
            logger.exception("Error loading Twitch/PTBR dataset: %s", e)
            raise

    def get_graph(self) -> nx.Graph:
        return self.graph

    def get_nodes_data(self) -> Dict[str, Dict]:
        return self.nodes_data

    def get_edges_data(self) -> List[Tuple[str, str]]:
        return self.edges_data

    def get_cached(self, key: str):
        return self.cache_data.get(key)

    def set_cached(self, key: str, value) -> None:
        self.cache_data[key] = value

    def clear_cache(self) -> None:
        self.cache_data = {}

    def reset(self) -> None:
        self._reset_graph_state()

    def get_adjacency_matrix(self) -> np.ndarray:
        return self.adjacency_matrix if self.adjacency_matrix is not None else np.zeros((0, 0), dtype=np.float32)

    def get_feature_matrix(self) -> np.ndarray:
        return self.feature_matrix if self.feature_matrix is not None else np.zeros((0, 0), dtype=np.float32)

    def get_label_vector(self) -> np.ndarray:
        return self.label_vector if self.label_vector is not None else np.array([], dtype=np.int64)

    def get_node_mappings(self) -> Tuple[Dict[str, int], List[str]]:
        return self.node_to_index, self.index_to_node
