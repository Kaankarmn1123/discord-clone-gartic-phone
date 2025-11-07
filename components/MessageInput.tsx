// components/MessageInput.tsx
import React, { useState } from 'react';
import { tr } from '../constants/tr';
import { useTheme } from '../contexts/ThemeContext';

interface MessageInputProps {
  channelName: string;
  sendMessage: (content: string) => Promise<void>;
  onOpenGameLauncher: () => void;
}

const SendIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);

const GameIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const MessageInput: React.FC<MessageInputProps> = ({ channelName, sendMessage, onOpenGameLauncher }) => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { theme } = useTheme();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (trimmedContent === '' || isSending) return;

    setIsSending(true);
    try {
        await sendMessage(trimmedContent);
        setContent('');
    } catch (error) {
        console.error("Failed to send message from input", error);
        // Optionally show an error to the user
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="px-6 pb-6 pt-4 mt-auto bg-gradient-to-t from-slate-800/50 to-transparent">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 p-3 bg-slate-600/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-500/50 transition-all duration-200 focus-within:border-indigo-400/50 focus-within:shadow-xl focus-within:shadow-indigo-500/10">
          <button 
            type="button" 
            className="p-2.5 text-slate-300 bg-slate-700/50 rounded-lg hover:bg-indigo-500/20 hover:text-indigo-400 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg>
          </button>
          <button 
            type="button" 
            onClick={onOpenGameLauncher}
            className="p-2.5 text-slate-300 bg-slate-700/50 rounded-lg hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Oyun Başlat"
            title="Mini Oyun Başlat"
          >
            <GameIcon />
          </button>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={tr.messagePlaceholder.replace('{channelName}', channelName)}
            disabled={isSending}
            className="flex-grow px-3 py-2 text-white bg-transparent focus:outline-none placeholder-slate-400 text-base"
            autoComplete="off"
          />
          <button
              type="submit"
              disabled={isSending || content.trim() === ''}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                content.trim() 
                  ? `${theme.colors.text} bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg hover:scale-105 active:scale-95` 
                  : 'text-slate-500 bg-slate-700/50'
              } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100`}
              aria-label="Mesaj Gönder"
            >
              <SendIcon />
            </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;