'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface AuthFormProps {
  isLogin?: boolean;
  onToggle?: (isLogin: boolean) => void;
  onClose?: () => void;
}

export default function AuthForm({ isLogin = false, onToggle, onClose }: AuthFormProps) {
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
      if (!isLogin && password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (username.length === 0 || password.length === 0) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Login: authenticate with Supabase
        const { data: user, error: queryError } = await supabase
          .from('users')
          .select('id, password_hash')
          .eq('username', username)
          .single();

        if (queryError || !user) {
          setError('Invalid username or password');
          setLoading(false);
          return;
        }

        // Compare password with hash
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
          setError('Invalid username or password');
          setLoading(false);
          return;
        }

        // Store user ID in sessionStorage for the session
        sessionStorage.setItem('userId', user.id);
        sessionStorage.setItem('username', username);
      } else {
        // Sign up: create new user in Supabase
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single();

        if (existingUser) {
          setError('Username already taken');
          setLoading(false);
          return;
        }

        // Hash password before storing
        const passwordHash = await bcrypt.hash(password, 10);

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ username, password_hash: passwordHash }])
          .select('id')
          .single();

        if (insertError || !newUser) {
          setError('Failed to create account');
          setLoading(false);
          return;
        }

        // Store user ID in sessionStorage
        sessionStorage.setItem('userId', newUser.id);
        sessionStorage.setItem('username', username);
      }

      setSuccess(true);
      setUsername('');
      setPassword('');
      setConfirmPassword('');

      // Redirect to profile after 1 second
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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
              placeholder="Enter your username"
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
              Don't have an account?{' '}
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
