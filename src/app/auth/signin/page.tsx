'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSuccess = () => {
    // Redirect to return URL or home page after successful sign in
    const returnTo = searchParams.get('returnTo') || '/';
    router.push(returnTo);
  };

  const handleModeChange = (mode: 'signin' | 'signup') => {
    if (mode === 'signup') {
      const returnTo = searchParams.get('returnTo');
      const url = returnTo ? `/auth/signup?returnTo=${encodeURIComponent(returnTo)}` : '/auth/signup';
      router.push(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)] flex items-center justify-center p-4">
      <AuthForm 
        mode="signin" 
        onSuccess={handleSuccess}
        onModeChange={handleModeChange}
      />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)] flex items-center justify-center p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]"></div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
