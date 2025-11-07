// src/components/games/GarticPhoneGame.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile } from '../../types';

type GameSession = { id: string; host_id: string; status: 'lobby' | 'prompting' | 'playing' | 'results'; };
type Player = { user_id: string; join_order: number; profile: Profile; is_ready: boolean; };
type GameRound = { id: string; round_number: number; player_id: string; chain_starter_id: string; prompt_text?: string; drawing_data?: any; };
type GameState = 'lobby' | 'prompting' | 'playing' | 'drawing' | 'describing' | 'results' | 'loading';

const GarticPhoneGame: React.FC<{ sessionId: string; onClose: () => void; }> = ({ sessionId, onClose }) => {
    const { user, profile } = useAuth();
    const [session, setSession] = useState<GameSession | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [rounds, setRounds] = useState<GameRound[]>([]);
    const [gameState, setGameState] = useState<GameState>('loading');
    const [myPrompt, setMyPrompt] = useState('');
    const [myDescription, setMyDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Canvas state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const isHost = session?.host_id === user?.id;
    const myPlayerInfo = players.find(p => p.user_id === user?.id);
    const maxRound = useMemo(() => rounds.length > 0 ? Math.max(...rounds.map(r => r.round_number)) : 0, [rounds]);
    const currentRoundNumber = maxRound + 1;

    // Drawing Logic
    const getCanvasContext = () => canvasRef.current?.getContext('2d');

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ctx = getCanvasContext();
        if (!ctx) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const ctx = getCanvasContext();
        if (!ctx) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        const ctx = getCanvasContext();
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
    };

    useEffect(() => {
        const ctx = getCanvasContext();
        if (ctx) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    }, [gameState]);
    // End Drawing Logic

    const fetchInitialData = useCallback(async () => {
        try {
            const { data: sessionData, error: sessionError } = await supabase.from('game_sessions').select('*').eq('id', sessionId).maybeSingle();
            if (sessionError) throw sessionError;
            if (sessionData) {
                setSession(sessionData);
                setGameState(sessionData.status as GameState);
            }

            const { data: playersData, error: playersError } = await supabase
                .from('game_session_players')
                .select('user_id, join_order, is_ready, profiles(*)')
                .eq('session_id', sessionId)
                .order('join_order');

            if (playersError) throw playersError;

            const combinedPlayers = playersData
                ?.map(p => {
                    // profiles could be an array or a single object
                    const profileData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                    return {...p, profile: profileData, is_ready: p.is_ready || false};
                })
                .filter(p => p.profile && p.profile.avatar_url) || [];

            setPlayers(combinedPlayers);
            
            const { data: roundsData, error: roundsError } = await supabase.from('game_rounds').select('*').eq('session_id', sessionId).order('created_at');
            if (roundsError) throw roundsError;
            if (roundsData) setRounds(roundsData);
        } catch (err: any) {
            setError(`Veri alınamadı: ${err.message}`);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchInitialData();
        const sessionSubscription = supabase.channel(`gartic-session-${sessionId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` }, (payload) => {
                const newSession = payload.new as GameSession;
                setSession(newSession);
                setGameState(newSession.status as GameState);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_session_players', filter: `session_id=eq.${sessionId}` }, fetchInitialData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rounds', filter: `session_id=eq.${sessionId}` }, fetchInitialData)
            .subscribe();
        return () => { supabase.removeChannel(sessionSubscription); };
    }, [sessionId, fetchInitialData]);

    const handleStartGame = async () => {
        if (!isHost) return;

        try {
            // Create initial, empty rounds for each player to start their own chain
            const initialRounds = players.map((p) => ({
                session_id: sessionId,
                player_id: p.user_id,
                round_number: 1,
                chain_starter_id: p.user_id, // Each player starts their own chain
            }));

            const { error: roundsError } = await supabase.from('game_rounds').insert(initialRounds);
            if (roundsError) {
                console.error("Error creating initial rounds:", roundsError);
                throw roundsError;
            }

            // Update the game session status to 'prompting'
            const { error: sessionError } = await supabase
                .from('game_sessions')
                .update({ status: 'prompting' })
                .eq('id', sessionId);

            if (sessionError) {
                console.error("Error updating session status:", sessionError);
                throw sessionError;
            }

        } catch (error: any) {
            console.error('Error starting game:', error);
            setError(`Failed to start game: ${error.message}`);
        }
    };

    const submitPrompt = async () => {
        if (!user || myPrompt.trim() === '') return;
        try {
            // Update the existing round 1 entry for this user
            const { error } = await supabase
                .from('game_rounds')
                .update({ prompt_text: myPrompt.trim() })
                .eq('session_id', sessionId)
                .eq('player_id', user.id)
                .eq('round_number', 1);

            if (error) throw error;
        } catch (err: any) {
            setError(`Cümle gönderilemedi: ${err.message}`);
        }
    };
    
    const submitDrawing = async () => {
        const drawingData = canvasRef.current?.toDataURL();
        if (!drawingData) return;
        try {
            // This now updates the pre-created round entry
            const { error } = await supabase
                .from('game_rounds')
                .update({ drawing_data: { data: drawingData } })
                .eq('session_id', sessionId)
                .eq('player_id', user!.id)
                .eq('round_number', currentRoundNumber);
            if (error) throw error;
        } catch (err: any) {
            setError(`Çizim gönderilemedi: ${err.message}`);
        }
    };
    
    const submitDescription = async () => {
        if (myDescription.trim() === '') return;
        try {
            // This now updates the pre-created round entry
            const { error } = await supabase
                .from('game_rounds')
                .update({ prompt_text: myDescription.trim() })
                .eq('session_id', sessionId)
                .eq('player_id', user!.id)
                .eq('round_number', currentRoundNumber);
            if (error) throw error;
        } catch (err: any) {
            setError(`Açıklama gönderilemedi: ${err.message}`);
        }
    };

    const hasSubmittedCurrentRound = useMemo(() => {
        // A round is submitted if it has content (not just an empty row)
        return rounds.some(r => 
            r.round_number === currentRoundNumber && 
            r.player_id === user?.id &&
            (r.prompt_text || r.drawing_data)
        );
    }, [rounds, currentRoundNumber, user]);

    const allPlayersSubmittedPrompt = useMemo(() => 
        gameState === 'prompting' && rounds.filter(r => r.round_number === 1 && r.prompt_text).length === players.length,
    [gameState, rounds, players.length]);

    const allPlayersSubmittedTurn = useMemo(() => 
        gameState === 'playing' && rounds.filter(r => r.round_number === currentRoundNumber && (r.prompt_text || r.drawing_data)).length === players.length,
    [gameState, rounds, currentRoundNumber, players.length]);

    useEffect(() => {
        const advanceGame = async () => {
            if (!isHost) return;

            try {
                if (gameState === 'prompting' && allPlayersSubmittedPrompt) {
                    // Create round 2 entries and update game state
                    const nextRoundNumber = 2;
                    if (nextRoundNumber > players.length) {
                        await supabase.from('game_sessions').update({ status: 'results' }).eq('id', sessionId);
                    } else {
                        const newRounds = players.map(player => {
                            const myOrderIndex = player.join_order - 1;
                            const chainOwnerIndex = (myOrderIndex - (nextRoundNumber - 1) + players.length) % players.length;
                            const chainOwner = players.find(p => p.join_order === chainOwnerIndex + 1);
                            return {
                                session_id: sessionId, player_id: player.user_id, round_number: nextRoundNumber,
                                chain_starter_id: chainOwner!.user_id,
                            };
                        });
                        await supabase.from('game_rounds').insert(newRounds);
                        await supabase.from('game_sessions').update({ status: 'playing' }).eq('id', sessionId);
                    }
                } else if (gameState === 'playing' && allPlayersSubmittedTurn) {
                    // Create next round's entries or end the game
                    const nextRoundNumber = currentRoundNumber + 1;
                    if (nextRoundNumber > players.length) {
                        await supabase.from('game_sessions').update({ status: 'results' }).eq('id', sessionId);
                    } else {
                        const newRounds = players.map(player => {
                            const myOrderIndex = player.join_order - 1;
                            const chainOwnerIndex = (myOrderIndex - (nextRoundNumber - 1) + players.length) % players.length;
                            const chainOwner = players.find(p => p.join_order === chainOwnerIndex + 1);
                            return {
                                session_id: sessionId, player_id: player.user_id, round_number: nextRoundNumber,
                                chain_starter_id: chainOwner!.user_id,
                            };
                        });
                        await supabase.from('game_rounds').insert(newRounds);
                    }
                }
            } catch (err: any) {
                setError(`Oyun ilerletilemedi: ${err.message}`);
            }
        };
        advanceGame();
    }, [isHost, allPlayersSubmittedPrompt, allPlayersSubmittedTurn, currentRoundNumber, players, sessionId, gameState]);

    const getPreviousRoundForMe = useCallback(() => {
        if (!myPlayerInfo || currentRoundNumber <= 1) return null;

        const numPlayers = players.length;
        // Determine the join_order of the player whose chain I am continuing
        const myJoinOrderIndex = myPlayerInfo.join_order - 1;
        const previousPlayerJoinOrderIndex = (myJoinOrderIndex - 1 + numPlayers) % numPlayers;
        const previousPlayerJoinOrder = previousPlayerJoinOrderIndex + 1;

        // Find the player who corresponds to that join order
        const previousPlayer = players.find(p => p.join_order === previousPlayerJoinOrder);
        if (!previousPlayer) return null;

        // Now, find the round from the previous turn (maxRound) that belongs to the chain started by the player I am following
        // This logic is still complex. Let's simplify the chain tracking first.
        // For now, let's find the round that corresponds to the chain I am supposed to be on this turn.

        const chainOwnerJoinOrder = ((myPlayerInfo.join_order - 1) - (currentRoundNumber - 1) + numPlayers) % numPlayers + 1;
        const chainOwner = players.find(p => p.join_order === chainOwnerJoinOrder);
        if (!chainOwner) return null;


        return rounds.find(r =>
            r.chain_starter_id === chainOwner.user_id &&
            r.round_number === maxRound
        );

    }, [myPlayerInfo, players, rounds, currentRoundNumber, maxRound]);


    const previousRound = useMemo(() => getPreviousRoundForMe(), [getPreviousRoundForMe]);

    const renderLobby = () => (
        <div className="text-center">
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">Oyun Lobisi</h2>
            <p className="text-slate-300 mb-6">Oyuncuların katılması bekleniyor. Herkes hazır olduğunda kurucu oyunu başlatabilir.</p>
            {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {players.map(p => (
                    <div key={p.user_id} className="flex flex-col items-center">
                        <div className="relative">
                            <img src={p.profile?.avatar_url || '/default-avatar.png'} alt={p.profile?.username || 'Oyuncu'} className="w-16 h-16 rounded-full border-2 border-cyan-500"/>
                            {p.is_ready && <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-500 border-2 border-slate-900"></span>}
                        </div>
                        <p className="mt-2 text-sm text-white truncate">{p.profile?.username || 'Anonim'}</p>
                        {p.user_id === session?.host_id && <span className="text-xs text-cyan-400">Kurucu</span>}
                    </div>
                ))}
            </div>
            {isHost ? (
                <button onClick={handleStartGame} disabled={players.length < 2} className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-cyan-500 transition-colors">Oyunu Başlat</button>
            ) : <p className="text-slate-400">Kurucunun oyunu başlatması bekleniyor...</p>}
            {players.length < 2 && <p className="text-sm text-slate-500 mt-4">Oynamak için en az 2 kişi gerekir.</p>}
        </div>
    );
    
    const renderPrompting = () => {
       const submitted = rounds.some(r => r.player_id === user?.id && r.round_number === 1 && r.prompt_text);
       if(submitted) return <div className="text-center p-8"><p className="text-xl text-slate-300 animate-pulse">Cümleniz gönderildi! Diğer oyuncuların bitirmesi bekleniyor...</p></div>;
       return (
            <div className="flex flex-col items-center">
                <h2 className="text-2xl mb-4 font-bold text-cyan-300">Bir Cümle Yazın!</h2>
                <p className="text-sm text-slate-400 mb-4">Aklınıza gelen komik, çılgın veya tuhaf bir cümle yazın. Bu, bir sonraki oyuncu için çizim istemi olacak!</p>
                <input type="text" value={myPrompt} onChange={e => setMyPrompt(e.target.value)} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-cyan-500 transition" placeholder="Örn: Uzayda dans eden bir fil"/>
                <button onClick={submitPrompt} disabled={myPrompt.trim() === ''} className="mt-6 px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-cyan-500 transition-colors">Gönder</button>
            </div>
       );
    };
    
    const renderDrawing = () => {
        if(hasSubmittedCurrentRound) return <div className="text-center p-8"><p className="text-xl text-slate-300 animate-pulse">Diğer oyuncuların çizim yapması bekleniyor...</p></div>;
        if(!previousRound || !previousRound.prompt_text) return <div className="text-center p-8"><p className="text-xl text-slate-300 animate-pulse">Önceki tur verisi bekleniyor...</p></div>;
        return (
            <div className="flex flex-col items-center">
                <h2 className="text-3xl font-bold mb-2 text-cyan-300">Şimdi Çiz!</h2>
                <p className="text-lg mb-4">Aşağıdaki cümleyi çizmeye çalışın:</p>
                <p className="text-center mb-4 p-3 bg-slate-800 rounded-lg w-full text-xl font-semibold text-yellow-300">"{previousRound.prompt_text}"</p>
                <canvas ref={canvasRef} width="450" height="300" className="bg-slate-800 rounded-lg border-2 border-cyan-700 cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}></canvas>
                <button onClick={submitDrawing} className="mt-6 px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors">Çizimi Gönder</button>
            </div>
        );
    };

    const renderDescribing = () => {
         if(hasSubmittedCurrentRound) return <div className="text-center p-8"><p className="text-xl text-slate-300 animate-pulse">Diğer oyuncuların tahmin yapması bekleniyor...</p></div>;
         if(!previousRound || !previousRound.drawing_data) return <div className="text-center p-8"><p className="text-xl text-slate-300 animate-pulse">Önceki tur verisi bekleniyor...</p></div>;
         return (
            <div className="flex flex-col items-center">
                <h2 className="text-3xl font-bold mb-2 text-cyan-300">Ne Görüyorsun?</h2>
                <p className="text-lg mb-4">Aşağıdaki çizimi bir cümleyle açıklayın:</p>
                <img src={previousRound.drawing_data.data} alt="Player drawing" className="w-[450px] h-[300px] bg-slate-800 rounded-lg border-2 border-cyan-700"/>
                <input type="text" value={myDescription} onChange={e => setMyDescription(e.target.value)} className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg text-white focus:border-cyan-500 focus:ring-cyan-500 transition mt-4" placeholder="Gördüğünü yaz..."/>
                <button onClick={submitDescription} disabled={myDescription.trim() === ''} className="mt-6 px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-cyan-500 transition-colors">Tahmini Gönder</button>
            </div>
         );
    }
    
    const ResultsDisplay: React.FC<{ allRounds: GameRound[]; allPlayers: Player[] }> = ({ allRounds, allPlayers }) => {
        const [currentChainIndex, setCurrentChainIndex] = useState(0);

        const chains = useMemo(() => {
            const groupedByChain = allRounds.reduce((acc, round) => {
                const key = round.chain_starter_id;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(round);
                return acc;
            }, {} as Record<string, GameRound[]>);

            return Object.values(groupedByChain).map(chain =>
                chain.sort((a, b) => a.round_number - b.round_number)
            );
        }, [allRounds]);

        if (chains.length === 0) {
            return <p>Sonuçlar yükleniyor veya hiç tur oynanmadı.</p>;
        }

        const currentChain = chains[currentChainIndex];
        const starterPlayer = allPlayers.find(p => p.user_id === currentChain[0].chain_starter_id);

        return (
            <div className="text-white p-4 w-full">
                <h2 className="text-2xl font-bold mb-4">Sonuçlar</h2>
                <div className="flex justify-between items-center mb-4">
                    <button 
                        onClick={() => setCurrentChainIndex(prev => (prev - 1 + chains.length) % chains.length)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Önceki Zincir
                    </button>
                    <h3 className="text-xl">{(starterPlayer?.profile?.username || 'Bilinmeyen Oyuncu')}'nın Zinciri</h3>
                    <button 
                        onClick={() => setCurrentChainIndex(prev => (prev + 1) % chains.length)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Sonraki Zincir
                    </button>
                </div>
                <div className="space-y-4">
                    {currentChain.map((round, index) => {
                        const player = allPlayers.find(p => p.user_id === round.player_id);
                        return (
                            <div key={round.id} className="bg-gray-800 p-4 rounded-lg">
                                <p className="font-semibold">{index + 1}. Adım - {(player?.profile?.username || 'Bilinmeyen')}</p>
                                {round.prompt_text && <p className="text-lg">{round.prompt_text}</p>}
                                {round.drawing_data?.data && <img src={round.drawing_data.data} alt={`Çizim ${index + 1}`} className="max-w-full h-auto rounded-md mt-2" />}
                            </div>
                        );
                    })}
                </div>
                <button onClick={onClose} className="mt-8 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-colors">Oyundan Çık</button>
            </div>
        );
    };


    const renderContent = () => {
        switch(gameState) {
            case 'loading': return <div className="text-center p-8"><p className="text-xl text-slate-300 animate-pulse">Oyun yükleniyor...</p></div>;
            case 'lobby': return renderLobby();
            case 'prompting': return renderPrompting();
            case 'playing': {
                if (!myPlayerInfo) return <p>Oyuncu bilgileri bekleniyor...</p>;

                // Determine which chain this player is currently working on
                const numPlayers = players.length;
                const chainOwnerJoinOrder = ((myPlayerInfo.join_order - 1) - (currentRoundNumber - 1) + numPlayers) % numPlayers + 1;
                const chainOwner = players.find(p => p.join_order === chainOwnerJoinOrder);

                if (!chainOwner) return <p>Mevcut zincir bulunamadı.</p>;

                // Determine the round number *within the context of the chain*
                const myChainRoundNumber = rounds.filter(r => r.chain_starter_id === chainOwner.user_id).length + 1;

                // In a chain, odd rounds are for prompts/descriptions, even are for drawings
                if (myChainRoundNumber % 2 === 0) {
                    return renderDrawing();
                } else {
                    return renderDescribing();
                }
            }
            case 'results': return <ResultsDisplay allRounds={rounds} allPlayers={players} />;
            default: return <p>Bilinmeyen oyun durumu: {gameState}</p>;
        }
    };

    return (
        <div className="w-[600px] max-w-full bg-slate-900/80 backdrop-blur-lg border-2 border-cyan-700/50 rounded-2xl shadow-2xl p-8 text-white relative flex flex-col items-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl z-10">×</button>
            {renderContent()}
        </div>
    );
};

export default GarticPhoneGame;
