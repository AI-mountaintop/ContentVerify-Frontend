import React from 'react';
import type { UserRole } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';

interface RequireRoleProps {
    allowedRoles: UserRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Renders children only if the current user has one of the allowed roles.
 * If not authorized, renders the fallback (or nothing if no fallback provided).
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
    allowedRoles,
    children,
    fallback = null,
}) => {
    const { user } = useAuth();

    if (!user) {
        return <>{fallback}</>;
    }

    if (allowedRoles.includes(user.role)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

/**
 * Hook to check if current user has any of the specified roles
 */
export const useHasRole = (allowedRoles: UserRole[]): boolean => {
    const { user } = useAuth();
    if (!user) return false;
    return allowedRoles.includes(user.role);
};

/**
 * Hook to check if current user is admin
 */
export const useIsAdmin = (): boolean => {
    const { user } = useAuth();
    return user?.role === 'admin';
};

export default RequireRole;
