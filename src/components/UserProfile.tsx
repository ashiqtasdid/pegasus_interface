'use client';

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Settings, 
  LogOut, 
  Edit2, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { useSession, signOut, ExtendedUser } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export const UserProfile: React.FC = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    displayName: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  React.useEffect(() => {
    if (session?.user) {
      const user = session.user as ExtendedUser;
      setFormData({
        displayName: user.displayName || user.name || '',
      });
    }
  }, [session]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="text-center p-8">
        <User className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
        <p className="text-[var(--muted-foreground)]">Please sign in to view your profile.</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      setError('Failed to sign out');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update user profile via API
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: formData.displayName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const user = session.user as ExtendedUser;
    setFormData({
      displayName: user.displayName || user.name || '',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChange = async () => {
    // Validate passwords
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsChangingPassword(false);
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 text-white';
      case 'moderator':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="card relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-24 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10 backdrop-blur-sm"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] blur-md opacity-70 scale-110"></div>
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                {(session.user as ExtendedUser).displayName || session.user.name || 'User Profile'}
              </h2>
              <p className="text-[var(--muted-foreground)]">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="relative overflow-hidden bg-white border border-red-500/30 text-red-600 font-semibold py-3 px-6 rounded-xl shadow-sm hover:shadow-md transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="absolute inset-0 bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <span className="relative flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="text-red-500 font-medium">Profile Error</h4>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h4 className="text-green-500 font-medium">Success!</h4>
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Display Name */}
          <div className="group">
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3 transition-colors group-focus-within:text-[var(--primary)]">
              Display Name
            </label>
            {isEditing ? (
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[var(--primary)]">
                  <User className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 bg-[var(--background)]/50 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] focus:bg-[var(--background)] hover:border-[var(--border)] backdrop-blur-sm"
                  placeholder="Enter your display name"
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-3 bg-[var(--muted)]/30 border border-[var(--border)]/30 p-4 rounded-xl">
                <User className="w-5 h-5 text-[var(--muted-foreground)]" />
                <span className="text-[var(--foreground)]">
                  {(session.user as ExtendedUser).displayName || session.user.name || 'Not set'}
                </span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="group">
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
              Email Address
            </label>
            <div className="flex items-center space-x-3 bg-[var(--muted)]/30 border border-[var(--border)]/30 p-4 rounded-xl">
              <Mail className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span className="text-[var(--foreground)]">{session.user.email}</span>
            </div>
          </div>

          {/* Role */}
          <div className="group">
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-3">
              Role
            </label>
            <div className="flex items-center space-x-3 bg-[var(--muted)]/30 border border-[var(--border)]/30 p-4 rounded-xl">
              <Shield className="w-5 h-5 text-[var(--muted-foreground)]" />
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleColor((session.user as ExtendedUser).role || 'user')}`}>
                {((session.user as ExtendedUser).role || 'user').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="group relative inline-flex items-center justify-center px-6 py-3 text-[var(--muted-foreground)] border border-[var(--border)]/50 rounded-xl font-medium transition-all duration-200 hover:bg-[var(--muted)]/20 hover:border-[var(--border)] hover:text-[var(--foreground)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center space-x-2">
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-xl hover:shadow-[var(--primary)]/40 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative flex items-center space-x-2">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Changes</span>
                  </span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="group relative inline-flex items-center justify-center px-6 py-3 text-[var(--primary)] border border-[var(--primary)]/30 rounded-xl font-medium transition-all duration-200 hover:bg-[var(--primary)]/10 hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center space-x-2">
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="card bg-gradient-to-br from-[var(--background)] to-[var(--muted)]/30 border border-[var(--border)]/50 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-5 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10">
            <Settings className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <span>Account Information</span>
        </h3>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center p-3 rounded-lg hover:bg-[var(--muted)]/30 transition-colors">
            <span className="text-[var(--muted-foreground)] font-medium">Account Created</span>
            <span className="text-[var(--foreground)] bg-[var(--muted)]/40 px-3 py-1.5 rounded-md font-mono">
              {new Date(session.user.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg hover:bg-[var(--muted)]/30 transition-colors">
            <span className="text-[var(--muted-foreground)] font-medium">Last Updated</span>
            <span className="text-[var(--foreground)] bg-[var(--muted)]/40 px-3 py-1.5 rounded-md font-mono">
              {new Date(session.user.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg hover:bg-[var(--muted)]/30 transition-colors">
            <span className="text-[var(--muted-foreground)] font-medium">User ID</span>
            <span className="text-[var(--foreground)] bg-[var(--muted)]/40 px-3 py-1.5 rounded-md font-mono text-xs truncate max-w-[200px]" title={session.user.id}>
              {session.user.id}
            </span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <button
            onClick={() => setIsChangingPassword(true)}
            className="group relative inline-flex items-center justify-center px-6 py-3 text-[var(--primary)] border border-[var(--primary)]/30 rounded-xl font-medium transition-all duration-200 hover:bg-[var(--primary)]/10 hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>Change Password</span>
            </span>
          </button>
        </div>
      </div>
      
      {/* Password Change Section */}
      {isChangingPassword && (
        <div className="card">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </h3>
          
          {passwordError && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h4 className="text-red-500 font-medium">Password Error</h4>
                  <span className="text-red-400 text-sm">{passwordError}</span>
                </div>
              </div>
            </div>
          )}

          {passwordSuccess && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="text-green-500 font-medium">Success!</h4>
                  <span className="text-green-400 text-sm">{passwordSuccess}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Current Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-3 transition-colors group-focus-within:text-[var(--primary)]">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[var(--primary)]">
                  <Lock className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full pl-12 pr-12 py-4 bg-[var(--background)]/50 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] focus:bg-[var(--background)] hover:border-[var(--border)] backdrop-blur-sm"
                  placeholder="Enter your current password"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors duration-200 p-1 rounded-lg hover:bg-[var(--primary)]/10"
                  disabled={passwordLoading}
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* New Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-3 transition-colors group-focus-within:text-[var(--primary)]">
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[var(--primary)]">
                  <Key className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full pl-12 pr-12 py-4 bg-[var(--background)]/50 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] focus:bg-[var(--background)] hover:border-[var(--border)] backdrop-blur-sm"
                  placeholder="Enter your new password"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors duration-200 p-1 rounded-lg hover:bg-[var(--primary)]/10"
                  disabled={passwordLoading}
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Password must be at least 6 characters long
              </p>
            </div>
            
            {/* Confirm New Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-3 transition-colors group-focus-within:text-[var(--primary)]">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[var(--primary)]">
                  <Key className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full pl-12 pr-12 py-4 bg-[var(--background)]/50 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] focus:bg-[var(--background)] hover:border-[var(--border)] backdrop-blur-sm"
                  placeholder="Confirm your new password"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors duration-200 p-1 rounded-lg hover:bg-[var(--primary)]/10"
                  disabled={passwordLoading}
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={handleCancelPasswordChange}
                disabled={passwordLoading}
                className="group relative inline-flex items-center justify-center px-6 py-3 text-[var(--muted-foreground)] border border-[var(--border)]/50 rounded-xl font-medium transition-all duration-200 hover:bg-[var(--muted)]/20 hover:border-[var(--border)] hover:text-[var(--foreground)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </span>
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading}
                className="relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-xl hover:shadow-[var(--primary)]/40 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <span className="relative flex items-center space-x-2">
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Update Password</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
