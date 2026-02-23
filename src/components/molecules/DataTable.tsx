import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/atoms/table';
import { Button } from '@/components/atoms/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select';

export interface ColumnDef<T> {
    key: string;
    headerKey?: string;
    header?: React.ReactNode;
    className?: string;
    headerClassName?: string;
    render: (item: T, index: number) => React.ReactNode;
}

interface DataTablePagination {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    rowKey: (item: T, index: number) => string;
    pagination?: DataTablePagination;
    rowClassName?: (item: T, index: number) => string;
    emptyMessage?: string;
    headerClassName?: string;
}

const LIMIT_OPTIONS = [5, 10, 20, 50];

export function DataTable<T>({
    columns,
    data,
    rowKey,
    pagination,
    rowClassName,
    emptyMessage,
    headerClassName,
}: DataTableProps<T>) {
    const { t } = useTranslation();

    const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

    return (
        <div className="space-y-0">
            <div className="rounded-md border">
                <Table>
                    <TableHeader className={headerClassName}>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className={col.headerClassName}>
                                    {col.headerKey ? t(col.headerKey) : col.header ?? ''}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {emptyMessage ?? t('common.noData')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow
                                    key={rowKey(item, index)}
                                    className={rowClassName?.(item, index)}
                                >
                                    {columns.map((col) => (
                                        <TableCell key={col.key} className={col.className}>
                                            {col.render(item, index)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.total > 0 && (
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t('common.rowsPerPage')}</span>
                        <Select
                            value={String(pagination.limit)}
                            onValueChange={(val) => {
                                pagination.onLimitChange(Number(val));
                                pagination.onPageChange(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LIMIT_OPTIONS.map((opt) => (
                                    <SelectItem key={opt} value={String(opt)}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="ml-2">
                            {t('common.showing', {
                                from: Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total),
                                to: Math.min(pagination.page * pagination.limit, pagination.total),
                                total: pagination.total,
                            })}
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1}
                        >
                            {t('common.previous')}
                        </Button>
                        <div className="text-sm text-muted-foreground w-20 text-center">
                            {t('common.page')} {pagination.page} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(Math.min(totalPages, pagination.page + 1))}
                            disabled={pagination.page === totalPages}
                        >
                            {t('common.next')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Hook for managing pagination state with default limit of 10.
 */
export function usePagination(defaultLimit = 10) {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(defaultLimit);

    return { page, limit, setPage, setLimit };
}
