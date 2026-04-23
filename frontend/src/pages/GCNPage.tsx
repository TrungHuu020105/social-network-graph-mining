import React, { useEffect, useState } from 'react';
import { getGCNAllPredictions, getGCNEmbeddings, predictGCNNode, trainGCN } from '../api/gcn';
import { EmbeddingChart } from '../components/gcn/EmbeddingChart';
import { GCNGraphPanel } from '../components/gcn/GCNGraphPanel';
import { InsightPanel } from '../components/gcn/InsightPanel';
import { PredictionPanel } from '../components/gcn/PredictionPanel';
import { TrainingPanel } from '../components/gcn/TrainingPanel';
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
        <h2 className="text-2xl font-bold text-white">Du doan bang Graph Neural Network (GCN)</h2>
        <p className="mt-2 text-slate-300">
          GCN hoc tu cau truc mang xa hoi va thong tin dac trung cua node de du doan nhan cho tung user trong do thi.
        </p>
      </header>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">{error}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TrainingPanel training={training} trainResult={trainResult} onTrain={handleTrain} />
        <PredictionPanel
          nodeId={nodeId}
          predicting={predicting}
          result={predictionResult}
          onNodeIdChange={setNodeId}
          onPredict={handlePredict}
        />
      </div>

      <GCNGraphPanel />
      <EmbeddingChart points={embeddings} />
      <InsightPanel predictions={allPredictions} />
    </div>
  );
};
