import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';


interface FloatingGameLobbyProps {
  sessionId: string;
  onJoin: (game: string, sessionId: string) => void;
  onClose: () => void;
}

export const FloatingGameLobby: React.FC<FloatingGameLobbyProps> = ({ sessionId, onJoin, onClose }) => {
    const { user } = useAuth();
    const [session, setSession] = useState<any | null>(null);
    const [host, setHost] = useState<Profile | null>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const onJoinRef = useRef(onJoin);
    useEffect(() => { onJoinRef.current = onJoin; }, [onJoin]);

    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    const isHost = user?.id === host?.id;

    const handleJoinLobby = async () => {
        if (!user) return;
        
        // Get current player count to determine join_order
        const { data: existingPlayers, error: countError } = await supabase
            .from('game_session_players')
            .select('user_id')
            .eq('session_id', sessionId);
        
        if (countError) {
            console.error('Error counting existing players', countError);
            setError('Lobiye katılırken bir hata oluştu: ' + countError.message);
            return;
        }
        
        const joinOrder = (existingPlayers?.length || 0) + 1;
        
        const { error } = await supabase.from('game_session_players').insert({
            session_id: sessionId,
            user_id: user.id,
            join_order: joinOrder
        });
        if (error) {
            console.error('Error joining lobby', error);
            setError('Lobiye katılırken bir hata oluştu: ' + error.message);
        }
    };

    const handleStartGame = async () => {
        if (!isHost) return;

        if (session.game_type === 'Gartic Phone' && players.length < 2) {
            setError('Gartic Phone en az 2 oyuncu gerektirir.');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const { error } = await supabase
            .from('game_sessions')
            .update({ status: 'in_progress' })
            .eq('id', sessionId);

        if (error) {
            console.error('Error starting game:', error);
            setError('Oyun başlatılamadı: ' + error.message);
        } else {
            onJoin(session.game_type, sessionId);
        }
    };

    const sessionRef = useRef(session);
    useEffect(() => { sessionRef.current = session; }, [session]);

    useEffect(() => {
        if (session?.status === 'in_progress') {
            onJoinRef.current(session.game_type, session.id);
        }
    }, [session?.status, session?.game_type, session?.id]);

    useEffect(() => {
        if (session?.status === 'in_progress') {
            onJoinRef.current(session.game_type, session.id);
        }
    }, [session?.status, session?.game_type, session?.id]);

    useEffect(() => {
        const abortController = new AbortController();
        const signal = abortController.signal;

        const fetchLobbyData = async () => {
            try {
                const { data: sessionData, error: sessionError } = await supabase
                    .from('game_sessions')
                    .select('*')
                    .eq('id', sessionId)
                    .abortSignal(signal)
                    .single();

                if (sessionError) throw sessionError;
                setSession(sessionData);

                if (sessionData?.host_id) {
                    const { data: hostData, error: hostError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', sessionData.host_id)
                        .abortSignal(signal)
                        .single();
                    if (hostError) throw hostError;
                    setHost(hostData);
                } else {
                    setHost(null);
                }

                const { data: playersData, error: playersError } = await supabase
                    .from('game_session_players')
                    .select('user_id')
                    .eq('session_id', sessionId)
                    .abortSignal(signal);

                if (playersError) throw playersError;

                if (playersData && playersData.length > 0) {
                    const userIds = playersData.map(p => p.user_id);
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, username, avatar_url')
                        .in('id', userIds)
                        .abortSignal(signal);

                    if (profilesError) throw profilesError;

                    const profileMap = new Map();
                    profilesData?.forEach(p => {
                        if (!profileMap.has(p.id)) {
                            profileMap.set(p.id, p);
                        }
                    });

                    const combinedPlayers = playersData.map(player => {
                        const profile = profileMap.get(player.user_id);
                        return { user_id: player.user_id, profile };
                    }).filter(p => p.profile);

                    setPlayers(combinedPlayers);
                } else {
                    setPlayers([]);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setError(`Lobi verileri alınamadı: ${err.message}`);
                    console.error(err);
                }
            }
        };

        fetchLobbyData();

        const subscription = supabase
            .channel(`floating-lobby-${sessionId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_session_players', filter: `session_id=eq.${sessionId}` }, fetchLobbyData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` }, (payload: any) => {
                const newStatus = payload.new.status;
                 if (newStatus === 'finished' || newStatus === 'abandoned') {
                    onCloseRef.current();
                }
                if (payload.new) {
                    setSession((currentSession: any) => ({...currentSession, ...payload.new}));
                }
            })
            .subscribe();

        return () => {
            abortController.abort();
            supabase.removeChannel(subscription);
        };
    }, [sessionId]);

    if (!session || !host) {
        return null; // Or a loading indicator
    }

    const isPlayer = players.some(p => p.user_id === user?.id);

    if (!session.game_type) {
        return <p>Oyun bulunamadı.</p>;
    }

    return (
        <div className="fixed bottom-5 right-5 w-80 bg-slate-900/80 backdrop-blur-lg border border-cyan-500/30 rounded-2xl shadow-2xl text-white p-5 animate-fade-in-up z-50">
            <button onClick={onClose} className="absolute top-2 right-3 text-slate-400 hover:text-white text-xl">×</button>
            <div className="flex items-center mb-4">
                {/* TODO: Re-implement game image lookup */}
                <div className="w-16 h-16 rounded-lg mr-4 bg-slate-700" />
                <div>
                    <h3 className="font-bold text-lg text-cyan-300">{session.game_type}</h3>
                    <p className="text-xs text-slate-400">Kurucu: {host.username}</p>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2 text-slate-300">Oyuncular ({players.length})</h4>
                <div className="flex flex-wrap gap-2">
                    {players.map(p => (
                        <img key={p.user_id} src={p.profile.avatar_url} alt={p.profile.username} title={p.profile.username} className="w-8 h-8 rounded-full border-2 border-slate-700"/>
                    ))}
                </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

            {isHost ? (
                <button
                    onClick={handleStartGame}
                    className="w-full py-3 font-bold rounded-lg shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl hover:shadow-green-500/20"
                >
                    Oyunu Başlat
                </button>
            ) : isPlayer ? (
                <button
                    disabled
                    className="w-full py-3 font-bold rounded-lg bg-slate-700 text-slate-400 cursor-not-allowed"
                >
                    Kurucunun oyunu başlatması bekleniyor...
                </button>
            ) : (
                <button
                    onClick={handleJoinLobby}
                    className="w-full py-3 font-bold rounded-lg shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-xl hover:shadow-cyan-500/20"
                >
                    Lobiye Katıl
                </button>
            )}
        </div>
    );
};