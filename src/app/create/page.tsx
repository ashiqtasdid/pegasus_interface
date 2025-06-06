'use client';

import React, { useState } from 'react';
import { 
  Wand2, 
  Code, 
  Download, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { usePluginGeneration } from '@/hooks/useApi';
import { downloadPluginFile } from '@/lib/api';
import { ChatComponent } from '@/components/ChatComponent';

const PluginGenerationForm: React.FC<{
  onGenerate: (data: any) => void;
  loading: boolean;
}> = ({ onGenerate, loading }) => {
  const [formData, setFormData] = useState({
    prompt: '',
    name: '',
    description: '',
    author: '',
    version: '1.0.0',
    mainClass: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Plugin Description *
        </label>
        <textarea
          id="prompt"
          name="prompt"
          required
          className="textarea"
          rows={4}
          placeholder="Describe what you want your plugin to do. For example: 'Create a plugin that gives players a diamond sword when they type /sword'"
          value={formData.prompt}
          onChange={handleChange}
        />
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Be as specific as possible about the functionality you want.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Plugin Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="input"
            placeholder="MyAwesomePlugin"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Author
          </label>
          <input
            type="text"
            id="author"
            name="author"
            className="input"
            placeholder="Your Name"
            value={formData.author}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="version" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Version
          </label>
          <input
            type="text"
            id="version"
            name="version"
            className="input"
            placeholder="1.0.0"
            value={formData.version}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="mainClass" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Main Class (Optional)
          </label>
          <input
            type="text"
            id="mainClass"
            name="mainClass"
            className="input"
            placeholder="Main"
            value={formData.mainClass}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Additional Description
        </label>
        <textarea
          id="description"
          name="description"
          className="textarea"
          rows={3}
          placeholder="Any additional details about your plugin..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !formData.prompt || !formData.name}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Generating Plugin...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            <span>Generate Plugin</span>
          </>
        )}
      </button>
    </form>
  );
};

const PluginChatWrapper: React.FC<{
  pluginName: string;
}> = ({ pluginName }) => {
  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center space-x-2">
        <MessageSquare className="w-5 h-5" />
        <span>Chat with AI</span>
      </h3>
      <ChatComponent
        selectedPlugin={pluginName}
        compact={true}
        className="border-0"
      />
    </div>
  );
};

const CompilationStatus: React.FC<{
  status: string;
  pluginName: string;
  onDownload: () => void;
}> = ({ status, pluginName, onDownload }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'status-pending',
          text: 'Compilation Pending',
          description: 'Your plugin is in the compilation queue.'
        };
      case 'compiling':
        return {
          icon: Loader2,
          color: 'status-compiling',
          text: 'Compiling',
          description: 'Your plugin is being compiled.',
          spinning: true
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'status-success',
          text: 'Compilation Successful',
          description: 'Your plugin is ready for download!'
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'status-failed',
          text: 'Compilation Failed',
          description: 'There was an error compiling your plugin.'
        };
      default:
        return {
          icon: Clock,
          color: 'status-pending',
          text: 'Unknown Status',
          description: 'Status unknown.'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className={`w-6 h-6 ${config.color} ${config.spinning ? 'animate-spin' : ''}`} />
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">{config.text}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">{config.description}</p>
          </div>
        </div>
        
        {status === 'success' && (
          <button
            onClick={onDownload}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default function CreatePluginPage() {
  const { generatePlugin, loading, error, data, compilationStatus, reset } = usePluginGeneration();
  const [generatedPluginName, setGeneratedPluginName] = useState<string>('');
  const [isLongRunning, setIsLongRunning] = useState(false);

  // Show timeout warning after 30 seconds
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading) {
      timeoutId = setTimeout(() => {
        setIsLongRunning(true);
      }, 30000);
    } else {
      setIsLongRunning(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  const handleGenerate = async (formData: any) => {
    // Validate required fields
    if (!formData.prompt.trim()) {
      console.error('Plugin description is required');
      return;
    }
    if (!formData.name.trim()) {
      console.error('Plugin name is required');
      return;
    }

    try {
      const result = await generatePlugin(formData);
      setGeneratedPluginName(formData.name);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const handleDownload = async () => {
    if (generatedPluginName) {
      try {
        await downloadPluginFile(generatedPluginName);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const handleReset = () => {
    reset();
    setGeneratedPluginName('');
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Create Your Plugin
        </h1>
        <p className="text-[var(--muted-foreground)] max-w-2xl mx-auto">
          Describe your plugin idea and let our AI generate the perfect Minecraft plugin for you
        </p>
      </div>

      {error && (
        <div className="card border-red-500 bg-red-500 bg-opacity-10">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-500">Error</h3>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLongRunning && loading && (
        <div className="card border-yellow-500 bg-yellow-500 bg-opacity-10">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div>
              <h3 className="font-semibold text-yellow-500">Taking Longer Than Expected</h3>
              <p className="text-sm text-yellow-400">
                AI plugin generation is currently running slower than usual. This may be due to service degradation. 
                Please be patient as we process your request.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generation Form */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center space-x-2">
              <Wand2 className="w-5 h-5" />
              <span>Plugin Details</span>
            </h2>
            <PluginGenerationForm onGenerate={handleGenerate} loading={loading} />
          </div>

          {generatedPluginName && (
            <CompilationStatus
              status={compilationStatus}
              pluginName={generatedPluginName}
              onDownload={handleDownload}
            />
          )}
        </div>

        {/* Generated Code & Chat */}
        <div className="space-y-6">
          {data && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>API Response</span>
                </h3>
                <button onClick={handleReset} className="btn-secondary text-sm">
                  New Plugin
                </button>
              </div>
              <div className="bg-[var(--secondary)] p-4 rounded-lg max-h-96 overflow-auto">
                <pre className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                  {data}
                </pre>
              </div>
            </div>
          )}

          {generatedPluginName && (
            <PluginChatWrapper
              pluginName={generatedPluginName}
            />
          )}
        </div>
      </div>
    </div>
  );
}
