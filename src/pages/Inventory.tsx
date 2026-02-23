import React from 'react';
import { useTranslation } from 'react-i18next';
import { InventoryTable } from '../components/InventoryTable';

export const Inventory: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('inventory.title')}</h1>
            </div>

            <InventoryTable />
        </div>
    );
};
