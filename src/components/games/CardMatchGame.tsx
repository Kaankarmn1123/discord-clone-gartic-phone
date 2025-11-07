// components/games/CardMatchGame.tsx
import React, { useState, useEffect } from 'react';

// Game constants with SVG icons
const ICONS = [
  `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6a2 2 0 11-4 0 2 2 0 014 0zM12 18a2 2 0 11-4 0 2 2 0 014 0z" />`,
  `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />`,
  `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3.824A4.5 4.5 0 004.5 8.324 4.5 4.5 0 009 12.824 4.5 4.5 0 0013.5 8.324 4.5 4.5 0 009 3.824zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
  `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0117.657 18.657z" />`,
  `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />`,
  `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />`,
  `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />`,
  `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9 .5.5 0 00-1 0 9 9 0 01-9-9 .5.5 0 00-1 0 9 9 0 019-9 .5.5 0 001 0 9 9 0 019 9z" />`
];
const CARDS_DATA = [...ICONS, ...ICONS];

const shuffle = (array: string[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

interface CardMatchGameProps {
  onGameEnd: (score: number) => void;
  onClose: () => void;
}

const CardMatchGame: React.FC<CardMatchGameProps> = ({ onGameEnd, onClose }) => {
  const [cards, setCards] = useState<string[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [mismatchedIndices, setMismatchedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [canFlip, setCanFlip] = useState(true);

  useEffect(() => {
    setCards(shuffle(CARDS_DATA));
  }, []);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      setCanFlip(false);
      const [firstIndex, secondIndex] = flippedIndices;
      if (cards[firstIndex] === cards[secondIndex]) {
        setMatchedPairs(prev => [...prev, cards[firstIndex]]);
        setScore(prev => prev + 100 - moves);
        setFlippedIndices([]);
        setCanFlip(true);
      } else {
        setMismatchedIndices(flippedIndices);
        setTimeout(() => {
          setFlippedIndices([]);
          setMismatchedIndices([]);
          setCanFlip(true);
        }, 800);
      }
      setMoves(prev => prev + 1);
    }
  }, [flippedIndices, cards, moves]);

  useEffect(() => {
    if (matchedPairs.length === ICONS.length && cards.length > 0) {
      setGameOver(true);
      onGameEnd(score);
    }
  }, [matchedPairs, cards.length, onGameEnd, score]);

  const handleCardClick = (index: number) => {
    if (!canFlip || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairs.includes(cards[index])) return;
    setFlippedIndices(prev => [...prev, index]);
  };

  const restartGame = () => {
    setCards(shuffle(CARDS_DATA));
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMismatchedIndices([]);
    setMoves(0);
    setScore(0);
    setGameOver(false);
    setCanFlip(true);
  };

  return (
    <>
      <style>{`
        .casino-table {
          background: 
            radial-gradient(ellipse 120% 80% at 50% 0%, rgba(34, 197, 94, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 100% 60% at 50% 100%, rgba(16, 185, 129, 0.3) 0%, transparent 50%),
            linear-gradient(180deg, #064e3b 0%, #0f4c3a 50%, #064e3b 100%);
        }
        .table-edge {
          box-shadow: 
            inset 0 4px 8px rgba(0, 0, 0, 0.3),
            inset 0 -4px 8px rgba(0, 0, 0, 0.3),
            0 0 30px rgba(251, 191, 36, 0.2);
        }
        .felt-texture {
          background-image: 
            repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px);
        }
        .game-card-perspective { perspective: 1000px; }
        .game-card-inner { 
          transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.3s;
          transform-style: preserve-3d;
        }
        .game-card.flipped .game-card-inner { transform: rotateY(180deg); }
        .game-card-front, .game-card-back { backface-visibility: hidden; }
        .game-card-back { transform: rotateY(0deg); }
        .game-card-front { transform: rotateY(180deg); }
        .game-card.mismatch .game-card-inner { 
          animation: shake 0.5s;
          box-shadow: 0 0 20px 8px rgba(239, 68, 68, 0.6);
        }
        .game-card.matched .game-card-inner { 
          animation: matchPulse 0.6s;
          box-shadow: 0 0 25px 10px rgba(251, 191, 36, 0.7);
        }
        @keyframes shake {
          0%, 100% { transform: rotateY(180deg) translateX(0); }
          25% { transform: rotateY(180deg) translateX(-8px); }
          75% { transform: rotateY(180deg) translateX(8px); }
        }
        @keyframes matchPulse {
          0%, 100% { transform: rotateY(180deg) scale(1); }
          50% { transform: rotateY(180deg) scale(1.1); }
        }
        .dealer-position {
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, transparent 100%);
        }
        .player-position {
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%);
        }
        .chip-stack {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
      `}</style>
      
      <div className="relative w-full max-w-5xl mx-auto" style={{ minHeight: '700px' }}>
        {/* Casino Table */}
        <div className="casino-table felt-texture table-edge rounded-[3rem] p-8 relative overflow-hidden">
          
          {/* Dealer Area (Top) */}
          <div className="dealer-position absolute top-0 left-0 right-0 h-24 flex items-center justify-center">
            <div className="bg-emerald-900/40 backdrop-blur-sm px-6 py-2 rounded-full border border-yellow-600/30">
              <span className="text-yellow-400 font-bold text-sm tracking-wider">♠ DEALER ♠</span>
            </div>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-red-900/50 hover:bg-red-800/70 border-2 border-red-600/50 hover:border-red-500 flex items-center justify-center transition-all duration-300 hover:scale-110 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Score Display - Top Left & Right (Chip Stacks Style) */}
          <div className="absolute top-8 left-8 flex flex-col gap-2">
            <div className="chip-stack bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-600 rounded-full w-20 h-20 flex flex-col items-center justify-center border-4 border-yellow-400/50 shadow-lg">
              <span className="text-[10px] font-bold text-yellow-900 uppercase tracking-wide">Skor</span>
              <span className="text-xl font-black text-white drop-shadow-lg">{score}</span>
            </div>
          </div>

          <div className="absolute top-8 left-32 flex flex-col gap-2">
            <div className="chip-stack bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 rounded-full w-20 h-20 flex flex-col items-center justify-center border-4 border-blue-400/50 shadow-lg">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">Hamle</span>
              <span className="text-xl font-black text-white drop-shadow-lg">{moves}</span>
            </div>
          </div>

          {/* Game Title - Center Top */}
          <div className="text-center pt-16 pb-6">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] tracking-wider uppercase">
              Siber Hafıza
            </h2>
          </div>

          {/* Playing Area */}
          <div className="relative py-8">
            {/* Elliptical playing surface */}
            <div className="bg-emerald-800/30 rounded-[50%] p-8 border-2 border-yellow-600/20 shadow-inner">
              <div className="grid grid-cols-4 gap-5 max-w-2xl mx-auto">
                {cards.map((card, index) => {
                  const isFlipped = flippedIndices.includes(index) || matchedPairs.includes(card);
                  const isMismatched = mismatchedIndices.includes(index);
                  const isMatched = matchedPairs.includes(card);
                  return (
                    <div 
                      key={index} 
                      className={`game-card game-card-perspective aspect-[3/4] cursor-pointer ${isFlipped ? 'flipped' : ''} ${isMismatched ? 'mismatch' : ''} ${isMatched ? 'matched' : ''}`} 
                      onClick={() => handleCardClick(index)}
                    >
                      <div className="game-card-inner relative w-full h-full rounded-xl">
                        {/* Card Back */}
                        <div className="game-card-back absolute w-full h-full rounded-xl bg-gradient-to-br from-red-700 via-red-800 to-red-900 border-4 border-yellow-600/40 shadow-xl flex items-center justify-center overflow-hidden">
                          {/* Card pattern */}
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute inset-2 border-2 border-yellow-400/30 rounded-lg"></div>
                            <div className="absolute inset-4 border border-yellow-400/20 rounded-md"></div>
                          </div>
                          <div className="relative text-5xl opacity-40 text-yellow-400">♦</div>
                        </div>
                        
                        {/* Card Front */}
                        <div className="game-card-front absolute w-full h-full rounded-xl bg-white border-4 border-gray-300 shadow-2xl flex items-center justify-center">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <svg 
                              className="w-16 h-16 text-emerald-700 drop-shadow-lg" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor" 
                              dangerouslySetInnerHTML={{ __html: card }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Player Position (Bottom) */}
          <div className="player-position absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center">
            <div className="bg-emerald-900/40 backdrop-blur-sm px-8 py-2 rounded-full border border-yellow-600/30">
              <span className="text-yellow-300 font-semibold text-sm tracking-wider">♣ PLAYER ♣</span>
            </div>
          </div>

          {/* Table Border Decoration */}
          <div className="absolute inset-0 rounded-[3rem] pointer-events-none border-[12px] border-yellow-900/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center rounded-[3rem] z-50 animate-fadeIn">
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 border-4 border-yellow-500 rounded-3xl p-10 shadow-2xl max-w-md text-center">
              <div className="text-7xl mb-4">🏆</div>
              <h3 className="text-5xl font-black text-yellow-400 mb-3 drop-shadow-lg">Tebrikler!</h3>
              <p className="text-emerald-200 text-lg mb-2">Oyunu tamamladın</p>
              <p className="text-white/70 mb-4 text-sm">{moves} hamle</p>
              
              <div className="bg-black/30 rounded-2xl p-6 mb-6 border border-yellow-600/30">
                <div className="text-yellow-300 text-sm font-semibold mb-2">FİNAL SKOR</div>
                <div className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                  {score}
                </div>
              </div>
              
              <button 
                onClick={restartGame} 
                className="w-full px-8 py-4 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-400 hover:to-yellow-500 rounded-xl text-emerald-950 font-black text-lg shadow-lg shadow-yellow-600/50 hover:shadow-xl hover:shadow-yellow-500/60 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-yellow-400"
              >
                🎲 Yeniden Oyna
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CardMatchGame;