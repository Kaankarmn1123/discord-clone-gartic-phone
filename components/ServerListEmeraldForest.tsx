// components/ServerListEmeraldForest.tsx
import React, { useState, useEffect } from 'react';
import type { Server } from '../types';
import CreateServerModal from './CreateServerModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { tr } from '../constants/tr';

interface ServerListProps {
  servers: Server[];
  onServerSelect: (server: Server | null) => void | Promise<void>;
  activeServerId: string | undefined;
  currentView: 'friends' | 'server' | 'admin' | 'dm' | 'discover';
  onServerCreated: (server: Server) => void;
  onAdminSelect: () => void;
  onDiscoverSelect: () => void;
}

const ServerListEmeraldForest: React.FC<ServerListProps> = ({ servers, onServerSelect, activeServerId, currentView, onServerCreated, onAdminSelect, onDiscoverSelect }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [userOwnsServer, setUserOwnsServer] = useState(true);

  const isAdmin = user?.email === 'kaankaramann55@gmail.com';

  useEffect(() => {
    const checkOwnership = async () => {
      if (!user) return;
      const { count } = await supabase
        .from('servers')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      setUserOwnsServer(count !== null && count > 0);
    };
    checkOwnership();
  }, [user, servers]);
  
  const handleServerCreated = (newServer: Server) => {
    setUserOwnsServer(true);
    onServerCreated(newServer);
  }

  return (
    <>
      <div className="relative w-full flex-shrink-0 h-28 overflow-hidden">
        {/* Organic Forest Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-green-950 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/20 via-green-900/10 to-transparent"></div>
        
        {/* Organic Leaf Pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(16,185,129,0.3) 2px, transparent 2px), radial-gradient(circle at 60px 60px, rgba(34,197,94,0.3) 2px, transparent 2px)',
            backgroundSize: '80px 80px',
          }}></div>
        </div>
        
        {/* Natural Light Rays */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent animate-pulse"></div>
        
        {/* Soft Natural Border */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent blur-sm"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center h-full px-8 space-x-5">
          <ServerIcon 
            text={tr.friends}
            imageUrl="https://gateway.pinata.cloud/ipfs/bafkreignl7hino45ssmnnjwtxcmsamf43ikxwnyjm2zcamuxvk4ujihz6q"
            onClick={() => onServerSelect(null)} 
            isActive={currentView === 'friends' || currentView === 'dm'}
          />
          <ServerIcon 
            text={tr.discoverServers}
            onClick={onDiscoverSelect} 
            isActive={currentView === 'discover'}
            isDiscoverButton
          />
          {isAdmin && (
            <ServerIcon 
              text="Yönetici Paneli" 
              onClick={onAdminSelect} 
              isActive={currentView === 'admin'}
              isAdminButton
            />
          )}
          <div className="h-12 w-0.5 bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
          <div className="flex-1 flex items-center space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-500/30 scrollbar-track-transparent hover:scrollbar-thumb-emerald-400/50 px-2 py-4">
            {servers.map(server => (
              <ServerIcon 
                key={server.id} 
                text={server.name} 
                imageUrl={server.icon_url}
                onClick={() => onServerSelect(server)} 
                isActive={server.id === activeServerId} 
              />
            ))}
          </div>
          {!userOwnsServer && (
            <>
              <div className="h-12 w-0.5 bg-gradient-to-b from-transparent via-green-500/50 to-transparent rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
              <ServerIcon 
                text={tr.createServer}
                isAddButton 
                onClick={() => setCreateModalOpen(true)} 
              />
            </>
          )}
        </div>
      </div>
      {user && (
        <CreateServerModal 
            isOpen={isCreateModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onServerCreated={handleServerCreated}
            userId={user.id}
        />
      )}
    </>
  );
};

interface ServerIconProps {
  text: string;
  imageUrl?: string | null;
  isActive?: boolean;
  isAddButton?: boolean;
  isAdminButton?: boolean;
  isDiscoverButton?: boolean;
  onClick: () => void | Promise<void>;
}

const ServerIcon: React.FC<ServerIconProps> = ({ text, imageUrl, isActive, isAddButton, isAdminButton, isDiscoverButton, onClick }) => {
  const { theme } = useTheme();
  
  return (
    <div className="relative group flex-shrink-0">
      {/* Growing Active Indicator - Plant Stem */}
      <div 
        className={`absolute -bottom-6 w-0.5 rounded-full transition-all duration-500 ease-out left-1/2 -translate-x-1/2 ${
          isActive 
            ? 'h-8 bg-gradient-to-b from-emerald-400 via-green-500 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.6)]' 
            : 'h-0 group-hover:h-6 bg-gradient-to-b from-emerald-300 via-green-400 to-emerald-500 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]'
        }`} 
      />
      {/* Active Leaves */}
      {isActive && (
        <>
          <div className="absolute -bottom-4 left-1/2 -translate-x-6 w-3 h-2 bg-emerald-500 rounded-full blur-sm opacity-60 animate-pulse"></div>
          <div className="absolute -bottom-4 left-1/2 translate-x-3 w-3 h-2 bg-green-500 rounded-full blur-sm opacity-60 animate-pulse"></div>
        </>
      )}
      
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center w-20 h-20 overflow-hidden transition-all duration-500 ease-out
          ${isDiscoverButton ? `bg-gradient-to-br from-teal-900/70 to-emerald-900/70 hover:from-teal-600 hover:to-emerald-600 border-2 border-teal-500/40 hover:border-teal-400/70 shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_35px_rgba(20,184,166,0.45)] backdrop-blur-xl` : ''}
          ${isAddButton ? `bg-gradient-to-br from-emerald-900/70 to-green-900/70 hover:from-emerald-600 hover:to-green-600 border-2 border-emerald-500/40 hover:border-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] backdrop-blur-xl` : theme.colors.bgPrimary} 
          ${isAdminButton ? `bg-gradient-to-br from-lime-600 via-emerald-600 to-green-600 hover:from-lime-500 hover:via-emerald-500 hover:to-green-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]` : ''}
          ${isActive 
            ? `rounded-[2rem] ${theme.colors.activeBackground} shadow-[0_0_30px_rgba(16,185,129,0.5),0_8px_32px_rgba(0,0,0,0.4)] scale-108` 
            : `rounded-3xl group-hover:rounded-[2rem] group-hover:${theme.colors.activeBackground} group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] group-hover:scale-105`
          }
          ${!isAddButton && !isAdminButton && !isDiscoverButton ? 'shadow-2xl shadow-emerald-950/60' : ''}
        `}
      >
        {/* Organic Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-green-400/10 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {isDiscoverButton ? (
           <div className="relative">
             <svg className="w-9 h-9 text-teal-400 transition-all duration-500 group-hover:text-white group-hover:scale-110 drop-shadow-[0_0_12px_rgba(20,184,166,0.7)]" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
             </svg>
             <div className="absolute inset-0 bg-teal-400/25 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
           </div>
        ) : isAddButton ? (
          <div className="relative">
            <svg className="w-9 h-9 text-emerald-400 transition-all duration-500 group-hover:text-white group-hover:rotate-90 group-hover:scale-110 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <div className="absolute inset-0 bg-emerald-400/25 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        ) : isAdminButton ? (
          <div className="relative">
            <svg className="w-9 h-9 text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-all duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-2xl animate-pulse"></div>
          </div>
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt={text} className="object-cover w-full h-full transition-all duration-500 group-hover:scale-110" />
            <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-40' : 'opacity-0 group-hover:opacity-30'}`}></div>
          </>
        ) : (
          <div className="relative">
            <span className="text-2xl font-medium text-white drop-shadow-[0_0_12px_rgba(16,185,129,0.7)] transition-transform duration-500 group-hover:scale-110 tracking-normal">{text.charAt(0)}</span>
            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        )}
        
        {isActive && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-green-500/15 animate-pulse rounded-[inherit]"></div>
            <div className="absolute inset-0 bg-white/5 rounded-[inherit]"></div>
          </>
        )}
        
        {/* Natural Light Sweep */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[inherit]">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-300/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
      </button>
      
      {/* Organic Tooltip - Leaf Shape */}
      <div className={`absolute top-full mt-6 px-6 py-3 text-sm font-normal ${theme.colors.textPrimary} bg-gradient-to-br from-emerald-950/95 via-green-950/95 to-emerald-950/95 backdrop-blur-2xl border-2 border-emerald-500/40 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(16,185,129,0.3)] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-400 whitespace-nowrap z-50 left-1/2 -translate-x-1/2 group-hover:-translate-y-2`}>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-emerald-950 to-green-950 border-l border-t border-emerald-500/40 rotate-45 rounded-tl-lg"></div>
        <span className="relative z-10 text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] tracking-wide">{text}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-emerald-500/10 rounded-2xl"></div>
      </div>
    </div>
  );
};

export default ServerListEmeraldForest;
