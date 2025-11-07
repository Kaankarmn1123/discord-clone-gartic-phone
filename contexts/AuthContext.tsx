// contexts/AuthContext.tsx
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../services/supabaseClient';
import LoadingScreen from '../components/LoadingScreen';
import type { Profile } from '../types';

type AuthContextType = {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  profileStatus: 'loading' | 'loaded' | 'missing';
  refetchProfile: () => void;
  updateStatus: (status: Profile['status']) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
    session: null, 
    user: null, 
    profile: null, 
    profileStatus: 'loading', 
    refetchProfile: () => {}, 
    updateStatus: async () => {} 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileStatus, setProfileStatus] = useState<'loading' | 'loaded' | 'missing'>('loading');
  const [authLoading, setAuthLoading] = useState(true);

  const fetchProfile = useCallback(async (userToFetch: any) => {
    setProfileStatus('loading');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userToFetch.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
          throw error;
      }
      
      if (data) {
          setProfile(data as Profile);
          setProfileStatus('loaded');
      } else {
          setProfile(null);
          setProfileStatus('missing');
      }
    } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        setProfileStatus('missing');
    }
  }, []);

  const updateStatus = useCallback(async (newStatus: Profile['status']) => {
    if (user && profile) {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
      if (error) {
        console.error("Error updating status:", error);
      } else {
        setProfile(p => p ? { ...p, status: newStatus } : null);
      }
    }
  }, [user, profile]);
  
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (e) {
        console.error("Error fetching initial session:", e);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchProfile(user);
      supabase.from('profiles').update({ status: 'online' }).eq('id', user.id).then();
    } else {
      setProfile(null);
      setProfileStatus('missing');
    }
  }, [user, fetchProfile]);


  const refetchProfile = useCallback(() => {
    if(user){
      fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (user && profile) {
        // 'dnd' veya 'offline' durumlarını manuel olarak ayarlayan kullanıcının üzerine yazma
        if (profile.status === 'online' || profile.status === 'idle') {
          const newStatus = document.visibilityState === 'visible' ? 'online' : 'idle';
          updateStatus(newStatus);
        }
        
        if (document.visibilityState === 'visible') {
            refetchProfile();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchProfile, updateStatus, user, profile]);

  useEffect(() => {
    const handleBeforeUnload = () => {
        if (user && session) {
             const url = `${supabase.rest.url}/rest/v1/profiles?id=eq.${user.id}`;
             const headers = {
                'apikey': supabase.rest.headers.apikey,
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
             };
            const body = JSON.stringify({ status: 'offline' });
            
            try {
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
                } else {
                    fetch(url, {
                        method: 'PATCH',
                        headers,
                        body,
                        keepalive: true,
                    });
                }
            } catch (e) {
                console.error("Error sending offline status:", e);
            }
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
}, [user, session]);


  return (
    <AuthContext.Provider value={{ session, user, profile, profileStatus, refetchProfile, updateStatus }}>
      {authLoading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};