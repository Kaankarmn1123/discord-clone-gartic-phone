// components/ServerListRedSparrow.tsx
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

const ServerListRedSparrow: React.FC<ServerListProps> = ({ servers, onServerSelect, activeServerId, currentView, onServerCreated, onAdminSelect, onDiscoverSelect }) => {
  const { user } = useAuth();
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
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-slate-950 to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)' }}></div>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
        
        <div className="relative z-10 flex items-center h-full px-6 space-x-3">
          <ServerIcon text={tr.friends} imageUrl="https://gateway.pinata.cloud/ipfs/bafkreignl7hino45ssmnnjwtxcmsamf43ikxwnyjm2zcamuxvk4ujihz6q" onClick={() => onServerSelect(null)} isActive={currentView === 'friends' || currentView === 'dm'} />
          <ServerIcon text={tr.discoverServers} onClick={onDiscoverSelect} isActive={currentView === 'discover'} isDiscoverButton />
          {isAdmin && <ServerIcon text="Yönetici Paneli" onClick={onAdminSelect} isActive={currentView === 'admin'} isAdminButton />}
          <div className="h-16 w-[2px] bg-gradient-to-b from-transparent via-red-500/60 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          <div className="flex-1 flex items-center space-x-3 overflow-x-auto scrollbar-thin scrollbar-thumb-red-600/40 scrollbar-track-transparent hover:scrollbar-thumb-red-500/60 px-2 py-4">
            {servers.map(server => <ServerIcon key={server.id} text={server.name} imageUrl={server.icon_url} onClick={() => onServerSelect(server)} isActive={server.id === activeServerId} />)}
          </div>
          {!userOwnsServer && (
            <>
              <div className="h-16 w-[2px] bg-gradient-to-b from-transparent via-violet-500/60 to-transparent shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
              <ServerIcon text={tr.createServer} isAddButton onClick={() => setCreateModalOpen(true)} />
            </>
          )}
        </div>
      </div>
      {user && <CreateServerModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onServerCreated={handleServerCreated} userId={user.id} />}
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
      {isActive && (
        <>
          <div className="absolute -top-7 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
          <div className="absolute -bottom-7 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_15px_rgba(139,92,246,0.8)]"></div>
        </>
      )}
      
      <button onClick={onClick} className={`relative flex items-center justify-center w-20 h-20 overflow-hidden transition-all duration-300 ease-out font-black
          ${isDiscoverButton ? `bg-gradient-to-br from-slate-900 to-black hover:from-cyan-600 hover:to-cyan-800 border-2 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)]` : ''}
          ${isAddButton ? `bg-gradient-to-br from-slate-900 to-black hover:from-violet-600 hover:to-violet-800 border-2 border-violet-500/50 hover:border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)]` : theme.colors.bgPrimary} 
          ${isAdminButton ? `bg-gradient-to-br from-amber-600 via-red-600 to-red-700 hover:from-amber-500 hover:via-red-500 hover:to-red-600 shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)]` : ''}
          ${isActive 
            ? `shadow-[0_0_30px_rgba(239,68,68,0.6),0_0_50px_rgba(139,92,246,0.4)] scale-110 ring-2 ring-red-500/60` 
            : `group-hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] group-hover:scale-105 group-hover:ring-2 group-hover:ring-red-400/40`
          }
          ${!isAddButton && !isAdminButton && !isDiscoverButton ? 'shadow-xl shadow-black/80' : ''}
        `}
        style={{ clipPath: isActive || isAdminButton ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' : 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {isDiscoverButton ? <svg className="w-9 h-9 text-cyan-400 transition-all duration-300 group-hover:text-white group-hover:scale-125 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        : isAddButton ? <svg className="w-10 h-10 text-violet-400 transition-all duration-300 group-hover:text-white group-hover:rotate-180 group-hover:scale-125 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
        : isAdminButton ? <svg className="w-9 h-9 text-white drop-shadow-[0_0_15px_rgba(239,68,68,1)] transition-all duration-300 group-hover:scale-125" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
        : imageUrl ? <><img src={imageUrl} alt={text} className="object-cover w-full h-full transition-all duration-300 group-hover:scale-110 group-hover:brightness-125" /><div className={`absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-violet-500/20 transition-opacity duration-300 ${isActive ? 'opacity-50' : 'opacity-0 group-hover:opacity-40'}`}></div></>
        : <span className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-transform duration-300 group-hover:scale-125 tracking-tighter">{text.charAt(0)}</span>}
        {isActive && <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-violet-500/20 animate-pulse"></div>}
      </button>
      <div className={`absolute top-full mt-4 px-5 py-2 text-sm font-black ${theme.colors.textPrimary} bg-gradient-to-r from-red-950 via-slate-950 to-violet-950 border-2 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.5)] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 left-1/2 -translate-x-1/2 tracking-wider uppercase text-xs`} style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)' }}>
        <span className="relative z-10 text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">{text}</span>
      </div>
    </div>
  );
};

export default ServerListRedSparrow;
