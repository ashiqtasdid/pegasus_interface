'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function MinecraftPage() {
  const { user, isLoading: userLoading } = useUserContext();
  const router = useRouter();
  const [servers, setServers] = useState<MinecraftServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedServer, setSelectedServer] = useState<MinecraftServer | null>(null);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!userLoading && user) {
      fetchServers();
      const interval = setInterval(fetchServers, 5000);
      return () => clearInterval(interval);
    }
  }, [user, userLoading]);

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/minecraft/servers');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to fetch servers');
      }
      const data = await response.json();
      setServers(data.servers || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching servers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  };

  const handleServerAction = async (serverId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const response = await fetch(`/api/minecraft/servers/${serverId}/${action}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} server`);
      }

      // Refresh servers immediately
      await fetchServers();
    } catch (err) {
      console.error(`Error ${action}ing server:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} server`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'stopped': return 'text-gray-400';
      case 'starting': case 'stopping': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'starting': case 'stopping': return '🟡';
      case 'error': return '❌';
      default: return '🔵';
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-6">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Minecraft Servers</h1>
            <p className="text-gray-400">Manage your Minecraft server instances</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create New Server
          </button>
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

        {/* Server Grid */}
        {servers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold mb-2">No servers yet</h3>
            <p className="text-gray-400 mb-6">Create your first Minecraft server to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Server
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {servers.map((server) => (
              <div
                key={server.id}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={() => setSelectedServer(server)}
              >
                {/* Server Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{server.serverName || server.id}</h3>
                    <div className={`flex items-center gap-2 text-sm ${getStatusColor(server.status)}`}>
                      <span>{getStatusIcon(server.status)}</span>
                      <span className="capitalize">{server.status}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <div>Port: {server.port}</div>
                    <div>{server.gameMode} • {server.difficulty}</div>
                  </div>
                </div>

                {/* Server Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-gray-400">Players</div>
                    <div className="font-semibold">{server.playerCount}/{server.maxPlayers}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Uptime</div>
                    <div className="font-semibold">
                      {Math.floor(server.uptime / 3600)}h {Math.floor((server.uptime % 3600) / 60)}m
                    </div>
                  </div>
                </div>

                {/* Online Players */}
                {server.onlinePlayers && server.onlinePlayers.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">Online Players:</div>
                    <div className="text-sm text-green-400">
                      {server.onlinePlayers.join(', ')}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {server.status === 'stopped' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServerAction(server.id, 'start');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {server.status === 'running' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServerAction(server.id, 'stop');
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        Stop
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServerAction(server.id, 'restart');
                        }}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        Restart
                      </button>
                    </>
                  )}
                  {(server.status === 'starting' || server.status === 'stopping') && (
                    <button
                      disabled
                      className="flex-1 bg-gray-600 px-3 py-2 rounded text-sm font-medium cursor-not-allowed"
                    >
                      {server.status}...
                    </button>
                  )}
                </div>

                {/* Error Display */}
                {server.error && (
                  <div className="mt-3 text-xs text-red-400 bg-red-900/30 rounded p-2">
                    {server.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Server Modal */}
        {showCreateForm && (
          <CreateServerModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchServers();
            }}
          />
        )}

        {/* Server Details Modal */}
        {selectedServer && (
          <ServerDetailsModal
            server={selectedServer}
            onClose={() => setSelectedServer(null)}
            onAction={handleServerAction}
          />
        )}
      </div>
    </div>
  );
}

// Create Server Modal Component
function CreateServerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    serverName: '',
    maxPlayers: 20,
    gameMode: 'survival',
    difficulty: 'normal',
    memoryLimit: '2G'
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/minecraft/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create server');
      }

      onSuccess();
    } catch (err) {
      console.error('Error creating server:', err);
      setError(err instanceof Error ? err.message : 'Failed to create server');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Server</h2>
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded p-3 mb-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Server Name</label>
            <input
              type="text"
              value={formData.serverName}
              onChange={(e) => setFormData({ ...formData, serverName: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              placeholder="My Minecraft Server"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Max Players</label>
            <input
              type="number"
              value={formData.maxPlayers}
              onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Game Mode</label>
            <select
              value={formData.gameMode}
              onChange={(e) => setFormData({ ...formData, gameMode: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="survival">Survival</option>
              <option value="creative">Creative</option>
              <option value="adventure">Adventure</option>
              <option value="spectator">Spectator</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="peaceful">Peaceful</option>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Memory Limit</label>
            <select
              value={formData.memoryLimit}
              onChange={(e) => setFormData({ ...formData, memoryLimit: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="1G">1GB</option>
              <option value="2G">2GB</option>
              <option value="4G">4GB</option>
              <option value="8G">8GB</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-medium transition-colors"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Server Details Modal Component (placeholder)
function ServerDetailsModal({ server, onClose, onAction }: { 
  server: MinecraftServer; 
  onClose: () => void; 
  onAction: (serverId: string, action: 'start' | 'stop' | 'restart') => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">{server.serverName || server.id}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Server Status */}
          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <div className="bg-gray-700 rounded p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Status: <span className="font-semibold capitalize">{server.status}</span></div>
                <div>Port: <span className="font-semibold">{server.port}</span></div>
                <div>Players: <span className="font-semibold">{server.playerCount}/{server.maxPlayers}</span></div>
                <div>Game Mode: <span className="font-semibold capitalize">{server.gameMode}</span></div>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div>
            <h3 className="font-semibold mb-2">Analytics</h3>
            <div className="bg-gray-700 rounded p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Total Players: <span className="font-semibold">{server.analytics.totalPlayers}</span></div>
                <div>Peak Players: <span className="font-semibold">{server.analytics.peakPlayerCount}</span></div>
                <div>Total Uptime: <span className="font-semibold">{Math.floor(server.analytics.totalUptime / 3600)}h</span></div>
                <div>Restarts: <span className="font-semibold">{server.analytics.restartCount}</span></div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="font-semibold mb-2">Actions</h3>
            <div className="flex gap-2">
              {server.status === 'stopped' && (
                <button
                  onClick={() => onAction(server.id, 'start')}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium transition-colors"
                >
                  Start Server
                </button>
              )}
              {server.status === 'running' && (
                <>
                  <button
                    onClick={() => onAction(server.id, 'stop')}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium transition-colors"
                  >
                    Stop Server
                  </button>
                  <button
                    onClick={() => onAction(server.id, 'restart')}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-medium transition-colors"
                  >
                    Restart Server
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
