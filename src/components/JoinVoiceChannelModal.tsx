import React from 'react';
import { tr } from '../constants/tr';
import { useTheme } from '../contexts/ThemeContext';

interface JoinVoiceChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  channelName?: string;
}

const JoinVoiceChannelModal: React.FC<JoinVoiceChannelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  channelName,
}) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-lg shadow-xl text-white" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-2">{tr.joinVoiceChannel}</h2>
        <p className="text-slate-300 mb-6">
          {tr.confirmJoinVoice.replace('#{channelName}', '')}
          <span className={`font-semibold ${theme.colors.text}`}>#{channelName}</span>?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-transparent rounded-md hover:bg-slate-700"
          >
            {tr.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            {tr.joinChannel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinVoiceChannelModal;
