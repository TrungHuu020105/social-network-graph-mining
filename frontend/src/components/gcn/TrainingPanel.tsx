import React from 'react';
import { GCNTrainResponse } from '../../types/gcn';

interface TrainingPanelProps {
  training: boolean;
  trainResult: GCNTrainResponse | null;
  onTrain: () => Promise<void>;
}

export const TrainingPanel: React.FC<TrainingPanelProps> = ({ training, trainResult, onTrain }) => {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Training Panel</h3>
      <button
        onClick={onTrain}
        disabled={training}
        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600"
      >
        {training ? 'Dang train...' : 'Train GCN'}
      </button>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-700 p-3">
          <p className="text-xs text-slate-300">Accuracy</p>
          <p className="text-xl font-bold text-emerald-400">{trainResult ? trainResult.accuracy.toFixed(4) : '-'}</p>
        </div>
        <div className="rounded-lg bg-slate-700 p-3">
          <p className="text-xs text-slate-300">Loss</p>
          <p className="text-xl font-bold text-amber-400">{trainResult ? trainResult.loss.toFixed(6) : '-'}</p>
        </div>
        <div className="rounded-lg bg-slate-700 p-3">
          <p className="text-xs text-slate-300">Training status</p>
          <p className="text-xl font-bold text-cyan-400">{training ? 'Training' : trainResult ? 'Done' : 'Idle'}</p>
        </div>
      </div>
    </section>
  );
};
