// components/AdminPanel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Profile } from '../types';
import Spinner from './Spinner';
import StatusIndicator from './StatusIndicator';
import { useTheme } from '../contexts/ThemeContext';

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);
const MessageIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);
const ServerIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
    />
  </svg>
);

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, loading }) => {
  const { theme } = useTheme();
  return (
    <div
      className={`p-6 rounded-xl shadow-lg flex items-center gap-4 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] transition-all`}
    >
      <div className="p-3 rounded-full bg-slate-700/40 text-blue-400 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">{title}</p>
        {loading ? (
          <div className="w-12 h-8 mt-1 bg-slate-600 rounded animate-pulse"></div>
        ) : (
          <p className="text-3xl font-bold text-white drop-shadow-sm">{value}</p>
        )}
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
    totalServers: 0,
  });
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const [
      { count: totalUsers, error: usersError },
      { count: onlineUsers, error: onlineError },
      { count: totalMessages, error: messagesError },
      { count: totalServers, error: serversError },
      { data: allUsersData, error: allUsersError },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'online'),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('servers').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*').order('username', { ascending: true }),
    ]);

    if (usersError || onlineError || messagesError || serversError || allUsersError) {
      console.error('Error fetching admin stats:', {
        usersError,
        onlineError,
        messagesError,
        serversError,
        allUsersError,
      });
    } else {
      setStats({
        totalUsers: totalUsers ?? 0,
        onlineUsers: onlineUsers ?? 0,
        totalMessages: totalMessages ?? 0,
        totalServers: totalServers ?? 0,
      });
      setAllUsers((allUsersData as Profile[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const subscription = supabase
      .channel('admin-panel-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchStats]);

  return (
    <div className="flex flex-col flex-grow min-h-0 bg-slate-800 p-8 overflow-y-auto relative">
      <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Yönetici Paneli</h1>
      <p className="text-slate-400 mb-8">
        Uygulamanın genel istatistiklerini buradan takip edebilirsin.
      </p>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Toplam Kullanıcı" value={stats.totalUsers} icon={<UsersIcon />} loading={loading} />
        <StatCard title="Çevrimiçi Kullanıcı" value={stats.onlineUsers} icon={<UsersIcon />} loading={loading} />
        <StatCard title="Toplam Mesaj" value={stats.totalMessages} icon={<MessageIcon />} loading={loading} />
        <StatCard title="Toplam Sunucu" value={stats.totalServers} icon={<ServerIcon />} loading={loading} />
      </div>

      {/* Kullanıcı Listesi */}
      <div
        className={`mt-10 p-6 rounded-xl border bg-gradient-to-br from-slate-800/80 to-slate-900/90 backdrop-blur-md border-slate-700/50 shadow-lg`}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
          <span>Tüm Kullanıcılar</span>
          <span className="text-slate-400 text-sm font-medium">{allUsers.length} kişi</span>
        </h2>

        <div className="max-h-96 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-slate-800/70 hover:bg-slate-700/60 transition rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={
                          user.avatar_url ||
                          `https://robohash.org/${user.id}.png?set=set1&size=40x40`
                        }
                        alt={user.username}
                        className="w-10 h-10 rounded-full border border-slate-600/50 group-hover:border-slate-400/40 transition"
                      />
                      <StatusIndicator
                        status={user.status}
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{user.username}</p>
                      <p className="text-xs text-slate-400">
                        {user.status === 'online' ? 'Aktif şimdi' : 'Çevrimdışı'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
