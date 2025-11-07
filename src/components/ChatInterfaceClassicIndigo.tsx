// components/ChatInterfaceClassicIndigo.tsx
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Server, Channel, Profile, Friend } from '../types';
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
import { FloatingGameLobby } from './FloatingGameLobby'; // NEW
import { useAppContext } from '../contexts/AppContext'; 
import Spinner from './Spinner';

// Dinamik olarak yüklenecek bileşenler
const FriendsInterface = React.lazy(() => import('./FriendsInterface'));
const AdminPanel = React.lazy(() => import('./AdminPanel'));
const DiscoverServers = React.lazy(() => import('./VoiceChannelUI'));
const ChannelList = React.lazy(() => import('./ChannelList'));
const MessageView = React.lazy(() => import('./MessageView'));
const MemberList = React.lazy(() => import('./MemberList'));

const ChatInterfaceClassicIndigo: React.FC = () => {
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
  }, [agora.remoteUsers]);

  useEffect(() => {
    fetchProfiles();
    const sub = supabase.channel('public:memberships').on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `user_id=eq.${user?.id}` }, () => refetchAll()).subscribe();
    return () => { supabase.removeChannel(sub); }
  }, [user, refetchAll, fetchProfiles]);
  
  useEffect(() => {
      if (agora.isJoined) {
          fetchProfiles();
          const remoteUserIds = new Set(agora.remoteUsers.map((u: any) => u.uid as string));
          if (focusedUserId && !remoteUserIds.has(focusedUserId) && focusedUserId !== user?.id) { setFocusedUserId(null); }
      } else { setVoiceChannelProfiles(new Map()); }
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
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>
            <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(99, 102, 241, 0.5) 30px, rgba(99, 102, 241, 0.5) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(99, 102, 241, 0.5) 30px, rgba(99, 102, 241, 0.5) 31px)` }}></div></div>
            <div className="absolute top-20 right-20 w-64 h-64 opacity-5"><svg viewBox="0 0 100 100" className="w-full h-full"><line x1="10" y1="10" x2="90" y2="10" stroke="currentColor" strokeWidth="0.5" className="text-indigo-400"/><line x1="10" y1="30" x2="90" y2="30" stroke="currentColor" strokeWidth="0.5" className="text-indigo-400"/><line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-indigo-400"/><line x1="10" y1="70" x2="90" y2="70" stroke="currentColor" strokeWidth="0.5" className="text-indigo-400"/><circle cx="30" cy="30" r="3" fill="currentColor" className="text-indigo-500"/><circle cx="70" cy="50" r="3" fill="currentColor" className="text-indigo-500"/><circle cx="50" cy="70" r="3" fill="currentColor" className="text-indigo-500"/></svg></div>
            <div className="absolute top-1/3 left-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center space-y-8">
            <div className="relative"><div className="absolute inset-0 bg-indigo-500/30 blur-2xl animate-pulse"></div><div className="relative p-8 bg-slate-900/50 border border-indigo-500/30 rounded-lg backdrop-blur-sm"><svg className="w-20 h-20 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div></div>
            <div className="text-center space-y-4 max-w-md"><p className="text-2xl font-semibold text-indigo-200 tracking-tight">Kanal Seçimi Bekleniyor</p><p className={`${theme.colors.textMuted} text-sm`}>Sol panelden bir metin veya ses kanalı seçerek başlayın</p><div className="flex items-center justify-center gap-2 pt-4"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div><div className="w-16 h-px bg-indigo-500/30"></div><div className="w-2 h-2 bg-indigo-500 rounded-full"></div><div className="w-16 h-px bg-indigo-500/30"></div><div className="w-2 h-2 bg-indigo-500 rounded-full"></div></div></div>
          </div>
        </div>
      );
    }
    if (activeChannel.type === 'text') {
      return <MessageView key={activeChannel.id} channel={activeChannel} onOpenGameLauncher={() => setIsGameSelectionModalOpen(true)} activeGameSession={activeChannelGameSession} onJoinGame={handleJoinGame}/>;
    }
    if (activeChannel.type === 'voice') {
        const showConnectionScreen = agora.isJoining || agora.isTogglingScreenShare;
        if (showConnectionScreen) {
        return (
            <div className={`flex-grow flex flex-col items-center justify-center ${theme.colors.bgPrimary} ${theme.colors.textSecondary} p-8 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>
                <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(99, 102, 241, 0.5) 30px, rgba(99, 102, 241, 0.5) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(99, 102, 241, 0.5) 30px, rgba(99, 102, 241, 0.5) 31px)` }}></div></div>
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-64 h-64 border border-indigo-500/20 rounded-full animate-ping"></div><div className="absolute w-48 h-48 border border-indigo-500/30 rounded-full animate-pulse"></div></div>
                <div className="relative z-10 flex flex-col items-center max-w-2xl">
                  <div className="relative mb-12 p-10 bg-slate-900/60 border border-indigo-500/30 rounded-xl backdrop-blur-sm"><svg className="w-24 h-24 text-indigo-400 animate-spin" style={{animationDuration: '3s'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                  <h2 className="text-3xl font-semibold mb-4 text-indigo-200">{agora.isJoining ? 'Bağlantı Kuruluyor' : 'İşlem Yapılıyor'}</h2>
                  <p className="text-indigo-300/80 text-base mb-12">{agora.isJoining ? 'Lütfen bekleyin, kanala bağlanılıyor...' : 'İşlem tamamlanıyor...'}</p>
                  <div className="w-full bg-slate-900/70 border border-indigo-500/30 rounded-xl p-6 backdrop-blur-sm">
                      {agora.error && (<div className="mb-6 p-4 bg-red-900/40 border border-red-500/40 rounded-lg"><div className="flex items-start gap-3"><svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg><div><p className="font-semibold text-red-300 mb-1">Hata Oluştu</p><p className="text-sm text-red-200">{agora.error.message}</p></div></div></div>)}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-indigo-500/20"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div><p className="font-medium text-indigo-300 text-sm">Sistem Günlüğü</p></div>
                          {agora.debugStatus.map((status: string, index: number) => (<div key={index} className={`flex items-start gap-3 p-3 rounded-lg transition-all ${status.startsWith('[HATA]') ? 'bg-red-900/20 text-red-300' : 'bg-indigo-900/20 text-indigo-300'}`}><span className="text-xs opacity-60 flex-shrink-0 font-mono">{String(index + 1).padStart(2, '0')}</span><span className="flex-1 text-xs">{status}</span></div>))}
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
          <div className="flex items-center px-6 py-4 border-b border-indigo-500/30 bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center gap-3"><div className="relative"><div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg></div><div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse"></div></div><span className="text-lg font-semibold text-indigo-200">{activeChannel.name}</span></div>
          </div>
          {agora.error && (<div className="m-6 p-4 bg-red-900/40 border border-red-500/40 rounded-lg flex items-center justify-between"><div className="flex items-center gap-3"><svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg><p className="text-red-200"><span className="font-semibold">Hata:</span> {agora.error.message}</p></div><button onClick={() => agora.clearError()} className="p-2 hover:bg-red-900/50 rounded-lg transition-colors"><svg className="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg></button></div>)}
          {focusedParticipant ? (<div className="flex-grow flex flex-col min-h-0 p-6 gap-6"><div className="flex-grow relative min-h-0 rounded-xl overflow-hidden border border-indigo-500/30 shadow-xl"><VideoPlayer key={focusedParticipant.id} className="w-full h-full" onClick={() => handleFocusUser(focusedParticipant.id)} user={focusedParticipant} videoTrack={focusedParticipant.videoTrack} isLocal={focusedParticipant.isLocal} videoMuted={focusedParticipant.videoMuted} audioMuted={focusedParticipant.audioMuted} isSpeaking={focusedParticipant.isSpeaking}/></div>{otherParticipants.length > 0 && (<div className="flex-shrink-0 flex gap-4 h-32 md:h-40 overflow-x-auto pb-2">{otherParticipants.map(p => ( <div key={p.id} className="rounded-lg overflow-hidden border border-indigo-500/30 shadow-lg"><VideoPlayer className="h-full w-auto aspect-video" onClick={() => handleFocusUser(p.id)} user={p} videoTrack={p.videoTrack} isLocal={p.isLocal} videoMuted={p.videoMuted} audioMuted={p.audioMuted} isSpeaking={p.isSpeaking}/></div>))}</div>)}</div>) : (<div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{allParticipants.map(p => ( <div key={p.id} className="rounded-lg overflow-hidden border border-indigo-500/30 shadow-lg"><VideoPlayer onClick={() => handleFocusUser(p.id)} user={p} videoTrack={p.videoTrack} isLocal={p.isLocal} videoMuted={p.videoMuted} audioMuted={p.audioMuted} isSpeaking={p.isSpeaking}/></div>))}</div>)}
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
            <div className="flex flex-col flex-grow min-w-0 border-l border-indigo-500/30">
               <div className="flex items-center px-6 py-4 border-b border-indigo-500/30 bg-slate-900/80 backdrop-blur-sm">
                  <div className="relative mr-3"><div className="absolute -inset-0.5 bg-indigo-500/40 rounded-lg blur-sm"></div><img src={dmRecipient.avatar_url || `https://robohash.org/${dmRecipient.id}.png?set=set1&size=40x40`} alt={dmRecipient.username} className="relative w-11 h-11 rounded-lg ring-1 ring-indigo-400/50"/><StatusIndicator status={dmRecipient.status} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-slate-900" /></div>
                  <div><span className="text-indigo-200 text-lg block font-semibold">{dmRecipient.username}</span><span className="text-xs text-indigo-400/70">Direkt Mesaj</span></div>
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>
      <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(99, 102, 241, 0.5) 30px, rgba(99, 102, 241, 0.5) 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(99, 102, 241, 0.5) 30px, rgba(99, 102, 241, 0.5) 31px)`}}></div></div>
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

export default ChatInterfaceClassicIndigo;
