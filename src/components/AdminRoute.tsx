import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute: React.FC = () => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading session...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin' && user?.role !== 'manager') {
        // Redir to main dashboard if not an admin or manager
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
