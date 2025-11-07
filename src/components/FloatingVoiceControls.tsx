// src/components/FloatingVoiceControls.tsx
import React from 'react';
import { tr } from '../constants/tr';
import { useTheme } from '../contexts/ThemeContext';

const MuteIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
const UnmuteIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const VideoOnIcon = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const VideoOffIcon = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ScreenShareIcon = () => <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LeaveIcon = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1h16V5a2 2 0 00-2-2H5zM5 19a2 2 0 002 2h10a2 2 0 002-2v-1H5v1z" /></svg>;
const SpinnerIcon = () => <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

interface FloatingVoiceControlsProps {
    agora: any;
}

const FloatingVoiceControls: React.FC<FloatingVoiceControlsProps> = ({ agora }) => {
    const { leave, muteAudio, isAudioMuted, muteVideo, isVideoMuted, toggleScreenShare, isScreenSharing, isJoining, isTogglingScreenShare } = agora;
    const { theme } = useTheme();

    const controlButtonClasses = "p-3 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className={`flex items-center space-x-4 ${theme.colors.bgSecondary}/80 backdrop-blur-sm p-2 rounded-xl shadow-2xl border ${theme.colors.borderPrimary}/50`}>
                <button 
                    onClick={() => muteAudio(!isAudioMuted)} 
                    disabled={isJoining}
                    className={`${controlButtonClasses} ${isAudioMuted ? 'bg-red-600 hover:bg-red-700' : `${theme.colors.bgMuted} hover:bg-slate-500`}`}
                    aria-label={isAudioMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                >
                    {isAudioMuted ? <UnmuteIcon/> : <MuteIcon/>}
                </button>
                <button 
                    onClick={() => muteVideo(!isVideoMuted)} 
                    disabled={isJoining}
                    className={`${controlButtonClasses} ${isVideoMuted ? `${theme.colors.bgMuted} hover:bg-slate-500` : 'bg-slate-600'}`}
                    aria-label={isVideoMuted ? tr.openCamera : tr.closeCamera}
                >
                    {isVideoMuted ? <VideoOffIcon/> : <VideoOnIcon/>}
                </button>
                <button 
                    onClick={() => toggleScreenShare(!isScreenSharing)} 
                    disabled={isJoining || isTogglingScreenShare}
                    className={`${controlButtonClasses} ${isScreenSharing ? 'bg-green-600 hover:bg-green-700' : `${theme.colors.bgMuted} hover:bg-slate-500`}`}
                    aria-label={isScreenSharing ? tr.stopSharing : tr.shareScreen}
                >
                    {isTogglingScreenShare ? <SpinnerIcon /> : <ScreenShareIcon/>}
                </button>
                <div className="h-6 w-px bg-slate-600" />
                <button 
                    onClick={leave} 
                    className={`${controlButtonClasses} bg-red-600 hover:bg-red-700`}
                    aria-label="Aramadan Ayrıl"
                >
                    <LeaveIcon/>
                </button>
            </div>
        </div>
    );
};

export default FloatingVoiceControls;