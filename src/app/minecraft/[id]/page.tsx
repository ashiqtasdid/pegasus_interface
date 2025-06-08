'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserContext } from '@/hooks/useUserContext';

interface MinecraftServer {
  _id: string;
  id: string;
  userId: string;
  status: 'creating' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  port: number;
  playerCount: number;
  maxPlayers: number;
  uptime: number;
  lastSeen: Date;
  lastPlayerActivity: Date;
  autoShutdown: boolean;
  inactiveShutdownMinutes: number;
  containerId?: string;
  error?: string;
  serverName?: string;
  gameMode?: string;
  difficulty?: string;
  pvp?: boolean;
  onlinePlayers?: string[];
  config: any;
  analytics: {
    totalPlayers: number;
    peakPlayerCount: number;
    totalUptime: number;
    restartCount: number;
    lastRestart: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ServerLog {
  _id: string;
  serverId: string;
  userId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  source: 'server' | 'plugin' | 'system';
}

interface ServerCommand {
  _id: string;
  serverId: string;
  userId: string;
  command: string;
  response?: string;
  timestamp: Date;
  status: 'pending' | 'executed' | 'failed';
  executionTime?: number;
}

export default function ServerDetailsPage() {  const params = useParams();
  const router = useRouter();
  const { user, isLoading: userLoading } = useUserContext();
  const [server, setServer] = useState<MinecraftServer | null>(null);
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [commands, setCommands] = useState<ServerCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'console' | 'settings'>('overview');
  const [commandInput, setCommandInput] = useState('');
  const [executing, setExecuting] = useState(false);

  const serverId = params.id as string;

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!userLoading && user && serverId) {
      fetchServerDetails();
      const interval = setInterval(fetchServerDetails, 3000);
      return () => clearInterval(interval);
    }
  }, [user, userLoading, serverId]);

  // Fetch logs when logs tab is active
  useEffect(() => {
    if (activeTab === 'logs' && server) {
      fetchLogs();
    }
  }, [activeTab, server]);

  // Fetch commands when console tab is active
  useEffect(() => {
    if (activeTab === 'console' && server) {
      fetchCommands();
    }
  }, [activeTab, server]);

  const fetchServerDetails = async () => {
    try {
      const response = await fetch(`/api/minecraft/servers/${serverId}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        if (response.status === 404) {
          setError('Server not found');
          return;
        }
        throw new Error('Failed to fetch server details');
      }
      const data = await response.json();
      setServer(data.server);
      setError(null);
    } catch (err) {
      console.error('Error fetching server details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch server details');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/minecraft/servers/${serverId}/logs?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const fetchCommands = async () => {
    try {
      const response = await fetch(`/api/minecraft/servers/${serverId}/command`);
      if (response.ok) {
        const data = await response.json();
        setCommands(data.commands || []);
      }
    } catch (err) {
      console.error('Error fetching commands:', err);
    }
  };

  const executeCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || executing) return;

    setExecuting(true);
    try {
      const response = await fetch(`/api/minecraft/servers/${serverId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandInput.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute command');
      }

      setCommandInput('');
      // Refresh commands list
      setTimeout(fetchCommands, 1000);
    } catch (err) {
      console.error('Error executing command:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute command');
    } finally {
      setExecuting(false);
    }
  };

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      const response = await fetch(`/api/minecraft/servers/${serverId}/${action}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} server`);
      }

      // Refresh server details immediately
      await fetchServerDetails();
    } catch (err) {
      console.error(`Error ${action}ing server:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} server`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-900/20';
      case 'stopped': return 'text-gray-400 bg-gray-900/20';
      case 'starting': case 'stopping': return 'text-yellow-400 bg-yellow-900/20';
      case 'error': return 'text-red-400 bg-red-900/20';
      default: return 'text-blue-400 bg-blue-900/20';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold mb-2">Server not found</h3>
          <p className="text-gray-400 mb-6">The requested server could not be found or you don't have access to it.</p>
          <button
            onClick={() => router.push('/minecraft')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Servers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push('/minecraft')}
              className="text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-2"
            >
              ← Back to Servers
            </button>
            <h1 className="text-3xl font-bold">{server.serverName || server.id}</h1>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(server.status)}`}>
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span className="capitalize">{server.status}</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            {server.status === 'stopped' && (
              <button
                onClick={() => handleServerAction('start')}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Server
              </button>
            )}
            {server.status === 'running' && (
              <>
                <button
                  onClick={() => handleServerAction('stop')}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Stop Server
                </button>
                <button
                  onClick={() => handleServerAction('restart')}
                  className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Restart Server
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'logs', name: 'Logs' },
            { id: 'console', name: 'Console' },
            { id: 'settings', name: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Server Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-2xl font-bold text-green-400">{server.playerCount}</div>
                <div className="text-sm text-gray-400">Players Online</div>
                <div className="text-xs text-gray-500">Max: {server.maxPlayers}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-2xl font-bold text-blue-400">{server.port}</div>
                <div className="text-sm text-gray-400">Server Port</div>
                <div className="text-xs text-gray-500">{server.gameMode} • {server.difficulty}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-2xl font-bold text-yellow-400">
                  {Math.floor(server.uptime / 3600)}h {Math.floor((server.uptime % 3600) / 60)}m
                </div>
                <div className="text-sm text-gray-400">Current Uptime</div>
                <div className="text-xs text-gray-500">Total: {Math.floor(server.analytics.totalUptime / 3600)}h</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-2xl font-bold text-purple-400">{server.analytics.peakPlayerCount}</div>
                <div className="text-sm text-gray-400">Peak Players</div>
                <div className="text-xs text-gray-500">Restarts: {server.analytics.restartCount}</div>
              </div>
            </div>

            {/* Online Players */}
            {server.onlinePlayers && server.onlinePlayers.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Online Players</h3>
                <div className="flex flex-wrap gap-2">
                  {server.onlinePlayers.map((player) => (
                    <span
                      key={player}
                      className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-sm"
                    >
                      {player}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Server Configuration */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>Server Name: <span className="font-semibold">{server.serverName}</span></div>
                <div>Game Mode: <span className="font-semibold capitalize">{server.gameMode}</span></div>
                <div>Difficulty: <span className="font-semibold capitalize">{server.difficulty}</span></div>
                <div>PvP: <span className="font-semibold">{server.pvp ? 'Enabled' : 'Disabled'}</span></div>
                <div>Auto Shutdown: <span className="font-semibold">{server.autoShutdown ? 'Enabled' : 'Disabled'}</span></div>
                <div>Inactive Timeout: <span className="font-semibold">{server.inactiveShutdownMinutes} minutes</span></div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-2 text-sm">
                <div>Last seen: <span className="text-gray-400">{new Date(server.lastSeen).toLocaleString()}</span></div>
                <div>Last player activity: <span className="text-gray-400">{new Date(server.lastPlayerActivity).toLocaleString()}</span></div>
                <div>Created: <span className="text-gray-400">{new Date(server.createdAt).toLocaleString()}</span></div>
                <div>Last updated: <span className="text-gray-400">{new Date(server.updatedAt).toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Server Logs</h3>
              <button
                onClick={fetchLogs}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="bg-black rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No logs available</div>
              ) : (
                logs.map((log) => (
                  <div key={log._id} className="flex gap-3 py-1">
                    <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`text-xs w-12 flex-shrink-0 uppercase ${getLogLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-xs w-16 flex-shrink-0 text-gray-400">
                      {log.source}
                    </span>
                    <span className="text-white">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'console' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Server Console</h3>
            
            {/* Command History */}
            <div className="bg-black rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm mb-4">
              {commands.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No commands executed</div>
              ) : (
                commands.map((cmd) => (
                  <div key={cmd._id} className="mb-2">
                    <div className="flex gap-3 items-center">
                      <span className="text-gray-500 text-xs">
                        {new Date(cmd.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-green-400"></span>
                      <span className="text-white">{cmd.command}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        cmd.status === 'executed' ? 'bg-green-900/30 text-green-400' :
                        cmd.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {cmd.status}
                      </span>
                    </div>
                    {cmd.response && (
                      <div className="ml-6 text-gray-300 text-xs mt-1">
                        {cmd.response}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Command Input */}
            <form onSubmit={executeCommand} className="flex gap-3">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Enter server command..."
                className="flex-1 bg-gray-700 rounded px-4 py-2 text-white font-mono"
                disabled={server.status !== 'running' || executing}
              />
              <button
                type="submit"
                disabled={server.status !== 'running' || executing || !commandInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded font-medium transition-colors"
              >
                {executing ? 'Executing...' : 'Execute'}
              </button>
            </form>
            
            {server.status !== 'running' && (
              <p className="text-yellow-400 text-sm mt-2">
                Server must be running to execute commands
              </p>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Server Settings</h3>
            <div className="text-gray-400">
              Settings management coming soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
