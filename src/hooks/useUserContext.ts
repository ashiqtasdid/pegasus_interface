import { useSession } from '@/lib/auth-client';
import { ExtendedUser } from '@/lib/auth-client';
import { useMemo } from 'react';

export interface UserPermissions {
  canCreatePlugins: boolean;
  canDeletePlugins: boolean;
  canAccessAllPlugins: boolean;
  canManageUsers: boolean;
  maxPluginsAllowed: number;
}

export interface UserContext {
  userId: string;
  email: string;
  name: string;
  role: string;
  displayName: string;
  isAuthenticated: boolean;
  permissions: UserPermissions;
}

const getRolePermissions = (role: string): UserPermissions => {
  switch (role.toLowerCase()) {
    case 'admin':
      return {
        canCreatePlugins: true,
        canDeletePlugins: true,
        canAccessAllPlugins: true,
        canManageUsers: true,
        maxPluginsAllowed: -1, // unlimited
      };
    case 'moderator':
      return {
        canCreatePlugins: true,
        canDeletePlugins: true,
        canAccessAllPlugins: false,
        canManageUsers: false,
        maxPluginsAllowed: 50,
      };
    case 'user':
    default:
      return {
        canCreatePlugins: true,
        canDeletePlugins: true,
        canAccessAllPlugins: false,
        canManageUsers: false,
        maxPluginsAllowed: 10,
      };
  }
};

export const useUserContext = () => {
  const { data: session, isPending } = useSession();

  const userContext: UserContext | null = useMemo(() => {
    if (!session?.user) return null;

    const role = (session.user as Record<string, unknown>).role as string || 'user';
    const permissions = getRolePermissions(role);

    return {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
      displayName: (session.user as Record<string, unknown>).displayName as string || session.user.name,
      isAuthenticated: true,
      permissions,
    };
  }, [session]);

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!userContext) return false;
    const value = userContext.permissions[permission];
    return typeof value === 'boolean' ? value : false;
  };

  const canPerformAction = (action: string): boolean => {
    if (!userContext) return false;

    switch (action) {
      case 'create-plugin':
        return userContext.permissions.canCreatePlugins;
      case 'delete-plugin':
        return userContext.permissions.canDeletePlugins;
      case 'access-all-plugins':
        return userContext.permissions.canAccessAllPlugins;
      case 'manage-users':
        return userContext.permissions.canManageUsers;
      default:
        return true; // Allow by default for unknown actions
    }
  };

  return {
    userContext,
    isLoading: isPending,
    user: session?.user as ExtendedUser | undefined,
    session,
    hasPermission,
    canPerformAction,
  };
};

export default useUserContext;
