export interface Node {
  id: string;
  name: string;
  username: string;
  degree?: number;
  community?: number;
}

export interface Edge {
  source: string;
  target: string;
}

export interface CommunityInfo {
  id: number;
  size: number;
  members: string[];
  density: number;
}

export interface GraphNodeData {
  id: string;
  label: string;
  community: number;
  degree: number;
  pagerank: number;
  prediction?: number | null;
  probability?: number | null;
}

export interface GraphLinkData {
  source: string;
  target: string;
}

export interface GraphMeta {
  num_nodes: number;
  num_edges: number;
  num_communities: number;
  community_ids: number[];
  total_nodes: number;
  total_edges: number;
  max_nodes: number;
}

export interface GraphData {
  nodes: GraphNodeData[];
  links: GraphLinkData[];
  edges?: GraphLinkData[];
  meta: GraphMeta;
}

export interface OverviewStats {
  num_nodes: number;
  num_edges: number;
  density: number;
  avg_degree: number;
  isolated_nodes: number;
  diameter: number;
  avg_clustering_coefficient: number;
}

export interface Recommendation {
  target_id: string;
  target_username: string;
  target_name: string;
  score: number;
  common_neighbors: string[];
  num_common_neighbors: number;
}

export interface UserDetail {
  id: string;
  name: string;
  username: string;
  degree: number;
  neighbors: string[];
  community: number;
  centrality_scores: Record<string, number>;
}

export interface UserNeighborNode {
  id: string;
  name: string;
  username: string;
  degree: number;
}

export interface UserNeighborEdge {
  source: string;
  target: string;
}

export interface UserNeighborsResponse {
  user_id: string;
  depth: number;
  neighbors: UserNeighborNode[];
  num_neighbors: number;
  edges: UserNeighborEdge[];
}

export interface InfluentialUser {
  user_id: string;
  username: string;
  name: string;
  degree: number;
  score: number;
  metric: string;
}

export interface ExplanationData {
  source_id: string;
  source_name: string;
  target_id: string;
  target_name: string;
  algorithm: string;
  ranking_label?: string;
  ranking_score?: number;
  jaccard_coefficient: number;
  adamic_adar_score: number;
  common_neighbors: string[];
  num_common_neighbors: number;
  same_community: boolean;
  shortest_path_distance: number;
  shortest_path: string[];
  explanation_text: string;
}

export interface DatasetInfo {
  num_nodes: number;
  num_edges: number;
  node_list: Array<{ id: string; name: string }>;
  density: number;
  avg_degree: number;
  dataset_mode?: 'twitch_ml' | 'simple_graph' | string;
  gcn_ready?: boolean;
  label_name?: string;
  feature_dim?: number;
  labeled_nodes?: number;
  unlabeled_nodes?: number;
  label_distribution?: Record<string, number>;
  files?: Record<string, { path: string; exists: boolean }>;
}
