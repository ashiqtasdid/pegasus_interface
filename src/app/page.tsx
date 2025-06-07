'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Code, 
  MessageSquare, 
  Download, 
  ArrowRight,
  Sparkles,
  Rocket,
  Shield,
  User,
  LogIn,
  BarChart3
} from 'lucide-react';
import { useHealth } from '@/hooks/useApi';
import { useSession } from '@/lib/auth-client';
import { useUserContext } from '@/hooks/useUserContext';
import { usePluginAnalytics } from '@/hooks/usePluginAnalytics';
import { activityLogger } from '@/utils/activityLogger';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Describe your plugin idea in natural language and let our AI create the perfect Minecraft plugin for you.',
  },
  {
    icon: MessageSquare,
    title: 'Interactive Chat',
    description: 'Refine and modify your plugins through an intelligent chat interface that understands your requirements.',
  },
  {
    icon: Code,
    title: 'Automatic Compilation',
    description: 'Generated code is automatically compiled and tested to ensure your plugins work perfectly.',
  },
  {
    icon: Download,
    title: 'Instant Download',
    description: 'Download your compiled plugins as JAR files ready to be deployed on your Minecraft server.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Describe Your Plugin',
    description: 'Tell us what you want your plugin to do using simple, natural language.',
  },
  {
    step: '02',
    title: 'AI Generates Code',
    description: 'Our advanced AI understands your requirements and generates optimized Java code.',
  },
  {
    step: '03',
    title: 'Review & Refine',
    description: 'Chat with the AI to make adjustments and improvements to your plugin.',
  },
  {
    step: '04',
    title: 'Download & Deploy',
    description: 'Get your compiled plugin ready to install on any Minecraft server.',
  },
];

export default function HomePage() {
  const { checkHealth } = useHealth();
  const { data: session } = useSession();
  const { userContext } = useUserContext();
  const { analytics, refreshAnalytics } = usePluginAnalytics();
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        await checkHealth();
        setApiStatus('online');
      } catch {
        setApiStatus('offline');
      }
    };

    checkApiStatus();
  }, [checkHealth]);

  // Log page visit activity
  useEffect(() => {
    if (userContext?.isAuthenticated) {
      // Using the base logActivity method since logPageVisit doesn't exist
      activityLogger.logActivity('page.visited', 'user', 'home', { page: 'home' }).catch(console.warn);
      refreshAnalytics(); // Refresh analytics when user is authenticated
    }
  }, [userContext?.isAuthenticated, refreshAnalytics]);

  const handleNavigationClick = async (destination: string) => {
    if (userContext?.isAuthenticated) {
      await activityLogger.logActivity('navigation.clicked', 'user', destination, { destination }).catch(console.warn);
    }
  };

  return (
    <div className="space-y-24">
      {/* Welcome Section for Authenticated Users */}
      {session?.user && userContext && (
        <section className="glass-card bg-gradient-to-br from-[var(--primary)]/10 via-[var(--glass-bg)] to-[var(--accent)]/10 fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-light)] rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-light)] rounded-2xl shadow-xl">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">
                    Welcome back, {userContext.displayName}!
                  </h2>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    userContext.role === 'admin' 
                      ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-500/30'
                      : userContext.role === 'moderator'
                      ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-500/30'  
                      : 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border border-green-500/30'
                  }`}>
                    {userContext.role}
                  </span>
                </div>
                <p className="text-[var(--muted-foreground)] text-lg">
                  Ready to create your next amazing Minecraft plugin?
                </p>
              </div>
            </div>
            
            {/* Enhanced User Stats */}
            {analytics && (
              <div className="flex items-center space-x-8">
                <div className="text-center group">
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {analytics.totalPlugins}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] font-medium">
                    Total Plugins
                  </div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {analytics.pluginsCreatedThisMonth}
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] font-medium">
                    This Month
                  </div>
                </div>
                {userContext.role !== 'admin' && userContext.permissions && (
                  <div className="text-center group">
                    <div className="text-3xl font-bold gradient-text mb-1">
                      {analytics.totalPlugins}/{userContext.permissions.maxPluginsAllowed}
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)] font-medium">
                      Plugin Limit
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Enhanced Hero Section */}
      <section className="hero-gradient text-center space-y-12 py-16 relative overflow-hidden fade-in">
        <div className="space-y-8">
          <div className="flex items-center justify-center space-x-3 text-sm">
            <div className={`w-3 h-3 rounded-full pulse ${
              apiStatus === 'online' ? 'bg-green-400 shadow-lg shadow-green-400/50' : 
              apiStatus === 'offline' ? 'bg-red-400 shadow-lg shadow-red-400/50' : 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
            }`} />
            <span className="text-[var(--muted-foreground)] font-medium">
              API Status: <span className={`font-semibold ${
                apiStatus === 'online' ? 'text-green-400' : 
                apiStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
              </span>
            </span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-[var(--foreground)] leading-tight">
              Create Minecraft Plugins
              <br />
              <span className="gradient-text floating">with AI</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-[var(--muted-foreground)] max-w-3xl mx-auto leading-relaxed">
              Transform your ideas into fully functional Minecraft plugins using the power of artificial intelligence. 
              <span className="text-[var(--foreground)] font-semibold"> No coding experience required.</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {session?.user ? (
            <>
              <Link 
                href="/create" 
                onClick={() => handleNavigationClick('create')}
                className="btn-primary inline-flex items-center justify-center space-x-3 text-lg px-10 py-5 hover-glow group"
              >
                <Rocket className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Start Creating</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/chat" 
                onClick={() => handleNavigationClick('chat')}
                className="btn-secondary inline-flex items-center justify-center space-x-3 text-lg px-10 py-5 group"
              >
                <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Chat with AI</span>
              </Link>
              
              <Link 
                href="/plugins" 
                onClick={() => handleNavigationClick('plugins')}
                className="btn-secondary inline-flex items-center justify-center space-x-3 text-lg px-10 py-5 group"
              >
                <Code className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>My Plugins</span>
              </Link>

              {/* Show analytics button for admins */}
              {userContext?.role === 'admin' && (
                <Link 
                  href="/analytics" 
                  onClick={() => handleNavigationClick('analytics')}
                  className="btn-secondary inline-flex items-center justify-center space-x-3 text-lg px-10 py-5 group"
                >
                  <BarChart3 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Analytics</span>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link 
                href="/auth/signin" 
                className="btn-primary inline-flex items-center justify-center space-x-3 text-lg px-10 py-5 hover-glow group"
              >
                <LogIn className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Sign In to Start</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/chat" 
                className="btn-secondary inline-flex items-center justify-center space-x-3 text-lg px-10 py-5 group"
              >
                <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span>Try Chat Demo</span>
              </Link>
            </>
          )}
        </div>

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-light)] rounded-full opacity-10 floating" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-[var(--accent-light)] to-[var(--primary)] rounded-full opacity-10 floating" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-light)] rounded-full opacity-10 floating" style={{animationDelay: '2s'}}></div>
      </section>

      {/* Enhanced Features Section */}
      <section className="space-y-16">
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-6">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-[var(--muted-foreground)] text-xl max-w-3xl mx-auto leading-relaxed">
            Everything you need to create, customize, and deploy Minecraft plugins with cutting-edge AI technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={feature.title} className="glass-card group hover-glow" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-light)] rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-light)] rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3 group-hover:text-[var(--primary)] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--muted-foreground)] text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced How It Works Section */}
      <section className="space-y-16">
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)]">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-[var(--muted-foreground)] text-xl max-w-3xl mx-auto leading-relaxed">
            Get from idea to plugin in just four simple steps with our streamlined AI-powered workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.step} className="text-center space-y-6 group fade-in" style={{animationDelay: `${index * 0.2}s`}}>
              <div className="relative">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-light)] rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-light)] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    {step.step}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-light)] opacity-20" />
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="glass-card text-center space-y-10 bg-gradient-to-br from-[var(--primary)]/20 via-[var(--glass-bg)] to-[var(--accent-light)]/20 border-2 border-[var(--primary)]/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--accent-light)]/5"></div>
        <div className="relative z-10 space-y-8">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Build Your <span className="gradient-text">Plugin</span>?
            </h2>
            <p className="text-blue-100 text-xl max-w-3xl mx-auto leading-relaxed">
              Join thousands of Minecraft server owners who are already using AI to create amazing plugins. 
              Start your journey today and bring your ideas to life!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              href="/create" 
              className="group relative bg-white text-[var(--primary)] hover:bg-gray-50 inline-flex items-center justify-center space-x-3 text-lg px-10 py-5 rounded-xl font-bold transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:scale-105"
            >
              <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Create Your First Plugin</span>
            </Link>
            
            <Link 
              href="/health" 
              className="group border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 inline-flex items-center justify-center space-x-3 text-lg px-10 py-5 rounded-xl font-bold transition-all duration-300 backdrop-blur-10"
            >
              <Shield className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>View API Status</span>
            </Link>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl"></div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card text-center space-y-4 group hover-glow">
          <div className="relative">
            <div className="text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">AI-Powered</div>
            <div className="text-[var(--muted-foreground)] text-lg font-medium">Advanced Language Model</div>
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-light)] rounded-full mx-auto"></div>
        </div>
        <div className="glass-card text-center space-y-4 group hover-glow">
          <div className="relative">
            <div className="text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">Instant</div>
            <div className="text-[var(--muted-foreground)] text-lg font-medium">Plugin Generation</div>
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-light)] rounded-full mx-auto"></div>
        </div>
        <div className="glass-card text-center space-y-4 group hover-glow">
          <div className="relative">
            <div className="text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">100%</div>
            <div className="text-[var(--muted-foreground)] text-lg font-medium">Minecraft Compatible</div>
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-light)] rounded-full mx-auto"></div>
        </div>
      </section>
    </div>
  );
}
