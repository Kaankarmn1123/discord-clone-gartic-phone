// components/games/GarticPhoneGame.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile } from '../../types';

type GameSession = { 
  id: string; 
  host_id: string; 
  status: 'lobby' | 'prompting' | 'playing' | 'results' | 'finished';
  game_type?: string;
};

type Player = { 
  user_id: string; 
  join_order: number; 
  profile: Profile; 
  is_ready?: boolean;
};

type GameRound = { 
  id: string; 
  round_number: number; 
  player_id: string; 
  chain_starter_id: string; 
  prompt_text?: string; 
  drawing_data?: any; 
  created_at?: string;
};

type GameState = 'lobby' | 'prompting' | 'playing' | 'drawing' | 'describing' | 'results' | 'loading';

type DrawingTool = 'pen' | 'eraser' | 'brush';

const GarticPhoneGame: React.FC<{ sessionId: string; onClose: () => void; }> = ({ sessionId, onClose }) => {
    const { user, profile } = useAuth();
    const [session, setSession] = useState<GameSession | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [rounds, setRounds] = useState<GameRound[]>([]);
    const [gameState, setGameState] = useState<GameState>('loading');
    const [myPrompt, setMyPrompt] = useState('');
    const [myDescription, setMyDescription] = useState('');
    const [notification, setNotification] = useState<string>('');
    const [timer, setTimer] = useState<number>(0);
    const [showTimer, setShowTimer] = useState<boolean>(false);
    
    // Enhanced canvas state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingTool, setDrawingTool] = useState<DrawingTool>('pen');
    const [brushSize, setBrushSize] = useState(3);
    const [brushColor, setBrushColor] = useState('#ffffff');
    const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const isHost = session?.host_id === user?.id;
    const myPlayerInfo = players.find(p => p.user_id === user?.id);
    const currentRoundNumber = rounds.length > 0 ? Math.max(...rounds.map(r => r.round_number)) + 1 : 1;

    // Enhanced Drawing Logic
    const getCanvasContext = () => canvasRef.current?.getContext('2d');

    const saveCanvasState = useCallback(() => {
        if (!canvasRef.current) return;
        const dataURL = canvasRef.current.toDataURL();
        const newHistory = canvasHistory.slice(0, historyStep + 1);
        newHistory.push(dataURL);
        setCanvasHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    }, [canvasHistory, historyStep]);

    const undo = () => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
            const ctx = getCanvasContext();
            const img = new Image();
            img.src = canvasHistory[historyStep - 1];
            img.onload = () => {
                if (ctx && canvasRef.current) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.drawImage(img, 0, 0);
                }
            };
        }
    };

    const redo = () => {
        if (historyStep < canvasHistory.length - 1) {
            setHistoryStep(historyStep + 1);
            const ctx = getCanvasContext();
            const img = new Image();
            img.src = canvasHistory[historyStep + 1];
            img.onload = () => {
                if (ctx && canvasRef.current) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.drawImage(img, 0, 0);
                }
            };
        }
    };

    const clearCanvas = () => {
        const ctx = getCanvasContext();
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            saveCanvasState();
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ctx = getCanvasContext();
        if (!ctx || !canvasRef.current) return;
        
        saveCanvasState();
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        if (drawingTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = brushSize * 2;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const ctx = getCanvasContext();
        if (!ctx || !canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = getCanvasContext();
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
    };

    // Timer functionality
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showTimer && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        setShowTimer(false);
                        showNotification("Süre doldu! Hızlı ol!");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showTimer, timer]);

    const startTimer = (seconds: number) => {
        setTimer(seconds);
        setShowTimer(true);
    };

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    useEffect(() => {
        const ctx = getCanvasContext();
        if (ctx) {
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [brushColor, brushSize]);

    const fetchInitialData = useCallback(async () => {
        try {
            const { data: sessionData, error: sessionError } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();
                
            if (sessionError) throw sessionError;
            if (sessionData) {
                setSession(sessionData);
                setGameState(sessionData.status as GameState);
            }
            
            const { data: playersData, error: playersError } = await supabase
                .from('game_session_players')
                .select('*, profile:profiles(*)')
                .eq('session_id', sessionId)
                .order('join_order');
                
            if (playersError) throw playersError;
            if (playersData) {
                setPlayers(playersData.map(p => ({...p, profile: p.profile as Profile})));
            }
            
            const { data: roundsData, error: roundsError } = await supabase
                .from('game_rounds')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });
                
            if (roundsError) throw roundsError;
            if (roundsData) {
                setRounds(roundsData);
            }
        } catch (error) {
            console.error('Error fetching game data:', error);
            showNotification('Oyun verileri yüklenirken hata oluştu');
        }
    }, [sessionId]);

    useEffect(() => {
        fetchInitialData();
        
        const sessionSubscription = supabase
            .channel(`gartic-session-${sessionId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'game_sessions', 
                filter: `id=eq.${sessionId}` 
            }, (payload) => {
                const newSession = payload.new as GameSession;
                setSession(newSession);
                setGameState(newSession.status as GameState);
                
                // Start timer when game state changes
                if (newSession.status === 'prompting') {
                    startTimer(60); // 60 seconds for writing prompts
                } else if (newSession.status === 'playing') {
                    startTimer(90); // 90 seconds for drawing/describing
                }
            })
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'game_session_players', 
                filter: `session_id=eq.${sessionId}` 
            }, fetchInitialData)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'game_rounds', 
                filter: `session_id=eq.${sessionId}` 
            }, fetchInitialData)
            .subscribe();
            
        return () => { 
            supabase.removeChannel(sessionSubscription); 
        };
    }, [sessionId, fetchInitialData]);

    const handleStartGame = async () => {
        if (!isHost || players.length < 2) {
            showNotification('En az 2 oyuncu gerekli!');
            return;
        }
        
        try {
            const { error } = await supabase
                .from('game_sessions')
                .update({ status: 'prompting' })
                .eq('id', sessionId);
                
            if (error) throw error;
            showNotification('Oyun başlatıldı!');
        } catch (error) {
            console.error('Error starting game:', error);
            showNotification('Oyun başlatılamadı');
        }
    };

    const submitPrompt = async () => {
        if (!user || myPrompt.trim() === '') {
            showNotification('Lütfen bir cümle yazın!');
            return;
        }
        
        try {
            const { error } = await supabase
                .from('game_rounds')
                .insert({
                    session_id: sessionId,
                    round_number: 1,
                    player_id: user.id,
                    chain_starter_id: user.id,
                    prompt_text: myPrompt.trim()
                });
                
            if (error) throw error;
            setMyPrompt('');
            showNotification('Cümle gönderildi!');
        } catch (error) {
            console.error('Error submitting prompt:', error);
            showNotification('Cümle gönderilemedi');
        }
    };
    
    const submitDrawing = async () => {
        const drawingData = canvasRef.current?.toDataURL();
        if (!drawingData || !previousRound) {
            showNotification('Çizim yapmadan gönderemezsiniz!');
            return;
        }
        
        try {
            const { error } = await supabase
                .from('game_rounds')
                .insert({
                    session_id: sessionId,
                    round_number: currentRoundNumber,
                    player_id: user!.id,
                    chain_starter_id: previousRound.chain_starter_id,
                    drawing_data: { data: drawingData }
                });
                
            if (error) throw error;
            showNotification('Çizim gönderildi!');
        } catch (error) {
            console.error('Error submitting drawing:', error);
            showNotification('Çizim gönderilemedi');
        }
    };
    
    const submitDescription = async () => {
        if (myDescription.trim() === '' || !previousRound) {
            showNotification('Lütfen bir tahmin yazın!');
            return;
        }
        
        try {
            const { error } = await supabase
                .from('game_rounds')
                .insert({
                    session_id: sessionId,
                    round_number: currentRoundNumber,
                    player_id: user!.id,
                    chain_starter_id: previousRound.chain_starter_id,
                    prompt_text: myDescription.trim()
                });
                
            if (error) throw error;
            setMyDescription('');
            showNotification('Tahmin gönderildi!');
        } catch (error) {
            console.error('Error submitting description:', error);
            showNotification('Tahmin gönderilemedi');
        }
    };

    const hasSubmittedCurrentRound = rounds.some(r => r.round_number === currentRoundNumber && r.player_id === user?.id);
    const allPlayersSubmittedPrompt = gameState === 'prompting' && rounds.length === players.length;
    const allPlayersSubmittedTurn = gameState === 'playing' && rounds.filter(r => r.round_number === currentRoundNumber).length === players.length;

    useEffect(() => {
        if(isHost && (allPlayersSubmittedPrompt || allPlayersSubmittedTurn)) {
            const nextRound = currentRoundNumber + 1;
            if (nextRound > players.length + 1) {
                supabase.from('game_sessions').update({ status: 'results' }).eq('id', sessionId).then();
            } else if (gameState === 'prompting') {
                supabase.from('game_sessions').update({ status: 'playing' }).eq('id', sessionId).then();
            }
        }
    }, [isHost, allPlayersSubmittedPrompt, allPlayersSubmittedTurn, currentRoundNumber, players.length, sessionId, gameState]);

    const getPreviousRoundForMe = useCallback(() => {
        if (!myPlayerInfo) return null;
        const myOrder = myPlayerInfo.join_order;
        const previousPlayerOrder = (myOrder - 2 + players.length) % players.length;
        const previousPlayer = players.find(p => p.join_order === previousPlayerOrder);
        if (!previousPlayer) return null;

        const chainStarter = previousPlayer.user_id;
        const previousPlayerRounds = rounds
            .filter(r => r.chain_starter_id === chainStarter)
            .sort((a,b) => b.round_number - a.round_number);
        
        return previousPlayerRounds.length > 0 ? previousPlayerRounds[0] : null;
    }, [myPlayerInfo, players, rounds]);

    const previousRound = getPreviousRoundForMe();

    // Enhanced UI Components
    const GameTimer = () => {
        if (!showTimer) return null;
        
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        const timeColor = timer <= 10 ? 'text-red-400' : timer <= 30 ? 'text-yellow-400' : 'text-green-400';
        
        return (
            <div className={`text-2xl font-bold ${timeColor} mb-4`}>
                {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
        );
    };

    const NotificationBanner = () => {
        if (!notification) return null;
        
        return (
            <div className="fixed top-4 right-4 bg-cyan-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
                {notification}
            </div>
        );
    };

    const DrawingTools = () => (
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <div className="flex gap-2">
                <button
                    onClick={() => setDrawingTool('pen')}
                    className={`px-3 py-2 rounded ${drawingTool === 'pen' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
                >
                    ✏️ Kalem
                </button>
                <button
                    onClick={() => setDrawingTool('brush')}
                    className={`px-3 py-2 rounded ${drawingTool === 'brush' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
                >
                    🖌️ Fırça
                </button>
                <button
                    onClick={() => setDrawingTool('eraser')}
                    className={`px-3 py-2 rounded ${drawingTool === 'eraser' ? 'bg-cyan-600' : 'bg-slate-700'} text-white`}
                >
                    🧹 Silgi
                </button>
            </div>
            
            <div className="flex gap-2 items-center">
                <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-10 h-10 rounded border-2 border-slate-600"
                />
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20"
                />
                <span className="text-white text-sm">{brushSize}px</span>
            </div>
            
            <div className="flex gap-2">
                <button
                    onClick={undo}
                    disabled={historyStep <= 0}
                    className="px-3 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
                >
                    ↶ Geri
                </button>
                <button
                    onClick={redo}
                    disabled={historyStep >= canvasHistory.length - 1}
                    className="px-3 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
                >
                    ↷ İleri
                </button>
                <button
                    onClick={clearCanvas}
                    className="px-3 py-2 bg-red-600 text-white rounded"
                >
                    🗑️ Temizle
                </button>
            </div>
        </div>
    );

    const PlayerList = () => (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-cyan-300 mb-3">Oyuncular ({players.length})</h3>
            <div className="grid grid-cols-3 gap-3">
                {players.map(p => (
                    <div key={p.user_id} className="flex flex-col items-center p-3 bg-slate-800 rounded-lg">
                        <img 
                            src={p.profile.avatar_url || ''} 
                            alt={p.profile.username} 
                            className="w-12 h-12 rounded-full border-2 border-cyan-500 mb-2"
                        />
                        <p className="text-sm text-white text-center truncate">{p.profile.username}</p>
                        {p.user_id === session?.host_id && (
                            <span className="text-xs text-cyan-400 mt-1">👑 Host</span>
                        )}
                        {rounds.some(r => r.player_id === p.user_id && r.round_number === currentRoundNumber) && (
                            <span className="text-xs text-green-400 mt-1">✓ Hazır</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderLobby = () => (
        <div className="text-center animate-fade-in">
            <NotificationBanner />
            <GameTimer />
            <h2 className="text-4xl font-bold text-cyan-400 mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                🎨 Zincirleme Sanat
            </h2>
            
            <div className="bg-slate-800 rounded-xl p-6 mb-6">
                <h3 className="text-xl text-white mb-4">Nasıl Oynanır?</h3>
                <div className="text-left text-slate-300 space-y-2">
                    <p>• 1. Her oyuncu bir cümle yazar</p>
                    <p>• 2. Cümleler başka oyunculara gider</p>
                    <p>• 3. Cümleyi çizersiniz</p>
                    <p>• 4. Çizimi başkası tarif eder</p>
                    <p>• 5. Sonuçları görüntüleyin!</p>
                </div>
            </div>

            <PlayerList />
            
            {isHost ? (
                <button 
                    onClick={handleStartGame} 
                    disabled={players.length < 2}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    🚀 Oyunu Başlat
                </button>
            ) : (
                <p className="text-slate-400 text-lg">Sunucunun oyunu başlatması bekleniyor...</p>
            )}
            
            {players.length < 2 && (
                <p className="text-sm text-slate-500 mt-4">⚠️ Oynamak için en az 2 kişi gerekir.</p>
            )}
        </div>
    );
    
    const renderPrompting = () => {
        const submitted = rounds.some(r => r.player_id === user?.id && r.round_number === 1);
        
        if (submitted) {
            return (
                <div className="text-center animate-fade-in">
                    <NotificationBanner />
                    <GameTimer />
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl text-white mb-4">Diğer oyuncuların cümlelerini yazması bekleniyor...</h2>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div 
                            className="bg-cyan-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${(rounds.length / players.length) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-slate-400 mt-2">{rounds.length} / {players.length} oyuncu hazır</p>
                </div>
            );
        }
        
        return (
            <div className="text-center animate-fade-in">
                <NotificationBanner />
                <GameTimer />
                <h2 className="text-3xl font-bold text-cyan-400 mb-6">Bir cümle yaz! 📝</h2>
                <p className="text-slate-300 mb-6">İlham verici, komik ya da absürt bir cümle yazın!</p>
                
                <div className="mb-6">
                    <textarea
                        value={myPrompt}
                        onChange={e => setMyPrompt(e.target.value)}
                        placeholder="Örn: 'Kedi ayağa kalkıp dans etmeye başladı...'"
                        className="w-full p-4 bg-slate-800 border-2 border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                        rows={3}
                        maxLength={200}
                    />
                    <div className="text-right text-sm text-slate-400 mt-2">
                        {myPrompt.length}/200 karakter
                    </div>
                </div>
                
                <div className="flex gap-2 justify-center mb-4">
                    <button 
                        onClick={() => setMyPrompt('Eski bir büyücü kütüphanesinden gizemli bir kitap buldu...')}
                        className="px-3 py-2 bg-slate-700 text-white rounded text-sm hover:bg-slate-600"
                    >
                        💡 Örnek 1
                    </button>
                    <button 
                        onClick={() => setMyPrompt('Uzaylılar İstanbul\'da piknik yapıyordu...')}
                        className="px-3 py-2 bg-slate-700 text-white rounded text-sm hover:bg-slate-600"
                    >
                        💡 Örnek 2
                    </button>
                    <button 
                        onClick={() => setMyPrompt('Köpek bilgisayarında oyun oynuyordu...')}
                        className="px-3 py-2 bg-slate-700 text-white rounded text-sm hover:bg-slate-600"
                    >
                        💡 Örnek 3
                    </button>
                </div>
                
                <button 
                    onClick={submitPrompt}
                    disabled={myPrompt.trim().length < 5}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/25 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    📤 Cümleyi Gönder
                </button>
            </div>
        );
    };
    
    const renderDrawing = () => {
        if (hasSubmittedCurrentRound) {
            return (
                <div className="text-center animate-fade-in">
                    <NotificationBanner />
                    <GameTimer />
                    <div className="text-6xl mb-4">🎨</div>
                    <h2 className="text-2xl text-white mb-4">Diğer oyuncuların çizim yapması bekleniyor...</h2>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div 
                            className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${(rounds.filter(r => r.round_number === currentRoundNumber).length / players.length) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-slate-400 mt-2">
                        {rounds.filter(r => r.round_number === currentRoundNumber).length} / {players.length} oyuncu hazır
                    </p>
                </div>
            );
        }
        
        if (!previousRound || !previousRound.prompt_text) {
            return (
                <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl text-white">Önceki tur verisi bekleniyor...</h2>
                </div>
            );
        }
        
        return (
            <div className="animate-fade-in">
                <NotificationBanner />
                <GameTimer />
                <h2 className="text-3xl font-bold text-cyan-400 mb-4 text-center">Şimdi çiz! 🎨</h2>
                
                <div className="bg-slate-800 rounded-lg p-4 mb-6">
                    <p className="text-center text-white mb-2">Çizilecek Cümle:</p>
                    <p className="text-center text-2xl text-cyan-300 font-bold">"{previousRound.prompt_text}"</p>
                </div>
                
                <DrawingTools />
                
                <div className="flex justify-center mb-4">
                    <canvas 
                        ref={canvasRef} 
                        width="600" 
                        height="400" 
                        className="bg-white rounded-lg border-4 border-cyan-500 shadow-lg cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                </div>
                
                <div className="text-center">
                    <button 
                        onClick={submitDrawing}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/25 transition-all hover:scale-105"
                    >
                        🎨 Çizimi Gönder
                    </button>
                </div>
            </div>
        );
    };

    const renderDescribing = () => {
        if (hasSubmittedCurrentRound) {
            return (
                <div className="text-center animate-fade-in">
                    <NotificationBanner />
                    <GameTimer />
                    <div className="text-6xl mb-4">🤔</div>
                    <h2 className="text-2xl text-white mb-4">Diğer oyuncuların tahmin yapması bekleniyor...</h2>
                </div>
            );
        }
        
        if (!previousRound || !previousRound.drawing_data) {
            return (
                <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl text-white">Önceki tur verisi bekleniyor...</h2>
                </div>
            );
        }
        
        return (
            <div className="animate-fade-in">
                <NotificationBanner />
                <GameTimer />
                <h2 className="text-3xl font-bold text-cyan-400 mb-4 text-center">Bu çizimi tarif et! 🖼️</h2>
                
                <div className="flex flex-col items-center mb-6">
                    <img 
                        src={previousRound.drawing_data.data} 
                        alt="Player drawing" 
                        className="w-[400px] h-[300px] bg-white rounded-lg border-4 border-cyan-500 shadow-lg"
                    />
                </div>
                
                <div className="max-w-2xl mx-auto">
                    <textarea
                        value={myDescription}
                        onChange={e => setMyDescription(e.target.value)}
                        placeholder="Çizimde ne görüyorsun? Tarif et..."
                        className="w-full p-4 bg-slate-800 border-2 border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                        rows={3}
                        maxLength={150}
                    />
                    <div className="text-right text-sm text-slate-400 mt-2">
                        {myDescription.length}/150 karakter
                    </div>
                </div>
                
                <div className="text-center mt-6">
                    <button 
                        onClick={submitDescription}
                        disabled={myDescription.trim().length < 3}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        📝 Tahmini Gönder
                    </button>
                </div>
            </div>
        );
    }
    
    const ResultsDisplay: React.FC<{ allRounds: GameRound[], allPlayers: Player[] }> = ({ allRounds, allPlayers }) => {
        const [currentChainIndex, setCurrentChainIndex] = useState(0);
        const [currentSlide, setCurrentSlide] = useState(0);
        const [isPlaying, setIsPlaying] = useState(false);
        
        const chains = useMemo(() => {
            const chainsMap = new Map<string, GameRound[]>();
            allPlayers.forEach(p => chainsMap.set(p.user_id, []));
            allRounds.forEach(r => chainsMap.get(r.chain_starter_id)?.push(r));
            return Array.from(chainsMap.values()).map(chain => 
                chain.sort((a,b) => a.round_number - b.round_number)
            ).filter(chain => chain.length > 0);
        }, [allRounds, allPlayers]);

        const activeChain = chains[currentChainIndex];
        const activeSlide = activeChain ? activeChain[currentSlide] : null;
        const getPlayerUsername = (id: string) => 
            allPlayers.find(p => p.user_id === id)?.profile.username || 'Bilinmeyen';

        if (!activeSlide) return <p className="text-white">Sonuçlar yükleniyor...</p>;

        const nextSlide = () => {
            if (currentSlide < activeChain.length - 1) {
                setCurrentSlide(currentSlide + 1);
            } else if (currentChainIndex < chains.length - 1) {
                setCurrentChainIndex(currentChainIndex + 1);
                setCurrentSlide(0);
            }
        };

        const prevSlide = () => {
            if (currentSlide > 0) {
                setCurrentSlide(currentSlide - 1);
            } else if (currentChainIndex > 0) {
                setCurrentChainIndex(currentChainIndex - 1);
                setCurrentSlide(chains[currentChainIndex - 1].length - 1);
            }
        };

        return (
            <div className="text-center animate-fade-in">
                <NotificationBanner />
                <h2 className="text-4xl font-bold text-cyan-400 mb-6">🎭 Sonuçlar!</h2>
                
                <div className="bg-slate-800 rounded-xl p-6 mb-6 max-w-2xl mx-auto">
                    <p className="text-lg text-white mb-2">
                        <span className="font-bold text-cyan-300">{getPlayerUsername(activeSlide.player_id)}</span> adlı oyuncunun sırası:
                    </p>
                    
                    {activeSlide.prompt_text && (
                        <div className="my-6">
                            <p className="text-xl text-cyan-400 font-bold bg-slate-900 rounded-lg p-4">
                                "{activeSlide.prompt_text}"
                            </p>
                        </div>
                    )}
                    
                    {activeSlide.drawing_data && (
                        <div className="my-6">
                            <img 
                                src={activeSlide.drawing_data.data} 
                                alt="drawing" 
                                className="mx-auto rounded-lg border-4 border-cyan-500 shadow-lg max-w-md"
                            />
                        </div>
                    )}
                </div>
                
                <div className="flex justify-center gap-4 mb-6">
                    <button 
                        onClick={prevSlide}
                        disabled={currentChainIndex === 0 && currentSlide === 0}
                        className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Önceki
                    </button>
                    
                    <div className="flex items-center text-white">
                        <span className="text-cyan-400 font-bold">{currentSlide + 1}</span>
                        <span className="mx-2">/</span>
                        <span>{activeChain.length}</span>
                    </div>
                    
                    <button 
                        onClick={nextSlide}
                        disabled={currentChainIndex === chains.length - 1 && currentSlide === activeChain.length - 1}
                        className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Sonraki →
                    </button>
                </div>
                
                <div className="flex justify-center gap-4 mb-6">
                    <button 
                        onClick={() => setCurrentChainIndex(Math.max(0, currentChainIndex - 1))}
                        disabled={currentChainIndex === 0}
                        className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50"
                    >
                        ⬅ Önceki Zincir
                    </button>
                    
                    <div className="flex items-center text-white bg-slate-800 px-4 py-2 rounded">
                        Zincir {currentChainIndex + 1} / {chains.length}
                    </div>
                    
                    <button 
                        onClick={() => setCurrentChainIndex(Math.min(chains.length - 1, currentChainIndex + 1))}
                        disabled={currentChainIndex >= chains.length - 1}
                        className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 disabled:opacity-50"
                    >
                        Sonraki Zincir ➡
                    </button>
                </div>
                
                <button 
                    onClick={onClose}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105"
                >
                    🏠 Oyundan Çık
                </button>
            </div>
        );
    };

    const renderContent = () => {
        switch(gameState) {
            case 'loading': 
                return (
                    <div className="text-center">
                        <div className="text-6xl mb-4 animate-spin">⚙️</div>
                        <h2 className="text-2xl text-white">Oyun yükleniyor...</h2>
                    </div>
                );
            case 'lobby': return renderLobby();
            case 'prompting': return renderPrompting();
            case 'playing':
                if (currentRoundNumber % 2 === 0) return renderDrawing();
                return renderDescribing();
            case 'results': 
                return <ResultsDisplay allRounds={rounds} allPlayers={players} />;
            default: 
                return (
                    <div className="text-center">
                        <div className="text-6xl mb-4">❓</div>
                        <h2 className="text-2xl text-white">Bilinmeyen oyun durumu.</h2>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-lg border-4 border-cyan-500 rounded-2xl shadow-2xl p-8 text-white relative">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl hover:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center transition-all"
            >
                ✕
            </button>
            
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
            
            {renderContent()}
        </div>
    );
};

export default GarticPhoneGame;
