// components/InviteFriendsModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { tr } from '../constants/tr';
import Spinner from './Spinner';
import type { Friend, Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverName: string;
  serverId: string;
}

type InvitableFriend = Friend & { inviteStatus: 'none' | 'pending' | 'invited' };

const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ isOpen, onClose, serverName, serverId }) => {
  const { user } = useAuth();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md p-6 rounded-2xl shadow-2xl bg-slate-900/80 border border-slate-700 backdrop-blur-xl text-white flex flex-col h-[500px] relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-4 text-center bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
          {tr.inviteFriendsToServer.replace('{serverName}', serverName)}
        </h2>

        <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar">
          {loading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
          {error && <p className="text-red-400 text-center">{error}</p>}

          {!loading && !error && friends.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <p className="font-semibold text-lg">{tr.noFriendsToInvite}</p>
              <p className="text-sm text-gray-500 mt-1">{tr.noFriendsToInviteDescription}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-2 animate-fadeIn">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700 hover:bg-slate-800 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <img
                      src={friend.avatar_url || `https://i.pravatar.cc/40?u=${friend.id}`}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full mr-3 border border-slate-600"
                    />
                    <span className="font-medium">{friend.username}</span>
                  </div>
                  <button
                    onClick={() => handleInvite(friend.id)}
                    disabled={friend.inviteStatus !== 'none'}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      friend.inviteStatus === 'none'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {friend.inviteStatus === 'none' ? tr.invite : tr.invited}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default InviteFriendsModal;
