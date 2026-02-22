import React from 'react';
import { useTranslation } from 'react-i18next';
import { InventoryTable } from '../components/InventoryTable';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>

            <InventoryTable />
        </div>
    );
};
