'use client';

import { UserProfile } from '@/components/UserProfile';
import withAuth from '@/components/withAuth';

function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          My Profile
        </h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Manage your account settings and preferences
        </p>
      </div>
      
      <UserProfile />
    </div>
  );
}

// Export with authentication protection
export default withAuth(ProfilePage);
