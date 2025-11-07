// src/components/CreateChannelModal.tsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { tr } from '../constants/tr';
import { useTheme } from '../contexts/ThemeContext';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  onChannelCreated: () => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose, serverId, onChannelCreated }) => {
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) {
      setError('Kanal adı boş olamaz.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('channels')
        .insert({
          name: channelName.trim(),
          type: channelType,
          server_id: serverId,
        });

      if (insertError) throw insertError;
      
      onChannelCreated();
      setChannelName('');
      setChannelType('text');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kanal oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-lg shadow-xl text-white" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Kanal Oluştur</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">KANAL TÜRÜ</label>
                <div className="space-y-2">
                    <RadioOption id="text-channel" value="text" checked={channelType === 'text'} onChange={setChannelType} label="Metin Kanalı" description="Mesaj, resim, GIF, emoji gönder."/>
                    <RadioOption id="voice-channel" value="voice" checked={channelType === 'voice'} onChange={setChannelType} label="Ses Kanalı" description="Sesli, görüntülü ve ekran paylaşımıyla sohbet et."/>
                </div>
            </div>
            <div>
              <label htmlFor="channel-name" className="block text-sm font-medium text-slate-300">KANAL ADI</label>
              <input
                id="channel-name"
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className={`w-full p-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:outline-none ${theme.colors.focusRing}`}
                placeholder="yeni-kanal"
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

const RadioOption = ({ id, value, checked, onChange, label, description }: any) => {
    const { theme } = useTheme();
    return (
        <label htmlFor={id} className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${checked ? theme.colors.radioChecked : 'bg-slate-700 hover:bg-slate-600'}`}>
            <div className="flex-grow">
                <h3 className="font-semibold">{label}</h3>
                <p className="text-sm text-slate-400">{description}</p>
            </div>
            <input type="radio" id={id} name="channelType" value={value} checked={checked} onChange={(e) => onChange(e.target.value)} className={`w-5 h-5 ml-4 text-${theme.colors.accent}-600 bg-slate-700 border-slate-600 focus:ring-${theme.colors.accent}-500`}/>
        </label>
    );
}

export default CreateChannelModal;