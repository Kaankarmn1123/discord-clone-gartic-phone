// components/ChatInterfaceRoyalAmethyst.tsx
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
// FIX: Add ActiveGameBanner import
import ActiveGameBanner from './ActiveGameBanner';

const ChatInterfaceRoyalAmethyst: React.FC = () => {
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
  // FIX: Add full game state
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeGameSessionId, setActiveGameSessionId] = useState<string | null>(null);
  const [isGameSelectionModalOpen, setIsGameSelectionModalOpen] = useState(false);
  const [activeChannelGameSession, setActiveChannelGameSession] = useState<any | null>(null);
  const agora = useAgora();

  const fetchServers = useCallback(async () => {
    if (!user) return;
    const { data: membershipData, error: membershipError } = await supabase.from('memberships').select('server_id').eq('user_id', user.id);
    if (membershipError) { console.error('Error fetching server IDs:', membershipError); setServers([]); return; }
    if (!membershipData || membershipData.length === 0) { setServers([]); return; }
    const serverIds = membershipData.map(m => m.server_id);
    const { data: serverData, error: serverError } = await supabase.from('servers').select('*').in('id', serverIds);
    if (serverError) { console.error('Error fetching servers:', serverError); setServers([]); } 
    else { setServers(serverData || []); }
  }, [user]);

  useEffect(() => {
    fetchServers();
    const sub = supabase.channel('public:memberships').on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `user_id=eq.${user?.id}` }, () => fetchServers()).subscribe();
    return () => { supabase.removeChannel(sub); }
  }, [user, fetchServers]);

  // YENİ: Aktif kanaldaki oyun oturumunu dinle (Hata Düzeltmesi)
  useEffect(() => {
    if (activeChannel && activeChannel.type === 'text') {
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
            setActiveChannelGameSession(null);
        };
    } else {
        setActiveChannelGameSession(null);
    }
  }, [activeChannel]);
  
  useEffect(() => {
      const fetchProfiles = async () => {
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
      };
      if (agora.isJoined) {
          fetchProfiles();
          const remoteUserIds = new Set(agora.remoteUsers.map((u: any) => u.uid as string));
          if (focusedUserId && !remoteUserIds.has(focusedUserId) && focusedUserId !== user?.id) { setFocusedUserId(null); }
      } else { setVoiceChannelProfiles(new Map()); }
  }, [agora.remoteUsers, agora.isJoined, focusedUserId, user?.id, voiceChannelProfiles]);

  const handleServerUpdate = (updatedServer: Server) => {
    setServers(current => current.map(s => s.id === updatedServer.id ? updatedServer : s));
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
    setServers(current => current.some(s => s.id === newServer.id) ? current : [...current, newServer]);
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
      let { data: channel, error: findError } = await supabase.from('channels').select('*').eq('name', channelName).is('server_id', null).single();
      if (findError && findError.code !== 'PGRST116') { console.error("Error finding DM channel:", findError); return; }
      if (!channel) {
          const { data: newChannel, error: createError } = await supabase.from('channels').insert({ name: channelName, type: 'text' }).select().single();
          if (createError) { console.error("Error creating DM channel:", createError); return; }
          channel = newChannel;
      }
      if (channel) {
          setActiveChannel({ ...channel, name: friend.username });
          setDmRecipient(friend); setCurrentView('dm'); setActiveServer(null);
      }
  };

  const handleFocusUser = (userId: string | null) => {
      setFocusedUserId(prevId => prevId === userId ? null : userId);
  };

  // FIX: Add game handlers
  const handleGameSelect = async (gameId: string, channelId: string) => {
    if (!user) return;
    setIsGameSelectionModalOpen(false);
    if (gameId === 'gartic-phone') {
        const { data: existingSession } = await supabase.from('game_sessions').select('id').eq('channel_id', channelId).neq('status', 'finished').single();
        if(existingSession) {
            handleJoinGame(gameId, existingSession.id);
            return;
        }
        const { data: newSession, error } = await supabase.from('game_sessions').insert({ channel_id: channelId, game_type: gameId, host_id: user.id }).select().single();
        if(error || !newSession) { console.error("Oyun oturumu oluşturulamadı", error); return; }
        await supabase.from('game_session_players').insert({ session_id: newSession.id, user_id: user.id, join_order: 1 });
        setActiveGame(gameId);
        setActiveGameSessionId(newSession.id);
    } else {
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

    const mainContent = () => {
    if (!activeChannel) {
      return (
        <div className={`flex-grow flex items-center justify-center ${theme.colors.bgPrimary} relative overflow-hidden`}>
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-violet-950 to-fuchsia-950"></div>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(168, 85, 247, 0.3) 100px, rgba(168, 85, 247, 0.3) 101px), repeating-linear-gradient(-45deg, transparent, transparent 100px, rgba(217, 70, 239, 0.3) 100px, rgba(217, 70, 239, 0.3) 101px)` }}></div></div>
            <div className="absolute inset-0"><div className="absolute top-1/4 left-1/4 w-1 h-96 bg-gradient-to-b from-purple-300 via-purple-500 to-transparent blur-sm opacity-40 animate-shimmer"></div><div className="absolute top-1/3 right-1/3 w-1 h-72 bg-gradient-to-b from-fuchsia-300 via-fuchsia-500 to-transparent blur-sm opacity-30 animate-shimmer-delayed"></div><div className="absolute top-1/5 left-2/3 w-1 h-80 bg-gradient-to-b from-violet-300 via-violet-500 to-transparent blur-sm opacity-35 animate-shimmer-slow"></div></div>
            <div className="absolute inset-0 overflow-hidden">{[...Array(15)].map((_, i) => (<div key={i} className="absolute w-1 h-1 bg-purple-300 rounded-full animate-sparkle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 2}s` }}></div>))}</div>
          </div>
          <div className="relative z-10 flex flex-col items-center space-y-10">
            <div className="relative"><div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 blur-3xl opacity-60 animate-pulse"></div><div className="relative"><div className="text-9xl drop-shadow-[0_0_50px_rgba(168,85,247,1)] animate-crystal-rotate">💎</div></div></div>
            <div className="text-center space-y-6 backdrop-blur-lg bg-purple-950/50 border-2 border-purple-500/40 rounded-3xl px-16 py-12 shadow-2xl shadow-purple-900/70"><div className="flex items-center justify-center gap-4 mb-4"><div className="w-8 h-px bg-gradient-to-r from-transparent via-purple-400 to-fuchsia-400"></div><div className="text-purple-300 text-2xl">◆</div><div className="w-8 h-px bg-gradient-to-r from-fuchsia-400 via-purple-400 to-transparent"></div></div><p className="text-5xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-300 uppercase">Kraliyet Salonu</p><p className={`${theme.colors.textMuted} text-base`}>Bir kanal seçerek asil sohbete dahil ol</p><div className="flex items-center justify-center gap-3 pt-4"><div className="w-2 h-2 bg-purple-400 rotate-45 animate-pulse"></div><div className="w-1.5 h-1.5 bg-fuchsia-400 rotate-45 animate-pulse" style={{animationDelay: '0.2s'}}></div><div className="w-2 h-2 bg-purple-400 rotate-45 animate-pulse" style={{animationDelay: '0.4s'}}></div></div></div>
          </div>
          <style>{`@keyframes shimmer { 0%, 100% { opacity: 0.2; transform: translateY(0) scaleY(1); } 50% { opacity: 0.6; transform: translateY(-20px) scaleY(1.2); } } @keyframes shimmer-delayed { 0%, 100% { opacity: 0.15; transform: translateY(0) scaleY(1); } 50% { opacity: 0.5; transform: translateY(20px) scaleY(0.9); } } @keyframes shimmer-slow { 0%, 100% { opacity: 0.25; transform: translateY(0) scaleY(1); } 50% { opacity: 0.55; transform: translateY(-15px) scaleY(1.1); } } @keyframes sparkle { 0%, 100% { opacity: 0; transform: scale(0); } 50% { opacity: 1; transform: scale(1.5); } } @keyframes crystal-rotate { 0%, 100% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } } .animate-shimmer { animation: shimmer 4s ease-in-out infinite; } .animate-shimmer-delayed { animation: shimmer-delayed 5s ease-in-out infinite; } .animate-shimmer-slow { animation: shimmer-slow 6s ease-in-out infinite; } .animate-sparkle { animation: sparkle 3s ease-in-out infinite; } .animate-crystal-rotate { animation: crystal-rotate 8s linear infinite; }`}</style>
        </div>
      );
    }
    if (activeChannel.type === 'text') {
// FIX: Pass required props to MessageView
      return <MessageView key={activeChannel.id} channel={activeChannel} onOpenGameLauncher={() => setIsGameSelectionModalOpen(true)} activeGameSession={activeChannelGameSession} onJoinGame={handleJoinGame} />;
    }
    if (activeChannel.type === 'voice') {
        const showConnectionScreen = agora.isJoining || agora.isTogglingScreenShare;
        if (showConnectionScreen) {
        return (
            <div className={`flex-grow flex flex-col items-center justify-center ${theme.colors.bgPrimary} ${theme.colors.textSecondary} p-8 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-violet-950 to-fuchsia-950"></div>
                <div className="absolute inset-0 opacity-10"><div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(168, 85, 247, 0.3) 100px, rgba(168, 85, 247, 0.3) 101px)`}}></div></div>
                <div className="absolute inset-0"><div className="absolute top-1/4 left-1/3 w-1 h-96 bg-gradient-to-b from-purple-300 to-transparent blur-sm opacity-40 animate-shimmer"></div><div className="absolute top-1/3 right-1/3 w-1 h-80 bg-gradient-to-b from-fuchsia-300 to-transparent blur-sm opacity-35 animate-shimmer-delayed"></div></div>
                <div className="absolute inset-0 overflow-hidden">{[...Array(20)].map((_, i) => (<div key={i} className="absolute w-1 h-1 bg-purple-300 rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animation: `sparkle ${2 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 3}s`}}></div>))}</div>
                <div className="relative z-10 flex flex-col items-center max-w-3xl">
                  <div className="relative mb-14"><div className="absolute -inset-28 bg-gradient-to-r from-purple-600/40 via-fuchsia-500/40 to-purple-600/40 blur-3xl animate-pulse"></div><div className="relative text-9xl drop-shadow-[0_0_60px_rgba(168,85,247,1)] animate-crystal-rotate">👑</div></div>
                  <h2 className="text-5xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-300 uppercase tracking-widest">{agora.isJoining ? 'Salona Giriş' : 'İşlem Yapılıyor'}</h2>
                  <p className="text-purple-300 text-lg mb-16">{agora.isJoining ? 'Kraliyet kapıları açılıyor...' : 'Lütfen bekleyin...'}</p>
                  <div className="w-full backdrop-blur-xl bg-purple-950/60 border-2 border-purple-500/50 rounded-3xl p-10 shadow-2xl shadow-purple-900/70">
                      {agora.error && (<div className="mb-8 p-6 bg-red-950/70 border-2 border-red-500/60 rounded-2xl backdrop-blur-sm"><div className="flex items-start gap-4"><div className="text-red-400 text-4xl">⚠️</div><div><p className="font-bold text-red-300 text-xl mb-2">Bir Sorun Tespit Edildi</p><p className="text-sm text-red-200">{agora.error.message}</p></div></div></div>)}
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-purple-500/50"><div className="w-3 h-3 bg-purple-400 rotate-45 animate-pulse shadow-lg shadow-purple-500"></div><p className="font-bold text-purple-300 tracking-widest text-lg uppercase">Bağlantı Kaydı</p></div>
                          {agora.debugStatus.map((status: string, index: number) => (<div key={index} className={`flex items-start gap-4 p-5 rounded-2xl backdrop-blur-sm transition-all duration-300 border-l-4 ${status.startsWith('[HATA]') ? 'bg-red-900/30 border-red-500' : 'bg-purple-900/30 border-purple-500'}`}><span className="text-purple-400/70 text-sm font-bold">{String(index + 1).padStart(2, '0')}</span><span className={`flex-1 text-sm ${status.startsWith('[HATA]') ? 'text-red-200' : 'text-purple-200'}`}>{status}</span></div>))}
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
          <div className="flex items-center px-6 py-6 border-b-2 border-purple-500/50 bg-gradient-to-r from-purple-950/80 via-fuchsia-950/70 to-purple-950/80 backdrop-blur-xl shadow-lg shadow-purple-900/50">
            <div className="flex items-center gap-5"><div className="relative"><div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg rotate-45 flex items-center justify-center shadow-lg shadow-purple-500/60"><svg className="w-6 h-6 text-white -rotate-45" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg></div><div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400"></div></div><span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-300 tracking-wide uppercase">{activeChannel.name}</span></div>
          </div>
          {agora.error && (<div className="m-6 p-6 bg-red-950/70 border-2 border-red-500/60 rounded-2xl flex items-center justify-between backdrop-blur-sm shadow-lg"><div className="flex items-center gap-4"><div className="text-3xl">⚠️</div><p className="text-red-200"><span className="font-bold">Hata:</span> {agora.error.message}</p></div><button onClick={() => agora.clearError()} className="p-3 hover:bg-red-900/60 rounded-xl transition-all duration-200"><svg className="w-5 h-5 text-red-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg></button></div>)}
          {focusedParticipant ? (<div className="flex-grow flex flex-col min-h-0 p-6 gap-6"><div className="flex-grow relative min-h-0 rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/60 border-2 border-purple-500/50"><VideoPlayer key={focusedParticipant.id} className="w-full h-full" onClick={() => handleFocusUser(focusedParticipant.id)} user={focusedParticipant} videoTrack={focusedParticipant.videoTrack} isLocal={focusedParticipant.isLocal} videoMuted={focusedParticipant.videoMuted} audioMuted={focusedParticipant.audioMuted} isSpeaking={focusedParticipant.isSpeaking}/></div>{otherParticipants.length > 0 && (<div className="flex-shrink-0 flex gap-4 h-32 md:h-40 overflow-x-auto pb-2">{otherParticipants.map(p => ( <div key={p.id} className="rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-xl"><VideoPlayer className="h-full w-auto aspect-video" onClick={() => handleFocusUser(p.id)} user={p} videoTrack={p.videoTrack} isLocal={p.isLocal} videoMuted={p.videoMuted} audioMuted={p.audioMuted} isSpeaking={p.isSpeaking}/></div>))}</div>)}</div>) : (<div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{allParticipants.map(p => ( <div key={p.id} className="rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-xl"><VideoPlayer onClick={() => handleFocusUser(p.id)} user={p} videoTrack={p.videoTrack} isLocal={p.isLocal} videoMuted={p.videoMuted} audioMuted={p.audioMuted} isSpeaking={p.isSpeaking}/></div>))}</div>)}
          {agora.isJoined && <FloatingVoiceControls agora={agora} />}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`flex flex-col h-screen ${theme.colors.textPrimary} relative overflow-hidden`}>
      {activeGame && <GameContainerModal game={activeGame} sessionId={activeGameSessionId ?? undefined} onClose={() => { setActiveGame(null); setActiveGameSessionId(null); }} />}
      {isGameSelectionModalOpen && (
        <GameSelectionModal
          isOpen={isGameSelectionModalOpen}
          onClose={() => setIsGameSelectionModalOpen(false)}
// FIX: Pass correct onGameSelect handler and channelId prop
          onGameSelect={handleGameSelect}
          channelId={activeChannel?.id || null}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-violet-950 to-fuchsia-950"></div>
      <div className="absolute inset-0 opacity-10"><div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(168, 85, 247, 0.3) 100px, rgba(168, 85, 247, 0.3) 101px), repeating-linear-gradient(-45deg, transparent, transparent 100px, rgba(217, 70, 239, 0.3) 100px, rgba(217, 70, 239, 0.3) 101px)` }}></div></div>
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
{/* FIX: Add ActiveGameBanner */}
                {activeChannelGameSession && (
                  <ActiveGameBanner session={activeChannelGameSession} onJoin={handleJoinGame} />
                )}
                <div className="relative z-10 flex flex-col flex-grow min-h-0">{mainContent()}</div>
              </main>
              <MemberList serverId={activeServer.id} serverOwnerId={activeServer.owner_id} />
            </>
          )}
          {currentView === 'dm' && activeChannel && dmRecipient && (
            <div className="flex flex-col flex-grow min-w-0 border-l-2 border-purple-500/50">
               <div className="flex items-center px-6 py-6 border-b-2 border-purple-500/50 bg-gradient-to-r from-purple-950/80 via-fuchsia-950/70 to-purple-950/80 backdrop-blur-xl shadow-lg shadow-purple-900/50">
                  <div className="relative mr-4"><div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-xl opacity-70 blur"></div><img src={dmRecipient.avatar_url || `https://robohash.org/${dmRecipient.id}.png?set=set1&size=40x40`} alt={dmRecipient.username} className="relative w-14 h-14 rounded-xl ring-2 ring-purple-400/60 shadow-lg shadow-purple-500/40"/><StatusIndicator status={dmRecipient.status} className="absolute -bottom-1 -right-1 ring-2 ring-purple-950" /></div>
                  <div><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-300 text-2xl block font-bold uppercase tracking-wide">{dmRecipient.username}</span><span className="text-xs text-purple-400/80 uppercase tracking-widest">Özel Sohbet</span></div>
              </div>
{/* FIX: Pass required props to MessageView */}
              <main className={`flex flex-col flex-grow min-w-0 ${theme.colors.bgPrimary} relative`}><div className="relative z-10 flex flex-col flex-grow min-h-0"><MessageView key={activeChannel.id} channel={activeChannel} onOpenGameLauncher={() => setIsGameSelectionModalOpen(true)} activeGameSession={activeChannelGameSession} onJoinGame={handleJoinGame} /></div></main>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterfaceRoyalAmethyst;
