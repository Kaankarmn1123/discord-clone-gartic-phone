// components/FriendsInterfaceRedSparrow.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tr } from '../constants/tr';
import { supabase } from '../services/supabaseClient';
import type { Friend, ServerInvite, Profile } from '../types';
import Spinner from './Spinner';
import StatusIndicator from './StatusIndicator';
import UserPanel from './UserPanel';
import FriendActivityPanel from './FriendActivityPanel';
import VoiceControlPanel from './VoiceControlPanel';
import { useFriends } from '../hooks/useFriends'; // NEW

const MessageIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

interface FriendsInterfaceProps {
    onServerAction: () => void;
    agora: any;
    onStartDm: (friend: Friend) => void;
}

const FriendsInterfaceRedSparrow: React.FC<FriendsInterfaceProps> = ({ onServerAction, agora, onStartDm }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'add'>('all');
    
    const renderMainContent = () => {
        switch (activeTab) {
            case 'all':
                return <AllFriendsTab onStartDm={onStartDm} />;
            case 'pending':
                return <PendingRequestsTab onAction={onServerAction} />;
            case 'add':
                return <AddFriendTab />;
            default: return null;
        }
    }
    
    return (
        <div className="flex flex-grow min-w-0">
            <div className="flex flex-col flex-grow">
                <div className="flex items-center p-6 bg-gradient-to-r from-black via-red-950 to-black border-b-2 border-red-900 shadow-2xl flex-shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239, 68, 68, 0.3) 2px, rgba(239, 68, 68, 0.3) 4px)` }}></div>
                    <div className="flex items-center space-x-6 relative z-10">
                        <div className="flex items-center bg-black border-2 border-red-500 px-5 py-2.5 relative group">
                            <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                            <svg className="w-7 h-7 mr-3 text-red-500 relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                            <span className="text-red-400 font-black tracking-widest uppercase relative z-10 text-sm">{tr.friends}</span>
                        </div>
                        <div className="h-10 w-px bg-red-500"></div>
                        <button onClick={() => setActiveTab('all')} className={`px-5 py-2 font-black uppercase tracking-wider text-xs transition-all duration-200 relative overflow-hidden ${activeTab === 'all' ? 'bg-red-600 text-white border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-black text-red-400 border border-red-900 hover:border-red-500 hover:text-red-300'}`}>
                            <span className="relative z-10">{tr.allFriends}</span>
                            {activeTab === 'all' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent animate-pulse"></div>}
                        </button>
                        <button onClick={() => setActiveTab('pending')} className={`px-5 py-2 font-black uppercase tracking-wider text-xs transition-all duration-200 relative overflow-hidden ${activeTab === 'pending' ? 'bg-red-600 text-white border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-black text-red-400 border border-red-900 hover:border-red-500 hover:text-red-300'}`}>
                            <span className="relative z-10">{tr.pending}</span>
                            {activeTab === 'pending' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent animate-pulse"></div>}
                        </button>
                        <button onClick={() => setActiveTab('add')} className="px-6 py-2.5 font-black uppercase tracking-wider text-xs text-black bg-gradient-to-r from-red-500 to-violet-500 hover:from-red-600 hover:to-violet-600 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-200 hover:scale-105">
                            {tr.addFriend}
                        </button>
                    </div>
                </div>
                <div className="flex-grow flex flex-col min-w-0 bg-gradient-to-br from-black via-red-950 to-black relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(239, 68, 68, 0.1) 50px, rgba(239, 68, 68, 0.1) 51px)` }}></div>
                    <div className="relative z-10 flex-grow flex flex-col min-h-0">
                        {renderMainContent()}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    {(agora.isJoined || agora.isJoining) && <VoiceControlPanel agora={agora} />}
                    <UserPanel />
                </div>
            </div>
            <FriendActivityPanel />
        </div>
    );
};

const listItemClasses = "flex items-center justify-between p-4 bg-black border-l-4 border-red-900 hover:border-red-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] relative overflow-hidden group";

const AllFriendsTab = ({ onStartDm }: { onStartDm: (friend: Friend) => void }) => {
    // UPDATED: Fetches data from the new hook
    const { friends, loading } = useFriends();

    const handleRemoveFriend = async (friendshipId: string) => { await supabase.from('friendships').delete().eq('id', friendshipId); };

    if (loading) return <div className="flex-grow flex items-center justify-center"><Spinner /></div>;
    
    if (friends.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center p-12 relative">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239, 68, 68, 0.3) 2px, rgba(239, 68, 68, 0.3) 4px)` }}></div>
                <div className="text-center relative z-10">
                    <div className="text-7xl mb-6 opacity-30">⚡</div>
                    <p className="text-2xl font-black uppercase tracking-widest text-red-500 mb-3">SİSTEM BOŞ</p>
                    <p className="text-sm font-mono text-red-400/60 uppercase">{tr.noFriendsYet}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 overflow-y-auto">
            <div className="flex items-center mb-6 border-b border-red-900 pb-3">
                <h3 className="text-xs font-black tracking-widest uppercase text-red-400">{tr.allFriends}</h3>
                <div className="ml-3 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-black border border-red-500">{friends.length}</div>
            </div>
            <div className="space-y-2">
                {friends.map(friend => (
                    <div key={friend.id} className={listItemClasses}>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-950/0 via-red-500/5 to-red-950/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex items-center relative z-10">
                            <div className="relative mr-4"><div className="absolute -inset-1 bg-red-500 blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div><img src={friend.avatar_url || `https://robohash.org/${friend.id}.png?set=set1&size=40x40`} alt={friend.username} className="w-12 h-12 relative border-2 border-red-900 group-hover:border-red-500 transition-all duration-300"/><StatusIndicator status={friend.status} className="absolute -bottom-1 -right-1 ring-2 ring-black"/></div>
                            <span className="font-black text-red-100 group-hover:text-red-400 transition-colors duration-200 uppercase tracking-wide">{friend.username}</span>
                        </div>
                        <div className="flex items-center space-x-2 relative z-10">
                            <button onClick={() => onStartDm(friend)} className="p-2.5 text-red-400 border border-red-900 hover:bg-red-500/20 hover:border-red-500 transition-all duration-200" aria-label={`Message ${friend.username}`}><MessageIcon /></button>
                            <button onClick={() => handleRemoveFriend(friend.friendship_id)} className="p-2.5 text-red-400 border border-red-900 hover:bg-red-500/20 hover:border-red-500 transition-all duration-200" aria-label={`Remove ${friend.username}`}><TrashIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PendingRequestsTab = ({ onAction }: { onAction: () => void }) => {
    // UPDATED: Fetches data from the new hook
    const { pending: pendingRequests, serverInvites, loading, refetch } = useFriends();
    const [joinRequests, setJoinRequests] = useState<ServerInvite[]>([]); // This can be moved to context too if needed
    const { user } = useAuth();
    
    // This part can also be moved to AppContext for full preloading
    useEffect(() => {
        const fetchJoinRequests = async () => {
            if (!user?.id) return;
            
            // Validate user.id is a valid UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(user.id)) {
                console.error('Invalid UUID format for user.id:', user.id);
                setJoinRequests([]);
                return;
            }
            
            try {
                const { data: ownedServersData, error: serversError } = await supabase
                    .from('servers')
                    .select('id')
                    .eq('owner_id', user.id);
                    
                if (serversError) {
                    console.error('Error fetching owned servers:', serversError);
                    setJoinRequests([]);
                    return;
                }
                
                if (ownedServersData && ownedServersData.length > 0) {
                    const ownedServerIds = ownedServersData.map(s => s.id);
                    const { data: joinRequestsData, error: invitesError } = await supabase
                        .from('server_invites')
                        .select('*, servers(*), profiles:invitee_id(*)')
                        .in('server_id', ownedServerIds)
                        .eq('status', 'pending')
                        .eq('type', 'join_request');
                        
                    if (invitesError) {
                        console.error('Error fetching join requests:', invitesError);
                        setJoinRequests([]);
                        return;
                    }
                    
                    if (joinRequestsData) {
                        const validJoinRequests = joinRequestsData.map(invite => {
                            const server = Array.isArray(invite.servers) ? invite.servers[0] : invite.servers;
                            const profile = Array.isArray(invite.profiles) ? invite.profiles[0] : invite.profiles;
                            return server && profile ? { ...invite, servers: server, profiles: profile } : null;
                        }).filter((i): i is ServerInvite => i !== null);
                        setJoinRequests(validJoinRequests);
                    }
                } else {
                    setJoinRequests([]);
                }
            } catch (error) {
                console.error('Error in fetchJoinRequests:', error);
                setJoinRequests([]);
            }
        };
        fetchJoinRequests();
    }, [user, refetch]);


    const handleAcceptFriend = async (friendshipId: string) => { await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId); refetch(); };
    const handleDeclineFriend = async (friendshipId: string) => { await supabase.from('friendships').delete().eq('id', friendshipId); refetch(); };
    const handleAcceptInvite = async (inviteId: string) => { const { error } = await supabase.rpc('accept_server_invite', { p_invite_id: inviteId }); if (!error) onAction(); refetch(); };
    const handleDeclineInvite = async (inviteId: string) => { await supabase.from('server_invites').delete().eq('id', inviteId); refetch(); };
    
    if (loading) return <div className="flex-grow flex items-center justify-center"><Spinner /></div>;
    if (pendingRequests.length === 0 && serverInvites.length === 0 && joinRequests.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center p-12 relative">
                <div className="absolute inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239, 68, 68, 0.3) 2px, rgba(239, 68, 68, 0.3) 4px)` }}></div></div>
                <div className="text-center relative z-10"><div className="text-7xl mb-6 opacity-30">🔴</div><p className="text-2xl font-black uppercase tracking-widest text-red-500 mb-3">KUYRUK BOŞ</p><p className="text-sm font-mono text-red-400/60 uppercase">{tr.noPendingRequests}</p></div>
            </div>
        );
    }
    return (
        <div className="p-8 overflow-y-auto space-y-8">
            {joinRequests.length > 0 && <JoinRequests requests={joinRequests} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />}
            {serverInvites.length > 0 && <ServerInvites invites={serverInvites} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />}
            {pendingRequests.length > 0 && <FriendRequests requests={pendingRequests} onAccept={handleAcceptFriend} onDecline={handleDeclineFriend} />}
        </div>
    );
};

// --- Helper sub-components for Pending Tab (no changes needed) ---
const JoinRequests: React.FC<{ requests: ServerInvite[], onAccept: (id: string) => void, onDecline: (id: string) => void }> = ({ requests, onAccept, onDecline }) => (
    <div>
        <div className="flex items-center mb-6 border-b border-red-900 pb-3"><h3 className="text-xs font-black tracking-widest uppercase text-red-400">{tr.joinRequests}</h3><div className="ml-3 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-black border border-red-500">{requests.length}</div></div>
        <div className="space-y-2">
            {requests.map(req => (<div key={req.id} className={listItemClasses}><div className="absolute inset-0 bg-gradient-to-r from-red-950/0 via-red-500/5 to-red-950/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div><div className="flex items-center relative z-10"><img src={req.profiles.avatar_url || ''} alt={req.profiles.username} className="w-12 h-12 border-2 border-red-900 group-hover:border-red-500 mr-4 transition-all duration-300"/><div><p className="text-sm text-red-300 font-mono">{tr.wantsToJoin.replace('{username}', req.profiles.username).replace('{serverName}', req.servers.name)}</p></div></div><div className="flex space-x-2 relative z-10"><button onClick={() => onAccept(req.id)} className="p-2.5 bg-red-600 border-2 border-red-500 hover:bg-red-500 transition-all duration-200"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button><button onClick={() => onDecline(req.id)} className="p-2.5 bg-black border-2 border-red-900 hover:border-red-500 transition-all duration-200"><svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div>))}
        </div>
    </div>
);

const ServerInvites = ({ invites, onAccept, onDecline }: { invites: ServerInvite[], onAccept: (id: string) => void, onDecline: (id: string) => void }) => (
    <div>
        <div className="flex items-center mb-6 border-b border-red-900 pb-3"><h3 className="text-xs font-black tracking-widest uppercase text-red-400">{tr.serverInvites}</h3><div className="ml-3 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-black border border-red-500">{invites.length}</div></div>
        <div className="space-y-2">
            {invites.map(invite => (<div key={invite.id} className={listItemClasses}><div className="absolute inset-0 bg-gradient-to-r from-red-950/0 via-red-500/5 to-red-950/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div><div className="flex items-center relative z-10"><div className="flex items-center justify-center w-12 h-12 border-2 border-red-900 group-hover:border-red-500 mr-4 bg-red-950 font-black text-lg text-red-400 transition-all duration-300">{invite.servers.name.charAt(0)}</div><div><p className="font-black text-red-100 uppercase tracking-wide">{invite.servers.name}</p><p className="text-xs text-red-400 font-mono">{invite.profiles.username} {tr.from}</p></div></div><div className="flex space-x-2 relative z-10"><button onClick={() => onAccept(invite.id)} className="p-2.5 bg-red-600 border-2 border-red-500 hover:bg-red-500 transition-all duration-200"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button><button onClick={() => onDecline(invite.id)} className="p-2.5 bg-black border-2 border-red-900 hover:border-red-500 transition-all duration-200"><svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div>))}
        </div>
    </div>
);

const FriendRequests = ({ requests, onAccept, onDecline }: { requests: Friend[], onAccept: (id: string) => void, onDecline: (id: string) => void }) => (
    <div>
        <div className="flex items-center mb-6 border-b border-red-900 pb-3"><h3 className="text-xs font-black tracking-widest uppercase text-red-400">{tr.pending}</h3><div className="ml-3 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-black border border-red-500">{requests.length}</div></div>
        <div className="space-y-2">
            {requests.map(req => (<div key={req.id} className={listItemClasses}><div className="absolute inset-0 bg-gradient-to-r from-red-950/0 via-red-500/5 to-red-950/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div><div className="flex items-center relative z-10"><img src={req.avatar_url || `https://robohash.org/${req.id}.png?set=set1&size=40x40`} alt={req.username} className="w-12 h-12 border-2 border-red-900 group-hover:border-red-500 mr-4 transition-all duration-300"/><div><p className="font-black text-red-100 uppercase tracking-wide">{req.username}</p><p className="text-xs text-red-400 font-mono">{tr.incomingRequest}</p></div></div><div className="flex space-x-2 relative z-10"><button onClick={() => onAccept(req.friendship_id)} className="p-2.5 bg-red-600 border-2 border-red-500 hover:bg-red-500 transition-all duration-200"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button><button onClick={() => onDecline(req.friendship_id)} className="p-2.5 bg-black border-2 border-red-900 hover:border-red-500 transition-all duration-200"><svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div>))}
        </div>
    </div>
);

const AddFriendTab = () => {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault(); if (!username.trim()) return; setLoading(true); setMessage('');
        const { data, error } = await supabase.rpc('send_friend_request', { target_username: username.trim() });
        if (error) setMessage(`Hata: ${error.message}`);
        else if (data.error) setMessage(data.error);
        else { setMessage(data.success); setUsername(''); }
        setLoading(false);
    };

    return (
        <div className="p-12">
            <div className="max-w-3xl">
                <h3 className="text-3xl font-black uppercase tracking-widest bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent mb-3">ARKADAŞ EKLE</h3>
                <p className="text-red-400/70 mb-10 font-mono text-sm">{tr.addFriendDescription}</p>
                <form onSubmit={handleSendRequest} className="border-t-2 border-red-900 pt-10">
                     <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-violet-600 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        <input
                            type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                            placeholder={tr.enterUsername} 
                            className={`relative w-full text-white bg-black p-5 pr-48 rounded-lg border-2 border-red-900/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all duration-300 text-base font-mono tracking-wider`}
                        />
                        <button 
                            type="submit" disabled={loading || !username.trim()} 
                            className="absolute right-3 top-3 bottom-3 px-8 text-sm font-black text-white rounded-md disabled:bg-slate-700 disabled:cursor-not-allowed bg-gradient-to-r from-red-600 to-violet-600 hover:from-red-500 hover:to-violet-500 shadow-lg shadow-red-500/30 transition-all duration-300 uppercase tracking-widest hover:scale-105"
                        >
                            {loading ? `${tr.sending}...` : tr.sendRequest}
                        </button>
                    </div>
                </form>
                {message && <p className="mt-8 text-sm text-center text-red-300 bg-red-950/40 backdrop-blur-sm px-6 py-4 rounded-lg border border-red-500/30 font-mono">{message}</p>}
            </div>
        </div>
    );
};

export default FriendsInterfaceRedSparrow;