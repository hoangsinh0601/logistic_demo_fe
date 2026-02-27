import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface CanProps {
    /** Permission code required to render children */
    permission: string;
    /** Content to render when user has the permission */
    children: ReactNode;
    /** Optional fallback to render when user lacks the permission (defaults to null) */
    fallback?: ReactNode;
}

/**
 * Permission-based UI wrapper component.
 * Reads the user's permissions from AuthContext and conditionally renders children.
 * 
 * Usage:
 *   <Can permission="approvals.approve">
 *     <Button>Duyệt</Button>
 *   </Can>
 */
export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
    const { hasPermission } = useAuth();

    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
