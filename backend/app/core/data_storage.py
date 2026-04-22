"""
Global data storage cho ứng dụng
"""

from app.core.graph_builder import GraphBuilder
from app.core.config import SAMPLE_NODES_FILE, SAMPLE_EDGES_FILE

# Khởi tạo graph builder
_graph_builder: GraphBuilder = None


def get_graph_builder() -> GraphBuilder:
    """Lấy hoặc tạo global GraphBuilder instance"""
    global _graph_builder
    if _graph_builder is None:
        _graph_builder = GraphBuilder()
        # Load sample data
        _graph_builder.load_from_csv(SAMPLE_NODES_FILE, SAMPLE_EDGES_FILE)
    return _graph_builder


def reset_graph():
    """Reset graph về trạng thái mặc định"""
    global _graph_builder
    if _graph_builder is not None:
        _graph_builder.reset()
        _graph_builder.load_from_csv(SAMPLE_NODES_FILE, SAMPLE_EDGES_FILE)
