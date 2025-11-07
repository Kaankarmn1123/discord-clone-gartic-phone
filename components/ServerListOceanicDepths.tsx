// components/ServerListOceanicDepths.tsx
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

const ServerListOceanicDepths: React.FC<ServerListProps> = ({ servers, onServerSelect, activeServerId, currentView, onServerCreated, onAdminSelect, onDiscoverSelect }) => {
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
      <div className="relative w-full flex-shrink-0 h-32 overflow-hidden">
        {/* Fluid Oceanic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-cyan-950 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_var(--tw-gradient-stops))] from-blue-900/30 via-cyan-900/20 to-transparent"></div>
        
        {/* Wave Pattern */}
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute inset-0 animate-wave" style={{
            backgroundImage: 'repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)',
          }}></div>
        </div>
        
        {/* Flowing Light Waves */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-pulse"></div>
        
        {/* Soft Bottom Glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent blur-sm"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center h-full px-8 space-x-6">
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
          <div className="h-12 w-px bg-gradient-to-b from-transparent via-blue-400/30 to-transparent blur-[1px]" />
          <div className="flex-1 flex items-center space-x-5 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent hover:scrollbar-thumb-blue-400/30 px-2 py-4">
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
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent blur-[1px]" />
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
      {/* Floating Active Indicator - Ripple Effect */}
      {isActive && (
        <div className="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping"></div>
      )}
      <div 
        className={`absolute -bottom-8 h-1 rounded-full transition-all duration-700 ease-out left-1/2 -translate-x-1/2 blur-sm ${
          isActive 
            ? 'w-16 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse' 
            : 'w-0 group-hover:w-12 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'
        }`} 
      />
      
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center w-24 h-24 overflow-hidden transition-all duration-700 ease-out rounded-full
          ${isDiscoverButton ? `bg-gradient-to-br from-cyan-900/60 to-blue-900/60 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/30 hover:border-cyan-300/60 shadow-[0_0_25px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] backdrop-blur-2xl` : ''}
          ${isAddButton ? `bg-gradient-to-br from-blue-900/60 to-cyan-900/60 hover:from-blue-500 hover:to-cyan-500 border border-blue-400/30 hover:border-blue-300/60 shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] backdrop-blur-2xl` : theme.colors.bgPrimary} 
          ${isAdminButton ? `bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_50px_rgba(59,130,246,0.6)]` : ''}
          ${isActive 
            ? `${theme.colors.activeBackground} shadow-[0_0_35px_rgba(59,130,246,0.5),0_0_60px_rgba(6,182,212,0.3),0_8px_32px_rgba(0,0,0,0.4)] scale-105` 
            : `group-hover:${theme.colors.activeBackground} group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4),0_8px_32px_rgba(0,0,0,0.3)] group-hover:scale-105`
          }
          ${!isAddButton && !isAdminButton && !isDiscoverButton ? 'shadow-2xl shadow-blue-950/60' : ''}
        `}
      >
        {/* Liquid Ripple Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-cyan-400/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
        
        {isDiscoverButton ? (
           <div className="relative">
             <svg className="w-10 h-10 text-cyan-300 transition-all duration-700 group-hover:text-white group-hover:scale-110 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
             </svg>
             <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
           </div>
        ) : isAddButton ? (
          <div className="relative">
            <svg className="w-11 h-11 text-blue-300 transition-all duration-700 group-hover:text-white group-hover:rotate-90 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
        ) : isAdminButton ? (
          <div className="relative">
            <svg className="w-10 h-10 text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] transition-all duration-700 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <div className="absolute inset-0 bg-blue-300/30 rounded-full blur-3xl animate-pulse"></div>
          </div>
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt={text} className="object-cover w-full h-full transition-all duration-700 group-hover:scale-110" />
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-400/10 via-cyan-400/10 to-transparent transition-opacity duration-700 ${isActive ? 'opacity-40' : 'opacity-0 group-hover:opacity-30'}`}></div>
          </>
        ) : (
          <div className="relative">
            <span className="text-3xl font-light text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-transform duration-700 group-hover:scale-110 tracking-wide">{text.charAt(0)}</span>
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
        )}
        
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/15 to-cyan-400/15 animate-pulse rounded-full"></div>
        )}
        
        {/* Flowing Light Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-full">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-300/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500"></div>
        </div>
      </button>
      
      {/* Floating Tooltip */}
      <div className={`absolute top-full mt-7 px-6 py-3 text-sm font-light ${theme.colors.textPrimary} bg-gradient-to-br from-blue-950/95 via-cyan-950/95 to-blue-950/95 backdrop-blur-3xl border border-blue-400/30 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(59,130,246,0.2)] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-500 whitespace-nowrap z-50 left-1/2 -translate-x-1/2 group-hover:-translate-y-3`}>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-blue-950 to-cyan-950 border-l border-t border-blue-400/30 rotate-45 rounded-tl-md"></div>
        <span className="relative z-10 text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] tracking-wide">{text}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-blue-500/5 rounded-3xl"></div>
      </div>
    </div>
  );
};

export default ServerListOceanicDepths;
