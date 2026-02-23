import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StatisticsCards } from '@/components/organisms/StatisticsCards';
import { RankingTables } from '@/components/organisms/RankingTables';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const [timeRange, setTimeRange] = useState<string>('month');

    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        let start = new Date(now);
        start.setHours(0, 0, 0, 0);

        switch (timeRange) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
            default: // month as default
                start.setMonth(now.getMonth() - 1);
        }

        return {
            startDate: start.toISOString(),
            endDate: now.toISOString()
        };
    }, [timeRange]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
                <div className="w-48">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('statistics.selectTimeRange')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">{t('statistics.week')}</SelectItem>
                            <SelectItem value="month">{t('statistics.month')}</SelectItem>
                            <SelectItem value="quarter">{t('statistics.quarter')}</SelectItem>
                            <SelectItem value="year">{t('statistics.year')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <StatisticsCards startDate={startDate} endDate={endDate} />
            <RankingTables startDate={startDate} endDate={endDate} />

        </div>
    );
};
