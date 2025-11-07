import React, { useState } from 'react';
import { supabase } from './services/supabaseClient';
// FIX: Corrected import path for useAuth hook.
import { useAuth } from './contexts/AuthContext';
// FIX: Corrected import path for tr
import { tr } from './constants/tr';

interface CreateProfileProps {
  onProfileCreated: () => void;
}

const avatars = [
  'https://i.pravatar.cc/150?u=avatar1',
  'https://i.pravatar.cc/150?u=avatar2',
  'https://i.pravatar.cc/150?u=avatar3',
  'https://i.pravatar.cc/150?u=avatar4',
  'https://i.pravatar.cc/150?u=avatar5',
];

const CreateProfile: React.FC<CreateProfileProps> = ({ onProfileCreated }) => {
  const { user } = useAuth();
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
      // 1. Check if username is unique
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'not found', which is good
          throw checkError;
      }
      
      if (existingProfile) {
        setError(tr.usernameTaken);
        setLoading(false);
        return;
      }

      // 2. If unique, insert the new profile
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username: username.trim(),
        avatar_url: selectedAvatar,
        gender: gender,
      });

      if (insertError) {
        // Handle potential race condition if unique constraint is violated
        if (insertError.code === '23505') { // unique_violation
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
    <div className="flex items-center justify-center h-screen bg-gray-800">
      <div className="w-full max-w-lg p-8 space-y-8 bg-gray-900 rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-extrabold text-center text-white">
            {tr.setUpYourProfile}
          </h2>
          <p className="mt-2 text-center text-gray-400">
            {tr.chooseUsernameAndAvatar}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleProfileSetup}>
          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-300">
              {tr.username}
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="relative block w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={tr.username}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">{tr.chooseAvatar}</label>
            <div className="flex justify-center mt-2 space-x-4">
              {avatars.map((avatarUrl) => (
                <button
                  type="button"
                  key={avatarUrl}
                  onClick={() => setSelectedAvatar(avatarUrl)}
                  className={`w-16 h-16 rounded-full overflow-hidden border-4 transition-all ${
                    selectedAvatar === avatarUrl ? 'border-indigo-500' : 'border-transparent hover:border-gray-500'
                  }`}
                >
                  <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="gender" className="text-sm font-medium text-gray-300">
              {tr.gender}
            </label>
            <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="relative block w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
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