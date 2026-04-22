// components/dashboard/StatCard.tsx
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorStyles = {
  blue: 'bg-blue-500/10 border-blue-500/20',
  green: 'bg-green-500/10 border-green-500/20',
  purple: 'bg-purple-500/10 border-purple-500/20',
  orange: 'bg-orange-500/10 border-orange-500/20',
  red: 'bg-red-500/10 border-red-500/20',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'blue',
}) => {
  return (
    <div className={`${colorStyles[color]} border rounded-lg p-6 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className="text-xs text-slate-500 mt-1">{trend}</p>
          )}
        </div>
        {icon && (
          <div className="text-2xl opacity-50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
