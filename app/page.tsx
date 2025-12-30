'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthForm from './components/AuthForm';

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(true);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuthToggle = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setShowAuth(true);
  };

  return (
    <main className="hero-main">
      <section className="hero">
        <div className="hero-subtitle">Write, send &</div>

        <h1 className="hero-title">Let It Go</h1>

        <p className="hero-p">
          Putting your thoughts and feelings into words can be a powerful step toward healing. Sometimes, just seeing your thoughts on the page brings clarity, relief, and a sense of calm.
        </p>

        {!showAuth && (
          <div className="hero-cta">
            <button
              className="cta-button"
              onClick={() => handleAuthToggle(true)}
            >
              Log In
            </button>
            <button
              className="cta-button"
              onClick={() => handleAuthToggle(false)}
            >
              Sign Up
            </button>
          </div>
        )}
      </section>

      {showAuth && (
        <div className="auth-on-page">
          <AuthForm
            isLogin={isLogin}
            onToggle={(newIsLogin) => setIsLogin(newIsLogin)}
            onClose={() => setShowAuth(false)}
          />
        </div>
      )}
    </main>
  );
}