import React, { useEffect, useState } from 'react';
import { getGraphData } from '../api/endpoints';
import { getGCNAllPredictions, getGCNEmbeddings, predictGCNNode, trainGCN } from '../api/gcn';
import { EmbeddingChart } from '../components/gcn/EmbeddingChart';
import { InsightPanel } from '../components/gcn/InsightPanel';
import { PredictionPanel } from '../components/gcn/PredictionPanel';
import { TrainingPanel } from '../components/gcn/TrainingPanel';
import { GraphPanel } from '../components/graph/GraphPanel';
import { GraphNodeData } from '../types';
import { GCNEmbeddingPoint, GCNPrediction, GCNTrainResponse } from '../types/gcn';

export const GCNPage: React.FC = () => {
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<GCNTrainResponse | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [predictionResult, setPredictionResult] = useState<GCNPrediction | null>(null);
  const [allPredictions, setAllPredictions] = useState<GCNPrediction[]>([]);
  const [embeddings, setEmbeddings] = useState<GCNEmbeddingPoint[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNodeData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [graphRefreshKey, setGraphRefreshKey] = useState(0);

  const nodeOptions = allPredictions.map((item) => ({
    id: String(item.node_id),
    name: `Người dùng ${item.node_id}`,
  }));

  const refreshGCNData = async () => {
    const [predictionResponse, embeddingResponse, graphResponse] = await Promise.all([
      getGCNAllPredictions(),
      getGCNEmbeddings(),
      getGraphData('louvain', 1000),
    ]);
    setAllPredictions(predictionResponse.predictions);
    setEmbeddings(embeddingResponse.embeddings);
    setGraphNodes(graphResponse.nodes || []);
  };

  const handleTrain = async () => {
    try {
      setError(null);
      setTraining(true);
      const result = await trainGCN();
      setTrainResult(result);
      await refreshGCNData();
      setGraphRefreshKey((prev) => prev + 1);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Không thể huấn luyện GCN');
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async () => {
    if (!nodeId) return;
    try {
      setError(null);
      setPredicting(true);
      const result = await predictGCNNode(nodeId.trim());
      setPredictionResult(result);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Không thể dự đoán node');
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    refreshGCNData().catch(() => {});
  }, []);

  return (
    <div className="space-y-6 p-6">
      <header className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h2 className="text-2xl font-bold text-white">Dự đoán partner bằng Graph Neural Network (GCN)</h2>
        <p className="mt-2 text-slate-300">
          GCN học từ cấu trúc mạng xã hội và thông tin đặc trưng của node để dự đoán nhãn partner cho từng user trong đồ thị.
        </p>
      </header>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">{error}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrainingPanel training={training} trainResult={trainResult} onTrain={handleTrain} />
        <PredictionPanel
          nodeId={nodeId}
          predicting={predicting}
          result={predictionResult}
          nodeOptions={nodeOptions}
          onNodeIdChange={setNodeId}
          onPredict={handlePredict}
        />
      </div>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h3 className="mb-3 text-lg font-semibold text-white">Trực quan đồ thị</h3>
        <div className="mb-3 flex gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            Dự đoán Non-Partner (0)
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            Dự đoán Partner (1)
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-500" />
            Chưa có dự đoán
          </span>
        </div>
        <GraphPanel communityAlgorithm="louvain" colorMode="prediction" refreshKey={graphRefreshKey} />
      </section>

      <EmbeddingChart points={embeddings} />
      <InsightPanel predictions={allPredictions} graphNodes={graphNodes} />
    </div>
  );
};
