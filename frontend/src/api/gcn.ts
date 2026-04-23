import apiClient from './client';
import {
  GCNAllPredictionsResponse,
  GCNEmbeddingsResponse,
  GCNPrediction,
  GCNTrainResponse,
} from '../types/gcn';

export const trainGCN = async (): Promise<GCNTrainResponse> => {
  const response = await apiClient.get('/gcn/train');
  return response.data;
};

export const predictGCNNode = async (nodeId: string): Promise<GCNPrediction> => {
  const response = await apiClient.get(`/gcn/predict/${nodeId}`);
  return response.data;
};

export const getGCNAllPredictions = async (): Promise<GCNAllPredictionsResponse> => {
  const response = await apiClient.get('/gcn/all-predictions');
  return response.data;
};

export const getGCNEmbeddings = async (): Promise<GCNEmbeddingsResponse> => {
  const response = await apiClient.get('/gcn/embeddings');
  return response.data;
};
