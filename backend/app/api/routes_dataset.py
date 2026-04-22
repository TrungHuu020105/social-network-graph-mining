"""
Routes cho Dataset Management
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.data_storage import get_graph_builder, reset_graph
from app.core.graph_builder import GraphBuilder
from app.utils.graph_utils import get_graph_stats
import io
import tempfile
from pathlib import Path

router = APIRouter(prefix="/api", tags=["dataset"])


@router.get("/dataset/info")
async def get_dataset_info():
    """Lấy thông tin dataset hiện tại"""
    
    graph_builder = get_graph_builder()
    graph = graph_builder.get_graph()
    nodes_data = graph_builder.get_nodes_data()
    
    stats = get_graph_stats(graph)
    
    return {
        'num_nodes': stats['num_nodes'],
        'num_edges': stats['num_edges'],
        'node_list': list(graph.nodes()),
        'density': stats['density'],
        'avg_degree': stats['avg_degree'],
    }


@router.post("/dataset/upload")
async def upload_dataset(nodes_file: UploadFile = File(...), edges_file: UploadFile = File(...)):
    """Upload dataset mới (CSV files)"""
    
    try:
        # Đọc file nodes
        nodes_content = await nodes_file.read()
        nodes_file_obj = io.StringIO(nodes_content.decode('utf-8'))
        
        # Đọc file edges
        edges_content = await edges_file.read()
        edges_file_obj = io.StringIO(edges_content.decode('utf-8'))
        
        # Tạo temp files
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_nodes:
            temp_nodes.write(nodes_file_obj.getvalue())
            temp_nodes_path = Path(temp_nodes.name)
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as temp_edges:
            temp_edges.write(edges_file_obj.getvalue())
            temp_edges_path = Path(temp_edges.name)
        
        # Build new graph
        new_builder = GraphBuilder()
        new_builder.load_from_csv(temp_nodes_path, temp_edges_path)
        
        # Update global builder
        import app.core.data_storage as data_storage
        data_storage._graph_builder = new_builder
        
        # Cleanup temp files
        temp_nodes_path.unlink()
        temp_edges_path.unlink()
        
        # Return new stats
        graph = new_builder.get_graph()
        stats = get_graph_stats(graph)
        
        return {
            'success': True,
            'message': 'Dataset uploaded successfully',
            'num_nodes': stats['num_nodes'],
            'num_edges': stats['num_edges'],
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {str(e)}")


@router.post("/dataset/reset")
async def reset_dataset():
    """Reset về dataset mẫu"""
    
    try:
        reset_graph()
        
        graph_builder = get_graph_builder()
        graph = graph_builder.get_graph()
        stats = get_graph_stats(graph)
        
        return {
            'success': True,
            'message': 'Dataset reset successfully',
            'num_nodes': stats['num_nodes'],
            'num_edges': stats['num_edges'],
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Reset failed: {str(e)}")
