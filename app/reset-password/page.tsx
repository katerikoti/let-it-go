'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="hero-main">
          <section className="hero">
            <h1 className="hero-title">Loading...</h1>
          </section>
        </main>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid reset link');
        setCheckingToken(false);
        return;
      }

      try {
        // Check if token exists and is not expired
        const { data: user, error: queryError } = await supabase
          .from('users')
          .select('id, reset_token_expires')
          .eq('reset_token', token)
          .single();

        if (queryError || !user) {
          setError('Invalid or expired reset link');
          setCheckingToken(false);
          return;
        }

        // Check if token is expired
        const expiresAt = new Date(user.reset_token_expires);
        if (expiresAt < new Date()) {
          setError('Reset link has expired');
          setCheckingToken(false);
          return;
        }

        setValidToken(true);
      } catch (err) {
        setError('An error occurred. Please try again.');
      } finally {
        setCheckingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null
        })
        .eq('reset_token', token);

      if (updateError) {
        setError('Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <main className="hero-main">
        <section className="hero">
          <h1 className="hero-title">Loading...</h1>
        </section>
      </main>
    );
  }

  if (!validToken) {
    return (
      <main className="hero-main">
        <section className="hero">
          <h1 className="hero-title">Reset Password</h1>
          <div className="auth-error" style={{ maxWidth: '400px', margin: '20px auto' }}>
            {error}
          </div>
          <button
            className="cta-button"
            onClick={() => router.push('/')}
            style={{ marginTop: '20px' }}
          >
            Back to Home
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="hero-main">
      <section className="hero">
        <h1 className="hero-title">Reset Password</h1>

        <div className="auth-form-wrapper">
          <div className="auth-form-container">
            {error && <div className="auth-error">{error}</div>}
            {success && (
              <div className="auth-success">
                Password reset successfully! Redirecting...
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-submit-button"
                >
                  {loading ? 'Loading...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
