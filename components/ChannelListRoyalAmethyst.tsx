// components/ChannelListRoyalAmethyst.tsx
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

// Elegant Geometric Icons
const DropdownIcon = () => (
  <svg className="w-5 h-5 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const TextChannelIcon = () => (
    <svg className="w-5 h-5 mr-2.5 text-purple-400 group-hover:text-fuchsia-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
    </svg>
);

const VoiceChannelIcon = () => (
  <svg className="w-5 h-5 mr-2.5 text-fuchsia-400 group-hover:text-purple-300 transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
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

const ChannelListRoyalAmethyst: React.FC<ChannelListProps> = ({ server, onChannelSelect, activeChannelId, onServerUpdate, agora, showLegacyVoiceControls, isCollapsed, onToggle }) => {
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
                <div className={`h-full transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'w-0' : 'w-64'}`}>
                    <div className={`w-64 h-full flex flex-col ${theme.colors.bgSecondary} border-r border-purple-900/30 shadow-2xl relative`}>
                        {/* Luxurious Royal Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-fuchsia-950 to-slate-950 pointer-events-none"></div>
                        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(168,85,247,0.4) 45%, rgba(168,85,247,0.4) 55%, transparent 60%), linear-gradient(-45deg, transparent 40%, rgba(192,132,252,0.4) 45%, rgba(192,132,252,0.4) 55%, transparent 60%)',
                            backgroundSize: '30px 30px',
                          }}></div>
                        </div>

                        {/* Server Header - Elegant Style */}
                        <div className="relative p-3 border-b border-purple-800/40 shadow-lg bg-gradient-to-b from-purple-900/20 to-transparent flex-shrink-0">
                            <button onClick={() => setDropdownOpen(!isDropdownOpen)} 
                                    className="w-full flex items-center justify-between text-white hover:bg-purple-900/20 px-4 py-3 rounded-md transition-all duration-300 hover:shadow-lg font-serif tracking-wide">
                                <span className={`truncate text-base ${serverNameColor}`}>{server.name}</span>
                                <div className={`transform transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                    <DropdownIcon />
                                </div>
                            </button>
                            {isDropdownOpen && (
                                <div className={`absolute top-full left-0 right-0 mt-2 mx-2 p-1.5 ${theme.colors.bgTertiary} rounded-lg shadow-2xl z-50 text-sm border border-purple-500/30 backdrop-blur-2xl`}>
                                    <button onClick={() => { setInviteModalOpen(true); setDropdownOpen(false); }} 
                                            className={`w-full text-left px-3 py-2 ${theme.colors.text} ${theme.colors.textHover} rounded-md transition-all duration-300 flex items-center gap-3 font-serif`}>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path></svg>
                                        {tr.invitePeople}
                                    </button>
                                    {isOwner && (<>
                                        <button onClick={() => { setServerSettingsModalOpen(true); setDropdownOpen(false); }} 
                                                className={`w-full text-left px-3 py-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} rounded-md hover:${theme.colors.activeBackground} transition-all duration-300 flex items-center gap-3 font-serif mt-1`}>
                                            <SettingsIcon />
                                            {tr.serverSettings}
                                        </button>
                                        <button onClick={() => { setCreateChannelModalOpen(true); setDropdownOpen(false); }} 
                                                className={`w-full text-left px-3 py-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} rounded-md hover:${theme.colors.activeBackground} transition-all duration-300 flex items-center gap-3 font-serif mt-1`}>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg>
                                            {tr.createChannel}
                                        </button>
                                    </>)}
                                </div>
                            )}
                        </div>

                        {/* Channels List */}
                        <div className="flex-grow p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent hover:scrollbar-thumb-purple-400/40">
                            <ChannelCategory title="Metin Kanalları" channels={textChannels} activeChannelId={activeChannelId} onChannelClick={onChannelSelect} isOwner={isOwner} setSelectedChannel={setSelectedChannel} setEditChannelModalOpen={setEditChannelModalOpen} />
                            <ChannelCategory title="Ses Kanalları" channels={voiceChannels} activeChannelId={activeChannelId} onChannelClick={onChannelSelect} isOwner={isOwner} setSelectedChannel={setSelectedChannel} setEditChannelModalOpen={setEditChannelModalOpen} agora={agora} userProfiles={userProfiles} currentUserProfile={profile} />
                        </div>

                        {/* Bottom Panels */}
                        <div className="flex-shrink-0 border-t border-purple-900/30">
                            {showLegacyVoiceControls && <VoiceControlPanel agora={agora} />}
                            <UserPanel />
                        </div>
                    </div>
                </div>

                {/* Geometric Toggle Button */}
                <button
                    onClick={onToggle}
                    className={`absolute top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-br from-purple-900/90 to-fuchsia-900/90 hover:from-purple-600 hover:to-fuchsia-600 z-20 flex items-center justify-center border-y-2 border-r-2 border-purple-500/40 hover:border-purple-400/60 shadow-[5px_0_20px_rgba(168,85,247,0.2)] hover:shadow-[5px_0_30px_rgba(168,85,247,0.4)] group transition-all duration-300 ease-in-out backdrop-blur-sm ${isCollapsed ? 'left-0' : 'left-64'}`}
                    style={{ clipPath: 'polygon(0 0, 100% 10%, 100% 90%, 0 100%)' }}
                    aria-label={isCollapsed ? "Kanal listesini aç" : "Kanal listesini kapat"}
                >
                    <svg className={`w-5 h-5 text-purple-300 group-hover:text-white transition-all duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
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
        <div className="mb-8">
            <h3 className={`px-2 mb-3 text-xs font-bold tracking-widest uppercase ${theme.colors.textPrimary} opacity-60`}>{title}</h3>
            <div className="space-y-1.5">
                {channels.map(channel => {
                    const isActiveTextChannel = channel.type === 'text' && activeChannelId === channel.id;
                    const isActiveVoiceChannel = agora?.isJoined && agora?.channelName === channel.id;
                    const isActive = isActiveTextChannel || isActiveVoiceChannel;

                    return (
                        <div key={channel.id}>
                            <div className="group relative">
                                <button
                                    onClick={() => onChannelClick(channel)}
                                    className={`w-full flex items-center px-4 py-2.5 text-left rounded-lg transition-all duration-300 border relative overflow-hidden font-medium
                                    ${isActive
                                        ? `${theme.colors.bgPrimary} ${theme.colors.textPrimary} border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.2)]`
                                        : `${theme.colors.bgSecondary} ${theme.colors.textMuted} border-transparent hover:bg-purple-900/30 hover:text-slate-100`
                                    }`}
                                >
                                    {isActive && (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-transparent"></div>
                                            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-purple-400 to-fuchsia-500"></div>
                                        </>
                                    )}
                                    <div className="flex items-center relative z-10">
                                        {channel.type === 'text' ? <TextChannelIcon /> : <VoiceChannelIcon />}
                                    </div>
                                    <span className={`truncate text-sm relative z-10 ${isActive ? 'pl-2' : ''}`}>{channel.name}</span>
                                </button>
                                {isOwner && (
                                    <button 
                                        onClick={() => { setSelectedChannel(channel); setEditChannelModalOpen(true); }} 
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 ${theme.colors.textMuted} rounded-lg opacity-0 group-hover:opacity-100 hover:bg-purple-600/50 hover:text-white transition-all duration-300`}>
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

export default ChannelListRoyalAmethyst;
