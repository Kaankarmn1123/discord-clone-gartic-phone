// components/DiscoverServersClassicIndigo.tsx
import React, { useState, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Server, Profile } from '../types';
import Spinner from './Spinner';
import { useTheme } from '../contexts/ThemeContext';
import { tr } from '../constants/tr';
import { useAppContext } from '../contexts/AppContext';

interface DiscoverServersProps {
  onServerJoined: () => void;
}

type DiscoverServer = Server & {
  members_count: number;
  is_member: boolean;
  request_sent: boolean;
  owner_profile: Pick<Profile, 'username'> | null;
};

const TabButton: React.FC<{title: string, isActive: boolean, onClick: () => void}> = ({ title, isActive, onClick }) => {
    return (
        <button 
            onClick={onClick} 
            className={`relative px-6 py-3 text-sm font-bold transition-all duration-300 rounded-xl ${
                isActive 
                    ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
            {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-50 -z-10"></div>
            )}
            {title}
        </button>
    );
};

const JoinButton: React.FC<{server: DiscoverServer, joiningServerId: string | null, onJoin: (server: DiscoverServer) => void}> = ({ server, joiningServerId, onJoin }) => {
    const { theme } = useTheme();

    if (server.is_member) {
        return (
            <button disabled className="w-full px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {tr.joined}
            </button>
        );
    }
    
    if (server.request_sent) {
        return (
            <button disabled className="w-full px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl cursor-not-allowed shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {tr.requestSent}
            </button>
        );
    }

    const buttonText = server.requires_approval ? tr.sendRequest : tr.joinServer;
    const gradientClasses = server.requires_approval
        ? 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30 hover:shadow-indigo-500/50'
        : 'from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-500/30 hover:shadow-emerald-500/50';

    return (
        <button 
            onClick={() => onJoin(server)}
            disabled={joiningServerId === server.id}
            className={`relative w-full px-5 py-3 text-sm font-bold text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 shadow-lg overflow-hidden bg-gradient-to-r ${gradientClasses}`}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">
                {joiningServerId === server.id ? (
                    <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {tr.joining}
                    </>
                ) : (
                    <>
                        {server.requires_approval ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        )}
                        {buttonText}
                    </>
                )}
            </span>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>
    );
};


const DiscoverServersClassicIndigo: React.FC<DiscoverServersProps> = ({ onServerJoined }) => {
    const { user } = useAuth();
    const { appData, isReady, refetchAll } = useAppContext();
    const [joiningServerId, setJoiningServerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'public' | 'friends'>('public');

    const { publicServers, friendsServers } = useMemo(() => {
        if (!isReady) return { publicServers: [], friendsServers: [] };
        const friendIds = new Set(appData.friends.map(f => f.id));
        const friendsOnly: DiscoverServer[] = [];
        const publicOnly: DiscoverServer[] = [];

        appData.discoverableServers.forEach(server => {
            if (friendIds.has(server.owner_id)) {
                friendsOnly.push(server);
            } else if (server.visibility === 'public') {
                publicOnly.push(server);
            }
        });
        return { publicServers: publicOnly, friendsServers: friendsOnly };
    }, [isReady, appData.discoverableServers, appData.friends]);

    const handleJoinAction = async (server: DiscoverServer) => {
        if (!user || server.is_member || server.request_sent) return;
        setJoiningServerId(server.id);

        if (server.requires_approval) {
            await supabase.from('server_invites').insert({
                server_id: server.id,
                inviter_id: server.owner_id,
                invitee_id: user.id,
                status: 'pending',
                type: 'join_request'
            });
        } else {
            await supabase.from('memberships').insert({ server_id: server.id, user_id: user.id });
        }
        await refetchAll();
        onServerJoined();
        setJoiningServerId(null);
    };

    const renderServerList = (list: DiscoverServer[]) => {
        if (list.length === 0) {
            return (
                <div className="col-span-full flex flex-col items-center justify-center py-24">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full"></div>
                        <div className="relative text-7xl opacity-40">🔍</div>
                    </div>
                    <p className="text-slate-400 text-lg font-medium">Bu kategoride gösterilecek sunucu yok</p>
                    <p className="text-slate-500 text-sm mt-2">Yeni sunucular keşfetmek için daha sonra tekrar deneyin</p>
                </div>
            );
        }
        return list.map(server => (
            <div 
                key={server.id} 
                className="group relative bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/5 hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.3)] hover:-translate-y-2"
            >
               {/* Arka Plan Resmi - Büyük ve Blurlu */}
               {server.icon_url && (
                    <img
                        src={server.icon_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-20 blur-3xl scale-125 group-hover:scale-150 group-hover:opacity-30 transition-all duration-700"
                    />
                )}
                
                {/* Okunabilirlik için Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900/95"></div>
                
                {/* Glow Effect on Hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                
                {/* İçerik */}
                <div className="relative flex flex-col h-full z-10">
                   {/* Icon Section - Yuvarlak Önde */}
                   <div className="h-40 flex items-center justify-center pt-8">
                       <div className="relative">
                           {/* Glow ring */}
                           <div className="absolute -inset-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-60 blur-2xl transition-all duration-500"></div>
                           
                           <div className="relative w-24 h-24 rounded-full shadow-2xl overflow-hidden ring-4 ring-white/10 group-hover:ring-white/20 transition-all duration-300 group-hover:scale-110">
                               {server.icon_url ? (
                                   <img src={server.icon_url} alt={server.name} className="w-full h-full object-cover" />
                               ) : (
                                   <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
                                       <span className="font-bold text-4xl text-white drop-shadow-lg">{server.name.charAt(0)}</span>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
                   
                   {/* Content Section */}
                   <div className="p-6 flex flex-col flex-grow">
                       <h3 className="font-bold text-xl text-white truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all duration-300">
                           {server.name}
                       </h3>
                       
                       <div className="flex items-center mt-2 space-x-2">
                           <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-500/20">
                               <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                               </svg>
                           </div>
                           <p className="text-xs text-slate-400 font-medium">{server.owner_profile?.username || 'Bilinmiyor'}</p>
                       </div>
                       
                       {/* Members Count with Animated Dot */}
                       <div className="flex items-center mt-4 space-x-2 bg-white/5 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10 group-hover:bg-white/10 transition-all duration-300">
                           <div className="relative flex items-center">
                               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span>
                               <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                           </div>
                           <span className="text-sm font-semibold text-slate-300">{server.members_count}</span>
                           <span className="text-xs text-slate-500">üye çevrimiçi</span>
                       </div>
                       
                       {/* Join Button */}
                       <div className="mt-auto pt-6">
                           <JoinButton server={server} joiningServerId={joiningServerId} onJoin={handleJoinAction} />
                       </div>
                   </div>
                   
                   {/* Shine Effect */}
                   <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                       <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                   </div>
                </div>
           </div>
       ));
    };

    return (
        <div className="flex flex-col flex-grow min-h-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 overflow-y-auto relative">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }}></div>
            </div>
            
            <div className="relative z-10">
                <div className="mb-10">
                    <div className="flex items-center space-x-4 mb-3">
                        <div className="w-1.5 h-12 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-100 bg-clip-text text-transparent drop-shadow-lg">
                            {tr.discoverServers}
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg ml-6 font-light">{tr.discoverDescription}</p>
                </div>

                <div className="flex space-x-3 mb-8 bg-white/5 backdrop-blur-sm p-2 rounded-2xl border border-white/10 w-fit">
                    <TabButton title={tr.publicServers} isActive={activeTab === 'public'} onClick={() => setActiveTab('public')} />
                    <TabButton title={tr.friendsServers} isActive={activeTab === 'friends'} onClick={() => setActiveTab('friends')} />
                </div>

                {!isReady ? (
                    <div className="flex-grow flex items-center justify-center min-h-[400px]">
                        <div className="relative">
                            <Spinner />
                            <div className="absolute inset-0 blur-xl opacity-50">
                                <Spinner />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {activeTab === 'public' ? renderServerList(publicServers) : renderServerList(friendsServers)}
                    </div>
                )}
            </div>
        </div>
    );
};


export default DiscoverServersClassicIndigo;