import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AdminRoute guards routes that require specific permissions.
 * It checks if the user has dashboard.read OR users.read OR roles.manage permissions.
 * This covers admin-level pages: Dashboard, User Management, Role Management.
 * 
 * Individual pages still receive their own permission checks via the backend API,
 * so this is a frontend-only UX guard to prevent navigation to unauthorized pages.
 */
export const AdminRoute: React.FC = () => {
    const { isAuthenticated, isLoading, hasAnyPermission } = useAuth();

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading session...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // User needs at least one "admin-level" permission to access these routes
    if (!hasAnyPermission('dashboard.read', 'users.read', 'users.write', 'roles.manage')) {
        return <Navigate to="/inventory" replace />;
    }

    return <Outlet />;
};
