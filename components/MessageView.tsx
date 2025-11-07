import React, { useEffect, useRef, useState } from 'react';
import type { Channel } from '../types';
import { format, isSameDay, differenceInMinutes } from 'date-fns';
import MessageInput from './MessageInput';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../hooks/useMessages';
import Spinner from './Spinner';
import { tr } from '../constants/tr';
import { supabase } from '../services/supabaseClient';
import MessageReactions from './MessageReactions';
import EmojiPicker from './EmojiPicker';
import ActiveGameBanner from './ActiveGameBanner'; // YENİ

const AddReactionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a.75.75 0 01.088-1.058 5 5 0 00-6.248 0 .75.75 0 01-1.146.97A6.5 6.5 0 0110 12.5a6.5 6.5 0 015.606 3.005.75.75 0 01-1.058-.088z" clipRule="evenodd" />
    </svg>
);

interface MessageViewProps {
  channel: Channel;
  onOpenGameLauncher: () => void;
  // YENİ PROPLAR
  activeGameSession?: any;
  onJoinGame: (game: string, sessionId: string) => void;
}

const MessageView: React.FC<MessageViewProps> = ({ channel, onOpenGameLauncher, activeGameSession, onJoinGame }) => {
  const { user, profile } = useAuth();
  const { messages, loading, error, sendMessage, optimisticUpdateReaction } = useMessages(channel);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pickerMessageId, setPickerMessageId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length-1]?.content]);

  const handleReact = async (messageId: string, emoji: string) => {
    if (!user || !profile) return;
    
    optimisticUpdateReaction(messageId, emoji);

    const { data: existing } = await supabase.from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .single();

    if (existing) {
      await supabase.from('message_reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user.id, emoji });
    }
  };


  const renderContent = () => {
    if (loading) {
      return <div className="flex-grow flex items-center justify-center"><Spinner /></div>;
    }
    
    if (error) {
      return <div className="flex-grow flex items-center justify-center text-rose-400 font-medium">{tr.errorLoadingMessages}</div>;
    }
    
    if (messages.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-start justify-end p-8">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                     <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path></svg>
                </div>
                <h3 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{tr.welcomeToChannel.replace('{channelName}', channel.name)}</h3>
                <p className="text-slate-300 text-lg">{tr.startOfChannel.replace('{channelName}', channel.name)}</p>
            </div>
        );
    }

    return (
        <div className="flex-grow p-4 overflow-y-auto">
            {messages.map((message, index) => {
                const prevMessage = messages[index - 1];
                const showAvatarAndName = 
                    !prevMessage || 
                    prevMessage.user_id !== message.user_id ||
                    differenceInMinutes(new Date(message.created_at), new Date(prevMessage.created_at)) > 5;

                const showDaySeparator = 
                    !prevMessage || 
                    !isSameDay(new Date(message.created_at), new Date(prevMessage.created_at));
                
                const messageOpacity = message.status === 'sending' ? 'opacity-50' : 'opacity-100';

                return (
                    <React.Fragment key={message.id}>
                        {showDaySeparator && (
                            <div className="relative my-6">
                                <hr className="border-slate-500"/>
                                <span className="absolute px-4 py-1 text-xs font-semibold text-slate-300 bg-slate-600 rounded-full shadow-sm" style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>{format(new Date(message.created_at), 'd MMMM yyyy')}</span>
                            </div>
                        )}
                        <div className={`group relative py-2 px-3 hover:bg-slate-600/40 rounded-lg transition-all duration-200 ${messageOpacity}`}>
                            {showAvatarAndName ? (
                                <div className="flex items-start">
                                    <div className="relative">
                                        <img
                                            src={message.profiles?.avatar_url || `https://robohash.org/${message.user_id}.png?set=set1&size=40x40`}
                                            alt={message.profiles?.username}
                                            className="w-11 h-11 ml-3 mr-4 rounded-full bg-slate-800 ring-2 ring-slate-600 shadow-md"
                                        />
                                        <div className="absolute bottom-0 right-3 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-700"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <p className="font-bold text-white text-base">{message.profiles?.username || 'Bilinmeyen Kullanıcı'}</p>
                                            <p className="text-xs text-slate-400 font-medium">{format(new Date(message.created_at), 'p')}</p>
                                        </div>
                                        <p className="text-slate-100 whitespace-pre-wrap leading-relaxed mt-1">{message.content}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center ml-16 pl-3">
                                    <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                </div>
                            )}

                             {message.status !== 'sending' && (
                                <div className="absolute top-1 right-4 -mt-2 flex items-center bg-slate-700/95 backdrop-blur-sm border border-slate-500 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <button 
                                        onClick={() => setPickerMessageId(pickerMessageId === message.id ? null : message.id)}
                                        className="p-2 text-slate-300 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                                    >
                                        <AddReactionIcon />
                                    </button>
                                </div>
                             )}

                             {pickerMessageId === message.id && (
                                <div className="absolute top-0 right-14 -mt-1 z-20">
                                    <EmojiPicker 
                                        onEmojiSelect={(emoji) => {
                                            handleReact(message.id, emoji);
                                            setPickerMessageId(null);
                                        }}
                                        onClose={() => setPickerMessageId(null)}
                                    />
                                </div>
                            )}
                             {message.status === 'failed' && (
                                <span className="ml-16 pl-3 text-xs text-rose-400 font-medium">Gönderilemedi - Tekrar dene</span>
                            )}
                        </div>
                        {message.reactions && message.reactions.length > 0 && <MessageReactions messageId={message.id} reactions={message.reactions} onReact={handleReact} />}
                    </React.Fragment>
                )
            })}
            <div ref={messagesEndRef} />
        </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow min-h-0 bg-gradient-to-b from-slate-700 to-slate-800">
      <div className="flex-shrink-0">
        <div className="flex items-center p-4 font-bold border-b border-slate-600 shadow-xl bg-slate-800/50 backdrop-blur-sm">
            <div className="p-2 bg-indigo-500/20 rounded-lg mr-3">
                <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path></svg>
            </div>
            <span className="truncate text-lg text-white">{channel.name}</span>
        </div>
        {/* YENİ: Aktif oyun başlığı */}
        {activeGameSession && <ActiveGameBanner session={activeGameSession} onJoin={onJoinGame} />}
      </div>
      {renderContent()}
      <MessageInput 
        channelName={channel.name} 
        sendMessage={sendMessage}
        onOpenGameLauncher={onOpenGameLauncher}
        />
    </div>
  );
};

export default MessageView;
