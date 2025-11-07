import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { tr } from '../constants/tr';
import { useTheme } from '../contexts/ThemeContext';

interface CreateProfileProps {
  onProfileCreated: () => void;
}

const avatars = [
  'https://robohash.org/a1.png?set=set1&size=150x150',
  'https://robohash.org/b2.png?set=set2&size=150x150',
  'https://robohash.org/c3.png?set=set1&size=150x150',
  'https://robohash.org/d4.png?set=set2&size=150x150',
  'https://robohash.org/e5.png?set=set3&size=150x150',
];

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [username, setUsername] = useState(user?.email?.split('@')[0] || '');
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [gender, setGender] = useState('prefer_not_to_say');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username.trim()) {
      setError(tr.usernameCannotBeEmpty);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
      }
      
      if (existingProfile) {
        setError(tr.usernameTaken);
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username: username.trim(),
        avatar_url: selectedAvatar,
        gender: gender,
      });

      if (insertError) {
        if (insertError.code === '23505') {
            setError(tr.usernameTaken);
        } else {
            throw insertError;
        }
      } else {
        onProfileCreated();
      }
      
    } catch (err: any) {
      console.error('Error creating profile:', err);
      setError(err.message || 'Profil oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center justify-center h-screen ${theme.colors.bgSecondary}`}>
      <div className={`w-full max-w-lg p-8 space-y-8 ${theme.colors.bgTertiary} rounded-lg shadow-lg`}>
        <div>
          <h2 className={`text-3xl font-extrabold text-center ${theme.colors.textPrimary}`}>
            {tr.setUpYourProfile}
          </h2>
          <p className={`mt-2 text-center ${theme.colors.textMuted}`}>
            {tr.chooseUsernameAndAvatar}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleProfileSetup}>
          <div>
            <label htmlFor="username" className={`text-sm font-medium ${theme.colors.textSecondary}`}>
              {tr.username}
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`relative block w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm ${theme.colors.focusRing}`}
              placeholder={tr.username}
            />
          </div>
          <div>
            <label className={`text-sm font-medium ${theme.colors.textSecondary}`}>{tr.chooseAvatar}</label>
            <div className="flex justify-center mt-2 space-x-4">
              {avatars.map((avatarUrl) => (
                <button
                  type="button"
                  key={avatarUrl}
                  onClick={() => setSelectedAvatar(avatarUrl)}
                  className={`w-16 h-16 rounded-full overflow-hidden border-4 transition-all bg-slate-700 ${
                    selectedAvatar === avatarUrl ? theme.colors.border : 'border-transparent hover:border-slate-500'
                  }`}
                >
                  <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="gender" className={`text-sm font-medium ${theme.colors.textSecondary}`}>
              {tr.gender}
            </label>
            <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`relative block w-full px-3 py-2 mt-1 text-white bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 sm:text-sm ${theme.colors.focusRing}`}
            >
                <option value="prefer_not_to_say">{tr.preferNotToSay}</option>
                <option value="male">{tr.male}</option>
                <option value="female">{tr.female}</option>
                <option value="other">{tr.other}</option>
            </select>
          </div>
          {error && <p className="text-sm text-center text-red-400">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 ${theme.colors.primaryButton} ${theme.colors.primaryButtonHover} ${theme.colors.focusRing}`}
            >
              {loading ? `${tr.saving}...` : tr.completeSetup}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProfile;
