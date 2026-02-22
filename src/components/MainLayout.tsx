import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Users, LayoutDashboard, LogOut, Package } from 'lucide-react';

export const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-muted/40">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card flex flex-col hidden sm:flex">
                <div className="p-6 flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight">Inventory App</h2>
                </div>

                <div className="px-6 pb-6">
                    <p className="text-sm font-medium">
                        Welcome, {user?.username || user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                        Role: {user?.role}
                    </p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/dashboard">
                        <Button
                            variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'}
                            className="w-full justify-start gap-2"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>

                    {user?.role === 'admin' && (
                        <Link to="/users">
                            <Button
                                variant={location.pathname === '/users' ? 'secondary' : 'ghost'}
                                className="w-full justify-start gap-2"
                            >
                                <Users className="h-4 w-4" />
                                Manage Users
                            </Button>
                        </Link>
                    )}
                </nav>

                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Mobile header placeholder if needed later, ignoring for now as requested a left vertical sidebar */}
                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
