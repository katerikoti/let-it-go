'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { deriveKeyFromPassword } from '../lib/encryption';

interface AuthFormProps {
  isLogin?: boolean;
  onToggle?: (isLogin: boolean) => void;
}

const EMAIL_DOMAIN = 'letitgo.app';
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{2,30}$/;

// Supabase Auth needs an email, so each username maps to an internal address that is never emailed.
const emailFor = (name: string) => `${name.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

export default function AuthForm({ isLogin = false, onToggle, }: AuthFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (username.length === 0 || password.length === 0) {
          setError('Please fill in all fields');
          return;
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailFor(username),
          password,
        });

        if (signInError || !data.user) {
          setError('Invalid username or password');
          return;
        }

        // The username is the salt for the encryption key, so fetch it from the user's own profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          setError('Could not load your profile. Please try again.');
          return;
        }

        await storeSession(data.user.id, profile.username, password);
      } else {
        if (username.length === 0 || password.length === 0) {
          setError('Please fill in all fields');
          return;
        }

        if (!USERNAME_PATTERN.test(username)) {
          setError('Username must be 2-30 characters: letters, numbers, . _ -');
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        const { data: available } = await supabase.rpc('username_available', {
          name: username,
        });

        if (available === false) {
          setError('Username already taken');
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: emailFor(username),
          password,
          options: { data: { username } },
        });

        if (signUpError || !data.user) {
          setError(
            signUpError?.message === 'User already registered'
              ? 'Username already taken'
              : signUpError?.message || 'Failed to create account'
          );
          return;
        }

        if (!data.session) {
          setError('Account created, but email confirmation is still switched on in Supabase.');
          return;
        }

        await storeSession(data.user.id, username, password);
      }

      setSuccess(true);
      setUsername('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const storeSession = async (userId: string, name: string, pwd: string) => {
    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('username', name);
    sessionStorage.setItem('password', pwd); // Store for decryption fallback
    sessionStorage.setItem('encryptionKey', await deriveKeyFromPassword(pwd, name));
  };

  return (
    <div className="auth-form-wrapper">
      <div className="auth-form-container">
        <h2 className="auth-title">{isLogin ? 'Log In' : 'Sign Up'}</h2>

        {error && <div className="auth-error">{error}</div>}
        {success && (
          <div className="auth-success">
            {isLogin
              ? 'Logged in successfully!'
              : 'Account created successfully! You can now log in.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isLogin ? 'Enter your username' : 'Choose a username'}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-button"
          >
            {loading ? 'Loading...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onToggle?.(false)}
                className="auth-toggle-button"
              >
                Sign up here
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onToggle?.(true)}
                className="auth-toggle-button"
              >
                Log in here
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
