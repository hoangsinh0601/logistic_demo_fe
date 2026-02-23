import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetAuditLogs, type AuditLog } from '@/hooks/useAuditLogs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

export const AuditHistory: React.FC = () => {
    const [page, setPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { t, i18n } = useTranslation();

    const limit = 20;

    const { data, isLoading, error } = useGetAuditLogs(page, limit);

    if (isLoading) return <div className="p-8 animate-pulse text-muted-foreground">{t('common.loading')}</div>;
    if (error) return <div className="p-8 text-destructive">{t('common.error')}</div>;

    // Use type asserting for the generic data layout bridging the dynamic keys safely
    const responseData = data as unknown as { logs: AuditLog[], total: number };
    const logs = responseData?.logs || [];
    const total = responseData?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const formatActionBadge = (action: string) => {
        let colorClass = "bg-secondary text-secondary-foreground";

        if (action.includes("CREATE")) colorClass = "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400";
        if (action.includes("UPDATE")) colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400";
        if (action.includes("DELETE")) colorClass = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400";

        return (
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${colorClass}`}>
                {action.replace(/_/g, " ")}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        try {
            // Append Z if no timezone information is present
            const safeDateString = dateString.includes('Z') || dateString.includes('+') ? dateString : `${dateString}Z`;
            const date = new Date(safeDateString);
            return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }).format(date);
        } catch {
            return dateString;
        }
    };

    const formatJSON = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return jsonString;
        }
    };

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setIsDialogOpen(true);
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{t('audit.title')}</h1>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">{t('audit.history')}</CardTitle>
                    <CardDescription>{t('audit.description', { total })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[180px]">{t('audit.columns.time')}</TableHead>
                                    <TableHead className="w-[150px]">{t('audit.columns.user')}</TableHead>
                                    <TableHead className="w-[200px]">{t('audit.columns.action')}</TableHead>
                                    <TableHead className="w-[200px]">{t('audit.columns.id')}</TableHead>
                                    <TableHead className="w-[200px]">{t('audit.columns.name')}</TableHead>
                                    <TableHead className="text-center w-[120px]">{t('audit.columns.details')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            {t('common.noData')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log: AuditLog) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                                                {formatDate(log.created_at)}
                                            </TableCell>
                                            <TableCell className="font-semibold text-primary">
                                                {log.username}
                                            </TableCell>
                                            <TableCell>
                                                {formatActionBadge(log.action)}
                                            </TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <div className="text-xs text-muted-foreground font-mono truncate" title={log.entity_id}>
                                                    ID: {log.entity_id}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <div className="font-mono truncate" title={log.entity_name}>
                                                    {log.entity_name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleViewDetails(log)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">{t('common.details')}</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                {t('common.previous')}
                            </Button>
                            <div className="text-sm text-muted-foreground w-20 text-center">
                                {t('common.page')} {page} / {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                {t('common.next')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('audit.dialog.title')}</DialogTitle>
                        <DialogDescription>
                            {t('audit.dialog.subtitle', { action: selectedLog?.action, user: selectedLog?.username })}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold text-muted-foreground">{t('audit.dialog.logId')}: </span>
                                    <span className="font-mono">{selectedLog.id}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-muted-foreground">{t('audit.dialog.entityId')}: </span>
                                    <span className="font-mono">{selectedLog.entity_id}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-muted-foreground">{t('audit.dialog.time')}: </span>
                                    <span>{formatDate(selectedLog.created_at)}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-muted-foreground">{t('audit.dialog.action')}: </span>
                                    {formatActionBadge(selectedLog.action)}
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <span className="font-semibold text-muted-foreground block mb-2">{t('audit.dialog.payload')}:</span>
                                <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-auto max-h-[300px]">
                                    {formatJSON(selectedLog.details)}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
