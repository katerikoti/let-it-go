'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import { deriveKeyFromPassword } from '../lib/encryption';

interface AuthFormProps {
  isLogin?: boolean;
  onToggle?: (isLogin: boolean) => void;
  onClose?: () => void;
}

export default function AuthForm({ isLogin = false, onToggle, onClose }: AuthFormProps) {
  const [username, setUsername] = useState('');
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

      if (!isLogin && (username.length === 0 || email.length === 0 || password.length === 0)) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (isLogin && (username.length === 0 || password.length === 0)) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (!isLogin && !email.includes('@')) {
        setError('Please enter a valid email');
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Login: authenticate with Supabase (support both username and email)
        let user;
        let queryError;
        
        // Try username first
        const usernameQuery = await supabase
          .from('users')
          .select('id, username, password_hash')
          .eq('username', username)
          .single();
        
        if (usernameQuery.data) {
          user = usernameQuery.data;
        } else {
          // Try email
          const emailQuery = await supabase
            .from('users')
            .select('id, username, password_hash')
            .eq('email', username)
            .single();
          
          if (emailQuery.data) {
            user = emailQuery.data;
          } else {
            queryError = emailQuery.error;
          }
        }

        if (queryError || !user) {
          setError('Invalid username/email or password');
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
        sessionStorage.setItem('username', user.username);
        sessionStorage.setItem('password', password); // Store for decryption fallback

        // Derive and store encryption key
        const encryptionKey = await deriveKeyFromPassword(password, user.username);
        sessionStorage.setItem('encryptionKey', encryptionKey);
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
          .insert([{ username, email, password_hash: passwordHash }])
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
        sessionStorage.setItem('password', password); // Store for decryption fallback

        // Derive and store encryption key
        const encryptionKey = await deriveKeyFromPassword(password, username);
        sessionStorage.setItem('encryptionKey', encryptionKey);
      }

      setSuccess(true);
      setUsername('');
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

  const handleForgotPasswordClick = () => {
    setSuccess(false);
    setError(
      "Unfortunately password reset isn't available in this test version yet."
    );
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
            <label htmlFor="username">{isLogin ? 'Username or Email' : 'Username'}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isLogin ? "Enter username or email" : "Choose a username"}
              required
            />
          </div>

          {!isLogin && (
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
          )}

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

        {isLogin && (
          <div className="auth-toggle" style={{ marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="auth-toggle-button"
            >
              Forgot password?
            </button>
          </div>
        )}

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
