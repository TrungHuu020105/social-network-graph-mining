// components/layout/Topbar.tsx
import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface TopbarProps {
  title: string;
  description?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title, description }) => {
  return (
    <div className="bg-slate-800 border-b border-slate-700 p-6">
      <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
      {description && (
        <p className="text-slate-400 text-sm">{description}</p>
      )}
    </div>
  );
};
