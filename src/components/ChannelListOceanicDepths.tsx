// components/ChannelListOceanicDepths.tsx
import React, { useState } from 'react';
import type { Server, Channel, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { tr } from '../constants/tr';
import VoiceControlPanel from './VoiceControlPanel';
import UserPanel from './UserPanel';
import { useTheme } from '../contexts/ThemeContext';
import { useChannels } from '../hooks/useChannels';

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

// Fluid Oceanic Icons
const DropdownIcon = () => (
  <svg className="w-5 h-5 transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const TextChannelIcon = () => (
  <svg className="w-5 h-5 mr-2 text-blue-400 group-hover:text-cyan-300 transition-all duration-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path>
  </svg>
);

const VoiceChannelIcon = () => (
  <svg className="w-5 h-5 mr-2 text-cyan-400 group-hover:text-blue-300 transition-all duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4 transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20">
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

const ChannelListOceanicDepths: React.FC<ChannelListProps> = ({ server, onChannelSelect, activeChannelId, onServerUpdate, agora, showLegacyVoiceControls, isCollapsed, onToggle }) => {
    const { user, profile } = useAuth();
    const { theme } = useTheme();
    const { channels, refetch: fetchChannels } = useChannels(server.id);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [isServerSettingsModalOpen, setServerSettingsModalOpen] = useState(false);
    const [isCreateChannelModalOpen, setCreateChannelModalOpen] = useState(false);
    const [isEditChannelModalOpen, setEditChannelModalOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

    const isOwner = server.owner_id === user?.id;
    const serverNameColor = server.icon_url ? '' : getTextColorForText(server.name);

    const textChannels = channels.filter(c => c.type === 'text');
    const voiceChannels = channels.filter(c => c.type === 'voice');

    return (
        <>
            <div className="relative h-full flex-shrink-0">
                <div className={`h-full transition-all duration-700 ease-in-out overflow-hidden ${isCollapsed ? 'w-0' : 'w-64'}`}>
                    <div className={`w-64 h-full flex flex-col ${theme.colors.bgSecondary} border-r border-blue-900/20 shadow-2xl relative`}>
                        {/* Fluid Oceanic Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_var(--tw-gradient-stops))] from-blue-900/30 via-cyan-900/20 to-transparent pointer-events-none"></div>
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                          <div className="absolute inset-0 animate-wave" style={{
                            backgroundImage: 'repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)',
                          }}></div>
                        </div>

                        {/* Server Header - Fluid Style */}
                        <div className="relative p-4 border-b border-blue-800/30 shadow-lg bg-gradient-to-b from-blue-900/20 to-transparent flex-shrink-0">
                            <button onClick={() => setDropdownOpen(!isDropdownOpen)} 
                                    className="w-full flex items-center justify-between text-white hover:bg-blue-900/30 px-4 py-3 rounded-3xl transition-all duration-500 hover:shadow-lg font-light tracking-wide">
                                <span className={`truncate text-base ${serverNameColor}`}>{server.name}</span>
                                <div className={`transform transition-transform duration-500 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                    <DropdownIcon />
                                </div>
                            </button>
                            {isDropdownOpen && (
                                <div className={`absolute top-full left-0 right-0 mt-3 mx-2 p-2 ${theme.colors.bgTertiary} rounded-3xl shadow-2xl z-50 text-sm border border-blue-500/30 backdrop-blur-2xl`}>
                                    <button onClick={() => { setInviteModalOpen(true); setDropdownOpen(false); }} 
                                            className={`w-full text-left px-4 py-3 ${theme.colors.text} ${theme.colors.textHover} rounded-2xl transition-all duration-500 flex items-center gap-3 font-light`}>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path></svg>
                                        {tr.invitePeople}
                                    </button>
                                    {isOwner && (<>
                                        <button onClick={() => { setServerSettingsModalOpen(true); setDropdownOpen(false); }} 
                                                className={`w-full text-left px-4 py-3 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} rounded-2xl hover:${theme.colors.activeBackground} transition-all duration-500 flex items-center gap-3 font-light mt-1`}>
                                            <SettingsIcon />
                                            {tr.serverSettings}
                                        </button>
                                        <button onClick={() => { setCreateChannelModalOpen(true); setDropdownOpen(false); }} 
                                                className={`w-full text-left px-4 py-3 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} rounded-2xl hover:${theme.colors.activeBackground} transition-all duration-500 flex items-center gap-3 font-light mt-1`}>
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg>
                                            {tr.createChannel}
                                        </button>
                                    </>)}
                                </div>
                            )}
                        </div>

                        {/* Channels List */}
                        <div className="flex-grow p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent hover:scrollbar-thumb-blue-400/30">
                            <ChannelCategory title="Metin Kanalları" channels={textChannels} activeChannelId={activeChannelId} onChannelClick={onChannelSelect} isOwner={isOwner} setSelectedChannel={setSelectedChannel} setEditChannelModalOpen={setEditChannelModalOpen} />
                            <ChannelCategory title="Ses Kanalları" channels={voiceChannels} activeChannelId={activeChannelId} onChannelClick={onChannelSelect} isOwner={isOwner} setSelectedChannel={setSelectedChannel} setEditChannelModalOpen={setEditChannelModalOpen} agora={agora} />
                        </div>

                        {/* Bottom Panels */}
                        <div className="flex-shrink-0 border-t border-blue-900/20">
                            {showLegacyVoiceControls && <VoiceControlPanel agora={agora} />}
                            <UserPanel />
                        </div>
                    </div>
                </div>

                {/* Floating Toggle Button */}
                <button
                    onClick={onToggle}
                    className={`absolute top-1/2 -translate-y-1/2 w-10 h-16 bg-gradient-to-br from-blue-900/90 to-cyan-900/90 hover:from-blue-600 hover:to-cyan-600 rounded-full z-20 flex items-center justify-center border border-blue-400/30 hover:border-blue-300/60 shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] group transition-all duration-700 ease-in-out backdrop-blur-2xl ${isCollapsed ? 'left-0' : 'left-64 -translate-x-1/2'}`}
                    aria-label={isCollapsed ? "Kanal listesini aç" : "Kanal listesini kapat"}
                >
                    <svg className={`w-5 h-5 text-blue-300 group-hover:text-white transition-all duration-700 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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
    agora?: any;
}

const ChannelCategory: React.FC<ChannelCategoryProps> = ({ title, channels, activeChannelId, onChannelClick, isOwner, setSelectedChannel, setEditChannelModalOpen, agora }) => {
    const { theme } = useTheme();
    return (
        <div className="mb-8">
            <h3 className={`px-3 mb-4 text-xs font-light tracking-[0.15em] uppercase ${theme.colors.textPrimary} flex items-center gap-3 opacity-70`}>
                <div className="h-px flex-grow bg-gradient-to-r from-transparent via-blue-400/30 to-transparent blur-[0.5px]"></div>
                <span className="drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">{title}</span>
                <div className="h-px flex-grow bg-gradient-to-r from-transparent via-blue-400/30 to-transparent blur-[0.5px]"></div>
            </h3>
            <div className="space-y-2">
                {channels.map(channel => {
                    const isActiveTextChannel = channel.type === 'text' && activeChannelId === channel.id;
                    const isActiveVoiceChannel = agora?.isJoined && agora?.channelName === channel.id;
                    const isActive = isActiveTextChannel || isActiveVoiceChannel;

                    return (
                        <div key={channel.id}>
                            <div className="group relative">
                                <button
                                    onClick={() => onChannelClick(channel)}
                                    className={`w-full flex items-center px-4 py-3 text-left rounded-full transition-all duration-700 border relative overflow-hidden font-light tracking-wide
                                    ${isActive
                                        ? `${theme.colors.bgPrimary} ${theme.colors.textPrimary} border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] scale-[1.02]`
                                        : `${theme.colors.bgSecondary} ${theme.colors.textMuted} hover:bg-blue-900/20 hover:text-slate-100 border-transparent hover:border-blue-700/30 hover:shadow-lg`
                                    }`}
                                >
                                    {isActive && (
                                        <>
                                            <div className="absolute -inset-1 bg-blue-500/10 rounded-full blur-sm animate-pulse"></div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-cyan-400/10 to-transparent rounded-full"></div>
                                        </>
                                    )}
                                    <div className="flex items-center relative z-10">
                                        {channel.type === 'text' ? <TextChannelIcon /> : <VoiceChannelIcon />}
                                    </div>
                                    <span className="truncate text-sm relative z-10">{channel.name}</span>
                                    
                                    {isActive && (
                                      <div className="absolute inset-0 opacity-30 pointer-events-none rounded-full">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-300/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
                                      </div>
                                    )}
                                </button>
                                {isOwner && (
                                    <button 
                                        onClick={() => { setSelectedChannel(channel); setEditChannelModalOpen(true); }} 
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 ${theme.colors.textMuted} rounded-full opacity-0 group-hover:opacity-100 hover:bg-blue-600/80 hover:text-white transition-all duration-500 backdrop-blur-xl shadow-lg`}>
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

export default ChannelListOceanicDepths;
