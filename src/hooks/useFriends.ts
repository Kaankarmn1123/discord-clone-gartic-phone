// NEW - src/hooks/useFriends.ts
import { useAppContext } from '../contexts/AppContext';

export function useFriends() {
  const { appData, isReady, refetchFriends, refetchAll } = useAppContext();

  return { 
    friends: appData.friends, 
    pending: appData.pendingFriends,
    serverInvites: appData.serverInvites,
    loading: !isReady, 
    refetch: refetchAll // Tüm veriyi yeniden çekmek en güvenli yol
  };
}
