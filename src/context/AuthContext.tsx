import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    permissions: string[];
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => void;
    hasPermission: (code: string) => boolean;
    hasAnyPermission: (...codes: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    const handleLogout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch {
            // Ignored
        } finally {
            setIsAuthenticated(false);
            setUser(null);
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        // Lắng nghe sự kiện 401 từ Axios
        const handleUnauthorized = () => handleLogout();
        window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);

        // Kiểm tra phiên đăng nhập ngay khi app chạy
        const verifySession = async () => {
            try {
                const res = await api.get('/me');
                const data = res.data.data;
                setIsAuthenticated(true);
                setUser({
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    permissions: data.permissions || [],
                });
            } catch {
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        verifySession();

        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    }, [handleLogout]);

    const login = useCallback(async (userData: User) => {
        setIsAuthenticated(true);
        setUser(userData);

        // Re-fetch /me to get fresh permissions for the new account
        try {
            const res = await api.get('/me');
            const data = res.data.data;
            setUser({
                id: data.id,
                username: data.username,
                email: data.email,
                role: data.role,
                permissions: data.permissions || [],
            });
        } catch {
            // Keep the initial userData if /me fails
        }
    }, []);

    const hasPermission = useCallback((code: string): boolean => {
        if (!user?.permissions) return false;
        return user.permissions.includes(code);
    }, [user]);

    const hasAnyPermission = useCallback((...codes: string[]): boolean => {
        if (!user?.permissions) return false;
        return codes.some(code => user.permissions.includes(code));
    }, [user]);

    const value = useMemo(() => ({
        isAuthenticated, user, isLoading, login, logout: handleLogout,
        hasPermission, hasAnyPermission,
    }), [isAuthenticated, user, isLoading, handleLogout, hasPermission, hasAnyPermission]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
