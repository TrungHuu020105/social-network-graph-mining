"""
Community Detection Services
"""

import networkx as nx
from typing import Dict, Tuple, List
import time
from collections import defaultdict
import random

from app.utils.graph_utils import get_graph_stats


class CommunityDetectionService:
    """Dịch vụ phát hiện cộng đồng"""
    
    # Color palette cho communities
    COLORS = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
        "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#A8E6CF",
        "#FFD3B6", "#FFAAA5", "#FF8B94", "#A8DADC", "#F1FAEE",
        "#E63946", "#F1FAEE", "#A8DADC", "#457B9D", "#1D3557",
    ]
    
    @staticmethod
    def louvain(graph: nx.Graph) -> Tuple[Dict[str, int], float, float]:
        """
        Louvain algorithm để phát hiện cộng đồng
        
        Returns:
            Tuple(communities_dict, modularity, execution_time)
        """
        start_time = time.time()
        
        if graph.number_of_nodes() == 0:
            return {}, 0.0, 0.0
        
        # Use networkx's greedy_modularity_communities (gần Louvain)
        communities_list = list(
            nx.community.greedy_modularity_communities(graph)
        )
        
        # Convert to dict
        communities = {}
        for comm_id, nodes in enumerate(communities_list):
            for node in nodes:
                communities[node] = comm_id
        
        # Calculate modularity
        modularity = nx.community.modularity(graph, communities_list)
        
        elapsed_time = time.time() - start_time
        
        return communities, modularity, elapsed_time
    
    @staticmethod
    def label_propagation(graph: nx.Graph) -> Tuple[Dict[str, int], float, float]:
        """
        Label Propagation algorithm
        
        Returns:
            Tuple(communities_dict, modularity, execution_time)
        """
        start_time = time.time()
        
        if graph.number_of_nodes() == 0:
            return {}, 0.0, 0.0
        
        # Use networkx's label_propagation_communities
        communities_list = list(nx.community.label_propagation_communities(graph))
        
        # Convert to dict
        communities = {}
        for comm_id, nodes in enumerate(communities_list):
            for node in nodes:
                communities[node] = comm_id
        
        # Calculate modularity
        modularity = nx.community.modularity(graph, communities_list)
        
        elapsed_time = time.time() - start_time
        
        return communities, modularity, elapsed_time
    
    @staticmethod
    def girvan_newman(graph: nx.Graph, num_communities: int = None) -> Tuple[Dict[str, int], float, float]:
        """
        Girvan-Newman algorithm
        
        Args:
            graph: Input graph
            num_communities: Mục tiêu số cộng đồng
        
        Returns:
            Tuple(communities_dict, modularity, execution_time)
        """
        start_time = time.time()
        
        if graph.number_of_nodes() == 0:
            return {}, 0.0, 0.0
        
        # Nếu không chỉ định số communities, dự toán
        if num_communities is None:
            num_communities = max(2, graph.number_of_nodes() // 7)
        
        # Girvan-Newman
        k = num_communities
        communities_generator = nx.community.girvan_newman(graph)
        
        communities_list = None
        for _ in range(k - 1):
            communities_list = next(communities_generator)
        
        if communities_list is None:
            # Fallback
            communities_list = [set(graph.nodes())]
        
        # Convert to dict
        communities = {}
        for comm_id, nodes in enumerate(communities_list):
            for node in nodes:
                communities[node] = comm_id
        
        # Calculate modularity
        modularity = nx.community.modularity(graph, communities_list)
        
        elapsed_time = time.time() - start_time
        
        return communities, modularity, elapsed_time
    
    @staticmethod
    def get_community_stats(graph: nx.Graph, communities: Dict[str, int]) -> Dict:
        """Tính thống kê cho từng cộng đồng"""
        
        community_groups = defaultdict(list)
        for node, comm_id in communities.items():
            community_groups[comm_id].append(node)
        
        stats = []
        for comm_id, members in sorted(community_groups.items()):
            subgraph = graph.subgraph(members)
            
            size = len(members)
            num_edges = subgraph.number_of_edges()
            
            # Density của subgraph
            if size > 1:
                density = (2 * num_edges) / (size * (size - 1))
            else:
                density = 0.0
            
            stats.append({
                'id': comm_id,
                'size': size,
                'members': sorted(members),
                'num_edges': num_edges,
                'density': round(density, 4),
            })
        
        return stats
    
    @staticmethod
    def get_community_colors(num_communities: int) -> Dict[int, str]:
        """Tạo mapping color cho communities"""
        colors = {}
        for i in range(num_communities):
            color_idx = i % len(CommunityDetectionService.COLORS)
            colors[i] = CommunityDetectionService.COLORS[color_idx]
        return colors
