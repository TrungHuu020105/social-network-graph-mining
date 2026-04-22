// types/index.ts

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

export interface GraphData {
  nodes: any[];
  edges: any[];
  communities: Record<string, number>;
  community_colors: Record<number, string>;
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
  jaccard_coefficient: number;
  adamic_adar_score: number;
  common_neighbors: string[];
  num_common_neighbors: number;
  same_community: boolean;
  shortest_path_distance: number;
  shortest_path: string[];
  explanation_text: string;
}
