// components/games/BlackjackGame.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

type Card = { suit: string; rank: string; value: number; };
type GameState = 'betting' | 'player-turn' | 'dealer-turn' | 'game-over';

const createDeck = (): Card[] => {
  return SUITS.flatMap(suit => 
    RANKS.map(rank => {
      let value = parseInt(rank);
      if (rank === 'A') value = 11;
      else if (['J', 'Q', 'K'].includes(rank)) value = 10;
      return { suit, rank, value };
    })
  );
};

const shuffle = (array: Card[]): Card[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const calculateScore = (hand: Card[]): number => {
  let score = hand.reduce((acc, card) => acc + card.value, 0);
  let aces = hand.filter(card => card.rank === 'A').length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
};

interface BlackjackGameProps {
  onGameEnd: (score: number) => void;
  onClose: () => void;
}

const CardComponent: React.FC<{ card: Card; hidden?: boolean; index: number; }> = ({ card, hidden, index }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    
    if (hidden) {
        return (
          <div 
            className="w-20 h-28 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border border-white/20 shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform"
            style={{ marginLeft: index > 0 ? '-12px' : '0' }}
          >
            <div className="w-16 h-24 border-2 border-white/30 rounded-lg"></div>
          </div>
        );
    }
    return (
        <div 
            className={`w-20 h-28 rounded-xl bg-white shadow-2xl flex flex-col justify-between p-2 font-bold transition-all duration-200 transform hover:scale-110 hover:-translate-y-2 ${isRed ? 'text-red-600' : 'text-gray-900'}`}
            style={{ marginLeft: index > 0 ? '-12px' : '0', border: '2px solid rgba(0,0,0,0.1)' }}
        >
            <div className="flex justify-between items-start">
                <span className="text-lg leading-none">{card.rank}</span>
                <span className="text-xl">{card.suit}</span>
            </div>
            <span className="text-4xl self-center">{card.suit}</span>
            <div className="flex justify-between items-end transform rotate-180">
                <span className="text-lg leading-none">{card.rank}</span>
                <span className="text-xl">{card.suit}</span>
            </div>
        </div>
    );
};

const BlackjackGame: React.FC<BlackjackGameProps> = ({ onGameEnd, onClose }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GameState>('player-turn');
  const [message, setMessage] = useState('Sıra sende. Kart çek veya dur.');
  const [finalScore, setFinalScore] = useState(0);

  const playerScore = useMemo(() => calculateScore(playerHand), [playerHand]);
  const dealerScore = useMemo(() => calculateScore(dealerHand), [dealerHand]);

  const dealCards = useCallback(() => {
    const shuffledDeck = shuffle(createDeck());
    const initialPlayerHand: Card[] = [];
    const initialDealerHand: Card[] = [];

    setTimeout(() => initialPlayerHand.push(shuffledDeck.pop()!), 100);
    setTimeout(() => initialDealerHand.push(shuffledDeck.pop()!), 300);
    setTimeout(() => initialPlayerHand.push(shuffledDeck.pop()!), 500);
    setTimeout(() => initialDealerHand.push(shuffledDeck.pop()!), 700);
    
    setTimeout(() => {
        setPlayerHand(initialPlayerHand);
        setDealerHand(initialDealerHand);
        setDeck(shuffledDeck);
        setGameState('player-turn');
        setMessage('Sıra sende. Kart çek veya dur.');
        setFinalScore(0);
    }, 800);
  }, []);

  useEffect(() => {
    dealCards();
  }, [dealCards]);

  const handleHit = () => {
    if (gameState !== 'player-turn' || playerScore > 21) return;
    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck(newDeck);
    if (calculateScore(newHand) > 21) {
      setMessage('Kaybettin!');
      setGameState('game-over');
      setFinalScore(0);
    }
  };

  const handleStand = () => {
    if (gameState !== 'player-turn') return;
    setGameState('dealer-turn');
  };

  useEffect(() => {
    if (gameState === 'dealer-turn') {
        const playDealerTurn = () => {
            let currentDealerHand = [...dealerHand];
            let currentDeck = [...deck];
            let score = calculateScore(currentDealerHand);

            const drawCard = () => {
                if(score < 17) {
                    const newCard = currentDeck.pop()!;
                    currentDealerHand.push(newCard);
                    setDealerHand([...currentDealerHand]);
                    setDeck([...currentDeck]);
                    score = calculateScore(currentDealerHand);
                    setTimeout(drawCard, 800);
                } else {
                    if (score > 21 || score < playerScore) { setMessage('Kazandın! 🎉'); setFinalScore(100); } 
                    else if (score > playerScore) { setMessage('Krupiye kazandı! 😔'); setFinalScore(0); } 
                    else { setMessage('Berabere! 🤝'); setFinalScore(50); }
                    setGameState('game-over');
                }
            }
            drawCard();
        };
        const timeoutId = setTimeout(playDealerTurn, 1000);
        return () => clearTimeout(timeoutId);
    }
  }, [gameState, dealerHand, deck, playerScore]);
  
  const handleNextRound = () => {
      if (gameState === 'game-over' && finalScore > 0) {
          onGameEnd(finalScore);
      }
      setPlayerHand([]);
      setDealerHand([]);
      setGameState('player-turn');
      dealCards();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-t-2xl px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">♠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Blackjack</h1>
              <p className="text-sm text-slate-400">Professional Edition</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 backdrop-blur transition-all flex items-center justify-center text-slate-400 hover:text-white border border-slate-600/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Game Area */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 border-x border-slate-700/50 p-8">
          
          {/* Dealer Area */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-800/80 backdrop-blur rounded-xl flex items-center justify-center border border-slate-700/50">
                  <span className="text-3xl">🎩</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Dealer</h2>
                  <p className="text-sm text-emerald-300 font-mono">
                    Score: {gameState !== 'player-turn' ? dealerScore : '???'}
                  </p>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur px-4 py-2 rounded-lg border border-slate-700/50">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Cards</span>
                <p className="text-2xl font-bold text-white">{dealerHand.length}</p>
              </div>
            </div>
            <div className="flex justify-center items-center h-32 bg-slate-900/30 rounded-xl border border-slate-700/30 p-4">
              <div className="flex items-center">
                {dealerHand.map((card, i) => (
                  <CardComponent key={i} card={card} hidden={i === 1 && gameState === 'player-turn'} index={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Game Status */}
          <div className="mb-8">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl px-6 py-4 shadow-xl">
              <div className="flex items-center justify-center gap-3">
                <div className={`w-3 h-3 rounded-full ${gameState === 'player-turn' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : gameState === 'dealer-turn' ? 'bg-amber-500 shadow-lg shadow-amber-500/50 animate-pulse' : 'bg-slate-600'}`}></div>
                <p className="text-lg font-semibold text-white">{message}</p>
              </div>
            </div>
          </div>

          {/* Player Area */}
          <div>
            <div className="flex justify-center items-center h-32 bg-slate-900/30 rounded-xl border border-slate-700/30 p-4 mb-6">
              <div className="flex items-center">
                {playerHand.map((card, i) => (
                  <CardComponent key={i} card={card} index={i} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="bg-slate-800/50 backdrop-blur px-4 py-2 rounded-lg border border-slate-700/50">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Cards</span>
                <p className="text-2xl font-bold text-white">{playerHand.length}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white text-right">You</h2>
                  <p className="text-sm text-emerald-300 font-mono text-right">
                    Score: {playerScore}
                  </p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center border-2 border-blue-500/50 shadow-lg shadow-blue-500/20">
                  <span className="text-3xl">👤</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-b-2xl px-6 py-5 flex items-center justify-center gap-4">
          {gameState === 'player-turn' && (
            <>
              <button 
                onClick={handleHit} 
                disabled={playerScore >= 21}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 border border-white/10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Hit</span>
              </button>
              <button 
                onClick={handleStand}
                className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3 border border-white/10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Stand</span>
              </button>
            </>
          )}
          {gameState === 'game-over' && (
            <button 
              onClick={handleNextRound}
              className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3 border border-white/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{finalScore > 0 ? "Save Score & New Round" : "New Round"}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default BlackjackGame;