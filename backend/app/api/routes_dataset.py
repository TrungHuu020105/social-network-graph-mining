"""
Routes for Dataset Management.
"""

from pathlib import Path
import io
import tempfile

import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile

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
from app.core.data_storage import get_graph_builder, reset_graph
from app.core.graph_builder import GraphBuilder
from app.utils.graph_utils import get_graph_stats

router = APIRouter(prefix="/api", tags=["dataset"])


def _build_files_info() -> dict:
    return {
        "twitch_pt_edges": {"path": str(TWITCH_PT_EDGES_FILE), "exists": Path(TWITCH_PT_EDGES_FILE).exists()},
        "twitch_pt_features": {"path": str(TWITCH_PT_FEATURES_FILE), "exists": Path(TWITCH_PT_FEATURES_FILE).exists()},
        "twitch_pt_target": {"path": str(TWITCH_PT_TARGET_FILE), "exists": Path(TWITCH_PT_TARGET_FILE).exists()},
        "ptbr_edges": {"path": str(PTBR_EDGES_FILE), "exists": Path(PTBR_EDGES_FILE).exists()},
        "ptbr_features": {"path": str(PTBR_FEATURES_FILE), "exists": Path(PTBR_FEATURES_FILE).exists()},
        "ptbr_target": {"path": str(PTBR_TARGET_FILE), "exists": Path(PTBR_TARGET_FILE).exists()},
        "sample_nodes": {"path": str(SAMPLE_NODES_FILE), "exists": Path(SAMPLE_NODES_FILE).exists()},
        "sample_edges": {"path": str(SAMPLE_EDGES_FILE), "exists": Path(SAMPLE_EDGES_FILE).exists()},
    }

def _write_temp_text_file(content: str, suffix: str) -> Path:
    with tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False, encoding="utf-8") as temp_file:
        temp_file.write(content)
        return Path(temp_file.name)

def _decode_upload_bytes(content: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("Cannot decode file content. Please save files in UTF-8.")


@router.get("/dataset/info")
async def get_dataset_info():
    """Get current dataset and ML readiness info."""

    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    stats = get_graph_stats(graph)

    feature_matrix = graph_builder.get_feature_matrix()
    label_vector = graph_builder.get_label_vector()

    node_count = int(stats["num_nodes"])
    labeled_mask = label_vector >= 0
    labeled_nodes = int(np.sum(labeled_mask)) if label_vector.size > 0 else 0
    unlabeled_nodes = max(0, node_count - labeled_nodes)

    label_distribution = {"0": 0, "1": 0}
    if labeled_nodes > 0:
        label_distribution["0"] = int(np.sum(label_vector[labeled_mask] == 0))
        label_distribution["1"] = int(np.sum(label_vector[labeled_mask] == 1))

    feature_dim = int(feature_matrix.shape[1]) if feature_matrix.size > 0 else 0
    gcn_ready = labeled_nodes > 0 and feature_dim > 0
    dataset_mode = "twitch_ml" if gcn_ready else "simple_graph"

    node_list = []
    for node_id in graph.nodes():
        node_info = nodes_data.get(node_id, {})
        node_list.append({
            "id": str(node_id),
            "name": node_info.get("name", str(node_id)),
        })

    return {
        "num_nodes": stats["num_nodes"],
        "num_edges": stats["num_edges"],
        "node_list": node_list,
        "density": stats["density"],
        "avg_degree": stats["avg_degree"],
        "dataset_mode": dataset_mode,
        "gcn_ready": gcn_ready,
        "label_name": "partner",
        "feature_dim": feature_dim,
        "labeled_nodes": labeled_nodes,
        "unlabeled_nodes": unlabeled_nodes,
        "label_distribution": label_distribution,
        "files": _build_files_info(),
    }


@router.post("/dataset/upload")
async def upload_dataset(nodes_file: UploadFile = File(...), edges_file: UploadFile = File(...)):
    """Upload simple CSV graph (nodes + edges)."""

    try:
        nodes_content = await nodes_file.read()
        nodes_file_obj = io.StringIO(_decode_upload_bytes(nodes_content))

        edges_content = await edges_file.read()
        edges_file_obj = io.StringIO(_decode_upload_bytes(edges_content))

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as temp_nodes:
            temp_nodes.write(nodes_file_obj.getvalue())
            temp_nodes_path = Path(temp_nodes.name)

        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as temp_edges:
            temp_edges.write(edges_file_obj.getvalue())
            temp_edges_path = Path(temp_edges.name)

        new_builder = GraphBuilder()
        new_builder.load_from_csv(temp_nodes_path, temp_edges_path)

        import app.core.data_storage as data_storage

        data_storage._graph_builder = new_builder

        temp_nodes_path.unlink()
        temp_edges_path.unlink()

        graph = new_builder.get_graph()
        stats = get_graph_stats(graph)

        return {
            "success": True,
            "message": "Simple graph dataset uploaded successfully",
            "num_nodes": stats["num_nodes"],
            "num_edges": stats["num_edges"],
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")

@router.post("/dataset/upload-ml")
async def upload_ml_dataset(
    edges_file: UploadFile = File(...),
    features_file: UploadFile = File(...),
    target_file: UploadFile = File(...),
):
    """Upload full ML dataset for GCN (edges + features + target)."""

    temp_edges_path: Path | None = None
    temp_features_path: Path | None = None
    temp_target_path: Path | None = None

    try:
        edges_content = _decode_upload_bytes(await edges_file.read())
        features_content = _decode_upload_bytes(await features_file.read())
        target_content = _decode_upload_bytes(await target_file.read())

        temp_edges_path = _write_temp_text_file(edges_content, ".csv")
        temp_features_path = _write_temp_text_file(features_content, ".json")
        temp_target_path = _write_temp_text_file(target_content, ".csv")

        new_builder = GraphBuilder()
        new_builder.load_twitch_dataset(temp_edges_path, temp_features_path, temp_target_path)

        import app.core.data_storage as data_storage

        data_storage._graph_builder = new_builder

        graph = new_builder.get_graph()
        stats = get_graph_stats(graph)
        feature_matrix = new_builder.get_feature_matrix()
        label_vector = new_builder.get_label_vector()
        labeled_nodes = int(np.sum(label_vector >= 0)) if label_vector.size > 0 else 0

        return {
            "success": True,
            "message": "Full ML dataset uploaded successfully",
            "num_nodes": stats["num_nodes"],
            "num_edges": stats["num_edges"],
            "feature_dim": int(feature_matrix.shape[1]) if feature_matrix.size > 0 else 0,
            "labeled_nodes": labeled_nodes,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ML upload failed: {str(e)}")
    finally:
        for path in (temp_edges_path, temp_features_path, temp_target_path):
            if path and path.exists():
                path.unlink()


@router.post("/dataset/reset")
async def reset_dataset():
    """Reset to default dataset (PTBR/Twitch if available)."""

    try:
        reset_graph()

        graph_builder = get_graph_builder()
        graph = graph_builder.get_graph()
        stats = get_graph_stats(graph)

        return {
            "success": True,
            "message": "Dataset reset successfully",
            "num_nodes": stats["num_nodes"],
            "num_edges": stats["num_edges"],
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Reset failed: {str(e)}")
