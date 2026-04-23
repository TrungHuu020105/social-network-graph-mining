import React from 'react';
import { GCNPrediction } from '../../types/gcn';

interface PredictionPanelProps {
  nodeId: string;
  predicting: boolean;
  result: GCNPrediction | null;
  onNodeIdChange: (value: string) => void;
  onPredict: () => Promise<void>;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  nodeId,
  predicting,
  result,
  onNodeIdChange,
  onPredict,
}) => {
  const badgeColor =
    result?.predicted_label === 1
      ? 'bg-red-600/20 text-red-300 border-red-500/40'
      : 'bg-blue-600/20 text-blue-300 border-blue-500/40';

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Prediction Panel</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={nodeId}
          onChange={(e) => onNodeIdChange(e.target.value)}
          placeholder="Nhap node_id"
          className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-blue-500"
        />
        <button
          onClick={onPredict}
          disabled={predicting || !nodeId}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {predicting ? 'Dang du doan...' : 'Predict'}
        </button>
      </div>

      {result && (
        <div className="mt-4 space-y-2 rounded-lg bg-slate-700 p-3 text-sm text-slate-200">
          <p>
            <span className="text-slate-400">Node ID:</span> {result.node_id}
          </p>
          <p>
            <span className="text-slate-400">Predicted label:</span>{' '}
            <span className={`rounded border px-2 py-1 text-xs font-semibold ${badgeColor}`}>{result.predicted_label}</span>
          </p>
          <p>
            <span className="text-slate-400">Probability:</span> {(result.probability * 100).toFixed(2)}%
          </p>
        </div>
      )}
    </section>
  );
};
