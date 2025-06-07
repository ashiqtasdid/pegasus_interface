'use client';

import React, { useState, useEffect } from 'react';
import { useUserContext } from '@/hooks/useUserContext';
import withAuth from '@/components/withAuth';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Package, 
  Search, 
  Filter, 
  Settings, 
  Crown, 
  User,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Activity,
  TrendingUp,
  Database
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin' | 'moderator';
  pluginLimit: number;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string;
  totalPlugins: number;
}

// Modern Admin Card Component
const AdminCard = ({ 
  icon: Icon, 
  title, 
  value, 
  color, 
  gradient 
}: { 
  icon: React.ComponentType<{ className?: string; size?: number }>; 
  title: string; 
  value: string | number; 
  color: string;
  gradient: string;
}) => (
  <div className="group relative overflow-hidden">
    {/* Glassmorphism background */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl"></div>
    
    {/* Hover effect overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
    
    {/* Content */}
    <div className="relative p-6 transform group-hover:scale-105 transition-transform duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <TrendingUp className="w-4 h-4 text-green-400 opacity-60" />
      </div>
      <h3 className="text-sm font-medium text-white/80 mb-1">{title}</h3>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

// Modern User Row Component
const UserRow = ({ 
  user, 
  onUpdateRole, 
  onUpdatePluginLimit, 
  onToggleStatus 
}: {
  user: User;
  onUpdateRole: (userId: string, role: 'user' | 'admin' | 'moderator') => void;
  onUpdatePluginLimit: (userId: string, limit: number) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newLimit, setNewLimit] = useState(user.pluginLimit);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-400" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleLimitChange = () => {
    onUpdatePluginLimit(user.id, newLimit);
    setIsEditing(false);
  };

  return (
    <div className="group relative overflow-hidden mb-4">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-xl"></div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
      
      {/* Content */}
      <div className="relative p-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
          {/* User Info */}
          <div className="lg:col-span-2 flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.displayName}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center space-x-2">
            {getRoleIcon(user.role)}
            <select
              value={user.role}
              onChange={(e) => onUpdateRole(user.id, e.target.value as 'user' | 'admin' | 'moderator')}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
            >
              <option value="user" className="bg-gray-900 text-white">User</option>
              <option value="moderator" className="bg-gray-900 text-white">Moderator</option>
              <option value="admin" className="bg-gray-900 text-white">Admin</option>
            </select>
          </div>

          {/* Plugin Limit */}
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(parseInt(e.target.value) || 0)}
                  className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  min="0"
                  max="1000"
                />
                <button
                  onClick={handleLimitChange}
                  className="p-1 text-green-400 hover:text-green-300 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white">{user.pluginLimit}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Usage */}
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Usage</span>
                <span className={`text-xs font-medium ${
                  user.totalPlugins >= user.pluginLimit ? 'text-red-400' : 'text-green-400'
                }`}>
                  {user.totalPlugins}/{user.pluginLimit}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    user.totalPlugins >= user.pluginLimit 
                      ? 'bg-gradient-to-r from-red-500 to-red-600' 
                      : 'bg-gradient-to-r from-green-500 to-blue-500'
                  }`}
                  style={{ width: `${Math.min((user.totalPlugins / user.pluginLimit) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => onToggleStatus(user.id, !user.isActive)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                user.isActive
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              }`}
            >
              {user.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{user.isActive ? 'Active' : 'Inactive'}</span>
            </button>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => onUpdatePluginLimit(user.id, user.pluginLimit + 10)}
                className="p-1 text-green-400 hover:text-green-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdatePluginLimit(user.id, Math.max(0, user.pluginLimit - 10))}
                className="p-1 text-red-400 hover:text-red-300 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPage: React.FC = () => {
  const { userContext } = useUserContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin' | 'moderator'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const userData = await response.json();
      setUsers(userData.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'moderator') => {
    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const updatePluginLimit = async (userId: string, newLimit: number) => {
    try {
      const response = await fetch('/api/admin/users/plugin-limit', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, pluginLimit: newLimit }),
      });

      if (!response.ok) {
        throw new Error('Failed to update plugin limit');
      }

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, pluginLimit: newLimit } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plugin limit');
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/users/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Check if user is admin
  if (userContext?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Access denied content */}
        <div className="relative z-10 text-center">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20"></div>
            <div className="relative p-8">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  Access Denied
                </h1>
                <p className="text-gray-300 max-w-md">
                  You need administrator privileges to access this page. Please contact your system administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        {/* Loading spinner */}
        <div className="relative z-10">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-white/80 mt-4 text-center">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
            Admin Control Center
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Comprehensive user management, role administration, and system oversight tools
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-sm border border-red-500/30"></div>
              <div className="relative p-4 flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-red-400" />
                  </div>
                </div>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminCard
            icon={Users}
            title="Total Users"
            value={users.length}
            color="text-blue-400"
            gradient="from-blue-500/20 to-blue-600/20"
          />
          <AdminCard
            icon={UserCheck}
            title="Active Users"
            value={users.filter(u => u.isActive).length}
            color="text-green-400"
            gradient="from-green-500/20 to-green-600/20"
          />
          <AdminCard
            icon={Crown}
            title="Administrators"
            value={users.filter(u => u.role === 'admin').length}
            color="text-yellow-400"
            gradient="from-yellow-500/20 to-yellow-600/20"
          />
          <AdminCard
            icon={Package}
            title="Total Plugins"
            value={users.reduce((sum, u) => sum + u.totalPlugins, 0)}
            color="text-purple-400"
            gradient="from-purple-500/20 to-purple-600/20"
          />
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20"></div>
            <div className="relative p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Search Users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by email or name..."
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Filter by Role</label>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value as 'all' | 'user' | 'admin' | 'moderator')}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm appearance-none"
                    >
                      <option value="all" className="bg-gray-900">All Roles</option>
                      <option value="user" className="bg-gray-900">User</option>
                      <option value="moderator" className="bg-gray-900">Moderator</option>
                      <option value="admin" className="bg-gray-900">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onUpdateRole={updateUserRole}
              onUpdatePluginLimit={updatePluginLimit}
              onToggleStatus={toggleUserStatus}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20"></div>
              <div className="relative p-8">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
                <p className="text-gray-400">No users match your current search criteria.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(AdminPage);
