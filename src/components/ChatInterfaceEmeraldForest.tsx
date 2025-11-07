// components/ChatInterfaceEmeraldForest.tsx
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Server, Channel, Profile, Friend } from '../types';
import ServerList from './ServerList';
import { useAuth } from '../contexts/AuthContext';
import useAgora from '../hooks/useAgora';
import VideoPlayer from './VideoPlayer';
import FloatingVoiceControls from './FloatingVoiceControls'; 
import { useTheme } from '../contexts/ThemeContext';
import StatusIndicator from './StatusIndicator';
import Spinner from './Spinner';
import { useAppContext } from '../contexts/AppContext'; 
import GameContainerModal from './games/GameContainerModal';
import GameSelectionModal from './games/GameSelectionModal';
import { FloatingGameLobby } from './FloatingGameLobby'; // NEW

// Dinamik olarak yüklenecek bileşenler
const FriendsInterface = React.lazy(() => import('./FriendsInterface'));
const AdminPanel = React.lazy(() => import('./AdminPanel'));
const DiscoverServers = React.lazy(() => import('./VoiceChannelUI'));
const ChannelList = React.lazy(() => import('./ChannelList'));
const MessageView = React.lazy(() => import('./MessageView'));
const MemberList = React.lazy(() => import('./MemberList'));


const ChatInterfaceEmeraldForest: React.FC = () => {
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
  
  const activeChannelGameSession = activeChannel ? appData.activeGameSessions.get(activeChannel.id) : null;
  const agora = useAgora();

  useEffect(() => {
    if (activeGameSessionId && !appData.activeGameSessions.has(activeChannel?.id || '')) {
      setActiveGame(null);
      setActiveGameSessionId(null);
    }
  }, [activeGameSessionId, activeChannel, appData.activeGameSessions]);

  const fetchProfiles = useCallback(async () => {
      const remoteUserIds = agora.remoteUsers.map((u: any) => u.uid as string);
          const idsToFetch = remoteUserIds.filter(id => !voiceChannelProfiles.has(id));
          if (idsToFetch.length > 0) {
              const { data, error } = await supabase.from('profiles').select('*').in('id', idsToFetch);
              if (error) { console.error("Error fetching voice channel profiles", error); return; }
              if (data) {
                  setVoiceChannelProfiles(prev => {
                      const newMap = new Map(prev);
                      data.forEach(p => newMap.set(p.id, p as Profile));
                      return newMap;
                  });
              }
          }
   }, [agora.remoteUsers, voiceChannelProfiles]);

  useEffect(() => { 
      if (agora.isJoined) {
          fetchProfiles();
          const remoteUserIds = new Set(agora.remoteUsers.map((u: any) => u.uid as string));
          if (focusedUserId && !remoteUserIds.has(focusedUserId) && focusedUserId !== user?.id) { setFocusedUserId(null); }
      } else { setVoiceChannelProfiles(new Map()); }
   }, [agora.remoteUsers, agora.isJoined, focusedUserId, user?.id, fetchProfiles]);
  
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
        if(error) { console.error("Oyun oturumu oluşturulamadı", error); }
    } else {
        setActiveGame(gameId);
        setActiveGameSessionId(null);
    }
  };

  const handleJoinGame = async (game: string, sessionId: string) => {
    if (!user) return;
    const { data: existingPlayer } = await supabase.from('game_session_players').select('user_id').eq('session_id', sessionId).eq('user_id', user.id).single();
    if (!existingPlayer) {
      const { count } = await supabase.from('game_session_players').select('*', { count: 'exact', head: true }).eq('session_id', sessionId);
      await supabase.from('game_session_players').insert({ session_id: sessionId, user_id: user.id, join_order: (count || 0) + 1 });
    }
    setTimeout(() => {
        setActiveGame(game);
        setActiveGameSessionId(sessionId);
    }, 0);
  };
  
  const mainContent = () => {
    if (!activeChannel) {
      return (
        <div className={`flex-grow flex items-center justify-center ${theme.colors.bgPrimary} relative overflow-hidden`}>
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950"></div>
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-emerald-950/80 to-transparent opacity-60"></div>
            <div className="absolute inset-0 opacity-20"><div className="absolute top-0 left-1/5 w-24 h-full bg-gradient-to-b from-emerald-300/40 via-green-400/20 to-transparent blur-3xl animate-sway-light"></div><div className="absolute top-0 right-1/4 w-32 h-full bg-gradient-to-b from-lime-400/30 via-emerald-300/15 to-transparent blur-3xl animate-sway-light-delayed"></div><div className="absolute top-0 left-2/3 w-20 h-full bg-gradient-to-b from-teal-400/35 via-green-400/20 to-transparent blur-2xl animate-sway-light-slow"></div></div>
            <div className="absolute inset-0 overflow-hidden"><div className="absolute top-1/4 left-1/4 text-2xl opacity-30 animate-leaf-fall">🍃</div><div className="absolute top-1/3 right-1/3 text-xl opacity-25 animate-leaf-fall-delayed">🍃</div><div className="absolute top-1/5 right-1/5 text-2xl opacity-20 animate-leaf-fall-slow">🍃</div></div>
          </div>
          <div className="relative z-10 flex flex-col items-center space-y-8">
            <div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 blur-3xl opacity-50 animate-pulse"></div><div className="relative text-9xl drop-shadow-[0_0_40px_rgba(16,185,129,0.7)] animate-gentle-float">🌿</div></div>
            <div className="text-center space-y-5 backdrop-blur-md bg-emerald-950/40 rounded-[2rem] px-16 py-10 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-900/50"><p className="text-4xl font-serif text-emerald-200 tracking-wide">Ormanın Sessizliği</p><p className={`${theme.colors.textMuted} text-base italic`}>Bir kanal seçerek doğanın seslerine kulak ver</p><div className="flex items-center justify-center gap-4 pt-4"><div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div><div className="text-emerald-400 text-xl">✦</div><div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div></div></div>
          </div>
          <style>{`@keyframes sway-light { 0%, 100% { transform: translateX(0) rotate(-5deg); opacity: 0.2; } 50% { transform: translateX(30px) rotate(5deg); opacity: 0.3; } } @keyframes sway-light-delayed { 0%, 100% { transform: translateX(0) rotate(5deg); opacity: 0.25; } 50% { transform: translateX(-25px) rotate(-5deg); opacity: 0.35; } } @keyframes sway-light-slow { 0%, 100% { transform: translateX(0) rotate(3deg); opacity: 0.2; } 50% { transform: translateX(20px) rotate(-3deg); opacity: 0.3; } } @keyframes leaf-fall { 0% { transform: translateY(0) rotate(0deg); opacity: 0.3; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } } @keyframes leaf-fall-delayed { 0% { transform: translateY(0) rotate(0deg); opacity: 0.25; } 100% { transform: translateY(100vh) rotate(-720deg); opacity: 0; } } @keyframes leaf-fall-slow { 0% { transform: translateY(0) rotate(0deg); opacity: 0.2; } 100% { transform: translateY(100vh) rotate(540deg); opacity: 0; } } @keyframes gentle-float { 0%, 100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-15px) rotate(3deg); } } .animate-sway-light { animation: sway-light 10s ease-in-out infinite; } .animate-sway-light-delayed { animation: sway-light-delayed 12s ease-in-out infinite; } .animate-sway-light-slow { animation: sway-light-slow 15s ease-in-out infinite; } .animate-leaf-fall { animation: leaf-fall 15s linear infinite; } .animate-leaf-fall-delayed { animation: leaf-fall-delayed 18s linear infinite 3s; } .animate-leaf-fall-slow { animation: leaf-fall-slow 20s linear infinite 6s; } .animate-gentle-float { animation: gentle-float 4s ease-in-out infinite; }`}</style>
        </div>
      );
    }
    if (activeChannel.type === 'text') {
      return <MessageView key={activeChannel.id} channel={activeChannel} onOpenGameLauncher={() => setIsGameSelectionModalOpen(true)} activeGameSession={activeChannelGameSession} onJoinGame={handleJoinGame} />;
    }
    if (activeChannel.type === 'voice') {
        const showConnectionScreen = agora.isJoining || agora.isTogglingScreenShare;
        if (showConnectionScreen) {
        return (
            <div className={`flex-grow flex flex-col items-center justify-center ${theme.colors.bgPrimary} ${theme.colors.textSecondary} p-8 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950"></div>
                <div className="absolute inset-0 opacity-25"><div className="absolute top-0 left-1/4 w-40 h-full bg-gradient-to-b from-emerald-400/40 to-transparent blur-3xl animate-sway-light"></div><div className="absolute top-0 right-1/4 w-36 h-full bg-gradient-to-b from-lime-400/30 to-transparent blur-3xl animate-sway-light-delayed"></div></div>
                <div className="absolute inset-0 overflow-hidden">{[...Array(8)].map((_, i) => (<div key={i} className="absolute text-xl opacity-30" style={{ left: `${Math.random() * 100}%`, top: '-50px', animation: `leaf-fall ${10 + Math.random() * 8}s linear infinite ${Math.random() * 5}s` }}>🍃</div>))}</div>
                <div className="relative z-10 flex flex-col items-center max-w-3xl">
                  <div className="relative mb-12"><div className="absolute -inset-24 bg-gradient-to-r from-emerald-600/30 via-green-500/30 to-teal-600/30 blur-3xl animate-pulse"></div><div className="relative text-9xl animate-gentle-float drop-shadow-[0_0_60px_rgba(16,185,129,0.8)]">🌳</div></div>
                  <h2 className="text-5xl font-serif mb-4 text-emerald-200">{agora.isJoining ? 'Ormana Adım Atılıyor' : 'İşlem Sürüyor'}</h2>
                  <p className="text-green-300 text-lg mb-14 italic">{agora.isJoining ? 'Doğanın ritmine uyum sağlanıyor...' : 'Lütfen bekleyin...'}</p>
                  <div className="w-full backdrop-blur-xl bg-emerald-950/50 border-2 border-emerald-500/40 rounded-[2rem] p-8 shadow-2xl shadow-emerald-900/50">
                      {agora.error && (<div className="mb-6 p-5 bg-red-950/60 border-2 border-red-500/50 rounded-2xl backdrop-blur-sm"><div className="flex items-start gap-4"><div className="text-red-400 text-3xl">⚠️</div><div><p className="font-semibold text-red-300 text-lg mb-2">Bir Sorun Belirti</p><p className="text-sm text-red-200 italic">{agora.error.message}</p></div></div></div>)}
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-emerald-500/40"><div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-500"></div><p className="font-serif text-emerald-300 tracking-wide text-lg">Bağlantı İzleri</p></div>
                          {agora.debugStatus.map((status: string, index: number) => (<div key={index} className={`flex items-start gap-3 p-4 rounded-2xl backdrop-blur-sm transition-all duration-300 border-l-4 ${status.startsWith('[HATA]') ? 'bg-red-900/20 border-red-500' : 'bg-emerald-900/20 border-emerald-500'}`}><span className="text-emerald-400/60 text-sm font-serif">{index + 1}</span><span className={`flex-1 text-sm ${status.startsWith('[HATA]') ? 'text-red-200' : 'text-emerald-200'}`}>{status}</span></div>))}
                      </div>
                  </div>
                </div>
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
          <div className="flex items-center px-6 py-5 border-b-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-green-950/70 to-teal-950/80 backdrop-blur-xl shadow-lg shadow-emerald-900/30">
            <div className="flex items-center gap-4"><div className="relative"><div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/50 rotate-45"><svg className="w-5 h-5 text-white -rotate-45" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg></div><div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400"></div></div><span className="text-xl font-serif text-emerald-100 tracking-wide">{activeChannel.name}</span></div>
          </div>
          {agora.error && (<div className="m-6 p-5 bg-red-950/60 border-2 border-red-500/50 rounded-2xl flex items-center justify-between backdrop-blur-sm shadow-lg"><div className="flex items-center gap-4"><div className="text-2xl">⚠️</div><p className="text-red-200"><span className="font-semibold">Hata:</span> {agora.error.message}</p></div><button onClick={() => agora.clearError()} className="p-2 hover:bg-red-900/50 rounded-xl transition-all duration-200"><svg className="w-5 h-5 text-red-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg></button></div>)}
          {focusedParticipant ? (<div className="flex-grow flex flex-col min-h-0 p-6 gap-6"><div className="flex-grow relative min-h-0 rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/50 border-2 border-emerald-500/40"><VideoPlayer key={focusedParticipant.id} className="w-full h-full" onClick={() => handleFocusUser(focusedParticipant.id)} user={focusedParticipant} videoTrack={focusedParticipant.videoTrack} isLocal={focusedParticipant.isLocal} videoMuted={focusedParticipant.videoMuted} audioMuted={focusedParticipant.audioMuted} isSpeaking={focusedParticipant.isSpeaking}/></div>{otherParticipants.length > 0 && (<div className="flex-shrink-0 flex gap-4 h-32 md:h-40 overflow-x-auto pb-2">{otherParticipants.map(p => ( <div key={p.id} className="rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl"><VideoPlayer className="h-full w-auto aspect-video" onClick={() => handleFocusUser(p.id)} user={p} videoTrack={p.videoTrack} isLocal={p.isLocal} videoMuted={p.videoMuted} audioMuted={p.audioMuted} isSpeaking={p.isSpeaking}/></div>))}</div>)}</div>) : (<div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{allParticipants.map(p => ( <div key={p.id} className="rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl"><VideoPlayer onClick={() => handleFocusUser(p.id)} user={p} videoTrack={p.videoTrack} isLocal={p.isLocal} videoMuted={p.videoMuted} audioMuted={p.audioMuted} isSpeaking={p.isSpeaking}/></div>))}</div>)}
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
            <div className="flex flex-col flex-grow min-w-0 border-l-2 border-emerald-500/40">
               <div className="flex items-center px-6 py-5 border-b-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-green-950/70 to-teal-950/80 backdrop-blur-xl shadow-lg shadow-emerald-900/30">
                  <div className="relative mr-4"><div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-60 blur"></div><img src={dmRecipient.avatar_url || `https://robohash.org/${dmRecipient.id}.png?set=set1&size=40x40`} alt={dmRecipient.username} className="relative w-12 h-12 rounded-2xl ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/30"/><StatusIndicator status={dmRecipient.status} className="absolute -bottom-1 -right-1 ring-2 ring-emerald-950" /></div>
                  <div><span className="text-emerald-100 text-xl block font-serif">{dmRecipient.username}</span><span className="text-xs text-emerald-400/70 italic">Özel Sohbet</span></div>
              </div>
              <main className={`flex flex-col flex-grow min-w-0 ${theme.colors.bgPrimary} relative`}>
                <div className="relative z-10 flex flex-col flex-grow min-h-0">
                    <MessageView key={activeChannel.id} channel={activeChannel} onOpenGameLauncher={() => setIsGameSelectionModalOpen(true)} activeGameSession={activeChannelGameSession} onJoinGame={handleJoinGame}/>
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
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950"></div>
      <div className="absolute inset-0 opacity-20"><div className="absolute top-0 left-1/5 w-24 h-full bg-gradient-to-b from-emerald-300/40 via-green-400/20 to-transparent blur-3xl animate-sway-light"></div><div className="absolute top-0 right-1/4 w-32 h-full bg-gradient-to-b from-lime-400/30 via-emerald-300/15 to-transparent blur-3xl animate-sway-light-delayed"></div><div className="absolute top-0 left-2/3 w-20 h-full bg-gradient-to-b from-teal-400/35 via-green-400/20 to-transparent blur-2xl animate-sway-light-slow"></div></div>
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

export default ChatInterfaceEmeraldForest;
