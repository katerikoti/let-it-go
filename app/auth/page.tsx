'use client';

import { useSearchParams } from 'next/navigation';
import AuthForm from '../components/AuthForm';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'login';
  const isLogin = tab === 'login';

  return (
    <main className="hero-main">
      <AuthForm isLogin={isLogin} />
    </main>
  );
}
