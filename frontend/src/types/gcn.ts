export interface GCNTrainResponse {
  accuracy: number;
  loss: number;
  train_size: number;
  test_size: number;
}

export interface GCNPrediction {
  node_id: string;
  predicted_label: number;
  probability: number;
}

export interface GCNAllPredictionsResponse {
  predictions: GCNPrediction[];
  count: number;
}

export interface GCNEmbeddingPoint {
  node_id: string;
  x: number;
  y: number;
  predicted_label: number;
  probability: number;
}

export interface GCNEmbeddingsResponse {
  embeddings: GCNEmbeddingPoint[];
  count: number;
}
