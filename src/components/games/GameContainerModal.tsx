// components/games/GameContainerModal.tsx
import React from 'react';
import CardMatchGame from './CardMatchGame';
import BlackjackGame from './BlackjackGame';
import SnakeGame from './SnakeGame';
import GarticPhoneGame from './GarticPhoneGame'; // YENİ

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';

interface GameContainerModalProps {
  game: string;
  sessionId?: string; // YENİ: Çok oyunculu oyunlar için oturum ID'si
  onClose: () => void;
}

const GameContainerModal: React.FC<GameContainerModalProps> = ({ game, sessionId, onClose }) => {
  const { user } = useAuth();

  // Check if user is authenticated for multiplayer games
  const isMultiplayerGame = ['gartic-phone'].includes(game);
  if (isMultiplayerGame && !user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg animate-fadeIn">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-auto text-center border border-red-500/30">
          <h2 className="text-2xl font-bold text-red-400 mb-4">🔒 Giriş Gerekli</h2>
          <p className="text-slate-300 mb-6">
            Çok oyunculu oyunlara katılmak için lütfen giriş yapın.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  if (!game) return null;

  const saveScoreToSupabase = async (score: number, gameName: string) => {
    if (!user) {
        console.log("Kullanıcı giriş yapmamış, skor kaydedilemedi.");
        return;
    }
    const { error } = await supabase
      .from('game_scores')
      .insert({ user_id: user.id, game_name: gameName, score: score });
      
    if (error) {
      console.error("Skor kaydedilirken hata oluştu:", error);
    } else {
      console.log("Skor başarıyla kaydedildi.");
    }
  };

  const handleGameEnd = (score: number, gameName: string) => {
    console.log(`Oyun bitti! Oyun: ${gameName}, Skor: ${score}`);
    if (score > 0) { // Sadece skoru 0'dan büyükse kaydet
        saveScoreToSupabase(score, gameName);
    }
    onClose();
  };
  
  const handleMultiplayerGameEnd = async () => {
    if (sessionId) {
      // Yalnızca oyunun sunucusu oturumu 'finished' olarak günceller
      const { data: session } = await supabase.from('game_sessions').select('host_id').eq('id', sessionId).single();
      if(session && session.host_id === user?.id) {
        await supabase.from('game_sessions').update({ status: 'finished' }).eq('id', sessionId);
      }
    }
    onClose();
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {game === 'card-match' && <CardMatchGame onGameEnd={(score) => handleGameEnd(score, 'card-match')} onClose={onClose} />}
        {game === 'blackjack' && <BlackjackGame onGameEnd={(score) => handleGameEnd(score, 'blackjack')} onClose={onClose} />}
        {game === 'snake' && <SnakeGame onGameEnd={(score) => handleGameEnd(score, 'snake')} onClose={onClose} />}
        {game === 'gartic-phone' && sessionId && <GarticPhoneGame sessionId={sessionId} onClose={handleMultiplayerGameEnd} />}
        
      </div>
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default GameContainerModal;