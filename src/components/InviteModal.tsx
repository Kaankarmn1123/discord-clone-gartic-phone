// src/components/InviteModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { tr } from '../constants/tr';
import Spinner from './Spinner';
import type { Friend, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverName: string;
  serverId: string;
}

type InvitableFriend = Friend & { inviteStatus: 'none' | 'pending' | 'invited' };

const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ isOpen, onClose, serverName, serverId }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [friends, setFriends] = useState<InvitableFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvitableFriends = useCallback(async () => {
    if (!user || !serverId) return;
    setLoading(true);
    setError('');
    
    try {
        const { data: friendData, error: friendError } = await supabase
            .from('friendships')
            .select('*, user1:user1_id(id, username, avatar_url, status), user2:user2_id(id, username, avatar_url, status)')
            .eq('status', 'accepted')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

        if (friendError) throw friendError;

        const friendProfiles: Profile[] = friendData.map(f => f.user1_id === user.id ? f.user2 : f.user1).filter(Boolean);

        const { data: membersData, error: membersError } = await supabase
            .from('memberships')
            .select('user_id')
            .eq('server_id', serverId);
        
        if (membersError) throw membersError;
        const memberIds = new Set(membersData.map(m => m.user_id));

        const { data: invitesData, error: invitesError } = await supabase
            .from('server_invites')
            .select('invitee_id')
            .eq('server_id', serverId)
            .eq('status', 'pending');
        
        if (invitesError) throw invitesError;
        const invitedIds = new Set(invitesData.map(i => i.invitee_id));

        const invitable = friendProfiles
            .filter(p => !memberIds.has(p.id))
            .map(p => ({
                ...p,
                friendship_id: '',
                friendship_status: 'accepted',
                action_user_id: '',
                inviteStatus: invitedIds.has(p.id) ? 'pending' : 'none'
            } as InvitableFriend));
            
        setFriends(invitable);

    } catch (err: any) {
        setError(err.message || 'Davet edilebilir arkadaşlar yüklenemedi.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  }, [user, serverId]);

  useEffect(() => {
    if (isOpen) {
      fetchInvitableFriends();
    }
  }, [isOpen, fetchInvitableFriends]);

  const handleInvite = async (friendId: string) => {
    if (!user) return;

    setFriends(friends.map(f => f.id === friendId ? { ...f, inviteStatus: 'invited' } : f));

    const { error: inviteError } = await supabase
        .from('server_invites')
        .insert({
            server_id: serverId,
            inviter_id: user.id,
            invitee_id: friendId,
            status: 'pending'
        });

    if (inviteError) {
        console.error("Error sending invite:", inviteError);
        setFriends(friends.map(f => f.id === friendId ? { ...f, inviteStatus: 'none' } : f));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="w-full max-w-md p-6 bg-slate-800 rounded-lg shadow-xl text-white flex flex-col h-[500px]" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2">{tr.inviteFriendsToServer.replace('{serverName}', serverName)}</h2>
        <div className="flex-grow overflow-y-auto pr-2">
            {loading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
            {error && <p className="text-red-400">{error}</p>}
            {!loading && !error && friends.length === 0 && (
                <div className="text-center text-slate-400 py-8">
                    <p className="font-semibold">{tr.noFriendsToInvite}</p>
                    <p className="text-sm">{tr.noFriendsToInviteDescription}</p>
                </div>
            )}
            {!loading && !error && (
                <div className="space-y-2">
                    {friends.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-md">
                            <div className="flex items-center">
                                <img src={friend.avatar_url || `https://i.pravatar.cc/40?u=${friend.id}`} alt={friend.username} className="w-8 h-8 rounded-full mr-3"/>
                                <span>{friend.username}</span>
                            </div>
                            <button 
                                onClick={() => handleInvite(friend.id)}
                                disabled={friend.inviteStatus !== 'none'}
                                className={`px-4 py-1.5 text-sm font-medium text-white rounded-md disabled:bg-slate-500 disabled:cursor-not-allowed ${theme.colors.primaryButton} ${theme.colors.primaryButtonHover}`}
                            >
                               {friend.inviteStatus === 'none' ? tr.invite : tr.invited}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default InviteFriendsModal;
