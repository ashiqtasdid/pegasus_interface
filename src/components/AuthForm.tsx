'use client';

import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  Github
} from 'lucide-react';
import { signIn, signUp } from '@/lib/auth-client';

interface AuthFormProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  mode = 'signin', 
  onSuccess, 
  onModeChange 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (mode === 'signup') {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signin') {
        const result = await signIn.email({
          email: formData.email,
          password: formData.password,
        });

        if (result.error) {
          setError(result.error.message || 'Sign in failed');
        } else {
          setSuccess('Successfully signed in!');
          onSuccess?.();
        }
      } else {
        const result = await signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });

        if (result.error) {
          setError(result.error.message || 'Sign up failed');
        } else {
          setSuccess('Account created successfully!');
          onSuccess?.();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await signIn.social({
        provider: 'github',
        callbackURL: '/profile', // Redirect to profile after successful sign-in
      });

      if (result.error) {
        setError(result.error.message || 'GitHub sign in failed');
      }
      // Note: For social sign-in, the user will be redirected to GitHub and then back
      // so we don't need to handle success here as the page will redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'signin' ? 'signup' : 'signin';
    onModeChange?.(newMode);
    setError(null);
    setSuccess(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] rounded-2xl opacity-5"></div>
        
        <div className="relative backdrop-blur-sm bg-[var(--background)]/80 border border-[var(--border)]/50 rounded-2xl shadow-2xl shadow-[var(--primary)]/10 p-8">
          <div className="text-center mb-8">
            {/* Enhanced icon with gradient background */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-2xl blur-lg opacity-30 scale-110"></div>
              <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-2xl mx-auto shadow-lg">
                {mode === 'signin' ? (
                  <LogIn className="w-8 h-8 text-white drop-shadow-md" />
                ) : (
                  <UserPlus className="w-8 h-8 text-white drop-shadow-md" />
                )}
              </div>
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent mb-3">
              {mode === 'signin' ? 'Welcome Back' : 'Join Pegasus Nest'}
            </h1>
            <p className="text-[var(--muted-foreground)] text-lg leading-relaxed">
              {mode === 'signin' 
                ? 'Sign in to continue your AI plugin journey' 
                : 'Create your account and start building amazing plugins'
              }
            </p>
          </div>

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="text-red-500 font-medium">Authentication Error</h4>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div className="group">
              <label htmlFor="name" className="block text-sm font-semibold text-[var(--foreground)] mb-3 transition-colors group-focus-within:text-[var(--primary)]">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[var(--primary)]">
                  <User className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-[var(--background)]/50 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] focus:bg-[var(--background)] hover:border-[var(--border)] backdrop-blur-sm"
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="group">
            <label htmlFor="email" className="block text-sm font-semibold text-[var(--foreground)] mb-3 transition-colors group-focus-within:text-[var(--primary)]">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[var(--primary)]">
                <Mail className="w-5 h-5 text-[var(--muted-foreground)]" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-4 bg-[var(--background)]/50 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] focus:bg-[var(--background)] hover:border-[var(--border)] backdrop-blur-sm"
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>
          </div>

          <div className="group">
            <label htmlFor="password" className="block text-sm font-semibold text-[var(--foreground)] mb-3 transition-colors group-focus-within:text-[var(--primary)]">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[var(--primary)]">
                <Lock className="w-5 h-5 text-[var(--muted-foreground)]" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-12 py-4 bg-[var(--background)]/50 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] focus:bg-[var(--background)] hover:border-[var(--border)] backdrop-blur-sm"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors duration-200 p-1 rounded-lg hover:bg-[var(--primary)]/10"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="group">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[var(--foreground)] mb-3 transition-colors group-focus-within:text-[var(--primary)]">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors group-focus-within:text-[var(--primary)]">
                  <Lock className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 bg-[var(--background)]/50 border border-[var(--border)]/50 rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] focus:bg-[var(--background)] hover:border-[var(--border)] backdrop-blur-sm"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors duration-200 p-1 rounded-lg hover:bg-[var(--primary)]/10"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-xl hover:shadow-[var(--primary)]/40 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative flex items-center justify-center space-x-3">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-lg">{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? (
                      <LogIn className="w-5 h-5" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                    <span className="text-lg">{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>

        {/* GitHub Sign-In Button */}
        <div className="mt-6">
          <button
            onClick={handleGithubSignIn}
            disabled={loading}
            className="w-full relative overflow-hidden bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-semibold py-4 px-6 rounded-xl shadow-sm hover:shadow-md transform transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group hover:border-[var(--primary)]/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="relative flex items-center justify-center space-x-3">
              <Github className="w-5 h-5" />
              <span className="text-lg">Continue with GitHub</span>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--background)] text-[var(--muted-foreground)]">or</span>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-[var(--muted-foreground)] mb-4">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              onClick={toggleMode}
              className="group relative inline-flex items-center justify-center px-6 py-3 text-[var(--primary)] border border-[var(--primary)]/30 rounded-xl font-medium transition-all duration-200 hover:bg-[var(--primary)]/10 hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <span className="relative">
                {mode === 'signin' ? 'Create New Account' : 'Sign In Instead'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
