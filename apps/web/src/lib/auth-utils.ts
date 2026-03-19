/**
 * Utility for Role-Based Access Control (RBAC)
 */

export type UserRole = 'super_admin' | 'admin' | 'agent' | 'finance' | 'viewer' | string;

interface User {
  role: UserRole;
  permissions?: Record<string, boolean>;
}

/**
 * Checks if a user is a Super Admin.
 * Super Admin has absolute access to all modules and bypasses permission checks.
 */
export const isSuperAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'super_admin';
};

/**
 * Checks if a user has access to a specific scope/permission.
 * If user is super_admin, it always returns true.
 */
export const hasAccess = (user: User | null, requiredPermission: string): boolean => {
  if (!user) return false;
  
  // God Mode: Super Admin always has access
  if (user.role === 'super_admin') return true;

  // Check granular permissions if available
  if (user.permissions) {
    return !!user.permissions[requiredPermission];
  }

  return false;
};

/**
 * Restrict access specifically to Super Admin for critical actions 
 * (e.g., Deleting logs, modifying core roles)
 */
export const requireSuperAdmin = (user: User | null) => {
  if (!user || user.role !== 'super_admin') {
    throw new Error("Access Denied: Super Admin scope required.");
  }
  return true;
};
