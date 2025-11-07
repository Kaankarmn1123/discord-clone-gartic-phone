// components/games/GameSelectionModal.tsx
import React from 'react';

const games = [
  {
    id: 'gartic-phone',
    title: 'Zincirleme Sanat',
    description: 'Çiz, tahmin et, gül! Cümleler çizimlere, çizimler cümlelere dönüşsün.',
    category: 'Çok Oyunculu',
    logo: '🎨',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'snake',
    title: 'Neon Yılan',
    description: 'Klasik yılan oyununu neon arenada oyna, en yüksek skoru yap.',
    category: 'Atari Oyunu',
    logo: '🐍',
    gradient: 'from-emerald-400 to-cyan-500',
  },
  {
    id: 'blackjack',
    title: 'Neon Blackjack',
    description: 'Kartlarını 21\'e tamamla ve krupiyeyi ışıklar içinde alt et.',
    category: 'Kart Oyunu',
    logo: '🃏',
    gradient: 'from-rose-400 to-fuchsia-500',
  },
  {
    id: 'card-match',
    title: 'Siber Hafıza',
    description: 'Veri küplerini eşleştirerek dijital dünyada zihnini keskinleştir.',
    category: 'Hafıza Oyunu',
    logo: '🤖',
    gradient: 'from-violet-400 to-indigo-500',
  },
];

interface GameSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameSelect: (gameId: string, channelId: string) => void;
  channelId: string | null;
}

const GameSelectionModal: React.FC<GameSelectionModalProps> = ({
  isOpen,
  onClose,
  onGameSelect,
  channelId,
}) => {

  if (!isOpen) return null;

  const handleSelect = (gameId: string) => {
    if (channelId) {
      onGameSelect(gameId, channelId);
    } else {
        // This case is for single-player games outside a channel context
        onGameSelect(gameId, "dm");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-3xl bg-slate-900/70 backdrop-blur-2xl border border-cyan-500/10 shadow-[0_0_50px_rgba(0,255,255,0.1)] overflow-hidden animate-fadeIn"
      >
        <div className="relative text-center py-10 border-b border-cyan-500/10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 tracking-tight">
            🎮 Oyun Merkezi
          </h2>
          <p className="text-slate-400 text-sm mt-3 tracking-wide">
            Seç, oyna, rekabet et!
          </p>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {games.map((game, i) => (
            <div
              key={game.id}
              className="relative group cursor-pointer transition-transform hover:scale-[1.02]"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 blur-2xl bg-gradient-to-r ${game.gradient} transition-all duration-500`}
              ></div>
              <div className="relative z-10 rounded-2xl p-6 flex flex-col justify-between h-full bg-slate-800/60 border border-white/10 hover:border-cyan-400/20 backdrop-blur-md transition-all">
                <div
                  className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br ${game.gradient} text-5xl mb-6 shadow-[0_0_25px_rgba(255,255,255,0.1)]`}
                >
                  {game.logo}
                </div>

                <div className="text-center flex-grow">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {game.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">
                    {game.description}
                  </p>
                  <span
                    className={`text-[11px] px-3 py-1 rounded-full font-semibold bg-gradient-to-r ${game.gradient} text-white`}
                  >
                    {game.category}
                  </span>
                </div>

                <button
                  onClick={() => handleSelect(game.id)}
                  className={`mt-6 relative overflow-hidden rounded-xl w-full py-3 font-semibold bg-gradient-to-r ${game.gradient} text-white shadow-lg transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.03] active:scale-[0.97]`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Oyna
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </span>
                  <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center px-8 py-5 border-t border-cyan-400/10 bg-slate-900/60 backdrop-blur-md">
          <p className="text-slate-500 text-sm">
            Toplam <span className="text-cyan-400 font-bold">{games.length}</span> oyun
          </p>
          <button
            onClick={onClose}
            className="text-slate-300 text-sm px-5 py-2 rounded-lg border border-white/10 hover:bg-slate-800 hover:text-white transition-all hover:scale-105 active:scale-95"
          >
            ✕ Kapat
          </button>
        </div>
      </div>

      {/* FIX: Removed invalid `jsx` prop from style tag. */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default GameSelectionModal;
