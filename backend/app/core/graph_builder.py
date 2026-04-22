import networkx as nx
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


class GraphBuilder:
    """Xây dựng và quản lý graph từ dữ liệu CSV"""
    
    def __init__(self):
        self.graph: nx.Graph = nx.Graph()
        self.nodes_data: Dict = {}
        self.edges_data: List = []
        
    def load_from_csv(self, nodes_file: Path, edges_file: Path) -> nx.Graph:
        """Load graph từ file CSV"""
        try:
            # Load nodes
            nodes_df = pd.read_csv(nodes_file)
            for _, row in nodes_df.iterrows():
                node_id = str(row['id'])
                self.graph.add_node(node_id)
                self.nodes_data[node_id] = {
                    'name': row['name'],
                    'username': row['username'],
                }
            
            # Load edges
            edges_df = pd.read_csv(edges_file)
            for _, row in edges_df.iterrows():
                source = str(row['source'])
                target = str(row['target'])
                if source in self.graph.nodes and target in self.graph.nodes:
                    self.graph.add_edge(source, target)
                    self.edges_data.append((source, target))
            
            logger.info(f"Graph loaded: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges")
            return self.graph
            
        except Exception as e:
            logger.error(f"Error loading graph: {e}")
            raise
    
    def get_graph(self) -> nx.Graph:
        """Lấy graph hiện tại"""
        return self.graph
    
    def get_nodes_data(self) -> Dict:
        """Lấy thông tin nodes"""
        return self.nodes_data
    
    def get_edges_data(self) -> List:
        """Lấy danh sách edges"""
        return self.edges_data
    
    def reset(self):
        """Reset graph"""
        self.graph = nx.Graph()
        self.nodes_data = {}
        self.edges_data = []
