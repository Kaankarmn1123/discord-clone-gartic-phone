// NEW - src/hooks/useMembers.ts
import { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';

export function useMembers(serverId: string | null) {
  const { appData, isReady } = useAppContext();

  const members = useMemo(() => {
    if (!serverId || !isReady) {
      return [];
    }
    // Veriyi AppContext'teki Map'ten al
    return appData.allMembers.get(serverId)?.sort((a, b) => a.username.localeCompare(b.username)) || [];
  }, [serverId, appData.allMembers, isReady]);

  return { 
    members, 
    loading: !isReady, 
  };
}
