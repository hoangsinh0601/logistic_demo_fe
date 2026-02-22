import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    const handleLogout = useCallback(async () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
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
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await api.get('/me'); // Lấy info dựa vào Token lấy từ local storage
                setIsAuthenticated(true);
                setUser(res.data.data);
            } catch {
                setIsAuthenticated(false);
                setUser(null);
                localStorage.removeItem('token');
                localStorage.removeItem('refresh_token');
            } finally {
                setIsLoading(false);
            }
        };

        verifySession();

        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    }, [handleLogout]);

    const login = (userData: User) => {
        setIsAuthenticated(true);
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout: handleLogout }}>
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
