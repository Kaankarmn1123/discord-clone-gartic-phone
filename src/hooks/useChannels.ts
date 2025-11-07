// NEW - src/hooks/useChannels.ts
import { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';

export function useChannels(serverId: string | null) {
  const { appData, isReady, refetchAll } = useAppContext();

  const channels = useMemo(() => {
    if (!serverId || !isReady) {
      return [];
    }
    // Veriyi AppContext'ten al ve filtrele
    return appData.channels
      .filter(c => c.server_id === serverId)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'text' ? -1 : 1; // Önce metin kanalları
        return a.name.localeCompare(b.name);
      });
  }, [serverId, appData.channels, isReady]);

  return { 
    channels, 
    loading: !isReady, 
    refetch: refetchAll // Tüm veriyi yeniden çekerek kanalları günceller
  };
}
