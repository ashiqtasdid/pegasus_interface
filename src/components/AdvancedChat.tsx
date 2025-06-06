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
  Sparkles,
  Plus,
  ChevronLeft,
  Settings,
  FileCode,
  Zap,
  History,
  X
} from 'lucide-react';
import { usePluginChat, useUserPlugins } from '@/hooks/useApi';
import { downloadPluginFile } from '@/lib/api';

interface ChatMessage {
  _id: string;
  userId: string;
  pluginName: string;
  message: string;
  response: string;
  messageType: 'info' | 'modification';
  operations?: FileOperation[];
  compilationResult?: CompilationResult;
  timestamp: Date;
  conversationId: string;
}

interface FileOperation {
  type: 'create' | 'modify' | 'delete';
  file: string;
  content: string;
}

interface CompilationResult {
  success: boolean;
  output: string;
  errors: string[];
}

interface ChatConversation {
  _id: string;
  userId: string;
  pluginName: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

interface AdvancedChatProps {
  selectedPlugin?: string;
  onPluginChange?: (plugin: string) => void;
  compact?: boolean;
  className?: string;
}

export const AdvancedChat: React.FC<AdvancedChatProps> = ({
  selectedPlugin,
  onPluginChange,
  compact = false,
  className = ''
}) => {
  const { 
    sendMessage, 
    loadConversations, 
    loadMessages, 
    deleteConversation,
    loading, 
    error, 
    conversations, 
    messages, 
    currentConversation 
  } = usePluginChat();

  const { loadUserPlugins, plugins: userPlugins } = useUserPlugins();

  const [currentMessage, setCurrentMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(!compact);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user plugins and conversations on mount
  useEffect(() => {
    loadUserPlugins();
    if (selectedPlugin) {
      loadConversations(selectedPlugin);
    }
  }, [selectedPlugin, loadUserPlugins, loadConversations]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedPlugin) return;

    const messageToSend = currentMessage;
    setCurrentMessage('');

    try {
      const response = await sendMessage({
        message: messageToSend,
        pluginName: selectedPlugin,
        conversationId: selectedConversation || undefined,
      });

      if (response.success && response.conversationId) {
        if (!selectedConversation) {
          setSelectedConversation(response.conversationId);
          // Reload conversations to get the new one
          loadConversations(selectedPlugin);
        }
        // Reload messages for the current conversation
        loadMessages(response.conversationId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    setSelectedConversation(null);
    setCurrentMessage('');
  };

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    await loadMessages(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(conversationId);
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    }
  };

  const handleDownloadPlugin = async (pluginName: string) => {
    try {
      await downloadPluginFile(pluginName);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatTimestamp = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = index % 2 === 0; // Assuming messages alternate user/assistant
    const content = isUser ? message.message : message.response;
    
    return (
      <div key={`${message._id}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`flex space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          }`}>
            {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
          </div>
          
          <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
            <div className={`inline-block p-4 rounded-2xl shadow-sm ${
              isUser
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
            }`}>
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{content}</pre>
            </div>
            
            {/* Show operations and compilation results for assistant messages */}
            {!isUser && message.operations && message.operations.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <FileCode className="w-3 h-3 mr-1" />
                  File Operations
                </div>
                {message.operations.map((op, opIndex) => (
                  <div key={opIndex} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {op.type.toUpperCase()}: {op.file}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        op.type === 'create' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        op.type === 'modify' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {op.type}
                      </span>
                    </div>
                    {op.content && (
                      <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        {op.content.length > 200 ? op.content.substring(0, 200) + '...' : op.content}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Show compilation results */}
            {!isUser && message.compilationResult && (
              <div className="mt-3">
                <div className={`p-3 rounded-lg border ${
                  message.compilationResult.success
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                  <div className="flex items-center mb-2">
                    <Zap className={`w-4 h-4 mr-2 ${
                      message.compilationResult.success ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      message.compilationResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      Compilation {message.compilationResult.success ? 'Successful' : 'Failed'}
                    </span>
                  </div>
                  {message.compilationResult.output && (
                    <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-2 rounded overflow-x-auto">
                      {message.compilationResult.output}
                    </pre>
                  )}
                  {message.compilationResult.errors && message.compilationResult.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-red-600 mb-1">Errors:</div>
                      {message.compilationResult.errors.map((error, errorIndex) => (
                        <div key={errorIndex} className="text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded mb-1">
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.messageType && (
                  <>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      message.messageType === 'modification' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {message.messageType}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!selectedPlugin) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Select a Plugin to Chat
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Choose one of your generated plugins to start chatting about it or requesting modifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Sidebar - Conversations */}
      {showSidebar && (
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedPlugin}
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleNewConversation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No conversations yet.
                  <br />
                  Start chatting to create one!
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conversation._id
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleSelectConversation(conversation._id)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {conversation.messageCount} messages
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(conversation.updatedAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Plugin Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleDownloadPlugin(selectedPlugin)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Plugin</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedPlugin} Chat
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ask questions or request modifications
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="max-w-md">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Ready to Chat!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Ask me anything about <span className="font-semibold text-blue-600">{selectedPlugin}</span> or 
                  request modifications. I can help you understand the code, add new features, fix bugs, or 
                  explain how everything works.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-blue-600 mb-2">💡 Information</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    "What commands does this plugin have?"
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-purple-600 mb-2">🔧 Modification</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    "Add a new command called /heal"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message, index) => renderMessage(message, index))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex space-x-3 max-w-[80%]">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
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
          <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4">
            <div className="flex-1">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask about ${selectedPlugin} or request modifications...`}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                rows={3}
                disabled={loading}
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>{currentMessage.length}/2000</span>
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={loading || !currentMessage.trim()}
              className="self-end bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
