'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from './components/AuthForm';
import { supabase } from './lib/supabase';

const steps = [
  {
    title: 'Write',
    text: 'Choose who it is for and say everything, exactly as it is. No one is reading over your shoulder.',
  },
  {
    title: 'Let it go',
    text: 'Press the button. Your message goes nowhere, and that is the point. It is never delivered to anyone.',
  },
  {
    title: 'Breathe',
    text: 'Your words stay in your private Sent folder, encrypted, for as long as you want them. Delete them whenever you are ready.',
  },
];

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const authRef = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && sessionStorage.getItem('encryptionKey')) {
        router.replace('/profile');
      }
    });
  }, [router]);

  const openAuth = (loginMode: boolean) => {
    setIsLogin(loginMode);
    authRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <main className="landing">
      <nav className="landing-nav">
        <span className="landing-logo">Let It Go</span>
        <div className="landing-nav-actions">
          <button className="landing-link" onClick={() => openAuth(true)}>
            Log in
          </button>
          <button className="cta-button" onClick={() => openAuth(false)}>
            Sign up
          </button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-subtitle">Write, send &amp;</div>
        <h1 className="hero-title">Let It Go</h1>
        <p className="hero-p">
          Some things never get said. Here you can finally say them. Write to the
          person you cannot reach, send it, and set it free. Nobody receives it.
          It is only for you.
        </p>
        <div className="hero-cta">
          <button className="cta-button cta-large" onClick={() => openAuth(false)}>
            Start writing
          </button>
          <button className="landing-link" onClick={() => openAuth(true)}>
            I already have an account
          </button>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-heading">A place to empty your heart</h2>
        <p className="hero-p">
          Not everything can be said out loud to the person it is meant for.
          Let It Go gives those words somewhere to go, so you can put them
          down and move forward.
        </p>
      </section>

      <section className="landing-section">
        <h2 className="landing-heading">How it works</h2>
        <div className="landing-steps">
          {steps.map((s, i) => (
            <div key={s.title} className="landing-card">
              <span className="landing-step-number">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-auth" ref={authRef} id="auth">
        <h2 className="landing-heading">Ready when you are</h2>
        <AuthForm isLogin={isLogin} onToggle={setIsLogin} />
      </section>

      <footer className="landing-footer">
        <p>Your messages are never delivered or shared with anyone.</p>
        <p>
          Let It Go is a portfolio project. There is no email on file, so
          passwords can&apos;t be reset. If you forget yours, just create a new account.
        </p>
      </footer>
    </main>
  );
}
