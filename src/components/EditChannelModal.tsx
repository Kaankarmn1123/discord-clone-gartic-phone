// src/components/EditChannelModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { tr } from '../constants/tr';
import type { Channel } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface EditChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel;
  onChannelUpdated: () => void;
}

const EditChannelModal: React.FC<EditChannelModalProps> = ({ isOpen, onClose, channel, onChannelUpdated }) => {
  const [channelName, setChannelName] = useState(channel.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    setChannelName(channel.name);
  }, [channel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || channelName.trim() === channel.name) {
      onClose();
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('channels')
        .update({ name: channelName.trim() })
        .eq('id', channel.id);

      if (updateError) throw updateError;
      
      onChannelUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kanal güncellenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`'${channel.name}' kanalını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
        setLoading(true);
        const { error: deleteError } = await supabase
            .from('channels')
            .delete()
            .eq('id', channel.id);
        
        if (deleteError) {
            setError(deleteError.message);
        } else {
            onChannelUpdated();
            onClose();
        }
        setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-lg shadow-xl text-white" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Kanalı Düzenle</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="channel-name-edit" className="block text-sm font-medium text-slate-300">KANAL ADI</label>
              <input
                id="channel-name-edit"
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className={`w-full p-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:outline-none ${theme.colors.focusRing}`}
                required
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <div className="flex justify-between mt-6">
            <button type="button" onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm font-medium text-red-400 bg-transparent rounded-md hover:bg-red-500/20">
              Kanalı Sil
            </button>
            <div className="flex space-x-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-transparent rounded-md hover:bg-slate-700">
                  {tr.cancel}
                </button>
                <button type="submit" disabled={loading || channelName.trim() === channel.name} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-slate-500">
                  {loading ? `${tr.saving}...` : tr.saveChanges}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditChannelModal;
