// src/types.ts
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profiles: Pick<Profile, 'id' | 'username'> | null;
}

export interface Server {
  id: string;
  name: string;
  icon_url: string | null;
  owner_id: string;
  visibility: 'public' | 'private';
  requires_approval: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  server_id: string | null;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  channel_id: string;
  profiles: Profile | null;
  reactions: Reaction[];
}

// NEW: UIMessage tipi, uygulama genelinde kullanılmak üzere buraya taşındı.
export type UIMessage = Message & { status?: 'sending' | 'sent' | 'failed' };

export interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  action_user_id: string;
  created_at: string;
}

export interface Friend extends Profile {
  friendship_id: string;
  friendship_status: 'pending' | 'accepted' | 'blocked';
  action_user_id: string; // The user who initiated the request
}

export interface ServerInvite {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  servers: Server; // from relation
  profiles: Profile; // inviter profile
  type?: 'invite' | 'join_request';
}