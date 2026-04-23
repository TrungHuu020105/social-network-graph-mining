from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from app.core.data_storage import get_graph_builder


def _normalize_adjacency(adjacency: np.ndarray) -> np.ndarray:
    identity = np.eye(adjacency.shape[0], dtype=np.float32)
    a_hat = adjacency + identity
    degrees = np.sum(a_hat, axis=1)
    degrees_inv_sqrt = np.power(degrees, -0.5, where=degrees > 0)
    degrees_inv_sqrt[~np.isfinite(degrees_inv_sqrt)] = 0.0
    d_inv_sqrt = np.diag(degrees_inv_sqrt.astype(np.float32))
    return d_inv_sqrt @ a_hat @ d_inv_sqrt


def _split_train_test_indices(label_vector: np.ndarray, train_ratio: float = 0.8) -> tuple[np.ndarray, np.ndarray]:
    labeled_indices = np.where(label_vector >= 0)[0]
    if labeled_indices.size == 0:
        raise ValueError("No labeled nodes found in dataset.")

    rng = np.random.default_rng(42)
    shuffled = labeled_indices.copy()
    rng.shuffle(shuffled)

    split_at = int(len(shuffled) * train_ratio)
    split_at = max(1, min(split_at, len(shuffled) - 1)) if len(shuffled) > 1 else len(shuffled)

    train_idx = shuffled[:split_at]
    test_idx = shuffled[split_at:] if split_at < len(shuffled) else shuffled[:1]
    return train_idx, test_idx


def _pca_2d(embeddings: np.ndarray) -> np.ndarray:
    if embeddings.shape[0] == 0:
        return np.zeros((0, 2), dtype=np.float32)
    if embeddings.shape[1] == 1:
        return np.concatenate([embeddings, np.zeros((embeddings.shape[0], 1), dtype=np.float32)], axis=1)
    if embeddings.shape[1] == 2:
        return embeddings

    centered = embeddings - np.mean(embeddings, axis=0, keepdims=True)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    components = vt[:2].T
    reduced = centered @ components
    return reduced.astype(np.float32)


class GraphConvLayer(nn.Module):
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.weight = nn.Parameter(torch.empty(in_features, out_features))
        self.bias = nn.Parameter(torch.zeros(out_features))
        nn.init.xavier_uniform_(self.weight)

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> torch.Tensor:
        return adj_norm @ x @ self.weight + self.bias


class GCNModel(nn.Module):
    def __init__(self, in_features: int, hidden_dim: int = 64, num_classes: int = 2, dropout: float = 0.5):
        super().__init__()
        self.gc1 = GraphConvLayer(in_features, hidden_dim)
        self.gc2 = GraphConvLayer(hidden_dim, num_classes)
        self.dropout = dropout

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        hidden = self.gc1(x, adj_norm)
        hidden = F.relu(hidden)
        hidden = F.dropout(hidden, p=self.dropout, training=self.training)
        logits = self.gc2(hidden, adj_norm)
        return logits, hidden


@dataclass
class TrainResult:
    accuracy: float
    loss: float
    train_size: int
    test_size: int
    class_metrics: List[Dict[str, float | int]]


class GCNService:
    def __init__(self):
        self.model: Optional[GCNModel] = None
        self.train_result: Optional[TrainResult] = None
        self.prediction_map: Dict[str, Dict] = {}
        self.embedding_map: Dict[str, List[float]] = {}
        self.embedding_2d_map: Dict[str, Dict] = {}
        self._cached_node_order: List[str] = []

    def is_trained(self) -> bool:
        return self.model is not None and self.train_result is not None

    def train(self, epochs: int = 120, lr: float = 0.01, weight_decay: float = 5e-4) -> TrainResult:
        graph_builder = get_graph_builder()
        adjacency = graph_builder.get_adjacency_matrix()
        features = graph_builder.get_feature_matrix()
        labels = graph_builder.get_label_vector()
        _, index_to_node = graph_builder.get_node_mappings()

        if adjacency.shape[0] == 0 or features.shape[0] == 0:
            raise ValueError("Graph is empty. Cannot train GCN.")
        if features.shape[0] != adjacency.shape[0]:
            raise ValueError("Feature matrix size does not match adjacency matrix size.")

        train_idx_np, test_idx_np = _split_train_test_indices(labels, train_ratio=0.8)

        device = torch.device("cpu")
        adj_norm = torch.tensor(_normalize_adjacency(adjacency), dtype=torch.float32, device=device)
        x = torch.tensor(features, dtype=torch.float32, device=device)
        y = torch.tensor(labels, dtype=torch.long, device=device)
        train_idx = torch.tensor(train_idx_np, dtype=torch.long, device=device)
        test_idx = torch.tensor(test_idx_np, dtype=torch.long, device=device)

        model = GCNModel(in_features=x.shape[1], hidden_dim=64, num_classes=2, dropout=0.5).to(device)
        optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)
        criterion = nn.CrossEntropyLoss()

        last_loss = 0.0
        for _ in range(epochs):
            model.train()
            optimizer.zero_grad()
            logits, _ = model(x, adj_norm)
            loss = criterion(logits[train_idx], y[train_idx])
            loss.backward()
            optimizer.step()
            last_loss = float(loss.item())

        model.eval()
        class_metrics: List[Dict[str, float | int]] = []
        with torch.no_grad():
            logits, embeddings = model(x, adj_norm)
            probabilities = F.softmax(logits, dim=1)
            predictions = torch.argmax(probabilities, dim=1)

            test_predictions = predictions[test_idx]
            test_labels = y[test_idx]
            accuracy = float((test_predictions == test_labels).float().mean().item()) if test_idx.numel() > 0 else 0.0
            class_metrics = self._compute_class_metrics(test_labels, test_predictions, num_classes=2)

        self.model = model
        self.train_result = TrainResult(
            accuracy=accuracy,
            loss=last_loss,
            train_size=int(train_idx.numel()),
            test_size=int(test_idx.numel()),
            class_metrics=class_metrics,
        )
        self._cached_node_order = index_to_node

        probs_np = probabilities.cpu().numpy()
        preds_np = predictions.cpu().numpy()
        emb_np = embeddings.cpu().numpy()
        emb_2d = _pca_2d(emb_np)

        prediction_map: Dict[str, Dict] = {}
        embedding_map: Dict[str, List[float]] = {}
        embedding_2d_map: Dict[str, Dict] = {}
        for idx, node_id in enumerate(index_to_node):
            pred = int(preds_np[idx])
            prob = float(probs_np[idx, pred])
            prediction_map[node_id] = {
                "node_id": node_id,
                "predicted_label": pred,
                "probability": prob,
            }
            embedding_map[node_id] = emb_np[idx].astype(float).tolist()
            embedding_2d_map[node_id] = {
                "node_id": node_id,
                "x": float(emb_2d[idx, 0]),
                "y": float(emb_2d[idx, 1]),
                "predicted_label": pred,
                "probability": prob,
            }

        self.prediction_map = prediction_map
        self.embedding_map = embedding_map
        self.embedding_2d_map = embedding_2d_map

        return self.train_result

    @staticmethod
    def _compute_class_metrics(
        true_labels: torch.Tensor,
        predicted_labels: torch.Tensor,
        num_classes: int = 2,
    ) -> List[Dict[str, float | int]]:
        if true_labels.numel() == 0:
            return [
                {"label": class_id, "precision": 0.0, "recall": 0.0, "f1_score": 0.0, "support": 0}
                for class_id in range(num_classes)
            ]

        y_true = true_labels.cpu().numpy()
        y_pred = predicted_labels.cpu().numpy()
        metrics: List[Dict[str, float | int]] = []

        for class_id in range(num_classes):
            tp = int(np.sum((y_true == class_id) & (y_pred == class_id)))
            fp = int(np.sum((y_true != class_id) & (y_pred == class_id)))
            fn = int(np.sum((y_true == class_id) & (y_pred != class_id)))
            support = int(np.sum(y_true == class_id))

            precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
            recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
            f1_score = float((2 * precision * recall) / (precision + recall)) if (precision + recall) > 0 else 0.0

            metrics.append(
                {
                    "label": class_id,
                    "precision": precision,
                    "recall": recall,
                    "f1_score": f1_score,
                    "support": support,
                }
            )

        return metrics

    def train_if_needed(self) -> TrainResult:
        if not self.is_trained():
            return self.train()
        return self.train_result  # type: ignore[return-value]

    def get_prediction(self, node_id: str) -> Dict:
        self.train_if_needed()
        node_key = str(node_id)
        result = self.prediction_map.get(node_key)
        if result is None:
            raise KeyError(f"Node {node_id} not found.")
        return result

    def get_all_predictions(self) -> List[Dict]:
        self.train_if_needed()
        return [self.prediction_map[node_id] for node_id in self._cached_node_order if node_id in self.prediction_map]

    def get_embeddings(self) -> List[Dict]:
        self.train_if_needed()
        return [self.embedding_2d_map[node_id] for node_id in self._cached_node_order if node_id in self.embedding_2d_map]

    def get_prediction_snapshot(self) -> Dict[str, Dict]:
        return self.prediction_map


_gcn_service: Optional[GCNService] = None


def get_gcn_service() -> GCNService:
    global _gcn_service
    if _gcn_service is None:
        _gcn_service = GCNService()
    return _gcn_service
