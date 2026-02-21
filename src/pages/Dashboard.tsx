import React from 'react';
import { InventoryTable } from '../components/InventoryTable';
import { OrderForm } from '../components/OrderForm';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-muted/40 p-4 md:p-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <h1 className="text-2xl font-bold tracking-tight">Inventory Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            Welcome, <span className="font-medium text-foreground">{user?.username || user?.email}</span>
                        </span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={logout}
                        >
                            Logout
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="flex flex-col gap-4 lg:col-span-2">
                        <InventoryTable />
                    </div>
                    <div className="flex flex-col gap-4">
                        <OrderForm />
                    </div>
                </div>
            </div>
        </div>
    );
};
