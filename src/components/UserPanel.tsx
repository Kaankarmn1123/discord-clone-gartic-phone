// src/components/UserPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tr } from '../constants/tr';
import StatusIndicator from './StatusIndicator';
import UserStatusMenu from './UserStatusMenu';
import SettingsModal from './SettingsModal';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';

const SettingsIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734-2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379-1.561-2.6 0-2.978a1.532 1.532 0 01.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>;
const SignOutIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>;


const UserPanel = () => {
    const { user, profile, refetchProfile, updateStatus } = useAuth();
    const { theme } = useTheme();
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        // First, update the status to offline for a clean exit
        await updateStatus('offline');
        // Then, sign out from Supabase
        await supabase.auth.signOut();
    };

    if (!profile) return null;

    return (
        <>
            <div className="relative" ref={userMenuRef}>
                {isUserMenuOpen && (
                    <div className={`absolute bottom-full left-2 right-2 mb-2 p-1 ${theme.colors.bgTertiary} rounded-lg shadow-xl z-20`}>
                        <UserStatusMenu onStatusSelect={updateStatus} onClose={() => setUserMenuOpen(false)} />
                        <div className={`h-px my-1 ${theme.colors.bgPrimary}`}></div>
                        <button onClick={handleSignOut} className="w-full flex items-center text-left px-3 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white rounded">
                            <SignOutIcon /> <span>{tr.signOut}</span>
                        </button>
                    </div>
                )}
                <div className={`w-full flex items-center justify-between p-2 ${theme.colors.bgTertiary}/70 border-t ${theme.colors.borderPrimary}/50`}>
                    <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center min-w-0 p-1 rounded hover:bg-slate-700/50">
                        <div className="relative mr-2">
                            <img src={profile.avatar_url || `https://robohash.org/${user?.id}.png?set=set1&size=40x40`} alt={profile.username} className="w-8 h-8 rounded-full"/>
                            <StatusIndicator status={profile.status} className="absolute -bottom-0.5 -right-0.5" />
                        </div>
                        <div className="flex-grow text-left min-w-0">
                            <span className={`text-sm font-semibold truncate ${theme.colors.textPrimary}`}>{profile.username}</span>
                        </div>
                    </button>
                     <button 
                        onClick={() => setSettingsModalOpen(true)} 
                        className={`p-2 ${theme.colors.textSecondary} rounded-md hover:bg-slate-700/50 border ${theme.colors.bgSecondary} border-t-slate-700/50 border-l-slate-700/50 border-b-black/50 border-r-black/50`}
                    >
                        <SettingsIcon />
                    </button>
                </div>
            </div>
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} onProfileUpdate={refetchProfile} />
        </>
    );
}
export default UserPanel;