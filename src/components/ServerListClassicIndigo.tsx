// src/components/ServerListClassicIndigo.tsx
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

const ServerListClassicIndigo: React.FC<ServerListProps> = ({ servers, onServerSelect, activeServerId, currentView, onServerCreated, onAdminSelect, onDiscoverSelect }) => {
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
      <div className="relative w-full flex-shrink-0 h-24 overflow-hidden border-b border-indigo-900/30">
        {/* Clean Minimal Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/20 via-transparent to-indigo-950/20"></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}></div>
        </div>
        
        {/* Minimal Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center h-full px-6 space-x-4">
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
          <div className="h-10 w-[1px] bg-indigo-800/40" />
          <div className="flex-1 flex items-center space-x-3 overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-800/30 scrollbar-track-transparent hover:scrollbar-thumb-indigo-700/50 px-2 py-4">
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
              <div className="h-10 w-[1px] bg-indigo-800/40" />
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
      {/* Clean Active Indicator - Simple Line */}
      <div 
        className={`absolute -bottom-5 h-[2px] transition-all duration-300 ease-out left-1/2 -translate-x-1/2 ${
          isActive 
            ? 'w-12 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]' 
            : 'w-0 group-hover:w-8 bg-indigo-400 group-hover:shadow-[0_0_8px_rgba(99,102,241,0.4)]'
        }`} 
      />
      
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center w-16 h-16 overflow-hidden transition-all duration-300 ease-out
          ${isDiscoverButton ? `bg-slate-800/80 hover:bg-indigo-700 border border-indigo-700/40 hover:border-indigo-500/60 shadow-lg hover:shadow-indigo-500/20` : ''}
          ${isAddButton ? `bg-slate-800/80 hover:bg-indigo-700 border border-indigo-700/40 hover:border-indigo-500/60 shadow-lg hover:shadow-indigo-500/20` : theme.colors.bgPrimary} 
          ${isAdminButton ? `bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50` : ''}
          ${isActive 
            ? `rounded-lg ${theme.colors.activeBackground} shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105 ring-2 ring-indigo-500/50` 
            : `rounded-md group-hover:rounded-lg group-hover:${theme.colors.activeBackground} group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:scale-105 group-hover:ring-1 group-hover:ring-indigo-500/30`
          }
          ${!isAddButton && !isAdminButton && !isDiscoverButton ? 'shadow-lg shadow-slate-950/50' : ''}
        `}
      >
        {/* Minimal Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {isDiscoverButton ? (
           <div className="relative">
             <svg className="w-7 h-7 text-indigo-300 transition-all duration-300 group-hover:text-white group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
             </svg>
           </div>
        ) : isAddButton ? (
          <div className="relative">
            <svg className="w-7 h-7 text-indigo-300 transition-all duration-300 group-hover:text-white group-hover:rotate-90 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
        ) : isAdminButton ? (
          <div className="relative">
            <svg className="w-7 h-7 text-white transition-all duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt={text} className="object-cover w-full h-full transition-all duration-300 group-hover:scale-105" />
            <div className={`absolute inset-0 bg-indigo-500/10 transition-opacity duration-300 ${isActive ? 'opacity-30' : 'opacity-0 group-hover:opacity-20'}`}></div>
          </>
        ) : (
          <div className="relative">
            <span className="text-xl font-semibold text-white transition-transform duration-300 group-hover:scale-105 tracking-tight">{text.charAt(0)}</span>
          </div>
        )}
        
        {isActive && (
          <div className="absolute inset-0 bg-indigo-500/10"></div>
        )}
        
        {/* Minimal Shine */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </div>
      </button>
      
      {/* Clean Tooltip */}
      <div className={`absolute top-full mt-4 px-4 py-2 text-xs font-medium ${theme.colors.textPrimary} bg-slate-900/95 backdrop-blur-sm border border-indigo-500/30 rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.6)] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 left-1/2 -translate-x-1/2 group-hover:-translate-y-1`}>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-l border-t border-indigo-500/30 rotate-45"></div>
        <span className="relative z-10 text-indigo-300 tracking-wide">{text}</span>
      </div>
    </div>
  );
};

export default ServerListClassicIndigo;
