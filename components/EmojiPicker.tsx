// components/EmojiPicker.tsx
import React, { useEffect, useRef } from 'react';

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😍','😘','😜','🤪','😎','🤩','🥳',
  '😢','😭','😡','🤬','😱','😨','😳','😇','🤔','🤨','🙃','😉','😴','🤤','🥺','😬',
  '👍','👎','👏','🙌','🙏','🔥','💯','🎉','❤️','💔','✨','🌈','⚡','🌸','💀','👀'
];

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
    <div
      ref={pickerRef}
      className="bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-3 flex flex-wrap gap-1 w-56 max-h-64 overflow-y-auto z-30 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent animate-fadeIn"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onEmojiSelect(emoji)}
          className="text-2xl p-2 rounded-xl hover:bg-white/10 hover:scale-110 active:scale-95 transition-all duration-150 flex items-center justify-center w-10 h-10"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPicker;
