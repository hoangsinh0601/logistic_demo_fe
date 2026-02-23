import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { useGetStatistics } from '@/hooks/useStatistics';
import { formatCurrency } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';

interface StatisticsCardsProps {
    startDate?: string;
    endDate?: string;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ startDate, endDate }) => {
    const { t } = useTranslation();
    const { data, isLoading, error } = useGetStatistics(startDate, endDate);

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium h-4 w-1/2 bg-muted rounded"></CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold h-8 w-3/4 bg-muted rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error || !data) {
        return <div className="text-destructive h-32 flex items-center justify-center border rounded-lg bg-destructive/10">{t('common.error')}</div>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('statistics.totalImport')}
                    </CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(data.total_import_value)}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('statistics.totalExport')}
                    </CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(data.total_export_value)}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {t('statistics.profit')}
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${data.profit < 0 ? 'text-destructive' : ''}`}>
                        {formatCurrency(data.profit)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
