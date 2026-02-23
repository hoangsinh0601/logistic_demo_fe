import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Users, LayoutDashboard, LogOut, Package, History } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavItem {
    to: string;
    labelKey: string;
    icon: React.ElementType;
    roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
    { to: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
    { to: '/inventory', labelKey: 'sidebar.inventory', icon: Package },
    { to: '/users', labelKey: 'sidebar.users', icon: Users, roles: ['admin'] },
    { to: '/history', labelKey: 'sidebar.auditHistory', icon: History, roles: ['admin', 'manager'] },
];

export const MainLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen bg-muted/40">
            {/* Sidebar */}
            <aside className="hidden sm:flex w-64 flex-col border-r bg-card relative">
                <div className="flex items-center gap-2 p-6">
                    <Package className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight">Inventory App</h2>
                </div>

                <div className="px-6 pb-6">
                    <p className="text-sm font-medium">
                        Welcome, {user?.username || user?.email}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                        Role: {user?.role}
                    </p>
                </div>

                <nav className="flex-1 space-y-2 px-4">
                    {NAV_ITEMS.map((item) => {
                        if (item.roles && (!user?.role || !item.roles.includes(user.role))) {
                            return null;
                        }

                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.to);

                        return (
                            <Link key={item.to} to={item.to}>
                                <Button
                                    variant={isActive ? 'secondary' : 'ghost'}
                                    className="w-full justify-start gap-2"
                                >
                                    <Icon className="h-4 w-4" />
                                    {t(item.labelKey)}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t p-4 space-y-3 flex justify-between">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4" />
                        {t('sidebar.logout')}
                    </Button>
                    <LanguageSwitcher />


                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
