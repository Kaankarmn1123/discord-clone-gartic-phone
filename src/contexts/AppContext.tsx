// src/contexts/AppContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import type { Server, Friend, Channel, Profile, ServerInvite, UIMessage, Message, Reaction } from '../types';

type DiscoverServer = Server & {
  members_count: number;
  is_member: boolean;
  request_sent: boolean;
  owner_profile: Pick<Profile, 'username'> | null;
};

// YENİ: GameSession türü eklendi
type GameSession = { id: string; channel_id: string; game_type: string; host_id: string; status: 'lobby' | 'prompting' | 'playing' | 'results' | 'finished'; };

interface AppData {
    servers: Server[];
    friends: Friend[];
    pendingFriends: Friend[];
    serverInvites: ServerInvite[];
    channels: Channel[];
    allMembers: Map<string, Profile[]>;
    profiles: Map<string, Profile>;
    messages: Map<string, UIMessage[]>;
    discoverableServers: DiscoverServer[];
    adminData: { stats: any; allUsers: Profile[] } | null;
    activeGameSessions: Map<string, GameSession>; // YENİ
}

interface AppContextType {
    appData: AppData;
    isReady: boolean;
    refetchAll: () => void;
    refetchServers: () => void;
    refetchFriends: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialAppData: AppData = {
    servers: [],
    friends: [],
    pendingFriends: [],
    serverInvites: [],
    channels: [],
    allMembers: new Map(),
    profiles: new Map(),
    messages: new Map(),
    discoverableServers: [],
    adminData: null,
    activeGameSessions: new Map(), // YENİ
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [appData, setAppData] = useState<AppData>(initialAppData);
    const [isReady, setIsReady] = useState(false);
    const [refetchCounter, setRefetchCounter] = useState(0);

    const refetchAll = useCallback(() => {
        setRefetchCounter(c => c + 1);
    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!user) {
                setAppData(initialAppData);
                setIsReady(false);
                return;
            }

            setIsReady(false);

            try {
                console.log('// AppContext: Kapsamlı ön-yükleme başlatıldı...');
                const [
                    membershipsRes,
                    friendshipsRes,
                    invitesRes,
                ] = await Promise.all([
                    supabase.from('memberships').select('server_id').eq('user_id', user.id),
                    supabase.from('friendships').select('*, user1:user1_id(*), user2:user2_id(*)').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
                    supabase.from('server_invites').select('*, servers(*), profiles:inviter_id(*)').eq('invitee_id', user.id).eq('status', 'pending'),
                ]);

                if (membershipsRes.error) throw membershipsRes.error;
                if (friendshipsRes.error) throw friendshipsRes.error;
                if (invitesRes.error) throw invitesRes.error;
                
                const serverIds = membershipsRes.data?.map(m => m.server_id) || [];
                
                let servers: Server[] = [];
                let channels: Channel[] = [];
                let allMembers = new Map<string, Profile[]>();
                const profilesMap = new Map<string, Profile>();
                
                if (serverIds.length > 0) {
                     const [serversRes, channelsRes, allMembershipsRes] = await Promise.all([
                        supabase.from('servers').select('*').in('id', serverIds),
                        supabase.from('channels').select('*').in('server_id', serverIds),
                        supabase.from('memberships').select('server_id, user_id').in('server_id', serverIds)
                     ]);
                     if (serversRes.error) throw serversRes.error;
                     if (channelsRes.error) throw channelsRes.error;
                     if (allMembershipsRes.error) throw allMembershipsRes.error;

                     servers = serversRes.data || [];
                     channels = channelsRes.data || [];

                     const allMemberIds = [...new Set(allMembershipsRes.data.map(m => m.user_id))];
                     if (allMemberIds.length > 0) {
                         const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*').in('id', allMemberIds);
                         if (profilesError) throw profilesError;
                         (profilesData || []).forEach(p => profilesMap.set(p.id, p as Profile));
                         
                         const membersByServer = new Map<string, Profile[]>();
                         (allMembershipsRes.data || []).forEach(m => {
                             const profile = profilesMap.get(m.user_id);
                             if (profile) {
                                 if (!membersByServer.has(m.server_id)) membersByServer.set(m.server_id, []);
                                 membersByServer.get(m.server_id)!.push(profile);
                             }
                         });
                         allMembers = membersByServer;
                     }
                }

                // YENİ: Başlangıçta tüm aktif oyunları yükle
                const { data: initialGameSessions } = await supabase.from('game_sessions').select('*').neq('status', 'finished');
                const activeGameSessions = new Map<string, GameSession>();
                (initialGameSessions || []).forEach(session => {
                    activeGameSessions.set(session.channel_id, session);
                });
                
                // ... (geri kalan veri çekme işlemleri aynı) ...
                let adminData: AppData['adminData'] = null;
                if (user.email === 'kaankaramann55@gmail.com') { /* ... */ }
                const { data: discoverData } = await supabase.from('discoverable_servers').select('*');
                const userServerIds = new Set(serverIds);
                const { data: userInvites } = await supabase.from('server_invites').select('server_id').eq('invitee_id', user.id).eq('status', 'pending').eq('type', 'join_request');
                const pendingRequestServerIds = new Set((userInvites || []).map(i => i.server_id));
                const discoverableServers: DiscoverServer[] = (discoverData as any[] || []).map(s => ({ ...s, is_member: userServerIds.has(s.id), request_sent: pendingRequestServerIds.has(s.id) }));
                
                const acceptedFriends: Friend[] = [];
                const pendingFriends: Friend[] = [];
                (friendshipsRes.data || []).forEach(f => {
                    const friendProfile = f.user1_id === user.id ? f.user2 : f.user1;
                    if (!friendProfile) return;
                    const friendObject: Friend = { ...(friendProfile as Profile), friendship_id: f.id, friendship_status: f.status, action_user_id: f.action_user_id };

                    if (f.status === 'accepted') acceptedFriends.push(friendObject);
                    else if (f.status === 'pending' && f.action_user_id !== user.id) pendingFriends.push(friendObject);
                });
                
                const serverInvites = (invitesRes.data || [])
                    .filter(invite => invite.type !== 'join_request')
                    .map(invite => {
                        const server = Array.isArray(invite.servers) ? invite.servers[0] : invite.servers;
                        const profile = Array.isArray(invite.profiles) ? invite.profiles[0] : invite.profiles;
                        return server && profile ? { ...invite, servers: server, profiles: profile } : null;
                    })
                    .filter((i): i is ServerInvite => i !== null);

                setAppData({ servers, friends: acceptedFriends, pendingFriends, serverInvites, channels, allMembers, profiles: profilesMap, discoverableServers, adminData, activeGameSessions, messages: new Map() }); // messages şimdilik boş
                console.log('// AppContext: Kapsamlı ön-yükleme tamamlandı. Uygulama hazır.');
            } catch (error) {
                console.error("AppContext: Uygulama verileri başlatılamadı:", error);
                setAppData(initialAppData);
            } finally {
                setIsReady(true);
            }
        };

        fetchAllData();
    }, [user?.id, refetchCounter]);
    
    // YENİ: Oyun oturumları için merkezi abonelik
    useEffect(() => {
        const gameSessionSubscription = supabase
            .channel('public:game_sessions')
            .on<GameSession>(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'game_sessions' },
                (payload) => {
                    const { eventType, new: newSession, old } = payload;
                    setAppData(prevData => {
                        const newActiveSessions = new Map(prevData.activeGameSessions);
                        if (eventType === 'INSERT' || (eventType === 'UPDATE' && newSession.status !== 'finished')) {
                            newActiveSessions.set(newSession.channel_id, newSession);
                        } else if (eventType === 'DELETE' || (eventType === 'UPDATE' && newSession.status === 'finished')) {
                            const idToRemove = eventType === 'DELETE' ? (old as GameSession).channel_id : newSession.channel_id;
                            newActiveSessions.delete(idToRemove);
                        }
                        return { ...prevData, activeGameSessions: newActiveSessions };
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(gameSessionSubscription);
        };
    }, []);

    const value = useMemo(() => ({
        appData,
        isReady,
        refetchAll,
        refetchServers: refetchAll,
        refetchFriends: refetchAll,
    }), [appData, isReady, refetchAll]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
