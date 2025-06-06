'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Code, 
  MessageSquare, 
  Download, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  Rocket,
  Shield,
  User,
  LogIn
} from 'lucide-react';
import { useHealth } from '@/hooks/useApi';
import { useSession, ExtendedUser } from '@/lib/auth-client';

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
  const { checkHealth, data: healthData } = useHealth();
  const { data: session } = useSession();
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

  return (
    <div className="space-y-16">
      {/* Welcome Section for Authenticated Users */}
      {session?.user && (
        <section className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)] rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-[var(--primary)] rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Welcome back, {(session.user as ExtendedUser).displayName || session.user.name || 'Developer'}!
              </h2>
              <p className="text-[var(--muted-foreground)]">
                Ready to create your next amazing Minecraft plugin?
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'online' ? 'bg-green-500' : 
              apiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="text-[var(--muted-foreground)]">
              API Status: {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--foreground)] leading-tight">
            Create Minecraft Plugins
            <br />
            <span className="text-[var(--primary)]">with AI</span>
          </h1>
          
          <p className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto">
            Transform your ideas into fully functional Minecraft plugins using the power of artificial intelligence. 
            No coding experience required.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {session?.user ? (
            <>
              <Link 
                href="/create" 
                className="btn-primary inline-flex items-center justify-center space-x-2 text-lg px-8 py-4"
              >
                <Rocket className="w-5 h-5" />
                <span>Start Creating</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                href="/chat" 
                className="btn-secondary inline-flex items-center justify-center space-x-2 text-lg px-8 py-4"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat with AI</span>
              </Link>
              
              <Link 
                href="/plugins" 
                className="btn-secondary inline-flex items-center justify-center space-x-2 text-lg px-8 py-4"
              >
                <Code className="w-5 h-5" />
                <span>My Plugins</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/auth/signin" 
                className="btn-primary inline-flex items-center justify-center space-x-2 text-lg px-8 py-4"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In to Start</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                href="/chat" 
                className="btn-secondary inline-flex items-center justify-center space-x-2 text-lg px-8 py-4"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Try Chat Demo</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">
            Powerful Features
          </h2>
          <p className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto">
            Everything you need to create, customize, and deploy Minecraft plugins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="card group">
              <div className="flex items-start space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-[var(--primary)] rounded-lg group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--muted-foreground)]">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">
            How It Works
          </h2>
          <p className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto">
            Get from idea to plugin in just four simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.step} className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto">
                  {step.step}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-[var(--border)]" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  {step.title}
                </h3>
                <p className="text-[var(--muted-foreground)] text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="card text-center space-y-6 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] border-0">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white">
            Ready to Build Your Plugin?
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Join thousands of Minecraft server owners who are already using AI to create amazing plugins
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/create" 
            className="bg-white text-[var(--primary)] hover:bg-gray-100 inline-flex items-center justify-center space-x-2 text-lg px-8 py-4 rounded-lg font-medium transition-all"
          >
            <Zap className="w-5 h-5" />
            <span>Create Your First Plugin</span>
          </Link>
          
          <Link 
            href="/health" 
            className="border-2 border-white text-white hover:bg-white hover:text-[var(--primary)] inline-flex items-center justify-center space-x-2 text-lg px-8 py-4 rounded-lg font-medium transition-all"
          >
            <Shield className="w-5 h-5" />
            <span>View API Status</span>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-[var(--primary)]">AI-Powered</div>
          <div className="text-[var(--muted-foreground)]">Advanced Language Model</div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-[var(--primary)]">Instant</div>
          <div className="text-[var(--muted-foreground)]">Plugin Generation</div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-[var(--primary)]">100%</div>
          <div className="text-[var(--muted-foreground)]">Minecraft Compatible</div>
        </div>
      </section>
    </div>
  );
}
