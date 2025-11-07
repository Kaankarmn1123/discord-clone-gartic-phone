// src/components/EmojiPicker.tsx
import React, { useEffect, useRef } from 'react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={pickerRef} className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 flex flex-wrap w-48 z-20">
      {EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => onEmojiSelect(emoji)}
          className="text-2xl p-1 rounded-md hover:bg-slate-700 transition-colors"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPicker;