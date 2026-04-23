// api/endpoints.ts
import apiClient from './client';
import {
  OverviewStats,
  GraphData,
  Recommendation,
  UserDetail,
  InfluentialUser,
  ExplanationData,
  DatasetInfo,
  UserNeighborsResponse,
} from '../types';

// Overview
export const getOverview = async (): Promise<OverviewStats> => {
  const response = await apiClient.get('/overview');
  return response.data;
};

// Graph
export const getGraphData = async (communityAlg: string = 'louvain', maxNodes: number = 1000): Promise<GraphData> => {
  const response = await apiClient.get('/graph', {
    params: { community_alg: communityAlg, max_nodes: maxNodes }
  });
  return response.data;
};

// Communities
export const getCommunities = async (algorithm: string = 'louvain') => {
  const response = await apiClient.get('/communities', {
    params: { algorithm }
  });
  return response.data;
};

export const getCommunityStats = async () => {
  const response = await apiClient.get('/communities/stats');
  return response.data;
};

export const compareCommunityAlgorithmsDirect = async () => {
  const response = await apiClient.get('/communities/compare');
  return response.data;
};

export const getBestCommunities = async () => {
  const response = await apiClient.get('/communities/best');
  return response.data;
};

// Users
export const getTopInfluential = async (metric: string = 'pagerank', limit: number = 10): Promise<{ users: InfluentialUser[] }> => {
  const response = await apiClient.get('/users/top-influential', {
    params: { metric, limit }
  });
  return response.data;
};

export const getUserDetail = async (userId: string): Promise<UserDetail> => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

export const getUserNeighbors = async (userId: string, depth: number = 1): Promise<UserNeighborsResponse> => {
  const response = await apiClient.get(`/users/${userId}/neighbors`, {
    params: { depth }
  });
  return response.data;
};

// Recommendations
export const getRecommendations = async (userId: string, algorithm: string = 'adamic_adar', topK: number = 10): Promise<{ recommendations: Recommendation[] }> => {
  const response = await apiClient.get(`/recommendations/${userId}`, {
    params: { algorithm, top_k: topK }
  });
  return response.data;
};

export const explainRecommendation = async (
  userId: string,
  targetId: string,
  algorithm: string = 'adamic_adar',
): Promise<ExplanationData> => {
  const response = await apiClient.get(`/recommendations/${userId}/explain`, {
    params: { target: targetId, algorithm }
  });
  return response.data;
};

// Comparison
export const compareCommunityAlgorithms = async () => {
  const response = await apiClient.get('/comparison/community');
  return response.data;
};

export const compareRecommendationAlgorithms = async (sourceId: string, topK: number = 10) => {
  const response = await apiClient.get('/comparison/recommendation', {
    params: { source_id: sourceId, top_k: topK }
  });
  return response.data;
};

// Evaluation
export const evaluateRecommendation = async (algorithm: string, topK: number = 10, hiddenEdgeRatio: number = 0.1) => {
  const response = await apiClient.get('/evaluation/recommendation', {
    params: { algorithm, top_k: topK, hidden_edge_ratio: hiddenEdgeRatio }
  });
  return response.data;
};

export const evaluateMultipleAlgorithms = async (topK: number = 10, hiddenEdgeRatio: number = 0.1) => {
  const response = await apiClient.get('/evaluation/multiple', {
    params: { top_k: topK, hidden_edge_ratio: hiddenEdgeRatio }
  });
  return response.data;
};

// Dataset
export const getDatasetInfo = async (): Promise<DatasetInfo> => {
  const response = await apiClient.get('/dataset/info');
  return response.data;
};

export const resetDataset = async () => {
  const response = await apiClient.post('/dataset/reset');
  return response.data;
};

export const uploadDataset = async (nodesFile: File, edgesFile: File) => {
  const formData = new FormData();
  formData.append('nodes_file', nodesFile);
  formData.append('edges_file', edgesFile);

  const response = await apiClient.post('/dataset/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const uploadFullMLDataset = async (edgesFile: File, featuresFile: File, targetFile: File) => {
  const formData = new FormData();
  formData.append('edges_file', edgesFile);
  formData.append('features_file', featuresFile);
  formData.append('target_file', targetFile);

  const response = await apiClient.post('/dataset/upload-ml', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
