// components/VideoPlayer.tsx
import React, { useEffect, useRef } from 'react';
import type { ICameraVideoTrack, IRemoteVideoTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import type { Profile } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const MicOnIcon = () => <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" /></svg>;
const MicOffIcon = () => <svg className="w-4 h-4 text-red-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" /></svg>;
const ScreenShareActiveIcon = () => <svg className="w-4 h-4 text-green-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>;

interface VideoPlayerProps {
  videoTrack: ICameraVideoTrack | IRemoteVideoTrack | ILocalVideoTrack | undefined | null;
  user: Profile & { isScreen?: boolean };
  isLocal?: boolean;
  videoMuted: boolean;
  audioMuted: boolean;
  isSpeaking: boolean;
  className?: string;
  onClick?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoTrack, user, isLocal, videoMuted, audioMuted, isSpeaking, className, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const hasVideo = videoTrack && !videoMuted;

  useEffect(() => {
    const playerRef = ref.current;
    if (playerRef && hasVideo) {
      videoTrack.play(playerRef, { fit: 'contain' });
    }
    return () => {
      videoTrack?.stop();
    };
  }, [videoTrack, hasVideo]);

  return (
    <div 
        onClick={onClick}
        className={`relative aspect-video ${theme.colors.bgTertiary} rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-sm
        ${isSpeaking && !user.isScreen 
          ? 'ring-4 ring-green-500 shadow-green-500/30 shadow-2xl animate-pulse-ring' 
          : 'ring-2 ring-transparent hover:ring-slate-600/50'
        } 
        ${onClick ? 'cursor-pointer hover:shadow-3xl' : ''} 
        ${className}`}
    >
      {/* Video veya Avatar Container */}
      <div ref={ref} className={`w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${isLocal && !user.isScreen ? 'transform scale-x-[-1]' : ''} ${!hasVideo ? 'hidden' : ''}`}></div>
      
      {!hasVideo && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="relative">
              <img 
                src={user.avatar_url || `https://robohash.org/${user.id}.png?set=set1&size=150x150`} 
                alt={user.username} 
                className="w-28 h-28 rounded-full border-4 border-slate-600 shadow-2xl transform transition-transform duration-300 hover:scale-110" 
              />
              {/* Konuşma halinde avatar etrafında parlayan ring */}
              {isSpeaking && !user.isScreen && (
                <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75"></div>
              )}
            </div>
        </div>
      )}

      {/* Konuşma göstergesi - sadece video açıkken ve ekran paylaşımı değilse */}
      {hasVideo && isSpeaking && !user.isScreen && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-2 bg-green-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-white">Konuşuyor</span>
          </div>
        </div>
      )}

      {/* Alt bilgi çubuğu */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {user.isScreen ? (
              <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded-lg border border-green-500/30">
                <ScreenShareActiveIcon />
                <span className="text-xs font-semibold text-green-400">Ekran Paylaşımı</span>
              </div>
            ) : (
              <>
                <div className={`p-1.5 rounded-lg backdrop-blur-sm transition-all duration-300 ${
                  audioMuted 
                    ? 'bg-red-500/20 border border-red-500/30' 
                    : 'bg-green-500/20 border border-green-500/30'
                }`}>
                  {audioMuted ? <MicOffIcon /> : <MicOnIcon />}
                </div>
                <span className="text-white text-sm font-bold truncate drop-shadow-lg">{user.username}</span>
              </>
            )}
          </div>

          {/* Video durumu göstergesi */}
          {!hasVideo && !user.isScreen && (
            <div className="flex items-center gap-1 bg-slate-800/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-600/30">
              <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
              <span className="text-xs text-slate-400 font-medium">Kapalı</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay efekti */}
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-900/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      )}
    </div>
  );
};

export default VideoPlayer;