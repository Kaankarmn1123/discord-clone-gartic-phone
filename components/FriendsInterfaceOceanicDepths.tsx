// components/FriendsInterfaceOceanicDepths.tsx
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
import { useTheme } from '../contexts/ThemeContext';

const MessageIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

interface FriendsInterfaceProps {
    onServerAction: () => void;
    agora: any;
    onStartDm: (friend: Friend) => void;
}

const FriendsInterfaceOceanicDepths: React.FC<FriendsInterfaceProps> = ({ onServerAction, agora, onStartDm }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'add'>('all');
    
    const renderMainContent = () => {
        switch (activeTab) {
            case 'all': return <AllFriendsTab onStartDm={onStartDm} />;
            case 'pending': return <PendingRequestsTab onAction={onServerAction} />;
            case 'add': return <AddFriendTab />;
            default: return null;
        }
    }
    
    return (
        <div className="flex flex-grow min-w-0">
            <div className="flex flex-col flex-grow">
                <div className="flex items-center p-6 bg-blue-950/70 border-b border-cyan-500/20 shadow-2xl flex-shrink-0 backdrop-blur-xl relative">
                    <div className="absolute inset-0 opacity-20"><div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-cyan-400/20 to-transparent blur-3xl animate-sway"></div></div>
                    <div className="flex items-center space-x-6 relative z-10">
                        <div className="flex items-center bg-blue-950/40 border border-cyan-500/30 px-5 py-2.5 rounded-2xl">
                            <svg className="w-7 h-7 mr-3 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                            <span className="text-cyan-200 font-light tracking-wide">{tr.friends}</span>
                        </div>
                        <div className="h-10 w-px bg-cyan-500/30"></div>
                        <button onClick={() => setActiveTab('all')} className={`px-5 py-2 font-medium tracking-wide text-sm transition-all duration-300 rounded-xl ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'bg-blue-950/30 text-cyan-300 hover:bg-blue-900/50 hover:text-white'}`}>{tr.allFriends}</button>
                        <button onClick={() => setActiveTab('pending')} className={`px-5 py-2 font-medium tracking-wide text-sm transition-all duration-300 rounded-xl ${activeTab === 'pending' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'bg-blue-950/30 text-cyan-300 hover:bg-blue-900/50 hover:text-white'}`}>{tr.pending}</button>
                        <button onClick={() => setActiveTab('add')} className="px-6 py-2.5 font-semibold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-105">{tr.addFriend}</button>
                    </div>
                </div>
                <div className="flex-grow flex flex-col min-w-0 bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10"><div className="absolute top-0 left-1/4 w-32 h-full bg-gradient-to-b from-cyan-400/20 to-transparent blur-3xl animate-sway-slow"></div></div>
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

const listItemClasses = "flex items-center justify-between p-4 bg-blue-950/30 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-cyan-900/50 group";

const AllFriendsTab = ({ onStartDm }: { onStartDm: (friend: Friend) => void }) => {
    const { user } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return; setLoading(true);
        const { data: friendData } = await supabase.from('friendships').select('*, user1:user1_id(*), user2:user2_id(*)').eq('status', 'accepted').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
        if(friendData) { const allFriends: Friend[] = friendData.map(friendship => { const friendProfile = friendship.user1_id === user.id ? friendship.user2 : friendship.user1; if (!friendProfile) return null; return { ...friendProfile, friendship_id: friendship.id, friendship_status: friendship.status, action_user_id: friendship.action_user_id }; }).filter((f): f is Friend => f !== null); setFriends(allFriends); } setLoading(false);
    }, [user]);

    useEffect(() => { fetchData(); const sub = supabase.channel(`friends-interface-all-friends`).on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, fetchData).subscribe(); return () => { supabase.removeChannel(sub); } }, [fetchData]);

    const handleRemoveFriend = async (friendshipId: string) => { await supabase.from('friendships').delete().eq('id', friendshipId); };

    if (loading) return <div className="flex-grow flex items-center justify-center"><Spinner /></div>;
    if (friends.length === 0) return <div className="flex-grow flex items-center justify-center p-12 text-center text-cyan-300/70 text-lg font-light">{tr.noFriendsYet}</div>;

    return (
        <div className="p-8 overflow-y-auto">
            <div className="flex items-center mb-6 border-b border-cyan-500/20 pb-4"><h3 className="text-sm font-semibold tracking-wide text-cyan-300">{tr.allFriends}</h3><div className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-200 text-xs font-semibold rounded-full border border-blue-500/30">{friends.length}</div></div>
            <div className="space-y-3">
                {friends.map(friend => (
                    <div key={friend.id} className={listItemClasses}>
                        <div className="flex items-center"><div className="relative mr-4"><div className="absolute -inset-1 bg-cyan-400 blur-sm rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div><img src={friend.avatar_url || `https://robohash.org/${friend.id}.png?set=set1&size=40x40`} alt={friend.username} className="w-12 h-12 rounded-full relative border-2 border-blue-800/50 group-hover:border-cyan-400/50 transition-all duration-300"/><StatusIndicator status={friend.status} className="absolute -bottom-1 -right-1 ring-2 ring-blue-950"/></div><span className="font-semibold text-blue-100 group-hover:text-cyan-200 transition-colors duration-200">{friend.username}</span></div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => onStartDm(friend)} className="p-2.5 text-cyan-300 border border-transparent hover:bg-blue-500/20 hover:border-blue-500/30 rounded-xl transition-all duration-200" aria-label={`Message ${friend.username}`}><MessageIcon /></button>
                            <button onClick={() => handleRemoveFriend(friend.friendship_id)} className="p-2.5 text-blue-300 border border-transparent hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 rounded-xl transition-all duration-200" aria-label={`Remove ${friend.username}`}><TrashIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PendingRequestsTab = ({ onAction }: { onAction: () => void }) => {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
    const [serverInvites, setServerInvites] = useState<ServerInvite[]>([]);
    const [joinRequests, setJoinRequests] = useState<ServerInvite[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return; setLoading(true);
        const [{ data: friendData }, { data: inviteData }, { data: ownedServersData }] = await Promise.all([ supabase.from('friendships').select('*, user1:user1_id(*), user2:user2_id(*)').eq('status', 'pending').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`), supabase.from('server_invites').select('*, servers(*), profiles:inviter_id(*)').eq('invitee_id', user.id).eq('status', 'pending'), supabase.from('servers').select('id').eq('owner_id', user.id) ]);
        if (friendData) { const pending = friendData.map(friendship => { const friendProfile = friendship.user1_id === user.id ? friendship.user2 : friendship.user1; if (!friendProfile || friendship.action_user_id === user.id) return null; return { ...friendProfile, friendship_id: friendship.id, friendship_status: friendship.status, action_user_id: friendship.action_user_id }; }).filter((f): f is Friend => f !== null); setPendingRequests(pending); }
        if (inviteData) { const validInvites = inviteData.filter(invite => invite.type !== 'join_request').map(invite => { const server = Array.isArray(invite.servers) ? invite.servers[0] : invite.servers; const profile = Array.isArray(invite.profiles) ? invite.profiles[0] : invite.profiles; return server && profile ? { ...invite, servers: server, profiles: profile } : null; }).filter((i): i is ServerInvite => i !== null); setServerInvites(validInvites); }
        if (ownedServersData && ownedServersData.length > 0) { const ownedServerIds = ownedServersData.map(s => s.id); const { data: joinRequestsData } = await supabase.from('server_invites').select('*, servers(*), profiles:invitee_id(*)').in('server_id', ownedServerIds).eq('status', 'pending').eq('type', 'join_request'); if (joinRequestsData) { const validJoinRequests = joinRequestsData.map(invite => { const server = Array.isArray(invite.servers) ? invite.servers[0] : invite.servers; const profile = Array.isArray(invite.profiles) ? invite.profiles[0] : invite.profiles; return server && profile ? { ...invite, servers: server, profiles: profile } : null; }).filter((i): i is ServerInvite => i !== null); setJoinRequests(validJoinRequests); } } else { setJoinRequests([]); } setLoading(false);
    }, [user]);

    useEffect(() => { fetchData(); const sub = supabase.channel(`friends-interface-pending`).on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, fetchData).on('postgres_changes', { event: '*', schema: 'public', table: 'server_invites' }, fetchData).subscribe(); return () => { supabase.removeChannel(sub); } }, [fetchData]);

    const handleAcceptFriend = async (friendshipId: string) => { await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId); };
    const handleDeclineFriend = async (friendshipId: string) => { await supabase.from('friendships').delete().eq('id', friendshipId); };
    const handleAcceptInvite = async (inviteId: string) => { const { error } = await supabase.rpc('accept_server_invite', { p_invite_id: inviteId }); if (!error) onAction(); };
    const handleDeclineInvite = async (inviteId: string) => { await supabase.from('server_invites').delete().eq('id', inviteId); };

    if (loading) return <div className="flex-grow flex items-center justify-center"><Spinner /></div>;
    if (pendingRequests.length === 0 && serverInvites.length === 0 && joinRequests.length === 0) return <div className="flex-grow flex items-center justify-center p-12 text-center text-cyan-300/70 text-lg font-light">{tr.noPendingRequests}</div>;

    return (
        <div className="p-8 overflow-y-auto space-y-8">
            {joinRequests.length > 0 && <JoinRequests requests={joinRequests} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />}
            {serverInvites.length > 0 && <ServerInvites invites={serverInvites} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />}
            {pendingRequests.length > 0 && <FriendRequests requests={pendingRequests} onAccept={handleAcceptFriend} onDecline={handleDeclineFriend} />}
        </div>
    );
};

const JoinRequests: React.FC<{ requests: ServerInvite[], onAccept: (id: string) => void, onDecline: (id: string) => void }> = ({ requests, onAccept, onDecline }) => (
    <div>
        <div className="flex items-center mb-6 border-b border-cyan-500/20 pb-4"><h3 className="text-sm font-semibold tracking-wide text-cyan-300">{tr.joinRequests}</h3><div className="ml-3 px-3 py-1 bg-yellow-500/20 text-yellow-200 text-xs font-semibold rounded-full border border-yellow-500/30">{requests.length}</div></div>
        <div className="space-y-3">{requests.map(req => (<div key={req.id} className={listItemClasses}><div className="flex items-center"><img src={req.profiles.avatar_url || ''} alt={req.profiles.username} className="w-12 h-12 rounded-full mr-4 border-2 border-blue-800/50 group-hover:border-cyan-400/50"/><div className="truncate"><p className="text-sm text-slate-300 truncate">{tr.wantsToJoin.replace('{username}', req.profiles.username).replace('{serverName}', req.servers.name)}</p></div></div><div className="flex space-x-2"><button onClick={() => onAccept(req.id)} className="p-2.5 bg-green-500/20 hover:bg-green-500/30 rounded-full transition-all duration-200"><svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button><button onClick={() => onDecline(req.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-all duration-200"><svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div>))}</div>
    </div>
);

const ServerInvites = ({ invites, onAccept, onDecline }: { invites: ServerInvite[], onAccept: (id: string) => void, onDecline: (id: string) => void }) => (
    <div>
        <div className="flex items-center mb-6 border-b border-cyan-500/20 pb-4"><h3 className="text-sm font-semibold tracking-wide text-cyan-300">{tr.serverInvites}</h3><div className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-200 text-xs font-semibold rounded-full border border-blue-500/30">{invites.length}</div></div>
        <div className="space-y-3">{invites.map(invite => (<div key={invite.id} className={listItemClasses}><div className="flex items-center"><div className="flex items-center justify-center w-12 h-12 rounded-2xl mr-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 font-bold text-lg text-white border border-blue-500/30 group-hover:border-cyan-400/40">{invite.servers.name.charAt(0)}</div><div><p className="font-semibold text-white group-hover:text-cyan-200 transition-colors">{invite.servers.name}</p><p className="text-sm text-slate-400">{invite.profiles.username} {tr.from}</p></div></div><div className="flex space-x-2"><button onClick={() => onAccept(invite.id)} className="p-2.5 bg-green-500/20 hover:bg-green-500/30 rounded-full transition-all duration-200"><svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button><button onClick={() => onDecline(invite.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-all duration-200"><svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div>))}</div>
    </div>
);

const FriendRequests = ({ requests, onAccept, onDecline }: { requests: Friend[], onAccept: (id: string) => void, onDecline: (id: string) => void }) => (
    <div>
        <div className="flex items-center mb-6 border-b border-cyan-500/20 pb-4"><h3 className="text-sm font-semibold tracking-wide text-cyan-300">{tr.pending}</h3><div className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-200 text-xs font-semibold rounded-full border border-blue-500/30">{requests.length}</div></div>
        <div className="space-y-3">{requests.map(req => (<div key={req.id} className={listItemClasses}><div className="flex items-center"><img src={req.avatar_url || `https://robohash.org/${req.id}.png?set=set1&size=40x40`} alt={req.username} className="w-12 h-12 rounded-full mr-4 border-2 border-blue-800/50 group-hover:border-cyan-400/50"/><div><p className="font-semibold text-white group-hover:text-cyan-200">{req.username}</p><p className="text-sm text-slate-400">{tr.incomingRequest}</p></div></div><div className="flex space-x-2"><button onClick={() => onAccept(req.friendship_id)} className="p-2.5 bg-green-500/20 hover:bg-green-500/30 rounded-full transition-all duration-200"><svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button><button onClick={() => onDecline(req.friendship_id)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-all duration-200"><svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div>))}</div>
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
            <div className="max-w-2xl"><h3 className="text-2xl font-light text-cyan-200 mb-3">{tr.addFriend}</h3><p className="text-blue-300/80 mb-8">{tr.addFriendDescription}</p>
                <form onSubmit={handleSendRequest} className="border-t border-cyan-500/20 pt-8">
                     <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={tr.enterUsername} className="relative w-full text-white bg-blue-950/50 p-4 pr-44 rounded-xl border border-blue-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 text-base backdrop-blur-sm" />
                        <button type="submit" disabled={loading || !username.trim()} className="absolute right-2 top-2 bottom-2 px-6 text-sm font-semibold text-white rounded-lg disabled:bg-slate-700 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105">{loading ? `${tr.sending}...` : tr.sendRequest}</button>
                    </div>
                </form>
                {message && <p className="mt-8 text-sm text-center text-blue-200 bg-blue-950/40 backdrop-blur-sm px-6 py-4 rounded-xl border border-blue-500/20">{message}</p>}
            </div>
        </div>
    );
};

export default FriendsInterfaceOceanicDepths;
