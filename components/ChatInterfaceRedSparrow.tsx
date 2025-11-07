// components/ChatInterfaceRedSparrow.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Server, Channel, Profile, Friend } from '../types';
import ServerList from './ServerList';
import ChannelList from './ChannelList';
import MessageView from './MessageView';
import FriendsInterface from './FriendsInterface';
import { useAuth } from '../contexts/AuthContext';
import useAgora from '../hooks/useAgora';
import MemberList from './MemberList';
import VideoPlayer from './VideoPlayer';
import { tr } from '../constants/tr';
import FloatingVoiceControls from './FloatingVoiceControls'; 
import { useTheme } from '../contexts/ThemeContext';
import AdminPanel from './AdminPanel';
import StatusIndicator from './StatusIndicator';
import DiscoverServers from './VoiceChannelUI';
import GameContainerModal from './games/GameContainerModal';
import GameSelectionModal from './games/GameSelectionModal';
import ActiveGameBanner from './ActiveGameBanner'; // YENİ

const ChatInterfaceRedSparrow: React.FC = () => {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [currentView, setCurrentView] = useState<'friends' | 'server' | 'admin' | 'dm' | 'discover'>('friends');
  const [dmRecipient, setDmRecipient] = useState<Profile | null>(null);
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [voiceChannelProfiles, setVoiceChannelProfiles] = useState<Map<string, Profile>>(new Map());
  const [isChannelListCollapsed, setIsChannelListCollapsed] = useState(false);
  
  // Game State
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeGameSessionId, setActiveGameSessionId] = useState<string | null>(null);
  const [isGameSelectionModalOpen, setIsGameSelectionModalOpen] = useState(false);
  const [activeChannelGameSession, setActiveChannelGameSession] = useState<any | null>(null);

  const agora = useAgora();

  const fetchServers = useCallback(async () => {
    if (!user) return;
    const { data: membershipData } = await supabase.from('memberships').select('server_id').eq('user_id', user.id);
    if (!membershipData || membershipData.length === 0) { setServers([]); return; }
    const serverIds = membershipData.map(m => m.server_id);
    const { data: serverData } = await supabase.from('servers').select('*').in('id', serverIds);
    setServers(serverData || []);
  }, [user]);

  useEffect(() => {
    fetchServers();
    const sub = supabase.channel('public:memberships').on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `user_id=eq.${user?.id}` }, () => fetchServers()).subscribe();
    return () => { supabase.removeChannel(sub); }
  }, [user, fetchServers]);
  
  // YENİ: Aktif kanaldaki oyun oturumunu dinle
  useEffect(() => {
    if (!activeChannel || activeChannel.type !== 'text') {
      setActiveChannelGameSession(null);
      return;
    }

    const fetchSession = async () => {
      const { data } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('channel_id', activeChannel.id)
        .neq('status', 'finished')
        .single();
      setActiveChannelGameSession(data);
    };

    fetchSession();

    const gameSessionChannel = supabase.channel(`game-session-${activeChannel.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `channel_id=eq.${activeChannel.id}` }, fetchSession)
      .subscribe();

    return () => {
      supabase.removeChannel(gameSessionChannel);
    };
  }, [activeChannel]);


  const handleGameSelect = async (gameId: string, channelId: string) => {
    if (!user) return;
    setIsGameSelectionModalOpen(false);

    if (gameId === 'gartic-phone') {
        // Check for existing session first
        const { data: existingSession } = await supabase.from('game_sessions').select('id').eq('channel_id', channelId).neq('status', 'finished').single();
        if(existingSession) {
            handleJoinGame(gameId, existingSession.id);
            return;
        }

        // Create a new session
        const { data: newSession, error } = await supabase.from('game_sessions').insert({ channel_id: channelId, game_type: gameId, host_id: user.id }).select().single();
        if(error || !newSession) { console.error("Oyun oturumu oluşturulamadı", error); return; }

        await supabase.from('game_session_players').insert({ session_id: newSession.id, user_id: user.id, join_order: 1 });
        setActiveGame(gameId);
        setActiveGameSessionId(newSession.id);
    } else {
        // Single player games
        setActiveGame(gameId);
        setActiveGameSessionId(null);
    }
};

  const handleJoinGame = async (game: string, sessionId: string) => {
    if (!user) return;
    const { data: players } = await supabase.from('game_session_players').select('*', { count: 'exact' }).eq('session_id', sessionId);
    const newOrder = (players?.length || 0) + 1;
    await supabase.from('game_session_players').insert({ session_id: sessionId, user_id: user.id, join_order: newOrder });

    setActiveGame(game);
    setActiveGameSessionId(sessionId);
  }

  // ... (diğer handle fonksiyonları aynı kalır)
  const handleServerUpdate = (updatedServer: Server) => { /* ... */ };
  const handleServerSelect = async (server: Server | null) => {
    setFocusedUserId(null); setDmRecipient(null); setActiveChannelGameSession(null);
    if (agora.isJoined) { await agora.leave(); }
    if (server) {
      if (activeServer?.id === server.id && currentView === 'server') return;
      setActiveServer(server); setActiveChannel(null); setCurrentView('server');
    } else {
      setActiveServer(null); setActiveChannel(null); setCurrentView('friends');
    }
  };
  const handleAdminSelect = () => { /* ... */ };
  const handleDiscoverSelect = () => { /* ... */ };
  const handleServerCreated = (newServer: Server) => { /* ... */ };
  const handleChannelSelect = useCallback((channel: Channel) => { /* ... */ }, [agora, user]);
  const handleStartDm = async (friend: Friend) => { /* ... */ };
  const handleFocusUser = (userId: string | null) => { /* ... */ };
  
  const mainContent = () => {
    if (!activeChannel) { /* ... (değişiklik yok) */ }
    if (activeChannel.type === 'text') {
// FIX: Pass required props to MessageView
      return <MessageView key={activeChannel.id} channel={activeChannel} onOpenGameLauncher={() => setIsGameSelectionModalOpen(true)} activeGameSession={activeChannelGameSession} onJoinGame={handleJoinGame} />;
    }
    if (activeChannel.type === 'voice') { /* ... (değişiklik yok) */ }
    return null;
  };

  return (
    <div className={`flex flex-col h-screen ${theme.colors.textPrimary} relative overflow-hidden`}>
      {(activeGame) && 
        <GameContainerModal game={activeGame} sessionId={activeGameSessionId ?? undefined} onClose={() => { setActiveGame(null); setActiveGameSessionId(null); }} />
      }
      {isGameSelectionModalOpen && (
        <GameSelectionModal
          isOpen={isGameSelectionModalOpen}
          onClose={() => setIsGameSelectionModalOpen(false)}
          onGameSelect={handleGameSelect}
          channelId={activeChannel?.id || null}
        />
      )}
      
      {/* ... (diğer JSX aynı) */}
      <div className="relative z-10 flex flex-col h-screen">
        <ServerList servers={servers} onServerSelect={handleServerSelect} activeServerId={activeServer?.id} currentView={currentView} onServerCreated={handleServerCreated} onAdminSelect={handleAdminSelect} onDiscoverSelect={handleDiscoverSelect} />
        <div className="flex flex-row flex-grow min-h-0">
          {currentView === 'friends' && <FriendsInterface onServerAction={fetchServers} agora={agora} onStartDm={handleStartDm} />}
          {currentView === 'admin' && <AdminPanel />}
          {currentView === 'discover' && <DiscoverServers onServerJoined={fetchServers} />}
          {currentView === 'server' && activeServer && (
            <>
              <ChannelList server={activeServer} onChannelSelect={handleChannelSelect} activeChannelId={activeChannel?.id} onServerUpdate={handleServerUpdate} agora={agora} showLegacyVoiceControls={agora.isJoined && activeChannel?.type !== 'voice'} isCollapsed={isChannelListCollapsed} onToggle={() => setIsChannelListCollapsed(prev => !prev)} />
              <main className={`flex flex-col flex-grow min-w-0 ${theme.colors.bgPrimary} relative`}>
                {/* YENİ: Aktif Oyun Başlığı */}
                {activeChannelGameSession && (
                  <ActiveGameBanner session={activeChannelGameSession} onJoin={handleJoinGame} />
                )}
                <div className="relative z-10 flex flex-col flex-grow min-h-0">{mainContent()}</div>
              </main>
              <MemberList serverId={activeServer.id} serverOwnerId={activeServer.owner_id} />
            </>
          )}
          {currentView === 'dm' && activeChannel && dmRecipient && (
            <div className="flex flex-col flex-grow min-w-0 border-l-2 border-red-900">
              {/* ... (dm içeriği aynı) */}
{/* FIX: Pass required props to MessageView */}
               <main className={`flex flex-col flex-grow min-w-0 ${theme.colors.bgPrimary} relative`}><div className="relative z-10 flex flex-col flex-grow min-h-0"><MessageView key={activeChannel.id} channel={activeChannel} onOpenGameLauncher={() => setIsGameSelectionModalOpen(true)} activeGameSession={activeChannelGameSession} onJoinGame={handleJoinGame} /></div></main>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterfaceRedSparrow;
