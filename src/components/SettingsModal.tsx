// src/components/SettingsModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import type { Profile } from '../types';
import useMediaDevices from '../hooks/useMediaDevices';
import { tr } from '../constants/tr';
import { useTheme, themes } from '../contexts/ThemeContext';

const UserIcon = () => <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;
const VoiceIcon = () => <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>;
const AppearanceIcon = () => <svg className="w-5 h-5 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>;


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('account');
  const { profile } = useAuth();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-6xl max-h-[90vh] h-[750px] flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50" onClick={e => e.stopPropagation()}>
        <div className="w-72 p-6 space-y-3 border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-xl flex flex-col">
            <div>
                <h3 className="px-3 mb-6 text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                  {tr.userSettings}
                </h3>
                <TabButton name={tr.myAccount} id="account" activeTab={activeTab} setActiveTab={setActiveTab} icon={<UserIcon />} />
                <TabButton name={tr.voiceAndVideo} id="voice" activeTab={activeTab} setActiveTab={setActiveTab} icon={<VoiceIcon />} />
                <TabButton name={tr.appearance} id="appearance" activeTab={activeTab} setActiveTab={setActiveTab} icon={<AppearanceIcon />} />
            </div>
          <div className="mt-auto pt-6 border-t border-slate-700/50">
             <button onClick={onClose} className="flex items-center justify-center w-full h-12 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all duration-200 group">
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                <span className="ml-2 text-sm font-medium">{tr.closeSettings}</span>
            </button>
          </div>
        </div>
        <div className="flex-grow bg-gradient-to-br from-slate-800 to-slate-900">
          {profile && activeTab === 'account' && <MyAccountTab profile={profile} onUpdate={onProfileUpdate} />}
          {activeTab === 'voice' && <VoiceAndVideoTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
    name: string; id: string; activeTab: string;
    setActiveTab: (id: string) => void; icon: React.ReactNode;
}
const TabButton: React.FC<TabButtonProps> = ({ name, id, activeTab, setActiveTab, icon }) => {
  const { theme } = useTheme();
  return (
    <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 mb-1 group ${
        activeTab === id ? `${theme.colors.activeBackground} text-white shadow-lg shadow-${theme.colors.accent}-500/20 scale-[1.02]` : 'text-slate-300 hover:bg-slate-700/30 hover:translate-x-1'
        }`}
    >
        <span className={`transition-all duration-200 ${activeTab === id ? 'scale-110' : 'group-hover:scale-105'}`}>
          {icon}
        </span>
        <span className="font-medium">{name}</span>
    </button>
  );
};


const MyAccountTab: React.FC<{ profile: Profile, onUpdate: () => void }> = ({ profile, onUpdate }) => {
    const { user } = useAuth();
    const [username, setUsername] = useState(profile.username);
    const [gender, setGender] = useState<Profile['gender']>(profile.gender || 'prefer_not_to_say');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { theme } = useTheme();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const hasChanges = username !== profile.username || gender !== profile.gender || avatarFile !== null;
    
    useEffect(() => {
        setUsername(profile.username);
        setGender(profile.gender || 'prefer_not_to_say');
        setAvatarPreview(profile.avatar_url);
        setAvatarFile(null);
    }, [profile]);
    
    const resetChanges = () => {
        setUsername(profile.username);
        setGender(profile.gender || 'prefer_not_to_say');
        setAvatarPreview(profile.avatar_url);
        setAvatarFile(null);
    }
    
    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };


    const handleSave = async () => {
        if (!user) return;
        setLoading(true); setError(''); setSuccess('');
        
        let newAvatarUrl = profile.avatar_url;

        try {
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const filePath = `${user.id}/${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                newAvatarUrl = urlData.publicUrl;
            }

            const { error: updateError } = await supabase.from('profiles').update({ 
                username, 
                gender,
                avatar_url: newAvatarUrl
            }).eq('id', profile.id);

            if (updateError) throw updateError;
            
            setSuccess(tr.profileUpdated);
            setAvatarFile(null); // Clear file after successful upload
            onUpdate();
            setTimeout(() => setSuccess(''), 2000);

        } catch (err: any) {
            console.error("Profile update error:", err);
            setError(err.message || 'Profil güncellenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow p-10 overflow-y-auto">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold mb-2 text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{tr.myAccount}</h2>
                  <p className="text-slate-400 text-base">Kullanıcı profilini ve hesap ayarlarını yönet.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                            <h3 className="text-xl font-semibold text-slate-100 mb-1">{tr.accountSettings}</h3>
                            <p className="text-sm text-slate-400 mb-6">Hesap bilgilerini düzenle</p>
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-6"></div>
                            <div className="space-y-8">
                                <div className="group">
                                    <label htmlFor="username" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3">
                                      <span className="w-1 h-4 bg-blue-500 rounded-full mr-2"></span>
                                      {tr.username}
                                    </label>
                                    <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                    className={`relative block w-full px-4 py-3 text-white bg-slate-900/50 border border-slate-600/50 rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm transition-all duration-200 hover:border-slate-500 ${theme.colors.focusRing}`}/>
                                </div>
                                
                                <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} accept="image/png, image/jpeg, image/webp" className="hidden" />
                                <div className="group">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3">
                                      <span className="w-1 h-4 bg-purple-500 rounded-full mr-2"></span>
                                      {tr.chooseAvatar}
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-slate-700/50 hover:border-slate-500 transition-all duration-200 bg-slate-900/50 group relative"
                                    >
                                        <img src={avatarPreview || `https://robohash.org/${profile.id}.png?set=set1&size=150x150`} alt="Avatar" className="object-cover w-full h-full" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs font-bold text-white text-center">DEĞİŞTİR</p>
                                        </div>
                                    </button>
                                </div>

                                <div className="group">
                                    <label htmlFor="gender" className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-3">
                                      <span className="w-1 h-4 bg-pink-500 rounded-full mr-2"></span>
                                      {tr.gender}
                                    </label>
                                    <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as Profile['gender'])}
                                        className={`relative block w-full px-4 py-3 text-white bg-slate-900/50 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm transition-all duration-200 hover:border-slate-500 ${theme.colors.focusRing}`}>
                                        <option value="prefer_not_to_say">{tr.preferNotToSay}</option>
                                        <option value="male">{tr.male}</option>
                                        <option value="female">{tr.female}</option>
                                        <option value="other">{tr.other}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        {error && <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4"><p className="text-sm text-center text-red-400">{error}</p></div>}
                        {success && <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4"><p className="text-sm text-center text-green-400">{success}</p></div>}
                    </div>
                    <div className="lg:col-span-1">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl sticky top-8">
                             <div className={`h-28 bg-gradient-to-r from-${theme.colors.accent}-600 via-purple-600 to-pink-600 relative overflow-hidden`}>
                               <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                             </div>
                             <div className="p-6 -mt-14 flex flex-col items-center">
                                 <div className="relative">
                                   <img src={avatarPreview || `https://robohash.org/${profile.id}.png?set=set1&size=150x150`} alt="Avatar Preview" className="w-28 h-28 rounded-2xl border-4 border-slate-800 shadow-xl object-cover" />
                                   <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-800"></div>
                                 </div>
                                 <div className="text-center mt-4">
                                     <p className="text-xl font-bold text-white truncate">{username}</p>
                                     <p className="text-sm text-slate-400 capitalize mt-1 px-3 py-1 bg-slate-700/50 rounded-full inline-block">{profile.status}</p>
                                 </div>
                             </div>
                             <div className="p-6 border-t border-slate-700/50 bg-slate-900/30">
                                 <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">TChat Üyesi</h4>
                                 <p className="text-sm text-slate-300 leading-relaxed">Bu bir profil önizlemesidir.</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
             {hasChanges && (
                <div className="flex-shrink-0 flex items-center justify-between p-6 bg-slate-900/90 backdrop-blur-xl border-t border-slate-700/50 shadow-lg">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                      <p className="text-sm text-slate-200 font-medium">Kaydedilmemiş değişikliklerin var.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                         <button onClick={resetChanges} className="px-5 py-2.5 text-sm font-medium text-white rounded-xl hover:bg-slate-700/50 transition-all duration-200 border border-slate-600">
                            {tr.reset}
                        </button>
                        <button onClick={handleSave} disabled={loading}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-500 hover:to-emerald-500 disabled:from-green-400 disabled:to-emerald-400 transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed">
                            {loading ? `${tr.saving}...` : tr.saveChanges}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MicVisualizer: React.FC<{ volume: number }> = ({ volume }) => {
    const bars = Array.from({ length: 20 });
    const getBarHeight = (index: number) => {
        const normalizedVolume = Math.min(volume / 100, 1);
        const distanceFromCenter = Math.abs(index - (bars.length / 2 - 0.5));
        const dampening = 1 - (distanceFromCenter / (bars.length / 2));
        const height = normalizedVolume * dampening * 100;
        return Math.max(height, 2);
    };
    return (
        <div className="flex items-end justify-center w-full h-16 space-x-1 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
            {bars.map((_, i) => (
                <div key={i} className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg shadow-lg shadow-green-500/50" style={{ height: `${getBarHeight(i)}%`, transition: 'height 0.05s ease-out' }}/>
            ))}
        </div>
    );
};


const VoiceAndVideoTab: React.FC = () => {
    const { devices, getDevices, startMicTest, stopMicTest } = useMediaDevices();
    const [micVolume, setMicVolume] = useState(0);
    const [isTesting, setIsTesting] = useState(false);
    const [selectedMic, setSelectedMic] = useState(localStorage.getItem('selectedMicrophoneId') || 'default');
    const [selectedCam, setSelectedCam] = useState(localStorage.getItem('selectedCameraId') || 'default');
    const { theme } = useTheme();

    useEffect(() => {
        return () => { if (isTesting) stopMicTest(); }; 
    }, [isTesting, stopMicTest]);

    const handleMicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deviceId = e.target.value;
        setSelectedMic(deviceId); localStorage.setItem('selectedMicrophoneId', deviceId);
        if (isTesting) { stopMicTest(); setIsTesting(false); }
        setMicVolume(0);
    }
    const handleCamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deviceId = e.target.value;
        setSelectedCam(deviceId); localStorage.setItem('selectedCameraId', deviceId);
    }
    const toggleMicTest = () => {
        if (isTesting) { stopMicTest(); setIsTesting(false); setMicVolume(0); } 
        else if (selectedMic) { startMicTest(selectedMic, setMicVolume); setIsTesting(true); }
    }

    return (
        <div className="p-10 overflow-y-auto h-full text-white">
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{tr.voiceAndVideo}</h2>
              <p className="text-slate-400 text-base">Giriş ve çıkış cihazlarını yönet.</p>
            </div>
            <div className="space-y-6">
                <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center mb-6">
                      <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                      <h3 className="text-xl font-semibold text-slate-100">{tr.voiceSettings}</h3>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-6"></div>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="mic-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">{tr.inputDevice}</label>
                            <select id="mic-select" value={selectedMic} onChange={handleMicChange} className={`w-full p-3 text-white bg-slate-900/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:outline-none focus:border-transparent transition-all duration-200 hover:border-slate-500 ${theme.colors.focusRing}`}>
                                <option value="default">{tr.default}</option>
                                {devices.audioInput.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                            </select>
                        </div>
                        <div className="pt-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{tr.micTest}</h3>
                             <MicVisualizer volume={micVolume} />
                            <div className="flex items-center space-x-4 mt-6">
                                <button onClick={toggleMicTest} className={`px-6 py-3 min-w-[140px] text-sm font-medium text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${isTesting ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500' : `${theme.colors.primaryButton} ${theme.colors.primaryButtonHover}`}`}>
                                    {isTesting ? tr.stopTest : tr.testMic}
                                </button>
                                <p className="text-xs text-slate-400 leading-relaxed">{tr.micTestDescription}</p>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center mb-6">
                      <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                      <h3 className="text-xl font-semibold text-slate-100">{tr.videoSettings}</h3>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-6"></div>
                    <div>
                        <label htmlFor="cam-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">{tr.camera}</label>
                        <select id="cam-select" value={selectedCam} onChange={handleCamChange} className={`w-full p-3 text-white bg-slate-900/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:outline-none focus:border-transparent transition-all duration-200 hover:border-slate-500 ${theme.colors.focusRing}`}>
                            <option value="default">{tr.default}</option>
                            {devices.videoInput.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                        </select>
                    </div>
                </div>
                 <button onClick={getDevices} className={`text-sm ${theme.colors.text} hover:underline flex items-center group px-4 py-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200`}>
                    <svg className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    {tr.detectDevices}
                </button>
            </div>
        </div>
    );
};

const AppearanceTab: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="p-10 overflow-y-auto h-full text-white">
            <div className="mb-10">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{tr.appearance}</h2>
              <p className="text-slate-400 text-base">Uygulamanın görünümünü zevkine göre ayarla.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {Object.values(themes).map(t => (
                    <div key={t.name} className="group">
                        <button 
                            onClick={() => setTheme(t.name)}
                            className={`w-full aspect-[4/3] rounded-2xl border-4 transition-all duration-300 overflow-hidden relative ${
                                theme.name === t.name ? `${t.colors.border} scale-105 shadow-2xl` : 'border-slate-700/50 hover:border-slate-500 hover:scale-102'
                            }`}
                        >
                            <div className="h-full w-full flex flex-col p-5 bg-gradient-to-br from-slate-800 to-slate-900 relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>
                                <span className={`w-3/4 h-5 rounded-full ${t.colors.primaryButton} shadow-lg relative z-10`}></span>
                                <span className={`w-1/2 h-4 rounded-full mt-3 ${t.colors.primaryButton.replace('600', '400')} opacity-75 relative z-10`}></span>
                                <div className="mt-auto flex items-center relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 shadow-lg"></div>
                                    <div className="ml-3">
                                        <div className="w-20 h-3 rounded-full bg-slate-600"></div>
                                        <div className="w-12 h-2 rounded-full bg-slate-700 mt-2"></div>
                                    </div>
                                </div>
                                {theme.name === t.name && (
                                  <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                  </div>
                                )}
                            </div>
                        </button>
                        <p className="text-center mt-3 text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-200">{t.displayName}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SettingsModal;
