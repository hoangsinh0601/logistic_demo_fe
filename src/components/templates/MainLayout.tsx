import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/atoms/button';
import { Users, LogOut, Package, History, Receipt, Scale, Shield, FileCheck, BarChart3, ClipboardCheck, Handshake, Truck } from 'lucide-react';
import { LanguageSwitcher } from '../molecules/LanguageSwitcher';

interface NavItem {
    to: string;
    labelKey: string;
    icon: React.ElementType;
    /** Permission code(s) required to see this nav item. If empty, always visible. */
    permissions?: string[];
}

const NAV_ITEMS: NavItem[] = [
    { to: '/dashboard', labelKey: 'sidebar.dashboard', icon: BarChart3, permissions: ['dashboard.read'] },
    { to: '/inventory', labelKey: 'sidebar.inventory', icon: Package, permissions: ['inventory.read'] },
    { to: '/expenses', labelKey: 'sidebar.expenses', icon: Receipt, permissions: ['expenses.read'] },
    { to: '/tax-rules', labelKey: 'sidebar.taxRules', icon: Scale, permissions: ['tax_rules.read'] },
    { to: '/approvals', labelKey: 'sidebar.approvals', icon: ClipboardCheck, permissions: ['approvals.read'] },
    { to: '/invoices', labelKey: 'sidebar.invoices', icon: FileCheck, permissions: ['invoices.read'] },
    { to: '/partners', labelKey: 'sidebar.partners', icon: Handshake, permissions: ['partners.read'] },
    { to: '/shipments', labelKey: 'sidebar.shipments', icon: Truck, permissions: ['shipments.read'] },
    { to: '/users', labelKey: 'sidebar.users', icon: Users, permissions: ['users.read'] },
    { to: '/roles', labelKey: 'sidebar.roles', icon: Shield, permissions: ['roles.manage'] },
    { to: '/history', labelKey: 'sidebar.auditHistory', icon: History, permissions: ['audit.read'] },
];

export const MainLayout: React.FC = () => {
    const { user, logout, hasAnyPermission } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen bg-muted/40">
            {/* Sidebar */}
            <aside className="hidden sm:flex w-64 flex-col border-r bg-card sticky top-0 h-screen overflow-y-auto">
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
                        // Check permissions — if item has permission requirements, user must have at least one
                        if (item.permissions && item.permissions.length > 0) {
                            if (!hasAnyPermission(...item.permissions)) {
                                return null;
                            }
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
