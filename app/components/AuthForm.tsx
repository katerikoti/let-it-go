'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

interface AuthFormProps {
  isLogin?: boolean;
  onToggle?: (isLogin: boolean) => void;
  onClose?: () => void;
}

export default function AuthForm({ isLogin = false, onToggle, onClose }: AuthFormProps) {
  const [email, setEmail] = useState('');
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

      if (email.length === 0 || password.length === 0) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Login: authenticate with Supabase
        const { data: users, error: queryError } = await supabase
          .from('users')
          .select('id, password')
          .eq('email', email)
          .single();

        if (queryError || !users) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }

        if (users.password !== password) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }

        // Store user ID in sessionStorage for the session
        sessionStorage.setItem('userId', users.id);
        sessionStorage.setItem('userEmail', email);
      } else {
        // Sign up: create new user in Supabase
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (existingUser) {
          setError('Email already registered');
          setLoading(false);
          return;
        }

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ email, password }])
          .select('id')
          .single();

        if (insertError || !newUser) {
          setError('Failed to create account');
          setLoading(false);
          return;
        }

        // Store user ID in sessionStorage
        sessionStorage.setItem('userId', newUser.id);
        sessionStorage.setItem('userEmail', email);
      }

      setSuccess(true);
      setEmail('');
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
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
