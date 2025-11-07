// components/ServerSettingsModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Server, Profile, ServerInvite } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { tr } from '../constants/tr';
import StatusIndicator from './StatusIndicator';
import Spinner from './Spinner';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: Server;
  onServerUpdate: (updatedServer: Server) => void;
}

interface Member extends Profile {
    user_id: string;
}

const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({ isOpen, onClose, server, onServerUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [joinRequestCount, setJoinRequestCount] = useState(0);

  const fetchRequestCount = useCallback(async () => {
    const { count } = await supabase
        .from('server_invites')
        .select('*', { count: 'exact', head: true })
        .eq('server_id', server.id)
        .eq('status', 'pending')
        .eq('type', 'join_request');
    setJoinRequestCount(count ?? 0);
  }, [server.id]);

  useEffect(() => {
    if (isOpen) {
        fetchRequestCount();
        const sub = supabase.channel(`join-requests-count-${server.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'server_invites', filter: `server_id=eq.${server.id}` }, fetchRequestCount)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }
  }, [isOpen, server.id, fetchRequestCount]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-5xl h-[700px] flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700/30 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="w-80 p-8 space-y-3 border-r border-slate-700/30 bg-gradient-to-b from-slate-900/80 to-slate-900/50 backdrop-blur-xl flex flex-col">
            <div>
                <div className="flex items-center gap-4 mb-8 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734-2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379-1.561-2.6 0-2.978a1.532 1.532 0 01.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                        </svg>
                    </div>
                    <h3 className="text-base font-bold tracking-wide bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent truncate">{server.name}</h3>
                </div>
                <div className="space-y-2">
                    <TabButton name={tr.serverOverview} id="overview" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name={tr.members} id="members" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name={tr.joinRequests} id="requests" activeTab={activeTab} setActiveTab={setActiveTab} badgeCount={joinRequestCount} />
                </div>
            </div>
          <div className="mt-auto pt-8 border-t border-slate-700/30">
             <button onClick={onClose} className="flex items-center justify-center w-14 h-14 text-slate-400 rounded-2xl hover:bg-gradient-to-br hover:from-red-500/20 hover:to-rose-500/20 hover:text-red-400 hover:border hover:border-red-500/30 transition-all duration-300 hover:scale-110 active:scale-95 group">
                <svg className="w-7 h-7 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>
        </div>
        <div className="flex-grow bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm">
          {activeTab === 'overview' && <OverviewTab server={server} onServerUpdate={onServerUpdate} />}
          {activeTab === 'members' && <MembersTab server={server} />}
          {activeTab === 'requests' && <JoinRequestsTab server={server} />}
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ name: string; id: string; activeTab: string; setActiveTab: (id: string) => void; badgeCount?: number }> = ({ name, id, activeTab, setActiveTab, badgeCount }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center justify-between px-5 py-4 text-left rounded-2xl transition-all duration-300 font-semibold group ${
      activeTab === id 
        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 scale-105' 
        : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-800/50 hover:text-white hover:scale-102'
    }`}
  >
    <span className="flex items-center gap-3">
      {id === 'overview' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>}
      {id === 'members' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg>}
      {id === 'requests' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path></svg>}
      {name}
    </span>
    {badgeCount !== undefined && badgeCount > 0 && <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-red-500/30 animate-pulse">{badgeCount}</span>}
  </button>
);

const OverviewTab: React.FC<{ server: Server, onServerUpdate: (updatedServer: Server) => void }> = ({ server, onServerUpdate }) => {
    const [serverName, setServerName] = useState(server.name);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(server.icon_url);
    const [visibility, setVisibility] = useState<'public' | 'private'>(server.visibility || 'private');
    const [requiresApproval, setRequiresApproval] = useState(server.requires_approval || false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const iconInputRef = useRef<HTMLInputElement>(null);

    const hasChanges = serverName !== server.name || iconFile !== null || visibility !== server.visibility || requiresApproval !== server.requires_approval;

    useEffect(() => {
        setServerName(server.name);
        setIconPreview(server.icon_url);
        setVisibility(server.visibility || 'private');
        setRequiresApproval(server.requires_approval || false);
        setIconFile(null);
    }, [server]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE_MB = 2;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError(`Dosya boyutu ${MAX_SIZE_MB}MB'den büyük olamaz.`);
            return;
        }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            setError('Sadece PNG, JPG veya WEBP formatında resim yükleyebilirsiniz.');
            return;
        }
        
        setError('');
        setIconFile(file);
        setIconPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!hasChanges) return;
        setLoading(true);
        setError('');

        let newIconUrl = server.icon_url;

        try {
            if (iconFile) {
                const fileExt = iconFile.name.split('.').pop();
                const filePath = `${server.owner_id}/${server.id}-${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('server-icons')
                    .upload(filePath, iconFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('server-icons').getPublicUrl(filePath);
                newIconUrl = urlData.publicUrl;
            }
            
            const updates = {
                name: serverName.trim(), 
                icon_url: newIconUrl,
                visibility: visibility,
                requires_approval: visibility === 'public' ? requiresApproval : false
            };
    
            const { data, error: updateError } = await supabase
                .from('servers')
                .update(updates)
                .eq('id', server.id)
                .select()
                .single();

            if (updateError) throw updateError;
            
            onServerUpdate(data as Server);
            setIconFile(null);
        } catch (err: any) {
            setError(err.message || 'Sunucu güncellenemedi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 overflow-y-auto h-full text-white">
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
                    <svg className="w-7 h-7 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                    </svg>
                </div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">{tr.serverOverview}</h2>
            </div>
            <div className="p-8 space-y-8 bg-gradient-to-br from-slate-900/60 to-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/30 shadow-2xl">
                <div className="flex items-center gap-8">
                    <input type="file" ref={iconInputRef} onChange={handleFileSelect} accept="image/png, image/jpeg, image/webp" className="hidden" />
                    <button 
                        type="button" 
                        onClick={() => iconInputRef.current?.click()}
                        className="w-28 h-28 flex-shrink-0 rounded-3xl overflow-hidden border-4 border-slate-700/30 hover:border-indigo-500/50 transition-all duration-300 bg-slate-900/50 group relative hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20"
                    >
                        {iconPreview ? (
                            <img src={iconPreview} alt="Server Icon" className="object-cover w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                                <span className="font-bold text-4xl text-slate-300">{serverName.charAt(0)}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="text-center">
                                <svg className="w-8 h-8 text-white mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <p className="text-xs font-bold text-white">DEĞİŞTİR</p>
                            </div>
                        </div>
                    </button>
                    <div className="flex-grow">
                        <label htmlFor="server-name" className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-3">{tr.serverName}</label>
                        <input
                          id="server-name"
                          type="text"
                          value={serverName}
                          onChange={(e) => setServerName(e.target.value)}
                          className="relative block w-full px-5 py-4 text-white text-lg font-medium bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-700/30">
                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-4">{tr.serverVisibility}</label>
                    <div className="space-y-3">
                        <RadioOption name="visibility" value="public" checked={visibility === 'public'} onChange={() => setVisibility('public')} label="Herkese Açık" description={tr.publicDesc} />
                        <RadioOption name="visibility" value="private" checked={visibility === 'private'} onChange={() => setVisibility('private')} label="Özel" description={tr.privateDesc} />
                    </div>
                </div>

                <div className={`pt-6 border-t border-slate-700/30 transition-opacity duration-300 ${visibility === 'private' ? 'opacity-50' : ''}`}>
                     <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-4">{tr.joinApproval}</label>
                     <div className="flex items-center p-4 bg-slate-800/50 rounded-2xl border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200">
                        <input type="checkbox" id="requires-approval" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} disabled={visibility === 'private'} className="w-6 h-6 text-indigo-500 bg-slate-700 border-slate-600 rounded-lg focus:ring-indigo-500 disabled:opacity-50" />
                        <label htmlFor="requires-approval" className="ml-4 text-base font-medium text-white disabled:opacity-50">{tr.requireApproval}</label>
                     </div>
                </div>

                 {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl"><p className="text-sm font-medium text-red-400">{error}</p></div>}

                <div className="flex justify-end pt-6">
                    <button 
                        onClick={handleSave} 
                        disabled={loading || !hasChanges} 
                        className="px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl hover:from-emerald-600 hover:to-green-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl shadow-emerald-500/30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                    >
                        {loading ? tr.saving : tr.saveChanges}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RadioOption: React.FC<{name: string, value: string, checked: boolean, onChange: () => void, label: string, description: string}> = ({name, value, checked, onChange, label, description}) => (
    <label className={`flex p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${checked ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/50'}`}>
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-6 w-6 mt-0.5 text-indigo-500 bg-slate-700 border-slate-600 focus:ring-indigo-500 rounded-full" />
        <div className="ml-5">
            <p className="font-bold text-white text-lg mb-1">{label}</p>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
    </label>
);


const MembersTab: React.FC<{ server: Server }> = ({ server }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        
        const { data, error } = await supabase
            .from('memberships')
            .select('profiles(*)')
            .eq('server_id', server.id);

        if (error) {
          console.error("Error fetching members in settings:", error);
          setMembers([]);
        } else if (data) {
            const memberProfiles = data
                .map(item => {
                    const profile = item.profiles as unknown as Profile;
                    if (!profile) return null;
                    return { ...profile, user_id: profile.id };
                })
                .filter((p): p is Member => p !== null)
                .sort((a, b) => a.username.localeCompare(b.username));
            setMembers(memberProfiles);
        }
        
        setLoading(false);
    }, [server.id]);
    
    useEffect(() => {
        fetchMembers();
        const sub = supabase.channel(`server-settings-members-tab-${server.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships', filter: `server_id=eq.${server.id}`}, fetchMembers)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [fetchMembers, server.id]);
    
    const handleKick = async (memberId: string) => {
        if (window.confirm(tr.kickUserConfirmation.replace('{username}', members.find(m => m.id === memberId)?.username || ''))) {
            await supabase
                .from('memberships')
                .delete()
                .eq('server_id', server.id)
                .eq('user_id', memberId);
        }
    };

    return (
        <div className="p-10 overflow-y-auto h-full text-white">
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
                    <svg className="w-7 h-7 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                    </svg>
                </div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">{tr.members}</h2>
            </div>
            <div className="space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="flex items-center gap-4 text-slate-400">
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="font-medium">{tr.loading}...</span>
                        </div>
                    </div>
                ) : members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900/60 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 group">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={member.avatar_url || `https://i.pravatar.cc/40?u=${member.id}`} alt={member.username} className="w-12 h-12 rounded-2xl ring-2 ring-slate-700/50 object-cover group-hover:ring-indigo-500/50 transition-all duration-300"/>
                                <StatusIndicator status={member.status} className="absolute -bottom-0.5 -right-0.5"/>
                            </div>
                            <span className="font-bold text-lg text-slate-100 group-hover:text-indigo-300 transition-colors duration-200">{member.username}</span>
                        </div>
                        {user?.id !== member.id && server.owner_id === user?.id && (
                             <button 
                                onClick={() => handleKick(member.id)} 
                                className="px-5 py-3 text-sm font-bold text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg hover:shadow-red-500/20"
                             >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                                {tr.kick}
                             </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

type JoinRequest = ServerInvite & { profiles: Profile };

const JoinRequestsTab: React.FC<{ server: Server }> = ({ server }) => {
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [processing, setProcessing] = useState(false);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('server_invites')
            .select('*, profiles:invitee_id(*)')
            .eq('server_id', server.id)
            .eq('status', 'pending')
            .eq('type', 'join_request');
        
        if (error) console.error("Error fetching join requests:", error);
        else setRequests(data as JoinRequest[]);
        setLoading(false);
    }, [server.id]);

    useEffect(() => {
        fetchRequests();
        const sub = supabase.channel(`join-requests-${server.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'server_invites', filter: `server_id=eq.${server.id}`}, fetchRequests)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [fetchRequests, server.id]);

    const handleToggleSelect = (id: string) => {
        setSelected(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelected(new Set(requests.map(r => r.id)));
        else setSelected(new Set());
    };

    const handleBulkAction = async (action: 'approve' | 'decline') => {
        const ids = Array.from(selected);
        if (ids.length === 0) return;
        setProcessing(true);
        const { error } = await supabase.rpc('process_join_requests', { p_invite_ids: ids, p_action: action });
        if (error) console.error(`Error with bulk ${action}:`, error);
        setSelected(new Set());
        setProcessing(false);
    };

    const handleAction = async (inviteId: string, action: 'approve' | 'decline') => {
        if (processing) return;
        setProcessing(true);
        const { error } = await supabase.rpc('process_join_requests', { p_invite_ids: [inviteId], p_action: action });
        if (error) {
            console.error(`Error processing request ${inviteId}:`, error);
        }
        setSelected(prev => {
            const newSet = new Set(prev);
            newSet.delete(inviteId);
            return newSet;
        });
        setProcessing(false);
    };


    return (
        <div className="p-10 overflow-y-auto h-full text-white flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30">
                        <svg className="w-7 h-7 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"></path></svg>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">{tr.joinRequests}</h2>
                </div>
                {requests.length > 0 && (
                    <div className="p-5 bg-gradient-to-r from-slate-900/60 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 mb-6 flex items-center justify-between shadow-xl">
                        <div className="flex items-center">
                            <input type="checkbox" onChange={handleSelectAll} checked={selected.size > 0 && selected.size === requests.length} className="w-6 h-6 text-indigo-500 bg-slate-700 border-slate-600 rounded-lg focus:ring-indigo-500 mr-5" />
                            <label className="text-base font-bold text-slate-200">
                                <span className="text-indigo-400">{selected.size}</span> / <span className="text-purple-400">{requests.length}</span> seçildi
                            </label>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleBulkAction('approve')} disabled={selected.size === 0 || processing} className="px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 transition-all duration-200 shadow-lg hover:shadow-green-500/30 hover:scale-105 active:scale-95 disabled:hover:scale-100">{tr.approveSelected}</button>
                            <button onClick={() => handleBulkAction('decline')} disabled={selected.size === 0 || processing} className="px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-xl hover:from-red-600 hover:to-rose-700 disabled:from-slate-600 disabled:to-slate-700 transition-all duration-200 shadow-lg hover:shadow-red-500/30 hover:scale-105 active:scale-95 disabled:hover:scale-100">{tr.declineSelected}</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-grow overflow-y-auto -mr-4 pr-4">
                {loading ? <div className="flex justify-center items-center h-full"><Spinner /></div>
                : requests.length === 0 ? <div className="flex flex-col items-center justify-center h-full p-12 text-center"><div className="p-6 bg-slate-800/30 rounded-3xl border border-slate-700/30 mb-4"><svg className="w-16 h-16 text-slate-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg></div><p className="text-xl font-semibold text-slate-400">Bekleyen katılma isteği yok.</p></div>
                : (
                    <div className="space-y-3">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900/60 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/30 hover:border-indigo-500/30 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-500/10">
                                <div className="flex items-center gap-4">
                                    <input type="checkbox" checked={selected.has(req.id)} onChange={() => handleToggleSelect(req.id)} className="w-6 h-6 text-indigo-500 bg-slate-700 border-slate-600 rounded-lg focus:ring-indigo-500" />
                                    <img src={req.profiles.avatar_url || ''} alt={req.profiles.username} className="w-12 h-12 rounded-2xl ring-2 ring-slate-700/50 group-hover:ring-indigo-500/50 transition-all duration-300" />
                                    <span className="font-bold text-lg text-slate-200 group-hover:text-indigo-300 transition-colors duration-200">{req.profiles.username}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => handleAction(req.id, 'approve')} disabled={processing} className="p-3 text-green-400 hover:bg-green-500/20 rounded-xl transition-all duration-200 disabled:opacity-50 border border-transparent hover:border-green-500/30 hover:scale-110 active:scale-95"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                                    <button onClick={() => handleAction(req.id, 'decline')} disabled={processing} className="p-3 text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-200 disabled:opacity-50 border border-transparent hover:border-red-500/30 hover:scale-110 active:scale-95"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


export default ServerSettingsModal;