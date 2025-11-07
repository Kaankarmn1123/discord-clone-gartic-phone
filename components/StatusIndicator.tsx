import React from 'react';
import type { Profile } from '../types';

interface StatusIndicatorProps {
  status: Profile['status'];
  className?: string;
}

const statusClasses: Record<Profile['status'], string> = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-slate-500',
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className }) => {
  return (
    <span
      className={`block w-3 h-3 rounded-full border-2 border-slate-900 ${statusClasses[status] || 'bg-slate-500'} ${className}`}
      title={status}
    />
  );
};

export default StatusIndicator;
