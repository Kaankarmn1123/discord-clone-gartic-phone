// components/MessageReactions.tsx
import React from 'react';
import type { Reaction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onReact: (messageId: string, emoji: string) => void;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId, reactions, onReact }) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1.5 ml-14 pl-4">
      {Object.entries(groupedReactions).map(([emoji, reactionsList]) => {
        // FIX: Explicitly cast reactionsList to Reaction[] as Object.entries can return `unknown` for values.
        const reactionArray = reactionsList as Reaction[];
        const userHasReacted = reactionArray.some(r => r.user_id === user?.id);
        const reactionUsernames = reactionArray
            .map(r => {
                if (!r.profiles) return '...';
                return r.profiles.id === user?.id ? 'Siz' : r.profiles.username;
            })
            .join(', ');

        return (
          <button
            key={emoji}
            onClick={() => onReact(messageId, emoji)}
            title={reactionUsernames}
            className={`flex items-center px-2 py-0.5 rounded-full text-sm transition-colors border ${
              userHasReacted
                ? `bg-${theme.colors.accent}-500/20 border-${theme.colors.accent}-500/50 text-white`
                : 'bg-slate-600/50 border-slate-600 hover:bg-slate-600'
            }`}
          >
            <span className="text-base mr-1">{emoji}</span>
            <span className="font-medium">{reactionArray.length}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactions;
