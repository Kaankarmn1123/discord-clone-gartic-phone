// components/ChatInterfaceRedSparrow.tsx
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Server, Channel, Friend, Profile } from '../types';
import ServerList from './ServerList';
import { useAuth } from '../contexts/AuthContext';
import useAgora from '../hooks/useAgora';
import VideoPlayer from './VideoPlayer';
import { tr } from '../constants/tr';
import FloatingVoiceControls from './FloatingVoiceControls'; 
import { useTheme } from '../contexts/ThemeContext';
import StatusIndicator from './StatusIndicator';
import GameContainerModal from './games/GameContainerModal';
import GameSelectionModal from './games/GameSelectionModal';
import { FloatingGameLobby } from './FloatingGameLobby';
import { useAppContext } from '../contexts/AppContext';
import Spinner from './Spinner';

// Dinamik olarak yüklenecek bileşenler
const FriendsInterface = React.lazy(() => import('./FriendsInterface'));
const AdminPanel = React.lazy(() => import('./AdminPanel'));
const DiscoverServers = React.lazy(() => import('./VoiceChannelUI'));
const ChannelList = React.lazy(() => import('./ChannelList'));
const MessageView = React.lazy(() => import('./MessageView'));
const MemberList = React.lazy(() => import('./MemberList'));


const ChatInterfaceRedSparrow: React.FC = () => {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const { appData, refetchAll } = useAppContext();

  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [currentView, setCurrentView] = useState<'friends' | 'server' | 'admin' | 'dm' | 'discover'>('friends');
  const [dmRecipient, setDmRecipient] = useState<Profile | null>(null);
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [voiceChannelProfiles, setVoiceChannelProfiles] = useState<Map<string, Profile>>(new Map());
  const [isChannelListCollapsed, setIsChannelListCollapsed] = useState(false);
  
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeGameSessionId, setActiveGameSessionId] = useState<string | null>(null);
  const [isGameSelectionModalOpen, setIsGameSelectionModalOpen] = useState(false);

  // YENİ: Veri merkezi context'ten alınıyor. Yerel state kaldırıldı.
  const activeChannelGameSession = activeChannel ? appData.activeGameSessions.get(activeChannel.id) : null;

  const agora = useAgora();

  // YENİ: Oyun modalını otomatik kapatma
  useEffect(() => {
    if (activeGameSessionId && !appData.activeGameSessions.has(activeChannel?.id || '')) {
      setActiveGame(null);
      setActiveGameSessionId(null);
    }
  }, [activeGameSessionId, activeChannel, appData.activeGameSessions]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const remoteUserIds = agora.remoteUsers.map((u: any) => u.uid as string);
      if (remoteUserIds.length > 0) {
        const { data, error } = await supabase.from('profiles').select('*').in('id', remoteUserIds);
        if (error) {
          console.error("Error fetching voice channel profiles", error);
          setVoiceChannelProfiles(new Map());
          return;
        }
        if (data) {
          const newMap = new Map();
          data.forEach(p => newMap.set(p.id, p as Profile));
          setVoiceChannelProfiles(newMap);
        }
      } else {
        setVoiceChannelProfiles(new Map());
      }
    };

    if (agora.isJoined) {
      fetchProfiles();
      const remoteUserIds = new Set(agora.remoteUsers.map((u: any) => u.uid as string));
      if (focusedUserId && !remoteUserIds.has(focusedUserId) && focusedUserId !== user?.id) {
        setFocusedUserId(null);
      }
    } else {
      setVoiceChannelProfiles(new Map());
    }
  }, [agora.remoteUsers, agora.isJoined, focusedUserId, user?.id]);

  const handleServerUpdate = (updatedServer: Server) => {
    refetchAll();
    if (activeServer?.id === updatedServer.id) setActiveServer(updatedServer);
  };

  const handleServerSelect = async (server: Server | null) => {
    setFocusedUserId(null); setDmRecipient(null);
    if (agora.isJoined) { await agora.leave(); }
    if (server) {
      if (activeServer?.id === server.id && currentView === 'server') return;
      setActiveServer(server); setActiveChannel(null); setCurrentView('server');
    } else {
      setActiveServer(null); setActiveChannel(null); setCurrentView('friends');
    }
  };
  
  const handleAdminSelect = () => {
    if (agora.isJoined) { agora.leave(); }
    setActiveServer(null); setActiveChannel(null); setDmRecipient(null); setCurrentView('admin');
  };

  const handleDiscoverSelect = () => {
    if (agora.isJoined) { agora.leave(); }
    setActiveServer(null); setActiveChannel(null); setDmRecipient(null); setCurrentView('discover');
  };

  const handleServerCreated = (newServer: Server) => {
    refetchAll();
    handleServerSelect(newServer);
  };

  const handleChannelSelect = useCallback((channel: Channel) => {
    setFocusedUserId(null);
    if (channel.type === 'voice') {
      if (!user) return;
      if (agora.isJoined && agora.channelName !== channel.id) {
        agora.leave().then(() => agora.join(channel.id, user.id));
      } else if (!agora.isJoined) {
        agora.join(channel.id, user.id);
      }
    }
    setActiveChannel(channel);
  }, [agora, user]);

  const handleStartDm = async (friend: Friend) => {
      if (!user) return;
      const userIds = [user.id, friend.id].sort();
      const channelName = `dm:${userIds[0]}:${userIds[1]}`;
      let channel = appData.channels.find(c => c.name === channelName && c.server_id === null);
      if (!channel) {
          const { data: newChannel, error: createError } = await supabase.from('channels').insert({ name: channelName, type: 'text' }).select().single();
          if (createError) { console.error("Error creating DM channel:", createError); return; }
          channel = newChannel;
          refetchAll();
      }
      if (channel) {
          setActiveChannel({ ...channel, name: friend.username });
          setDmRecipient(friend); setCurrentView('dm'); setActiveServer(null);
      }
  };

  const handleFocusUser = (userId: string | null) => {
      setFocusedUserId(prevId => prevId === userId ? null : userId);
  };

  const handleGameSelect = async (gameId: string, channelId: string) => {
    if (!user) return;
    setIsGameSelectionModalOpen(false);

    if (gameId === 'gartic-phone') {
        const { data: existingSession } = await supabase.from('game_sessions').select('id').eq('channel_id', channelId).neq('status', 'finished').single();
        if(existingSession) {
            handleJoinGame(gameId, existingSession.id);
            return;
        }

        const { error } = await supabase.from('game_sessions').insert({ channel_id: channelId, game_type: gameId, host_id: user.id });
        if(error) { console.error("Oyun oturumu oluşturulamadı", error); return; }
        // The realtime subscription in AppContext will handle the state update
    } else {
        setActiveGame(gameId);
        setActiveGameSessionId(null);
    }
  };

  const handleJoinGame = async (game: string, sessionId: string) => {
    if (!user) return;
    setTimeout(() => {
        setActiveGame(game);
        setActiveGameSessionId(sessionId);
    }, 0);
    const { data: existingPlayer } = await supabase.from('game_session_players').select('user_id').eq('session_id', sessionId).eq('user_id', user.id).single();
    if (!existingPlayer) {
        const { count } = await supabase.from('game_session_players').select('*', { count: 'exact', head: true }).eq('session_id', sessionId);
        await supabase.from('game_session_players').insert({ session_id: sessionId, user_id: user.id, join_order: (count || 0) + 1 });
    }
  };

  const mainContent = () => {
    if (!activeChannel) {
      return (
        <div className={`flex-grow flex items-center justify-center ${theme.colors.bgPrimary} relative overflow-hidden`}>
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-violet-950 opacity-40"></div>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239, 68, 68, 0.1) 2px, rgba(239, 68, 68, 0.1) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 92, 246, 0.1) 2px, rgba(139, 92, 246, 0.1) 4px)` }}></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-violet-500 to-transparent animate-pulse"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 blur-3xl opacity-30 animate-pulse"></div>
              <div className="relative">
                <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-violet-500 to-red-500 animate-pulse filter drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">⚡</div>
                <div className="absolute inset-0 text-9xl text-red-500 opacity-20 blur-sm animate-ping">⚡</div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <p className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-violet-400 uppercase">SİSTEM BEKLİYOR</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <p className={`${theme.colors.textMuted} text-sm font-mono uppercase tracking-widest`}>Bir kanal seç // Bağlantı kur</p>
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="mt-8 p-px bg-gradient-to-r from-red-500 via-violet-500 to-red-500 rounded-lg"><div className="bg-black px-6 py-3 rounded-lg"><p className="text-xs font-mono text-red-400">&gt; STATUS: <span className="text-violet-400">READY</span></p></div></div>
          </div>
        </div>
      );
    }
    if (activeChannel.type === 'text') {
      return <MessageView key={activeChannel.id} channel={activeChannel} onOpenGameLauncher={() => setIsGameSelectionModalOpen(true)} onJoinGame={handleJoinGame} activeGameSession={activeChannelGameSession} />;
    }
    if (activeChannel.type === 'voice') {
        const showConnectionScreen = agora.isJoining || agora.isTogglingScreenShare;
        if (showConnectionScreen) {
        return (
            <div className={`flex-grow flex flex-col items-center justify-center ${theme.colors.bgPrimary} ${theme.colors.textSecondary} p-8 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950 to-black"></div>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239, 68, 68, 0.2) 2px, rgba(239, 68, 68, 0.2) 4px)` }}></div>
                <div className="absolute inset-0 overflow-hidden"><div className="absolute w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan"></div></div>
                <div className="relative z-10 flex flex-col items-center max-w-3xl">
                  <div className="relative mb-8">
                    <div className="absolute -inset-16 bg-gradient-to-r from-red-600/30 via-violet-600/30 to-red-600/30 blur-3xl animate-pulse"></div>
                    <div className="relative"><div className="text-9xl animate-glitch">🔴</div><div className="absolute inset-0 text-9xl text-red-500 opacity-50 animate-glitch-2">🔴</div></div>
                  </div>
                  <h2 className="text-5xl font-black uppercase tracking-wider mb-4"><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-violet-500 to-red-500 animate-pulse">{agora.isJoining ? 'BAĞLANTI KURULUYOR' : 'İŞLEM DEVAM EDİYOR'}</span></h2>
                  <div className="flex items-center gap-3 mb-8"><div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div><p className="text-red-400 font-mono text-lg uppercase tracking-widest">{agora.isJoining ? 'NEURAL LINK ACTIVE' : 'PROCESSING...'}</p><div className="w-3 h-3 bg-violet-500 rounded-full animate-ping"></div></div>
                  <div className="w-full p-px bg-gradient-to-r from-red-500 via-violet-500 to-red-500 rounded-xl">
                    <div className="bg-black/95 backdrop-blur-xl p-8 rounded-xl">
                      {agora.error && (<div className="mb-6 p-4 border-2 border-red-500 bg-red-950/50 rounded-lg"><div className="flex items-start gap-3"><div className="text-red-500 text-2xl">⚠</div><div className="flex-1"><p className="font-black text-red-400 text-lg mb-2 uppercase">HATA TESPİT EDİLDİ</p><p className="text-sm text-red-300 font-mono">{agora.error.message}</p></div></div></div>)}
                      <div className="font-mono text-xs space-y-2 max-h-64 overflow-y-auto">
                          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-red-900"><div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div><p className="font-black text-red-400 uppercase tracking-wider">SYSTEM LOG</p></div>
                          {agora.debugStatus.map((status: string, index: number) => (<div key={index} className={`flex items-start gap-3 p-3 rounded border-l-2 ${status.startsWith('[HATA]') ? 'border-red-500 bg-red-950/30 text-red-300' : 'border-violet-500 bg-violet-950/30 text-violet-300'}`}><span className="opacity-50">[{String(index + 1).padStart(2, '0')}]</span><span className="flex-1">{status}</span></div>))}
                      </div>
                    </div>
                  </div>
                </div>
                <style>{` @keyframes scan { 0% { top: -2px; } 100% { top: 100%; } } @keyframes glitch { 0%, 100% { transform: translate(0); } 20% { transform: translate(-2px, 2px); } 40% { transform: translate(-2px, -2px); } 60% { transform: translate(2px, 2px); } 80% { transform: translate(2px, -2px); } } @keyframes glitch-2 { 0%, 100% { transform: translate(0); } 20% { transform: translate(2px, -2px); } 40% { transform: translate(2px, 2px); } 60% { transform: translate(-2px, -2px); } 80% { transform: translate(-2px, 2px); } } .animate-scan { animation: scan 3s linear infinite; } .animate-glitch { animation: glitch 0.3s infinite; } .animate-glitch-2 { animation: glitch-2 0.3s infinite; } `}</style>
            </div>
        );
      }
      const allParticipants: any[] = [];
      if (agora.isJoined && profile && user) {
        const screenVideoTrack = agora.isScreenSharing ? (Array.isArray(agora.localScreenTrack) ? agora.localScreenTrack[0] : agora.localScreenTrack) : null;
          allParticipants.push({ ...profile, id: user.id, isLocal: true, videoTrack: agora.isScreenSharing ? screenVideoTrack : agora.localVideoTrack, videoMuted: agora.isScreenSharing ? false : agora.isVideoMuted, audioMuted: agora.isAudioMuted, isSpeaking: agora.speakingUsers.has(user.id), isScreen: agora.isScreenSharing, username: agora.isScreenSharing ? `${profile.username}'ın Ekranı` : profile.username, });
      }
      agora.remoteUsers.forEach((remoteUser: any) => {
          const remoteProfile = voiceChannelProfiles.get(remoteUser.uid) || { id: remoteUser.uid as string, username: `Kullanıcı ${remoteUser.uid}`, avatar_url: '', status: 'online' };
          const isScreen = remoteUser.videoTrack && remoteUser.videoTrack.getMediaStreamTrack().label.includes('screen');
          allParticipants.push({ ...remoteProfile, id: remoteUser.uid, isLocal: false, videoTrack: remoteUser.videoTrack, videoMuted: !remoteUser.hasVideo, audioMuted: !remoteUser.hasAudio, isSpeaking: agora.speakingUsers.has(remoteUser.uid), isScreen: isScreen, username: isScreen ? `${remoteProfile.username}'ın Ekranı` : remoteProfile.username, });
      });
      const focusedParticipant = focusedUserId ? allParticipants.find(p => p.id === focusedUserId) : null;
      const otherParticipants = allParticipants.filter(p => p.id !== focusedUserId);
      return (
        <div className={`flex-grow flex flex-col min-h-0 ${theme.colors.bgPrimary} relative`}>
          <div className="flex items-center px-6 py-4 font-black border-b-2 border-red-900 bg-gradient-to-r from-black via-red-950/50 to-black backdrop-blur-xl">
            <div className="flex items-center gap-3"><div className="relative"><div className="w-8 h-8 bg-gradient-to-br from-red-500 to-violet-500 rounded-lg flex items-center justify-center"><div className="w-3 h-3 bg-black rounded-full animate-pulse"></div></div><div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div></div><span className="text-xl uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-violet-400">{activeChannel.name}</span></div>
          </div>
          {agora.error && (<div className="m-6 p-4 border-2 border-red-500 bg-gradient-to-r from-red-950 to-black rounded-lg flex items-center justify-between"><div className="flex items-center gap-3"><div className="text-3xl animate-pulse">⚠</div><p className="text-red-300 font-mono"><span className="font-black text-red-400">ERROR:</span> {agora.error.message}</p></div><button onClick={() => agora.clearError()} className="p-2 hover:bg-red-900/50 rounded transition-colors"><svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg></button></div>)}
          {focusedParticipant ? (<div className="flex-grow flex flex-col min-h-0 p-6 gap-6"><div className="flex-grow relative min-h-0 rounded-xl overflow-hidden border-2 border-red-900 shadow-2xl shadow-red-900/50"><VideoPlayer key={focusedParticipant.id} className="w-full h-full" onClick={() => handleFocusUser(focusedParticipant.id)} user={focusedParticipant} videoTrack={focusedParticipant.videoTrack} isLocal={focusedParticipant.isLocal} videoMuted={focusedParticipant.videoMuted} audioMuted={focusedParticipant.audioMuted} isSpeaking={focusedParticipant.isSpeaking}/></div>{otherParticipants.length > 0 && (<div className="flex-shrink-0 flex gap-4 h-32 md:h-40 overflow-x-auto pb-2">{otherParticipants.map(p => ( <div key={p.id} className="rounded-lg overflow-hidden border border-red-900"><VideoPlayer className="h-full w-auto aspect-video" onClick={() => handleFocusUser(p.id)} user={p} videoTrack={p.videoTrack} isLocal={p.isLocal} videoMuted={p.videoMuted} audioMuted={p.audioMuted} isSpeaking={p.isSpeaking}/></div>))}</div>)}</div>) : (<div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{allParticipants.map(p => ( <div key={p.id} className="rounded-lg overflow-hidden border border-red-900"><VideoPlayer onClick={() => handleFocusUser(p.id)} user={p} videoTrack={p.videoTrack} isLocal={p.isLocal} videoMuted={p.videoMuted} audioMuted={p.audioMuted} isSpeaking={p.isSpeaking}/></div>))}</div>)}
          {agora.isJoined && <FloatingVoiceControls agora={agora} />}
        </div>
      );
    }
    return null;
  };

  const renderCurrentView = () => {
    switch(currentView) {
      case 'server':
        if (activeServer) {
          return (
            <>
              <ChannelList server={activeServer} onChannelSelect={handleChannelSelect} activeChannelId={activeChannel?.id} onServerUpdate={handleServerUpdate} agora={agora} showLegacyVoiceControls={agora.isJoined && activeChannel?.type !== 'voice'} isCollapsed={isChannelListCollapsed} onToggle={() => setIsChannelListCollapsed(prev => !prev)} />
              <main className={`flex flex-col flex-grow min-w-0 ${theme.colors.bgPrimary} relative`}>
                <div className="relative z-10 flex flex-col flex-grow min-h-0">{mainContent()}</div>
                {activeChannelGameSession && (
                    <FloatingGameLobby
                        sessionId={activeChannelGameSession.id}
                        onJoin={handleJoinGame}
                        onClose={() => {
                            setActiveGame(null);
                            setActiveGameSessionId(null);
                        }}
                    />
                )}
              </main>
              <MemberList serverId={activeServer.id} serverOwnerId={activeServer.owner_id} />
            </>
          );
        }
        return null;
      case 'dm':
        if (activeChannel && dmRecipient) {
          return (
            <div className="flex flex-col flex-grow min-w-0 border-l-2 border-red-900">
               <div className="flex items-center px-6 py-5 font-black border-b-2 border-red-900 bg-gradient-to-r from-black via-red-950/50 to-black backdrop-blur-xl">
                  <div className="relative mr-4"><div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-violet-500 rounded-lg blur opacity-75"></div><img src={dmRecipient.avatar_url || `https://robohash.org/${dmRecipient.id}.png?set=set1&size=40x40`} alt={dmRecipient.username} className="relative w-12 h-12 rounded-lg ring-2 ring-red-500"/><StatusIndicator status={dmRecipient.status} className="absolute -bottom-1 -right-1 ring-2 ring-black" /></div>
                  <div><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-violet-400 text-xl block uppercase tracking-wide">{dmRecipient.username}</span><span className="text-xs text-red-500 font-mono uppercase tracking-wider">DIRECT MESSAGE</span></div>
              </div>
              <main className={`flex flex-col flex-grow min-w-0 ${theme.colors.bgPrimary} relative`}>
                <div className="relative z-10 flex flex-col flex-grow min-h-0">
                    <MessageView key={activeChannel.id} channel={activeChannel} onOpenGameLauncher={() => setIsGameSelectionModalOpen(true)} onJoinGame={handleJoinGame} activeGameSession={activeChannelGameSession} />
                </div>
                 {activeChannelGameSession && (
                    <FloatingGameLobby
                        sessionId={activeChannelGameSession.id}
                        onJoin={handleJoinGame}
                        onClose={() => {
                            setActiveGame(null);
                            setActiveGameSessionId(null);
                        }}
                    />
                )}
              </main>
            </div>
          );
        }
        return null;
      default: return <FriendsInterface onServerAction={refetchAll} agora={agora} onStartDm={handleStartDm} />;
    }
  }

  return (
    <div className={`flex flex-col h-screen ${theme.colors.textPrimary} relative overflow-hidden`}>
      {activeGame && <GameContainerModal game={activeGame} sessionId={activeGameSessionId ?? undefined} onClose={() => { setActiveGame(null); setActiveGameSessionId(null); }} />}
      {isGameSelectionModalOpen && (
        <GameSelectionModal
          isOpen={isGameSelectionModalOpen}
          onClose={() => setIsGameSelectionModalOpen(false)}
          onGameSelect={handleGameSelect}
          channelId={activeChannel?.id || null}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950 to-black"></div>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(239, 68, 68, 0.1) 50px, rgba(239, 68, 68, 0.1) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(139, 92, 246, 0.1) 50px, rgba(139, 92, 246, 0.1) 51px)` }}></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent"></div>
      <div className="relative z-10 flex flex-col h-screen">
        <ServerList servers={appData.servers} onServerSelect={handleServerSelect} activeServerId={activeServer?.id} currentView={currentView} onServerCreated={handleServerCreated} onAdminSelect={handleAdminSelect} onDiscoverSelect={handleDiscoverSelect} />
        <div className="flex flex-row flex-grow min-h-0">
          <Suspense fallback={<div className="flex-grow flex items-center justify-center"><Spinner /></div>}>
            {renderCurrentView()}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ChatInterfaceRedSparrow;
