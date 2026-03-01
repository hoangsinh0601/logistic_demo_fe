import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface CanProps {
    /** Single permission code required to render children */
    permission?: string;
    /** Multiple permission codes — renders children if user has ANY of them (OR logic) */
    anyOf?: string[];
    /** Content to render when user has the permission */
    children: ReactNode;
    /** Optional fallback to render when user lacks the permission (defaults to null) */
    fallback?: ReactNode;
}

/**
 * Permission-based UI wrapper component.
 * Reads the user's permissions from AuthContext and conditionally renders children.
 * 
 * Usage (single):
 *   <Can permission="orders.approve_warehouse">
 *     <Button>Duyệt Kho</Button>
 *   </Can>
 * 
 * Usage (any of):
 *   <Can anyOf={["orders.approve_warehouse", "orders.approve_accounting"]}>
 *     <Button>Duyệt</Button>
 *   </Can>
 */
export const Can: React.FC<CanProps> = ({ permission, anyOf, children, fallback = null }) => {
    const { hasPermission } = useAuth();

    if (permission) {
        if (!hasPermission(permission)) {
            return <>{fallback}</>;
        }
        return <>{children}</>;
    }

    if (anyOf && anyOf.length > 0) {
        const hasAny = anyOf.some(p => hasPermission(p));
        if (!hasAny) {
            return <>{fallback}</>;
        }
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
