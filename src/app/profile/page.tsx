'use client';

import { UserProfile } from '@/components/UserProfile';
import withAuth from '@/components/withAuth';
import { User, Settings, Shield, Star } from 'lucide-react';

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="floating-element mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
            My Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Manage your account settings, preferences, and view your plugin creation activity
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card group hover:scale-105 transition-all duration-300">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Account Settings</h3>
              <p className="text-[var(--muted-foreground)] text-sm">Update your personal information and preferences</p>
            </div>
          </div>

          <div className="glass-card group hover:scale-105 transition-all duration-300">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Security</h3>
              <p className="text-[var(--muted-foreground)] text-sm">Manage your authentication and security settings</p>
            </div>
          </div>

          <div className="glass-card group hover:scale-105 transition-all duration-300">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Activity</h3>
              <p className="text-[var(--muted-foreground)] text-sm">View your plugin creation history and stats</p>
            </div>
          </div>
        </div>

        {/* Main Profile Component */}
        <div className="glass-card">
          <UserProfile />
        </div>

        {/* Decorative Elements */}
        <div className="fixed top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl floating-element" />
        <div className="fixed bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl floating-element" />
      </div>
    </div>
  );
}

// Export with authentication protection
export default withAuth(ProfilePage);
