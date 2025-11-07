// components/Auth.tsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { tr } from '../constants/tr';
import { useTheme } from '../contexts/ThemeContext';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const { theme } = useTheme();

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: email.split('@')[0] },
          },
        });
        if (error) throw error;
        setMessage(tr.checkYourEmail);
      }
    } catch (error: any) {
      setMessage(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-white p-4 
    bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] 
    from-red-900 via-black to-black 
    animate-[pulse_6s_ease-in-out_infinite]">

      <div className="relative w-full max-w-md p-8 space-y-6 
      bg-black/60 backdrop-blur-md border border-red-800/40 rounded-2xl shadow-[0_0_20px_rgba(255,0,0,0.4)]">

        {/* Parlama efekti */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/20 to-transparent blur-2xl opacity-40 animate-pulse pointer-events-none"></div>

        <div className="relative flex flex-col items-center">
          <img 
            src="https://gateway.pinata.cloud/ipfs/bafkreignl7hino45ssmnnjwtxcmsamf43ikxwnyjm2zcamuxvk4ujihz6q" 
            alt="Serçe Logo" 
            className="w-24 h-24 mb-4 rounded-full shadow-[0_0_20px_rgba(255,0,0,0.6)] animate-[pulse_3s_ease-in-out_infinite]"
          />
          <h2 className="text-3xl font-bold text-center text-red-200 drop-shadow-[0_0_10px_rgba(255,0,0,0.6)]">
            {isLogin ? tr.welcomeBack : tr.createYourAccount}
          </h2>
          <p className="text-red-400 mt-2 text-center">
            {isLogin ? tr.signInToContinue : tr.joinTheCommunity}
          </p>
        </div>

        <form className="relative mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-4 py-3 text-white bg-red-900/30 
              border border-red-800 rounded-md placeholder-red-400/70 
              focus:outline-none focus:ring-2 focus:ring-red-500/80 focus:border-red-500/80
              transition-all sm:text-sm"
              placeholder={tr.emailAddress}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full px-4 py-3 text-white bg-red-900/30 
              border border-red-800 rounded-md placeholder-red-400/70 
              focus:outline-none focus:ring-2 focus:ring-red-500/80 focus:border-red-500/80
              transition-all sm:text-sm"
              placeholder={tr.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white
              border border-transparent rounded-md group focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed
              bg-gradient-to-r from-red-700 via-red-600 to-red-700
              hover:from-red-600 hover:via-red-500 hover:to-red-600
              shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-all duration-300"
            >
              {loading ? `${tr.loading}...` : isLogin ? tr.signIn : tr.signUp}
            </button>
          </div>
        </form>

        {message && <p className="mt-2 text-sm text-center text-red-400">{message}</p>}

        <div className="text-sm text-center relative">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-red-300 hover:text-white transition-colors duration-300"
          >
            {isLogin ? tr.dontHaveAccount : tr.alreadyHaveAccount}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
