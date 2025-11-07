import React from 'react';
import type { Profile } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface UserStatusMenuProps {
  onStatusSelect: (status: Profile['status']) => void;
  onClose?: () => void; // Optional close handler
}

const statuses: { id: Profile['status']; label: string; color: string }[] = [
  { id: 'online', label: 'Çevrimiçi', color: 'bg-green-500' },
  { id: 'idle', label: 'Boşta', color: 'bg-yellow-500' },
  { id: 'dnd', label: 'Rahatsız Etmeyin', color: 'bg-red-500' },
  { id: 'offline', label: 'Görünmez', color: 'bg-slate-500' },
];

const UserStatusMenu: React.FC<UserStatusMenuProps> = ({ onStatusSelect, onClose }) => {
  const { theme } = useTheme();
  
  const handleSelect = (status: Profile['status']) => {
    onStatusSelect(status);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="p-1">
      <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase">Durumunu Ayarla</div>
      <div className="mt-1 space-y-1">
        {statuses.map(status => (
            <button
            key={status.id}
            onClick={() => handleSelect(status.id)}
            className={`w-full flex items-center text-left px-2 py-1.5 text-sm text-slate-200 hover:text-white rounded ${theme.colors.primaryButtonHover}`}
            >
            <span className={`w-3 h-3 rounded-full mr-3 ${status.color}`} />
            {status.label}
            </button>
        ))}
      </div>
    </div>
  );
};

export default UserStatusMenu;