'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSuccess = () => {
    // Redirect to return URL or home page after successful sign up
    const returnTo = searchParams.get('returnTo') || '/';
    router.push(returnTo);
  };

  const handleModeChange = (mode: 'signin' | 'signup') => {
    if (mode === 'signin') {
      const returnTo = searchParams.get('returnTo');
      const url = returnTo ? `/auth/signin?returnTo=${encodeURIComponent(returnTo)}` : '/auth/signin';
      router.push(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)] flex items-center justify-center p-4">
      <AuthForm 
        mode="signup" 
        onSuccess={handleSuccess}
        onModeChange={handleModeChange}
      />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] to-[var(--secondary)] flex items-center justify-center p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]"></div>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
