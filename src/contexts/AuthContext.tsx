// contexts/AuthContext.tsx
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
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
  authLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({ 
    session: null, 
    user: null, 
    profile: null, 
    profileStatus: 'loading', 
    refetchProfile: () => {}, 
    updateStatus: async () => {},
    authLoading: true, 
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
    if (!user) return;

    const profileChannel = supabase
      .channel(`profile-${user.id}`)
      .on<Profile>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          setProfile(payload.new as Profile);
          if(profileStatus !== 'loaded') setProfileStatus('loaded');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user, profileStatus]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (user && profile) {
        if (profile.status === 'online' || profile.status === 'idle') {
          const newStatus = document.visibilityState === 'visible' ? 'online' : 'idle';
          // Sadece durum gerçekten değiştiyse güncelleme yap. Bu, gereksiz render'ları önler.
          if (profile.status !== newStatus) {
            updateStatus(newStatus);
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateStatus, user, profile]);


  useEffect(() => {
    const handleBeforeUnload = () => {
        if (user && session) {
             const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`;
             const headers = {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
             };
            const body = JSON.stringify({ status: 'offline' });
            
            try {
                // Use fetch with keepalive as a more reliable alternative to sendBeacon for this case
                fetch(url, {
                    method: 'PATCH',
                    headers,
                    body,
                    keepalive: true,
                });
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


  const value = useMemo(() => ({
    session,
    user,
    profile,
    profileStatus,
    refetchProfile,
    updateStatus,
    authLoading
  }), [session, user, profile, profileStatus, refetchProfile, updateStatus, authLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
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