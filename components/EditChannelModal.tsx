// components/EditChannelModal.tsx
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl text-white border border-slate-700/50 transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Kanalı Düzenle</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="channel-name-edit" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Kanal Adı
              </label>
              <input
                id="channel-name-edit"
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className={`w-full px-4 py-3 text-white bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:outline-none ${theme.colors.focusRing} transition-all duration-200 placeholder-slate-500`}
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
            <button 
              type="button" 
              onClick={handleDelete} 
              disabled={loading} 
              className="px-4 py-2.5 text-sm font-semibold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                Kanalı Sil
              </span>
            </button>
            
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {tr.cancel}
              </button>
              <button 
                type="submit" 
                disabled={loading || channelName.trim() === channel.name} 
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:hover:scale-100"
              >
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