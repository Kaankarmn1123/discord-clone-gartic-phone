// src/components/VoiceControlPanel.tsx
import React from 'react';
import { tr } from '../constants/tr';
import { useTheme } from '../contexts/ThemeContext';

const MuteIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
const UnmuteIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const VideoOnIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const VideoOffIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ScreenShareIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LeaveIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1h16V5a2 2 0 00-2-2H5zM5 19a2 2 0 002 2h10a2 2 0 002-2v-1H5v1z" /></svg>;
const SpinnerIcon = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;


interface VoiceControlPanelProps {
    agora: any;
}

const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({ agora }) => {
    const { leave, muteAudio, isAudioMuted, muteVideo, isVideoMuted, channelName, isJoining, toggleScreenShare, isScreenSharing, isTogglingScreenShare } = agora;
    const { theme } = useTheme();

    return (
        <div className={`${theme.colors.bgSecondary} p-3 border-t ${theme.colors.borderPrimary}/40 backdrop-blur-md bg-gradient-to-t from-slate-900/50 to-transparent shadow-2xl`}>
            <div className="flex items-center justify-between gap-3">
                {/* Sol Taraf - Bağlantı Durumu */}
                <div className="flex items-center gap-2 min-w-0 flex-shrink">
                    <div className="relative">
                        {isJoining ? (
                            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50"></div>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse"></div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold ${isJoining ? 'text-yellow-400' : 'text-green-400'} drop-shadow-lg`}>
                            {isJoining ? tr.connecting : 'Ses Bağlandı'}
                        </p>
                        <p className={`text-xs ${theme.colors.textMuted} truncate max-w-[100px]`}>{channelName}</p>
                    </div>
                </div>

                {/* Sağ Taraf - Kontrol Butonları */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => muteAudio(!isAudioMuted)} 
                        disabled={isJoining}
                        className={`p-2.5 rounded-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm
                            ${isAudioMuted 
                                ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/50 text-white' 
                                : `${theme.colors.bgMuted} hover:bg-slate-500 hover:shadow-slate-500/30 text-white`
                            }`}
                        aria-label={isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                    >
                        {isAudioMuted ? <UnmuteIcon/> : <MuteIcon/>}
                    </button>
                    
                    <button 
                        onClick={() => muteVideo(!isVideoMuted)} 
                        disabled={isJoining}
                        className={`p-2.5 rounded-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm
                            ${isVideoMuted 
                                ? `${theme.colors.bgMuted} hover:bg-slate-500 hover:shadow-slate-500/30 text-white` 
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/50 text-white'
                            }`}
                        aria-label={isVideoMuted ? tr.openCamera : tr.closeCamera}
                    >
                        {isVideoMuted ? <VideoOffIcon/> : <VideoOnIcon/>}
                    </button>
                    
                    <button 
                        onClick={() => toggleScreenShare(!isScreenSharing)} 
                        disabled={isJoining || isTogglingScreenShare}
                        className={`p-2.5 rounded-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-110 active:scale-95 shadow-lg backdrop-blur-sm
                            ${isScreenSharing 
                                ? 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/50 text-white' 
                                : `${theme.colors.bgMuted} hover:bg-slate-500 hover:shadow-slate-500/30 text-white`
                            }`}
                        aria-label={isScreenSharing ? tr.stopSharing : tr.shareScreen}
                    >
                        {isTogglingScreenShare ? <SpinnerIcon /> : <ScreenShareIcon/>}
                    </button>
                    
                    <div className="w-px h-8 bg-slate-600/50 mx-1"></div>
                    
                    <button 
                        onClick={leave} 
                        className="p-2.5 bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-red-500/50 text-white backdrop-blur-sm"
                        aria-label="Aramadan Ayrıl"
                    >
                        <LeaveIcon/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceControlPanel;