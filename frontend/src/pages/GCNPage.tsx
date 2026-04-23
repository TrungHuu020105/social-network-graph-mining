import React, { useEffect, useState } from 'react';
import { getGCNAllPredictions, getGCNEmbeddings, predictGCNNode, trainGCN } from '../api/gcn';
import { EmbeddingChart } from '../components/gcn/EmbeddingChart';
import { InsightPanel } from '../components/gcn/InsightPanel';
import { PredictionPanel } from '../components/gcn/PredictionPanel';
import { TrainingPanel } from '../components/gcn/TrainingPanel';
import { GraphPanel } from '../components/graph/GraphPanel';
import { GCNEmbeddingPoint, GCNPrediction, GCNTrainResponse } from '../types/gcn';

export const GCNPage: React.FC = () => {
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<GCNTrainResponse | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [predictionResult, setPredictionResult] = useState<GCNPrediction | null>(null);
  const [allPredictions, setAllPredictions] = useState<GCNPrediction[]>([]);
  const [embeddings, setEmbeddings] = useState<GCNEmbeddingPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const nodeOptions = allPredictions.map((item) => ({
    id: String(item.node_id),
    name: `User ${item.node_id}`,
  }));

  const refreshGCNData = async () => {
    const [predictionResponse, embeddingResponse] = await Promise.all([getGCNAllPredictions(), getGCNEmbeddings()]);
    setAllPredictions(predictionResponse.predictions);
    setEmbeddings(embeddingResponse.embeddings);
  };

  const handleTrain = async () => {
    try {
      setError(null);
      setTraining(true);
      const result = await trainGCN();
      setTrainResult(result);
      await refreshGCNData();
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Khong the train GCN');
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
      setError(e?.response?.data?.detail || 'Khong the du doan node');
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
        <h2 className="text-2xl font-bold text-white">Du doan partner bang Graph Neural Network (GCN)</h2>
        <p className="mt-2 text-slate-300">
          GCN hoc tu cau truc mang xa hoi va thong tin dac trung cua node de du doan nhan partner cho tung user trong do thi.
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
        <h3 className="mb-3 text-lg font-semibold text-white">Graph Visualization</h3>
        <div className="mb-3 flex gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            Predicted Non-Partner (0)
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            Predicted Partner (1)
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-500" />
            Not predicted yet
          </span>
        </div>
        <GraphPanel communityAlgorithm="louvain" colorMode="prediction" />
      </section>
      <EmbeddingChart points={embeddings} />
      <InsightPanel predictions={allPredictions} />
    </div>
  );
};
