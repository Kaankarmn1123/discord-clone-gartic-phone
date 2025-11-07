// components/ServerListRoyalAmethyst.tsx
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

const ServerListRoyalAmethyst: React.FC<ServerListProps> = ({ servers, onServerSelect, activeServerId, currentView, onServerCreated, onAdminSelect, onDiscoverSelect }) => {
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
        {/* Luxurious Royal Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-fuchsia-950 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/25 via-transparent to-transparent"></div>
        
        {/* Diamond Pattern */}
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(168,85,247,0.4) 45%, rgba(168,85,247,0.4) 55%, transparent 60%), linear-gradient(-45deg, transparent 40%, rgba(192,132,252,0.4) 45%, rgba(192,132,252,0.4) 55%, transparent 60%)',
            backgroundSize: '30px 30px',
          }}></div>
        </div>
        
        {/* Elegant Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/8 to-transparent animate-pulse"></div>
        
        {/* Royal Borders */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500/60 to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center h-full px-8 space-x-4">
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
          <div className="h-16 w-px bg-gradient-to-b from-transparent via-purple-500/50 to-transparent shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
          <div className="flex-1 flex items-center space-x-5 overflow-x-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent hover:scrollbar-thumb-purple-400/50 px-2 py-4">
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
              <div className="h-16 w-px bg-gradient-to-b from-transparent via-fuchsia-500/50 to-transparent shadow-[0_0_10px_rgba(217,70,239,0.4)]" />
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
      {/* Elegant Active Indicator - Crown Shape */}
      <div 
        className={`absolute -bottom-6 transition-all duration-500 ease-out left-1/2 -translate-x-1/2 ${
          isActive 
            ? 'w-16 h-2' 
            : 'w-0 h-0 group-hover:w-12 group-hover:h-1.5'
        }`} 
      >
        <div className={`w-full h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 ${isActive ? 'shadow-[0_0_20px_rgba(168,85,247,0.8)]' : 'group-hover:shadow-[0_0_15px_rgba(168,85,247,0.6)]'}`}
             style={{ clipPath: 'polygon(0% 100%, 10% 0%, 20% 100%, 30% 0%, 40% 100%, 50% 0%, 60% 100%, 70% 0%, 80% 100%, 90% 0%, 100% 100%)' }}></div>
      </div>
      
      <button
        onClick={onClick}
        className={`relative flex items-center justify-center w-20 h-20 overflow-hidden transition-all duration-500 ease-out
          ${isDiscoverButton ? `bg-gradient-to-br from-purple-900/80 to-fuchsia-900/80 hover:from-purple-600 hover:to-fuchsia-600 border-2 border-purple-500/50 hover:border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] backdrop-blur-xl` : ''}
          ${isAddButton ? `bg-gradient-to-br from-fuchsia-900/80 to-purple-900/80 hover:from-fuchsia-600 hover:to-purple-600 border-2 border-fuchsia-500/50 hover:border-fuchsia-400/80 shadow-[0_0_25px_rgba(217,70,239,0.3)] hover:shadow-[0_0_40px_rgba(217,70,239,0.5)] backdrop-blur-xl` : theme.colors.bgPrimary} 
          ${isAdminButton ? `bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-600 shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:shadow-[0_0_50px_rgba(168,85,247,0.7)]` : ''}
          ${isActive 
            ? `rounded-none ${theme.colors.activeBackground} shadow-[0_0_35px_rgba(168,85,247,0.6),0_0_60px_rgba(217,70,239,0.4),0_8px_32px_rgba(0,0,0,0.5)] scale-110 ring-4 ring-purple-500/40 rotate-45` 
            : `rounded-sm group-hover:rounded-none group-hover:${theme.colors.activeBackground} group-hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] group-hover:scale-105 group-hover:ring-2 group-hover:ring-purple-400/30 group-hover:rotate-45`
          }
          ${!isAddButton && !isAdminButton && !isDiscoverButton ? 'shadow-2xl shadow-purple-950/70' : ''}
        `}
      >
        {/* Diamond Facet Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-300/10 via-transparent to-fuchsia-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
             style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
        
        <div className={`${isActive || 'group-hover:-rotate-45'} ${isActive && '-rotate-45'} transition-transform duration-500`}>
          {isDiscoverButton ? (
             <div className="relative">
               <svg className="w-9 h-9 text-purple-300 transition-all duration-500 group-hover:text-white group-hover:scale-110 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
               </svg>
               <div className="absolute inset-0 bg-purple-400/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             </div>
          ) : isAddButton ? (
            <div className="relative">
              <svg className="w-9 h-9 text-fuchsia-300 transition-all duration-500 group-hover:text-white group-hover:rotate-90 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <div className="absolute inset-0 bg-fuchsia-400/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ) : isAdminButton ? (
            <div className="relative">
              <svg className="w-9 h-9 text-white drop-shadow-[0_0_20px_rgba(168,85,247,1)] transition-all duration-500 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <div className="absolute inset-0 bg-purple-300/40 blur-3xl animate-pulse"></div>
            </div>
          ) : imageUrl ? (
            <>
              <img src={imageUrl} alt={text} className="object-cover w-full h-full transition-all duration-500 group-hover:scale-110" />
              <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/20 via-fuchsia-500/15 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-50' : 'opacity-0 group-hover:opacity-40'}`}></div>
            </>
          ) : (
            <div className="relative">
              <span className="text-3xl font-serif font-bold text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.9)] transition-transform duration-500 group-hover:scale-110 tracking-tight">{text.charAt(0)}</span>
              <div className="absolute inset-0 bg-purple-400/25 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          )}
        </div>
        
        {isActive && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-fuchsia-500/15 to-purple-500/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-white/5"></div>
          </>
        )}
        
        {/* Crystalline Shine */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-200/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
      </button>
      
      {/* Luxurious Tooltip */}
      <div className={`absolute top-full mt-7 px-7 py-3.5 text-sm font-serif ${theme.colors.textPrimary} bg-gradient-to-br from-purple-950/98 via-fuchsia-950/98 to-purple-950/98 backdrop-blur-3xl border-2 border-purple-500/50 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.4)] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-400 whitespace-nowrap z-50 left-1/2 -translate-x-1/2 group-hover:-translate-y-2`}
           style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%, 0% 5%)' }}>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-500/50"></div>
        <span className="relative z-10 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.7)] tracking-widest uppercase text-xs font-bold">{text}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-fuchsia-500/15 to-purple-500/15" 
             style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%, 0% 5%)' }}></div>
      </div>
    </div>
  );
};

export default ServerListRoyalAmethyst;
