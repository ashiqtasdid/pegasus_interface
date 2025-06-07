'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

export default function withAuth<P extends Record<string, unknown>>(Component: React.ComponentType<P>) {
  const ProtectedRoute: React.FC<P> = (props) => {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
      // Check if session is not loading and user is not authenticated
      if (!isPending && !session) {
        console.log('[CLIENT] No session found, redirecting to sign-in');
        
        // Get the current path to use as return URL
        const returnTo = window.location.pathname;
        
        // Redirect to sign-in with return URL
        router.push(`/auth/signin?returnTo=${encodeURIComponent(returnTo)}`);
      }
    }, [session, isPending, router]);

    // Show nothing while checking authentication
    if (isPending || !session) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-t-2 border-b-2 border-[var(--primary)] rounded-full animate-spin"></div>
            <p className="text-[var(--muted-foreground)]">Checking authentication...</p>
          </div>
        </div>
      );
    }

    // User is authenticated, render the protected component
    return <Component {...props} />;
  };
  
  return ProtectedRoute;
}
