// components/ChannelListRedSparrow.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Server, Channel, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { tr } from '../constants/tr';
import VoiceControlPanel from './VoiceControlPanel';
import UserPanel from './UserPanel';
import { useTheme } from '../contexts/ThemeContext';

// Modals
import InviteFriendsModal from './InviteModal';
import ServerSettingsModal from './ServerSettingsModal';
import CreateChannelModal from './CreateChannelModal';
import EditChannelModal from './EditChannelModal';

const colorPalette = [
  'text-red-500', 'text-orange-500', 'text-amber-500',
  'text-yellow-500', 'text-lime-500', 'text-green-500',
  'text-emerald-500', 'text-teal-500', 'text-cyan-500',
  'text-sky-500', 'text-blue-500', 'text-indigo-500',
  'text-violet-500', 'text-purple-500', 'text-fuchsia-500',
  'text-pink-500', 'text-rose-500'
];

const getTextColorForText = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash % colorPalette.length);
  return colorPalette[index];
};

// Sharp Angular Icons
const DropdownIcon = () => (
  <svg className="w-5 h-5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const TextChannelIcon = () => (
  <svg className="w-5 h-5 mr-2 text-red-400 group-hover:text-red-300 transition-colors duration-200" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path>
  </svg>
);

const VoiceChannelIcon = () => (
  <svg className="w-5 h-5 mr-2 text-violet-400 group-hover:text-violet-300 transition-all duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734-2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379-1.561-2.6 0-2.978a1.532 1.532 0 01.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
  </svg>
);

interface ChannelListProps {
    server: Server;
    onChannelSelect: (channel: Channel) => void;
    activeChannelId: string | undefined;
    onServerUpdate: (updatedServer: Server) => void;
    agora: any;
    showLegacyVoiceControls: boolean;
    isCollapsed: boolean;
    onToggle: () => void;
}

const ChannelListRedSparrow: React.FC<ChannelListProps> = ({ server, onChannelSelect, activeChannelId, onServerUpdate, agora, showLegacyVoiceControls, isCollapsed, onToggle }) => {
    const { user, profile } = useAuth();
    const { theme } = useTheme();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [userProfiles] = useState<Map<string | number, Profile>>(new Map());

    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [isServerSettingsModalOpen, setServerSettingsModalOpen] = useState(false);
    const [isCreateChannelModalOpen, setCreateChannelModalOpen] = useState(false);
    const [isEditChannelModalOpen, setEditChannelModalOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

    const isOwner = server.owner_id === user?.id;
    const serverNameColor = server.icon_url ? '' : getTextColorForText(server.name);

    const fetchChannels = useCallback(async () => {
        const { data, error } = await supabase.from('channels').select('*').eq('server_id', server.id).order('name', { ascending: true });
        if (error) console.error('Error fetching channels:', error);
        else setChannels(data || []);
    }, [server.id]);
    
    useEffect(() => {
        fetchChannels();
        const sub = supabase.channel(`public:channels:server_id=eq.${server.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'channels', filter: `server_id=eq.${server.id}` }, () => fetchChannels()).subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [server.id, fetchChannels]);

    const textChannels = channels.filter(c => c.type === 'text');
    const voiceChannels = channels.filter(c => c.type === 'voice');

    return (
        <>
            <div className="relative h-full flex-shrink-0">
                <div className={`h-full transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'w-0' : 'w-64'}`}>
                    <div className={`w-64 h-full flex flex-col ${theme.colors.bgSecondary} border-r-2 border-red-900/30 shadow-2xl relative`}>
                        {/* Sharp Angular Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-slate-950 to-black pointer-events-none"></div>
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)',
                          }}></div>
                        </div>

                        {/* Server Header - Sharp Style */}
                        <div className="relative p-3 border-b-2 border-red-500/30 shadow-lg bg-gradient-to-b from-red-900/20 to-transparent flex-shrink-0">
                            <button onClick={() => setDropdownOpen(!isDropdownOpen)} 
                                    className="w-full flex items-center justify-between text-white hover:bg-red-900/30 px-3 py-2.5 transition-all duration-200 font-black tracking-tight"
                                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)' }}>
                                <span className={`truncate text-base ${serverNameColor}`}>{server.name}</span>
                                <div className={`transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                    <DropdownIcon />
                                </div>
                            </button>
                            {isDropdownOpen && (
                                <div className={`absolute top-full left-0 right-0 mt-2 mx-2 p-2 ${theme.colors.bgTertiary} shadow-2xl z-50 text-sm border-2 border-red-500/40 backdrop-blur-xl`}
                                     style={{ clipPath: 'polygon(0 0, 100% 0, 100% 95%, 98% 100%, 0 100%)' }}>
                                    <button onClick={() => { setInviteModalOpen(true); setDropdownOpen(false); }} 
                                            className={`w-full text-left px-3 py-2 ${theme.colors.text} ${theme.colors.textHover} transition-all duration-200 flex items-center gap-2 font-bold tracking-wide`}
                                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)' }}>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path></svg>
                                        {tr.invitePeople}
                                    </button>
                                    {isOwner && (<>
                                        <button onClick={() => { setServerSettingsModalOpen(true); setDropdownOpen(false); }} 
                                                className={`w-full text-left px-3 py-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} hover:${theme.colors.activeBackground} transition-all duration-200 flex items-center gap-2 font-bold tracking-wide mt-1`}
                                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)' }}>
                                            <SettingsIcon />
                                            {tr.serverSettings}
                                        </button>
                                        <button onClick={() => { setCreateChannelModalOpen(true); setDropdownOpen(false); }} 
                                                className={`w-full text-left px-3 py-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} hover:${theme.colors.activeBackground} transition-all duration-200 flex items-center gap-2 font-bold tracking-wide mt-1`}
                                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)' }}>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg>
                                            {tr.createChannel}
                                        </button>
                                    </>)}
                                </div>
                            )}
                        </div>

                        {/* Channels List */}
                        <div className="flex-grow p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-red-600/40 scrollbar-track-transparent hover:scrollbar-thumb-red-500/60">
                            <ChannelCategory title="METIN KANALLARI" channels={textChannels} activeChannelId={activeChannelId} onChannelClick={onChannelSelect} isOwner={isOwner} setSelectedChannel={setSelectedChannel} setEditChannelModalOpen={setEditChannelModalOpen} />
                            <ChannelCategory title="SES KANALLARI" channels={voiceChannels} activeChannelId={activeChannelId} onChannelClick={onChannelSelect} isOwner={isOwner} setSelectedChannel={setSelectedChannel} setEditChannelModalOpen={setEditChannelModalOpen} agora={agora} userProfiles={userProfiles} currentUserProfile={profile} />
                        </div>

                        {/* Bottom Panels */}
                        <div className="flex-shrink-0 border-t-2 border-red-900/30">
                            {showLegacyVoiceControls && <VoiceControlPanel agora={agora} />}
                            <UserPanel />
                        </div>
                    </div>
                </div>

                {/* Angular Toggle Button */}
                <button
                    onClick={onToggle}
                    className={`absolute top-1/2 -translate-y-1/2 w-7 h-16 bg-gradient-to-br from-red-900/95 to-slate-900/95 hover:from-red-600 hover:to-red-800 z-20 flex items-center justify-center border-2 border-red-500/50 hover:border-red-400/80 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] group transition-all duration-200 ease-in-out backdrop-blur-sm ${isCollapsed ? 'left-0' : 'left-64 -translate-x-1/2'}`}
                    style={{ clipPath: 'polygon(0 10%, 100% 0, 100% 100%, 0 90%)' }}
                    aria-label={isCollapsed ? "Kanal listesini aç" : "Kanal listesini kapat"}
                >
                    <svg className={`w-5 h-5 text-red-300 group-hover:text-white transition-all duration-200 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
            </div>
            
            <InviteFriendsModal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} serverId={server.id} serverName={server.name} />
            {isOwner && <ServerSettingsModal isOpen={isServerSettingsModalOpen} onClose={() => setServerSettingsModalOpen(false)} server={server} onServerUpdate={onServerUpdate} />}
            {isOwner && <CreateChannelModal isOpen={isCreateChannelModalOpen} onClose={() => setCreateChannelModalOpen(false)} serverId={server.id} onChannelCreated={fetchChannels} />}
            {selectedChannel && isOwner && <EditChannelModal isOpen={isEditChannelModalOpen} onClose={() => setEditChannelModalOpen(false)} channel={selectedChannel} onChannelUpdated={fetchChannels} />}
        </>
    );
};

interface ChannelCategoryProps {
    title: string; channels: Channel[]; activeChannelId: string | undefined; onChannelClick: (channel: Channel) => void;
    isOwner: boolean; setSelectedChannel: (channel: Channel) => void; setEditChannelModalOpen: (isOpen: boolean) => void;
    agora?: any; userProfiles?: Map<string | number, Profile>; currentUserProfile?: Profile | null;
}

const ChannelCategory: React.FC<ChannelCategoryProps> = ({ title, channels, activeChannelId, onChannelClick, isOwner, setSelectedChannel, setEditChannelModalOpen, agora, userProfiles, currentUserProfile }) => {
    const { theme } = useTheme();
    return (
        <div className="mb-7">
            <h3 className={`px-2 mb-3 text-[10px] font-black tracking-[0.2em] uppercase ${theme.colors.textPrimary} flex items-center gap-2`}>
                <div className="h-[2px] flex-grow bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
                <span className="drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">{title}</span>
                <div className="h-[2px] flex-grow bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
            </h3>
            <div className="space-y-1">
                {channels.map(channel => {
                    const isActiveTextChannel = channel.type === 'text' && activeChannelId === channel.id;
                    const isActiveVoiceChannel = agora?.isJoined && agora?.channelName === channel.id;
                    const isActive = isActiveTextChannel || isActiveVoiceChannel;

                    return (
                        <div key={channel.id}>
                            <div className="group relative">
                                <button
                                    onClick={() => onChannelClick(channel)}
                                    className={`w-full flex items-center px-3 py-2.5 text-left transition-all duration-200 border-l-2 relative overflow-hidden font-bold tracking-tight
                                    ${isActive
                                        ? `${theme.colors.bgPrimary} ${theme.colors.textPrimary} border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] scale-[1.01]`
                                        : `${theme.colors.bgSecondary} ${theme.colors.textMuted} border-transparent hover:bg-red-900/20 hover:text-slate-100 hover:border-red-700/50 hover:shadow-md`
                                    }`}
                                    style={{ clipPath: isActive ? 'polygon(0 0, 100% 0, 98% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent"></div>
                                    )}
                                    <div className={`${isActive ? 'ml-1' : ''} flex items-center`}>
                                        {channel.type === 'text' ? <TextChannelIcon /> : <VoiceChannelIcon />}
                                    </div>
                                    <span className="truncate text-sm">{channel.name}</span>
                                </button>
                                {isOwner && (
                                    <button 
                                        onClick={() => { setSelectedChannel(channel); setEditChannelModalOpen(true); }} 
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 ${theme.colors.textMuted} opacity-0 group-hover:opacity-100 hover:bg-red-600/80 hover:text-white transition-all duration-200 backdrop-blur-sm shadow-md`}
                                        style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}
                                    >
                                        <SettingsIcon />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ChannelListRedSparrow;
