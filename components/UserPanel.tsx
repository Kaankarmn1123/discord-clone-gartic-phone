// components/UserPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tr } from '../constants/tr';
import StatusIndicator from './StatusIndicator';
import UserStatusMenu from './UserStatusMenu';
import SettingsModal from './SettingsModal';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379-1.561-2.6 0-2.978a1.532 1.532 0 01.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    ></path>
  </svg>
);

const SignOutIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    ></path>
  </svg>
);

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!profile) return null;

  return (
    <>
      <div className="relative" ref={userMenuRef}>
        {/* Kullanıcı menüsü */}
        {isUserMenuOpen && (
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-2 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md ${theme.colors.bgTertiary} z-30 w-56 animate-fadeIn`}
          >
            <UserStatusMenu
              onStatusSelect={updateStatus}
              onClose={() => setUserMenuOpen(false)}
            />
            <div className="h-px my-2 bg-white/10"></div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all"
            >
              <SignOutIcon />
              <span>{tr.signOut}</span>
            </button>
          </div>
        )}

        {/* Alt panel */}
        <div
          className={`w-full flex items-center justify-between p-3 rounded-t-xl border-t ${theme.colors.borderPrimary}/30 bg-gradient-to-r from-slate-800/70 to-slate-900/70 hover:from-slate-800/80 transition-all`}
        >
          <button
            onClick={() => setUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center min-w-0 p-1 rounded-lg hover:bg-white/5 transition"
          >
            <div className="relative mr-3">
              <img
                src={
                  profile.avatar_url ||
                  `https://robohash.org/${user?.id}.png?set=set1&size=40x40`
                }
                alt={profile.username}
                className="w-9 h-9 rounded-full ring-2 ring-white/10 hover:ring-white/20 transition"
              />
              <StatusIndicator
                status={profile.status}
                className="absolute -bottom-0.5 -right-0.5"
              />
            </div>
            <div className="flex-grow text-left min-w-0">
              <p className={`text-sm font-semibold truncate ${theme.colors.textPrimary}`}>
                {profile.username}
              </p>
              <p className="text-xs text-gray-400 truncate opacity-70">Profil</p>
            </div>
          </button>

          <button
            onClick={() => setSettingsModalOpen(true)}
            className={`p-2 rounded-lg transition-all hover:bg-white/10 ${theme.colors.textSecondary}`}
            title="Ayarlar"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onProfileUpdate={refetchProfile}
      />
    </>
  );
};

export default UserPanel;
