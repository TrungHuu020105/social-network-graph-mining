"""
Pydantic schemas cho API responses
"""

from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from enum import Enum


class OverviewStats(BaseModel):
    """Thống kê tổng quan"""
    num_nodes: int
    num_edges: int
    num_communities: Optional[int] = None
    density: float
    avg_degree: float
    isolated_nodes: int
    diameter: int
    avg_clustering_coefficient: float
    current_community_algorithm: str = "louvain"
    current_recommendation_algorithm: str = "adamic_adar"
    num_recommendations: int = 0


class Node(BaseModel):
    """Node info"""
    id: str
    name: str
    username: str
    degree: Optional[int] = None
    community: Optional[int] = None
    centrality_scores: Optional[Dict[str, float]] = None


class Edge(BaseModel):
    """Edge info"""
    source: str
    target: str


class GraphData(BaseModel):
    """Dữ liệu graph để visualize"""
    nodes: List[Dict[str, Any]]  # Cytoscape nodes format
    edges: List[Dict[str, Any]]  # Cytoscape edges format
    communities: Dict[str, int]  # node_id -> community_id
    community_colors: Dict[int, str]  # community_id -> color


class Community(BaseModel):
    """Thông tin cộng đồng"""
    id: int
    size: int
    members: List[str]
    modularity: Optional[float] = None
    density: Optional[float] = None


class CommunityStats(BaseModel):
    """Thống kê các cộng đồng"""
    num_communities: int
    communities: List[Community]
    algorithm: str
    modularity: float
    execution_time: float


class CentralityScore(BaseModel):
    """Điểm trung tâm của một user"""
    user_id: str
    username: str
    degree_centrality: float
    betweenness_centrality: float
    closeness_centrality: float
    pagerank: float
    eigenvector_centrality: Optional[float] = None
    combined_score: float


class UserDetail(BaseModel):
    """Chi tiết một user"""
    id: str
    name: str
    username: str
    degree: int
    neighbors: List[str]
    centrality_scores: Dict[str, float]
    community: int


class Recommendation(BaseModel):
    """Gợi ý kết nối"""
    target_id: str
    target_username: str
    target_name: str
    score: float
    common_neighbors: List[str]
    num_common_neighbors: int
    same_community: bool


class RecommendationList(BaseModel):
    """Danh sách gợi ý"""
    source_id: str
    algorithm: str
    recommendations: List[Recommendation]
    execution_time: float


class ExplanationData(BaseModel):
    """Dữ liệu giải thích gợi ý"""
    source_id: str
    source_name: str
    target_id: str
    target_name: str
    algorithm: str
    
    # Metrics
    jaccard_coefficient: float
    adamic_adar_score: float
    common_neighbors: List[str]
    num_common_neighbors: int
    same_community: bool
    
    # Path
    shortest_path_distance: int
    shortest_path: List[str]
    
    # Detailed scores
    scores: Dict[str, float]


class AlgorithmComparison(BaseModel):
    """So sánh thuật toán"""
    algorithm_name: str
    num_communities: Optional[int] = None
    modularity: Optional[float] = None
    execution_time: float
    quality_score: Optional[float] = None
    metrics: Dict[str, Any] = {}


class ComparisonResult(BaseModel):
    """Kết quả so sánh"""
    comparison_type: str  # "community" or "recommendation"
    algorithms: List[AlgorithmComparison]


class EvaluationMetrics(BaseModel):
    """Metrics đánh giá"""
    algorithm: str
    top_k: int
    hidden_edge_ratio: float
    precision_at_k: float
    hit_rate: float
    num_edges_hidden: int
    num_edges_predicted: int
    execution_time: float


class DatasetInfo(BaseModel):
    """Thông tin dataset"""
    num_nodes: int
    num_edges: int
    node_list: List[str]
    density: float
