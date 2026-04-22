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
    
    @staticmethod
    def compare_all_algorithms(graph: nx.Graph) -> Dict:
        """
        So sánh cả 3 thuật toán
        
        Returns:
            {
                'louvain': {'num_communities': int, 'modularity': float, 'execution_time': float},
                'label_propagation': {...},
                'girvan_newman': {...},
                'best_algorithm': 'louvain' | 'label_propagation' | 'girvan_newman'
            }
        """
        results = {}
        best_modularity = -1
        best_algorithm = None
        
        # Louvain
        communities_louvain, modularity_louvain, time_louvain = CommunityDetectionService.louvain(graph)
        results['louvain'] = {
            'num_communities': len(set(communities_louvain.values())),
            'modularity': round(modularity_louvain, 4),
            'execution_time': round(time_louvain, 4),
            'communities': communities_louvain
        }
        if modularity_louvain > best_modularity:
            best_modularity = modularity_louvain
            best_algorithm = 'louvain'
        
        # Label Propagation
        communities_lp, modularity_lp, time_lp = CommunityDetectionService.label_propagation(graph)
        results['label_propagation'] = {
            'num_communities': len(set(communities_lp.values())),
            'modularity': round(modularity_lp, 4),
            'execution_time': round(time_lp, 4),
            'communities': communities_lp
        }
        if modularity_lp > best_modularity:
            best_modularity = modularity_lp
            best_algorithm = 'label_propagation'
        
        # Girvan-Newman
        communities_gn, modularity_gn, time_gn = CommunityDetectionService.girvan_newman(graph)
        results['girvan_newman'] = {
            'num_communities': len(set(communities_gn.values())),
            'modularity': round(modularity_gn, 4),
            'execution_time': round(time_gn, 4),
            'communities': communities_gn
        }
        if modularity_gn > best_modularity:
            best_modularity = modularity_gn
            best_algorithm = 'girvan_newman'
        
        results['best_algorithm'] = best_algorithm
        results['best_modularity'] = round(best_modularity, 4)
        
        return results
    
    @staticmethod
    def get_best_communities(graph: nx.Graph) -> Tuple[Dict[str, int], float, str]:
        """
        Lấy kết quả cộng đồng từ thuật toán tốt nhất
        
        Returns:
            Tuple(communities_dict, modularity, algorithm_name)
        """
        comparison = CommunityDetectionService.compare_all_algorithms(graph)
        best_algo = comparison['best_algorithm']
        
        if best_algo == 'louvain':
            return comparison['louvain']['communities'], comparison['louvain']['modularity'], 'louvain'
        elif best_algo == 'label_propagation':
            return comparison['label_propagation']['communities'], comparison['label_propagation']['modularity'], 'label_propagation'
        else:  # girvan_newman
            return comparison['girvan_newman']['communities'], comparison['girvan_newman']['modularity'], 'girvan_newman'
