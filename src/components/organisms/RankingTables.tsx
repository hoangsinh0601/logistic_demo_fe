import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/atoms/card';
import { useGetStatistics, type ProductRanking } from '@/hooks/useStatistics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/atoms/badge';

interface RankingTablesProps {
    startDate?: string;
    endDate?: string;
}

export const RankingTables: React.FC<RankingTablesProps> = ({ startDate, endDate }) => {
    const { t } = useTranslation();
    const { data, isLoading, error } = useGetStatistics(startDate, endDate);

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 mt-4">
                {[1, 2].map((i) => (
                    <Card key={i} className="animate-pulse h-64">
                        <CardHeader className="pb-2">
                            <CardTitle className="h-4 w-1/3 bg-muted rounded"></CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mt-4">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="h-10 w-full bg-muted rounded"></div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error || !data) {
        return null;
    }

    const renderTable = (items: ProductRanking[], badgeVariant: "default" | "secondary" | "destructive" | "outline") => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>{t('inventory.columns.productName')}</TableHead>
                    <TableHead className="text-right">{t('inventory.columns.currentStock')}</TableHead>
                    <TableHead className="text-right">{t('common.totalValue')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items?.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-16 text-center text-muted-foreground text-sm">
                            {t('common.noData')}
                        </TableCell>
                    </TableRow>
                ) : (
                    items?.map((item, index) => (
                        <TableRow key={item.product_id}>
                            <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                            <TableCell>
                                <div className="font-medium">{item.product_name}</div>
                                <div className="text-xs text-muted-foreground">{item.product_sku}</div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge variant={badgeVariant}>{item.total_quantity}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(item.total_value)}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('statistics.topImported')}</CardTitle>
                    <CardDescription>{t('statistics.topImportedDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                    {renderTable(data.top_imported_items, "default")}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('statistics.topExported')}</CardTitle>
                    <CardDescription>{t('statistics.topExportedDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                    {renderTable(data.top_exported_items, "secondary")}
                </CardContent>
            </Card>
        </div>
    );
};
