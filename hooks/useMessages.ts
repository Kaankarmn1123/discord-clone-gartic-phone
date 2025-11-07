// hooks/useMessages.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Channel, Message, Profile, Reaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

export type UIMessage = Message & { status?: 'sending' | 'sent' | 'failed' };

export function useMessages(channel: Channel | null) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !profile || !channel) {
      throw new Error("User, profile, or channel not available.");
    }

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: UIMessage = {
      id: tempId,
      content: content,
      created_at: new Date().toISOString(),
      user_id: user.id,
      profiles: profile,
      reactions: [],
      status: 'sending',
      channel_id: channel.id,
    };

    setMessages(current => [...current, optimisticMessage]);

    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert({ channel_id: channel.id, user_id: user.id, content: content })
      .select()
      .single();

    if (insertError) {
      console.error('Error sending message:', insertError);
      setMessages(current => current.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    } else if (insertedMessage) {
        // Replace optimistic message with the real one from DB
        const finalMessage: UIMessage = {
            ...insertedMessage,
            profiles: profile, // We know the profile is ours
            reactions: [],
            status: 'sent',
        };
        setMessages(current => current.map(m => m.id === tempId ? finalMessage : m));
    }
  }, [user, profile, channel]);

  const optimisticUpdateReaction = useCallback((messageId: string, emoji: string) => {
      if (!user || !profile) return;
      
      setMessages(current => current.map(msg => {
          if (msg.id === messageId) {
              const existingReactionIndex = msg.reactions.findIndex(r => r.emoji === emoji && r.user_id === user.id);
              let newReactions = [...msg.reactions];
              if (existingReactionIndex !== -1) {
                  newReactions.splice(existingReactionIndex, 1);
              } else {
                  const tempReaction: Reaction = {
                      id: `optimistic-${Date.now()}`,
                      message_id: messageId,
                      user_id: user.id,
                      emoji,
                      profiles: { id: user.id, username: profile.username },
                      created_at: new Date().toISOString()
                  };
                  newReactions.push(tempReaction);
              }
              return { ...msg, reactions: newReactions };
          }
          return msg;
      }));
  }, [user, profile]);


  useEffect(() => {
    if (!channel || channel.type !== 'text') {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      
      // 1. Fetch raw messages first
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`*`)
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setError(messagesError);
        setLoading(false);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // 2. Collect all user and message IDs to fetch related data
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const messageIds = messagesData.map(m => m.id);

      // 3. Fetch all profiles and reactions in parallel
      const [
        { data: profilesData, error: profilesError },
        { data: reactionsData, error: reactionsError }
      ] = await Promise.all([
        supabase.from('profiles').select('*').in('id', userIds),
        supabase.from('message_reactions').select(`*, profiles(id, username)`).in('message_id', messageIds)
      ]);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError(profilesError);
        setLoading(false);
        return; // Profiles are essential, stop if they fail
      }
      if (reactionsError) {
        // Reactions are not critical, we can log a warning and continue
        console.warn('Error fetching reactions:', reactionsError);
      }

      // 4. Create lookup maps for efficient data combination
      const profilesById = new Map<string, Profile>();
      if (profilesData) {
        for (const p of profilesData) {
          profilesById.set(p.id, p as Profile);
        }
      }
      
      const reactionsByMessageId = new Map<string, Reaction[]>();
      if (reactionsData) {
        for (const reaction of reactionsData) {
          const existing = reactionsByMessageId.get(reaction.message_id) || [];
          existing.push(reaction as Reaction);
          reactionsByMessageId.set(reaction.message_id, existing);
        }
      }
      
      // 5. Combine all data into the final message list
      const processedMessages: UIMessage[] = messagesData.map(message => ({
        ...message,
        profiles: profilesById.get(message.user_id) || null,
        reactions: reactionsByMessageId.get(message.id) || [],
        status: 'sent'
      }));
      
      setMessages(processedMessages);
      setLoading(false);
    };

    fetchInitialData();
  }, [channel]);

  useEffect(() => {
    if (!channel || channel.type !== 'text' || !user) return;
    
    const handleNewMessage = (payload: any) => {
      const newMessage = payload.new as Message;

      // Ignore messages from the current user because they are handled by sendMessage
      if (newMessage.user_id === user.id) {
          return;
      }

      const processMessage = async () => {
          let authorProfile: Profile | null = null;
          // Fetch the profile for the new message's author
          const { data } = await supabase.from('profiles').select('*').eq('id', newMessage.user_id).single();
          authorProfile = data;

          setMessages(current => {
              // Add new message if it doesn't already exist
              if (!current.some(m => m.id === newMessage.id)) {
                  return [...current, { ...newMessage, profiles: authorProfile, reactions: [], status: 'sent' }];
              }
              return current;
          });
      };
      processMessage();
    };

    const handleNewReaction = (payload: any) => {
        const newReaction = payload.new as Reaction;
        
        supabase.from('profiles').select('id, username').eq('id', newReaction.user_id).single().then(({ data: profileData }) => {
            if(profileData) {
                newReaction.profiles = profileData;
            }
            setMessages(current => current.map(msg => {
                if (msg.id === newReaction.message_id) {
                    const otherReactions = msg.reactions.filter(r => !(r.user_id === newReaction.user_id && r.emoji === newReaction.emoji));
                    return { ...msg, reactions: [...otherReactions, newReaction] };
                }
                return msg;
            }));
        });
    };

    const handleDeleteReaction = (payload: any) => {
        const oldReaction = payload.old as Reaction;
        setMessages(current => current.map(msg => {
            if (msg.id === oldReaction.message_id) {
                const newReactions = msg.reactions.filter(r => !(r.user_id === oldReaction.user_id && r.emoji === oldReaction.emoji));
                return { ...msg, reactions: newReactions };
            }
            return msg;
        }));
    };
    
    const messagesSubscription = supabase
      .channel(`messages-in-channel-${channel.id}`)
      .on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channel.id}` }, handleNewMessage)
      .subscribe();

    const reactionsSubscription = supabase.channel(`reactions-for-channel-${channel.id}`)
      .on<Reaction>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, handleNewReaction)
      .on<Reaction>('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, handleDeleteReaction)
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(reactionsSubscription);
    };
  }, [channel, user, profile]);

  return { messages, loading, error, sendMessage, optimisticUpdateReaction };
}
