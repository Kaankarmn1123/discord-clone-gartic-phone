// components/ActiveGameBanner.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';

interface ActiveGameBannerProps {
  session: { id: string; game_type: string; host_id: string; };
  onJoin: (game: string, sessionId: string) => void;
}

const gameIcons: { [key: string]: string } = {
    'gartic-phone': '🎨',
    'card-match': '🧠',
    'blackjack': '🃏',
    'snake': '🐍',
};

const ActiveGameBanner: React.FC<ActiveGameBannerProps> = ({ session, onJoin }) => {
    const { user } = useAuth();
    const [host, setHost] = useState<Profile | null>(null);
    const [players, setPlayers] = useState<Profile[]>([]);

    useEffect(() => {
        const fetchGameData = async () => {
            const { data: hostData } = await supabase.from('profiles').select('*').eq('id', session.host_id).single();
            if (hostData) setHost(hostData);

            const { data: playersData } = await supabase.from('game_session_players').select('profile:profiles(*)').eq('session_id', session.id);
            if(playersData) setPlayers(playersData.map(p => p.profile as Profile));
        };
        fetchGameData();
        
        const sub = supabase.channel(`game-banner-${session.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_session_players', filter: `session_id=eq.${session.id}`}, fetchGameData)
            .subscribe();
            
        return () => { supabase.removeChannel(sub); };

    }, [session.id, session.host_id]);

    const isPlayer = players.some(p => p.id === user?.id);

    return (
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-3 m-4 rounded-xl border border-purple-700/50 shadow-lg flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-4">
                <div className="text-4xl animate-pulse">{gameIcons[session.game_type] || '🎮'}</div>
                <div>
                    <h3 className="font-bold text-white">Aktif Oyun: {session.game_type.replace('-', ' ').toUpperCase()}</h3>
                    <p className="text-xs text-slate-300">
                        {host?.username || 'Birisi'} tarafından başlatıldı. Oyuncular: {players.length}
                    </p>
                    <div className="flex -space-x-2 mt-1">
                        {players.slice(0, 5).map(p => (
                            <img key={p.id} src={p.avatar_url || ''} alt={p.username} className="w-6 h-6 rounded-full border-2 border-slate-900" title={p.username} />
                        ))}
                    </div>
                </div>
            </div>
            {!isPlayer && (
                <button 
                    onClick={() => onJoin(session.game_type, session.id)}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform"
                >
                    Katıl
                </button>
            )}
             {isPlayer && (
                 <button 
                    onClick={() => onJoin(session.game_type, session.id)}
                    className="px-6 py-2.5 bg-gradient-to-r from-slate-700 to-slate-600 text-white font-bold rounded-lg shadow-md hover:scale-105 transition-transform"
                >
                    Oyuna Dön
                </button>
            )}
        </div>
    );
}

export default ActiveGameBanner;
