import React from 'react';
import { InventoryTable } from '../components/InventoryTable';
import { OrderForm } from '../components/OrderForm';

export const Dashboard: React.FC = () => {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h1>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-4 lg:col-span-2">
                    <InventoryTable />
                </div>
                <div className="flex flex-col gap-4">
                    <OrderForm />
                </div>
            </div>
        </div>
    );
};
