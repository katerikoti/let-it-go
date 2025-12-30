'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Dynamically import AuthForm to prevent SSR errors
const AuthForm = dynamic(() => import('../components/AuthForm'), { ssr: false });

function AuthPageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'login';
  const isLogin = tab === 'login';

  return (
    <main className="hero-main">
      <AuthForm isLogin={isLogin} />
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}