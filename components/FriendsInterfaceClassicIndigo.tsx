// components/FriendsInterfaceClassicIndigo.tsx
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

const FriendsInterfaceClassicIndigo: React.FC<FriendsInterfaceProps> = ({ onServerAction, agora, onStartDm }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'add'>('all');
    
    const renderMainContent = () => {
        switch (activeTab) {
            case 'all': return <AllFriendsTab onStartDm={onStartDm} />;
            case 'pending': return <PendingRequestsTab onAction={onServerAction} />;
            case 'add': return <AddFriendTab />;
            default: return null;
        }
    }
    
    const baseTabClasses = "px-4 py-2 font-medium transition-colors duration-200 rounded-md";
    const activeClasses = "bg-indigo-600 text-white";
    const inactiveClasses = "text-slate-400 hover:text-white hover:bg-slate-700/50";
    
    return (
        <div className="flex flex-grow min-w-0">
            <div className="flex flex-col flex-grow">
                <div className="flex items-center p-4 bg-slate-800 border-b border-slate-700/50 flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 mr-2 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                            <span className="text-white font-semibold">{tr.friends}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-600" />
                        <button onClick={() => setActiveTab('all')} className={`${baseTabClasses} ${activeTab === 'all' ? activeClasses : inactiveClasses}`}>{tr.allFriends}</button>
                        <button onClick={() => setActiveTab('pending')} className={`relative ${baseTabClasses} ${activeTab === 'pending' ? activeClasses : inactiveClasses}`}>{tr.pending}</button>
                        <button onClick={() => setActiveTab('add')} className="px-4 py-2 font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">{tr.addFriend}</button>
                    </div>
                </div>
                <div className="flex-grow flex flex-col min-w-0 bg-slate-700">
                    {renderMainContent()}
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

const listItemClasses = "flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group";

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
    if (friends.length === 0) return <div className="p-10 text-center text-slate-400">{tr.noFriendsYet}</div>;

    return (
        <div className="p-6 overflow-y-auto">
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">{tr.allFriends} — {friends.length}</h3>
            <div className="space-y-1">
                {friends.map(friend => (
                    <div key={friend.id} className={listItemClasses}>
                        <div className="flex items-center"><div className="relative mr-3"><img src={friend.avatar_url || `https://robohash.org/${friend.id}.png?set=set1&size=40x40`} alt={friend.username} className="w-10 h-10 rounded-full"/><StatusIndicator status={friend.status} className="absolute -bottom-0.5 -right-0.5"/></div><span className="font-semibold text-white">{friend.username}</span></div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onStartDm(friend)} className="p-2 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white" aria-label={`Message ${friend.username}`}><MessageIcon /></button>
                            <button onClick={() => handleRemoveFriend(friend.friendship_id)} className="p-2 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white" aria-label={`Remove ${friend.username}`}><TrashIcon /></button>
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
    if (pendingRequests.length === 0 && serverInvites.length === 0 && joinRequests.length === 0) return <div className="p-10 text-center text-slate-400">{tr.noPendingRequests}</div>;

    return (
        <div className="p-6 overflow-y-auto space-y-6">
            {joinRequests.length > 0 && <JoinRequests requests={joinRequests} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />}
            {serverInvites.length > 0 && <ServerInvites invites={serverInvites} onAccept={handleAcceptInvite} onDecline={handleDeclineInvite} />}
            {pendingRequests.length > 0 && <FriendRequests requests={pendingRequests} onAccept={handleAcceptFriend} onDecline={handleDeclineFriend} />}
        </div>
    );
};

const JoinRequests: React.FC<{ requests: ServerInvite[], onAccept: (id: string) => void, onDecline: (id: string) => void }> = ({ requests, onAccept, onDecline }) => (
    <div>
        <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">{tr.joinRequests} — {requests.length}</h3>
        <div className="space-y-1">{requests.map(req => (<div key={req.id} className={listItemClasses}><div className="flex items-center"><img src={req.profiles.avatar_url || ''} alt={req.profiles.username} className="w-10 h-10 rounded-full mr-3"/><div className="truncate"><p className="text-sm text-slate-300 truncate">{tr.wantsToJoin.replace('{username}', req.profiles.username).replace('{serverName}', req.servers.name)}</p></div></div><div className="flex space-x-2"><button onClick={() => onAccept(req.id)} className="p-2 bg-slate-600 rounded-full hover:bg-green-600 transition-colors"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button><button onClick={() => onDecline(req.id)} className="p-2 bg-slate-600 rounded-full hover:bg-red-600 transition-colors"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div>))}</div>
    </div>
);

const ServerInvites = ({ invites, onAccept, onDecline }: { invites: ServerInvite[], onAccept: (id: string) => void, onDecline: (id: string) => void }) => (
    <div>
        <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">{tr.serverInvites} — {invites.length}</h3>
        <div className="space-y-1">{invites.map(invite => (<div key={invite.id} className={listItemClasses}><div className="flex items-center"><div className="flex items-center justify-center w-10 h-10 rounded-lg mr-3 bg-slate-600 font-bold text-lg text-white">{invite.servers.name.charAt(0)}</div><div><p className="font-semibold text-white">{invite.servers.name}</p><p className="text-sm text-slate-400">{invite.profiles.username} {tr.from}</p></div></div><div className="flex space-x-2"><button onClick={() => onAccept(invite.id)} className="p-2 bg-slate-600 rounded-full hover:bg-green-600 transition-colors"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button><button onClick={() => onDecline(invite.id)} className="p-2 bg-slate-600 rounded-full hover:bg-red-600 transition-colors"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div>))}</div>
    </div>
);

const FriendRequests = ({ requests, onAccept, onDecline }: { requests: Friend[], onAccept: (id: string) => void, onDecline: (id: string) => void }) => (
    <div>
        <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">{tr.pending} — {requests.length}</h3>
        <div className="space-y-1">{requests.map(req => (<div key={req.id} className={listItemClasses}><div className="flex items-center"><img src={req.avatar_url || `https://robohash.org/${req.id}.png?set=set1&size=40x40`} alt={req.username} className="w-10 h-10 rounded-full mr-3"/><div><p className="font-semibold text-white">{req.username}</p><p className="text-sm text-slate-400">{tr.incomingRequest}</p></div></div><div className="flex space-x-2"><button onClick={() => onAccept(req.friendship_id)} className="p-2 bg-slate-600 rounded-full hover:bg-green-600 transition-colors"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button><button onClick={() => onDecline(req.friendship_id)} className="p-2 bg-slate-600 rounded-full hover:bg-red-600 transition-colors"><svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div>))}</div>
    </div>
);

const AddFriendTab = () => {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { theme } = useTheme();

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault(); if (!username.trim()) return; setLoading(true); setMessage('');
        const { data, error } = await supabase.rpc('send_friend_request', { target_username: username.trim() });
        if (error) setMessage(`Hata: ${error.message}`);
        else if (data.error) setMessage(data.error);
        else { setMessage(data.success); setUsername(''); }
        setLoading(false);
    };

    return (
        <div className="p-6">
            <h3 className="text-xl font-bold uppercase text-white mb-2">{tr.addFriend}</h3>
            <p className="text-slate-400 mb-4 text-sm">{tr.addFriendDescription}</p>
            <form onSubmit={handleSendRequest} className="border-t border-slate-600 pt-4">
                 <div className="relative">
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={tr.enterUsername} className={`w-full text-white bg-slate-800 p-3 pr-40 rounded-md border border-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${theme.colors.focusRing}`} />
                    <button type="submit" disabled={loading || !username.trim()} className={`absolute right-1 top-1 bottom-1 px-4 text-sm font-semibold text-white rounded disabled:bg-slate-600 bg-indigo-600 hover:bg-indigo-700 transition-colors`}>{loading ? `${tr.sending}...` : tr.sendRequest}</button>
                </div>
            </form>
            {message && <p className="mt-4 text-sm text-center text-slate-300 bg-slate-800/50 p-3 rounded-md">{message}</p>}
        </div>
    );
};

export default FriendsInterfaceClassicIndigo;
