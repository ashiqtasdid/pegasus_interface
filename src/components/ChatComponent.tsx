'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Trash2,
  Download,
  AlertCircle,
  Clock,
  Loader2,
  Sparkles
} from 'lucide-react';
import { usePluginChat } from '@/hooks/useApi';
import { downloadPluginFile } from '@/lib/api';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pluginName?: string;
}

interface ChatComponentProps {
  selectedPlugin?: string;
  onPluginChange?: (plugin: string) => void;
  availablePlugins?: string[];
  compact?: boolean;
  className?: string;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  selectedPlugin = '',
  onPluginChange,
  availablePlugins = [],
  compact = false,
  className = ''
}) => {
  const { sendMessage, loading, error, messages: apiMessages, clearMessages } = usePluginChat();
  const [currentMessage, setCurrentMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  useEffect(() => {
    // Convert API messages to local messages format
    const convertedMessages: Message[] = [];
    apiMessages.forEach(msg => {
      convertedMessages.push({
        id: `${msg.id}-user`,
        type: 'user',
        content: msg.message,
        timestamp: msg.timestamp,
        pluginName: selectedPlugin
      });
      convertedMessages.push({
        id: `${msg.id}-assistant`,
        type: 'assistant',
        content: msg.response,
        timestamp: msg.timestamp,
        pluginName: selectedPlugin
      });
    });
    setLocalMessages(convertedMessages);
  }, [apiMessages, selectedPlugin]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const messageToSend = currentMessage;
    setCurrentMessage('');

    try {
      if (selectedPlugin) {
        // Chat with specific plugin
        await sendMessage({
          message: messageToSend,
          name: selectedPlugin,
        });
      } else {
        // General AI chat (create a temporary message for general questions)
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: messageToSend,
          timestamp: new Date(),
        };

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: "I'm an AI assistant specialized in Minecraft plugin development. To chat about specific plugins, please select one from the dropdown above. For general plugin creation, use the 'Create Plugin' page. I can help you with:\n\n• Plugin ideas and concepts\n• Minecraft API questions\n• Best practices\n• Code explanations\n• Troubleshooting\n\nWhat would you like to know?",
          timestamp: new Date(),
        };

        setLocalMessages(prev => [...prev, userMessage, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    clearMessages();
    setLocalMessages([]);
  };

  const handleDownloadPlugin = async (pluginName: string) => {
    try {
      await downloadPluginFile(pluginName);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Plugin Selection (only show if not compact and plugins available) */}
      {!compact && availablePlugins.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 space-y-2">
            <label htmlFor="plugin-select" className="block text-sm font-medium text-[var(--foreground)]">
              Select Plugin (Optional)
            </label>
            <select
              id="plugin-select"
              value={selectedPlugin}
              onChange={(e) => onPluginChange?.(e.target.value)}
              className="input max-w-sm"
            >
              <option value="">General AI Chat</option>
              {availablePlugins.map((plugin) => (
                <option key={plugin} value={plugin}>
                  {plugin}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--muted-foreground)]">
              {selectedPlugin 
                ? `Chatting about ${selectedPlugin} plugin` 
                : 'General conversation about plugin development'
              }
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {selectedPlugin && (
              <button
                onClick={() => handleDownloadPlugin(selectedPlugin)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={handleClearChat}
              className="btn-secondary flex items-center space-x-2"
              disabled={localMessages.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className={`space-y-4 overflow-y-auto border border-[var(--border)] rounded-lg p-4 ${
        compact ? 'min-h-64 max-h-64' : 'min-h-96 max-h-96'
      }`}>
        {localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <div className="w-12 h-12 bg-[var(--primary)] bg-opacity-10 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Start a Conversation
              </h3>
              <p className="text-[var(--muted-foreground)] text-sm max-w-md">
                {selectedPlugin 
                  ? `Ask questions about ${selectedPlugin} or request modifications`
                  : 'Ask me anything about Minecraft plugin development'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {localMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-[var(--primary)] text-white' 
                      : 'bg-[var(--secondary)] text-[var(--foreground)]'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`flex-1 space-y-2 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--secondary)] text-[var(--foreground)]'
                    }`}>
                      <pre className="whitespace-pre-wrap text-sm font-sans">{message.content}</pre>
                    </div>
                    {!compact && (
                      <div className="flex items-center space-x-2 text-xs text-[var(--muted-foreground)]">
                        <Clock className="w-3 h-3" />
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.pluginName && (
                          <>
                            <span>•</span>
                            <span>{message.pluginName}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex space-x-3 max-w-3xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--secondary)] text-[var(--foreground)] flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-[var(--secondary)] text-[var(--foreground)] p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-500 text-sm">{error}</span>
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-3">
        <div className="flex space-x-2">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedPlugin 
              ? `Ask about ${selectedPlugin} or request modifications...` 
              : "Ask about plugin development, Minecraft APIs, or general questions..."
            }
            className={`textarea flex-1 resize-none ${compact ? 'min-h-16' : 'min-h-20'}`}
            disabled={loading}
            maxLength={1000}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !currentMessage.trim()}
            className="btn-primary px-6 self-end flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {!compact && <span>Send</span>}
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{currentMessage.length}/1000</span>
        </div>
      </div>
    </div>
  );
};
