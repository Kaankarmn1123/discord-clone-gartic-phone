// components/games/SnakeGame.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const TILE_SIZE = 20;
const INITIAL_SPEED = 180;

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface SnakeGameProps {
  onGameEnd: (score: number) => void;
  onClose: () => void;
}

const SnakeGame: React.FC<SnakeGameProps> = ({ onGameEnd, onClose }) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [speed, setSpeed] = useState<number | null>(INITIAL_SPEED);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const generateFood = useCallback(() => {
    let newFoodPosition: Position;
    do {
      newFoodPosition = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    } while (snake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y));
    setFood(newFoodPosition);
  }, [snake]);

  const restartGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    generateFood();
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameOver(false);
    gameContainerRef.current?.focus();
  }, [generateFood]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    switch (e.key) {
      case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
      case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
      case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
      case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
      case ' ': if (gameOver) restartGame(); break;
    }
  }, [direction, gameOver, restartGame]);

  useEffect(() => {
    gameContainerRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };

        switch (direction) {
            case 'UP': head.y -= 1; break;
            case 'DOWN': head.y += 1; break;
            case 'LEFT': head.x -= 1; break;
            case 'RIGHT': head.x += 1; break;
        }

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE || 
            newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
            setSpeed(null);
            setGameOver(true);
            return prevSnake;
        }
        
        newSnake.unshift(head);
        
        if (head.x === food.x && head.y === food.y) {
            setScore(s => s + 10);
            generateFood();
            setSpeed(s => Math.max(40, (s || INITIAL_SPEED) * 0.97));
        } else {
            newSnake.pop();
        }
        return newSnake;
    });
  }, [direction, food, generateFood]);
  
  useEffect(() => {
    if (speed !== null && !gameOver) {
      if(gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    } else if (gameOver && gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    return () => { if(gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [speed, gameOver, moveSnake]);

  return (
    <div ref={gameContainerRef} tabIndex={0} className="outline-none">
      <div className="relative w-full max-w-lg mx-auto bg-black rounded-2xl border-4 border-slate-700/50 shadow-2xl shadow-green-900/50 p-4 font-mono overflow-hidden">
        <div className="relative z-10">
            <div className="flex justify-between items-center mb-3 px-2 text-white">
                <h2 className="text-2xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.7)]">NEON YILAN</h2>
                <div className="text-right">
                    <div className="text-xs uppercase text-slate-400">SKOR</div>
                    <div className="text-2xl font-bold text-green-300">{score}</div>
                </div>
            </div>
            
            <div 
              className="relative bg-black border-2 border-green-800/50" 
              style={{ 
                width: GRID_SIZE * TILE_SIZE, 
                height: GRID_SIZE * TILE_SIZE,
                boxShadow: 'inset 0 0 20px rgba(74, 222, 128, 0.2)',
                backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
                backgroundImage: 'linear-gradient(to right, rgba(74, 222, 128, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(74, 222, 128, 0.1) 1px, transparent 1px)',
              }}
            >
                {snake.map((segment, index) => (
                    <div key={index} className="absolute transition-all duration-100 ease-linear" style={{ left: segment.x * TILE_SIZE, top: segment.y * TILE_SIZE, width: TILE_SIZE-1, height: TILE_SIZE-1 }}>
                      <div className={`w-full h-full ${index === 0 ? 'bg-lime-400' : 'bg-green-500'}`} style={{boxShadow: `0 0 8px ${index === 0 ? 'rgba(163, 230, 53, 0.8)' : 'rgba(34, 197, 94, 0.6)'}`}}></div>
                    </div>
                ))}
                <div className="absolute rounded-full" style={{ left: food.x * TILE_SIZE, top: food.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                   <div className="w-full h-full bg-red-500 rounded-full animate-pulse" style={{boxShadow: '0 0 12px rgba(239, 68, 68, 0.8)'}}></div>
                </div>

                {gameOver && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
                        <h3 className="text-5xl font-bold text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]">OYUN BİTTİ</h3>
                        <p className="text-2xl text-white mb-8">Skorun: {score}</p>
                        <button onClick={restartGame} className="px-6 py-3 bg-gradient-to-r from-green-600 to-lime-600 rounded-lg text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-lime-500/30">Yeniden Başlat (Boşluk)</button>
                        <button onClick={() => onGameEnd(score)} className="mt-4 text-sm text-slate-400 hover:underline">Skoru Kaydet & Çık</button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;