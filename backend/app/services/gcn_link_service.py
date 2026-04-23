from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np
import torch
import torch.nn as nn

from app.core.data_storage import get_graph_builder


def _normalize_adjacency(adjacency: np.ndarray) -> np.ndarray:
    identity = np.eye(adjacency.shape[0], dtype=np.float32)
    a_hat = adjacency + identity
    degrees = np.sum(a_hat, axis=1)
    degrees_inv_sqrt = np.power(degrees, -0.5, where=degrees > 0)
    degrees_inv_sqrt[~np.isfinite(degrees_inv_sqrt)] = 0.0
    d_inv_sqrt = np.diag(degrees_inv_sqrt.astype(np.float32))
    return d_inv_sqrt @ a_hat @ d_inv_sqrt


def _binary_auc(scores: np.ndarray, labels: np.ndarray) -> float:
    if scores.size == 0 or labels.size == 0:
        return 0.0
    pos_mask = labels == 1
    neg_mask = labels == 0
    n_pos = int(np.sum(pos_mask))
    n_neg = int(np.sum(neg_mask))
    if n_pos == 0 or n_neg == 0:
        return 0.0

    order = np.argsort(scores)
    ranks = np.empty_like(order, dtype=np.float64)
    ranks[order] = np.arange(1, len(scores) + 1, dtype=np.float64)
    pos_rank_sum = float(np.sum(ranks[pos_mask]))
    auc = (pos_rank_sum - n_pos * (n_pos + 1) / 2.0) / (n_pos * n_neg)
    return float(max(0.0, min(1.0, auc)))


class GraphConvLayer(nn.Module):
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.weight = nn.Parameter(torch.empty(in_features, out_features))
        self.bias = nn.Parameter(torch.zeros(out_features))
        nn.init.xavier_uniform_(self.weight)

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> torch.Tensor:
        return adj_norm @ x @ self.weight + self.bias


class LinkGCNModel(nn.Module):
    def __init__(self, in_features: int, hidden_dim: int = 96, emb_dim: int = 64, dropout: float = 0.2):
        super().__init__()
        self.gc1 = GraphConvLayer(in_features, hidden_dim)
        self.gc2 = GraphConvLayer(hidden_dim, emb_dim)
        self.dropout = dropout

    def encode(self, x: torch.Tensor, adj_norm: torch.Tensor) -> torch.Tensor:
        hidden = torch.relu(self.gc1(x, adj_norm))
        hidden = torch.dropout(hidden, p=self.dropout, train=self.training)
        z = self.gc2(hidden, adj_norm)
        return z


@dataclass
class LinkTrainResult:
    auc: float
    loss: float
    train_edges: int
    val_edges: int


class GCNLinkService:
    def __init__(self):
        self.model: Optional[LinkGCNModel] = None
        self.train_result: Optional[LinkTrainResult] = None
        self.embedding_map: Dict[str, np.ndarray] = {}
        self._cached_node_order: List[str] = []
        self._graph_signature: Optional[Tuple[int, int]] = None

    def _get_graph_signature(self) -> Tuple[int, int]:
        builder = get_graph_builder()
        graph = builder.get_graph()
        return graph.number_of_nodes(), graph.number_of_edges()

    def is_trained(self) -> bool:
        current_signature = self._get_graph_signature()
        return (
            self.model is not None
            and self.train_result is not None
            and self._graph_signature == current_signature
            and len(self.embedding_map) > 0
        )

    @staticmethod
    def _sample_negative_edges(
        num_samples: int,
        num_nodes: int,
        positive_edge_set: set[Tuple[int, int]],
        rng: np.random.Generator,
    ) -> List[Tuple[int, int]]:
        negatives: set[Tuple[int, int]] = set()
        max_trials = max(num_samples * 30, 5000)
        trials = 0
        while len(negatives) < num_samples and trials < max_trials:
            a = int(rng.integers(0, num_nodes))
            b = int(rng.integers(0, num_nodes))
            trials += 1
            if a == b:
                continue
            edge = (a, b) if a < b else (b, a)
            if edge in positive_edge_set or edge in negatives:
                continue
            negatives.add(edge)
        return list(negatives)

    @staticmethod
    def _edge_tensor(edges: Sequence[Tuple[int, int]], device: torch.device) -> torch.Tensor:
        if not edges:
            return torch.zeros((0, 2), dtype=torch.long, device=device)
        return torch.tensor(edges, dtype=torch.long, device=device)

    @staticmethod
    def _decode_edges(z: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        if edge_index.numel() == 0:
            return torch.zeros((0,), dtype=torch.float32, device=z.device)
        src = edge_index[:, 0]
        dst = edge_index[:, 1]
        logits = (z[src] * z[dst]).sum(dim=1)
        return logits

    def train(self, epochs: int = 140, lr: float = 0.01, weight_decay: float = 1e-4) -> LinkTrainResult:
        builder = get_graph_builder()
        graph = builder.get_graph()
        adjacency = builder.get_adjacency_matrix()
        features = builder.get_feature_matrix()
        node_to_index, index_to_node = builder.get_node_mappings()

        if adjacency.shape[0] == 0 or features.shape[0] == 0:
            raise ValueError("Graph or feature matrix is empty. Cannot train GCN link predictor.")
        if features.shape[0] != adjacency.shape[0]:
            raise ValueError("Feature matrix size does not match adjacency matrix size.")

        positive_edges: List[Tuple[int, int]] = []
        for source, target in graph.edges():
            source_idx = node_to_index.get(str(source))
            target_idx = node_to_index.get(str(target))
            if source_idx is None or target_idx is None or source_idx == target_idx:
                continue
            edge = (source_idx, target_idx) if source_idx < target_idx else (target_idx, source_idx)
            positive_edges.append(edge)
        positive_edges = sorted(set(positive_edges))

        if len(positive_edges) < 2:
            raise ValueError("Not enough edges to train link predictor.")

        rng = np.random.default_rng(42)
        shuffled = positive_edges.copy()
        rng.shuffle(shuffled)

        split_idx = max(1, int(len(shuffled) * 0.85))
        split_idx = min(split_idx, len(shuffled) - 1)
        train_pos = shuffled[:split_idx]
        val_pos = shuffled[split_idx:]

        positive_edge_set = set(positive_edges)
        train_neg = self._sample_negative_edges(len(train_pos), len(index_to_node), positive_edge_set, rng)
        val_neg = self._sample_negative_edges(len(val_pos), len(index_to_node), positive_edge_set, rng)

        device = torch.device("cpu")
        adj_norm = torch.tensor(_normalize_adjacency(adjacency), dtype=torch.float32, device=device)
        x = torch.tensor(features, dtype=torch.float32, device=device)

        train_pos_t = self._edge_tensor(train_pos, device)
        train_neg_t = self._edge_tensor(train_neg, device)
        val_pos_t = self._edge_tensor(val_pos, device)
        val_neg_t = self._edge_tensor(val_neg, device)

        model = LinkGCNModel(in_features=x.shape[1]).to(device)
        optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)
        criterion = nn.BCEWithLogitsLoss()

        last_loss = 0.0
        for _ in range(epochs):
            model.train()
            optimizer.zero_grad()
            z = model.encode(x, adj_norm)

            pos_logits = self._decode_edges(z, train_pos_t)
            neg_logits = self._decode_edges(z, train_neg_t)
            logits = torch.cat([pos_logits, neg_logits], dim=0)
            labels = torch.cat(
                [
                    torch.ones(pos_logits.shape[0], dtype=torch.float32, device=device),
                    torch.zeros(neg_logits.shape[0], dtype=torch.float32, device=device),
                ],
                dim=0,
            )

            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            last_loss = float(loss.item())

        model.eval()
        with torch.no_grad():
            z = model.encode(x, adj_norm)
            val_pos_logits = self._decode_edges(z, val_pos_t)
            val_neg_logits = self._decode_edges(z, val_neg_t)
            val_scores = torch.sigmoid(torch.cat([val_pos_logits, val_neg_logits], dim=0)).cpu().numpy()
            val_labels = np.concatenate(
                [np.ones(val_pos_logits.shape[0], dtype=np.int64), np.zeros(val_neg_logits.shape[0], dtype=np.int64)]
            )
            auc = _binary_auc(val_scores, val_labels)

            emb_np = z.cpu().numpy()

        self.model = model
        self.train_result = LinkTrainResult(
            auc=auc,
            loss=last_loss,
            train_edges=len(train_pos),
            val_edges=len(val_pos),
        )
        self._cached_node_order = index_to_node
        self._graph_signature = (graph.number_of_nodes(), graph.number_of_edges())
        self.embedding_map = {node_id: emb_np[idx].astype(np.float32) for idx, node_id in enumerate(index_to_node)}
        return self.train_result

    def train_if_needed(self) -> LinkTrainResult:
        if not self.is_trained():
            return self.train()
        return self.train_result  # type: ignore[return-value]

    def score_candidates(self, source_node: str, candidate_nodes: List[str]) -> Dict[str, float]:
        self.train_if_needed()
        source_key = str(source_node)
        source_emb = self.embedding_map.get(source_key)
        if source_emb is None:
            return {str(node_id): 0.0 for node_id in candidate_nodes}

        source_norm = float(np.linalg.norm(source_emb))
        if source_norm == 0.0:
            return {str(node_id): 0.0 for node_id in candidate_nodes}

        scores: Dict[str, float] = {}
        for node_id in candidate_nodes:
            node_key = str(node_id)
            target_emb = self.embedding_map.get(node_key)
            if target_emb is None:
                scores[node_key] = 0.0
                continue
            dot = float(np.dot(source_emb, target_emb))
            # probability-like value in (0, 1)
            scores[node_key] = float(1.0 / (1.0 + np.exp(-dot)))
        return scores

    def score_pair(self, source_node: str, target_node: str) -> float:
        scores = self.score_candidates(source_node, [target_node])
        return float(scores.get(str(target_node), 0.0))


_gcn_link_service: Optional[GCNLinkService] = None


def get_gcn_link_service() -> GCNLinkService:
    global _gcn_link_service
    if _gcn_link_service is None:
        _gcn_link_service = GCNLinkService()
    return _gcn_link_service

