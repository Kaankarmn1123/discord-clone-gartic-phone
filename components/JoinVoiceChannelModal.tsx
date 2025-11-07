import React from 'react';
import { tr } from '../constants/tr';

interface JoinVoiceChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  channelName?: string;
}

const JoinVoiceChannelModal: React.FC<JoinVoiceChannelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  channelName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-md mx-4 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl shadow-2xl text-white border border-slate-700/50 overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
        
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative flex items-center space-x-4">
            <div className="flex-shrink-0 w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold drop-shadow-lg">{tr.joinVoiceChannel}</h2>
              <div className="flex items-center mt-1 space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-sm text-green-100 font-medium">Sesli Kanal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-6">
            <p className="text-slate-300 text-base leading-relaxed mb-3">
              {tr.confirmJoinVoice.replace('#{channelName}', '')}
            </p>
            <div className="flex items-center space-x-3 bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-lg font-bold text-white">#{channelName}</span>
                <p className="text-xs text-slate-400 mt-0.5">Sesli kanal</p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-semibold bg-slate-700/50 backdrop-blur-sm rounded-xl hover:bg-slate-700 border border-slate-600/50 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {tr.cancel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>{tr.joinChannel}</span>
            </button>
          </div>
        </div>

        {/* Decorative bottom glow */}
        <div className="h-1 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600"></div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default JoinVoiceChannelModal;