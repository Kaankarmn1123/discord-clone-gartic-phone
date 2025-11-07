// components/CreateServerModal.tsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { tr } from '../constants/tr';
import type { Server } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerCreated: (newServer: Server) => void;
  userId: string;
}

const CreateServerModal: React.FC<CreateServerModalProps> = ({ isOpen, onClose, onServerCreated, userId }) => {
  const [serverName, setServerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) {
      setError('Sunucu adı boş olamaz.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data: newServer, error: rpcError } = await supabase
        .rpc('create_user_server', {
          p_server_name: serverName.trim()
        });
      
      if (rpcError) throw rpcError;

      onServerCreated(newServer);
      setServerName('');
      onClose();

    } catch (err: any) {
      if (err.message?.includes('User is only allowed to create one server')) {
        setError('Her kullanıcının yalnızca bir sunucusu olabilir.');
      } else {
        setError(err.message || 'Sunucu oluşturulamadı.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-lg shadow-xl text-white" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Sunucu Oluştur</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="server-name" className="block text-sm font-medium text-slate-300">Sunucu Adı</label>
              <input
                id="server-name"
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className={`w-full p-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:outline-none ${theme.colors.focusRing}`}
                placeholder="Yeni Sunucum"
                required
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <div className="flex justify-end mt-6 space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-transparent rounded-md hover:bg-slate-700">
              {tr.cancel}
            </button>
            <button type="submit" disabled={loading} className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${theme.colors.primaryButton} ${theme.colors.primaryButtonHover}`}>
              {loading ? `${tr.loading}...` : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServerModal;
