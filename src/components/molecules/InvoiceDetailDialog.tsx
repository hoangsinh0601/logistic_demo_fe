import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Badge } from '@/components/atoms/badge';
import type { Invoice, ApprovalStatus } from '@/types';

interface InvoiceDetailDialogProps {
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formatCurrency: (value: string) => string;
}

const statusVariant: Record<ApprovalStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PENDING: 'outline',
    APPROVED: 'default',
    REJECTED: 'destructive',
};

export const InvoiceDetailDialog: React.FC<InvoiceDetailDialogProps> = ({
    invoice,
    open,
    onOpenChange,
    formatCurrency,
}) => {
    const { t } = useTranslation();

    if (!invoice) return null;

    const f = (key: string) => t(`invoices.detail.${key}`);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {f('title')}
                        <span className="font-mono text-base text-muted-foreground">
                            {invoice.invoice_no}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* General Info */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {f('generalInfo')}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <InfoRow label={f('invoiceNo')}>
                                <span className="font-mono font-medium">{invoice.invoice_no}</span>
                            </InfoRow>
                            <InfoRow label={f('referenceType')}>
                                <Badge variant="outline">
                                    {t(`invoices.refTypes.${invoice.reference_type}`) || invoice.reference_type}
                                </Badge>
                            </InfoRow>
                            <InfoRow label={f('status')}>
                                <Badge variant={statusVariant[invoice.approval_status]}>
                                    {t(`invoices.statuses.${invoice.approval_status}`)}
                                </Badge>
                            </InfoRow>
                            <InfoRow label={f('createdAt')}>
                                {new Date(invoice.created_at).toLocaleString('vi-VN')}
                            </InfoRow>
                            {invoice.approved_at && (
                                <InfoRow label={f('approvedAt')}>
                                    {new Date(invoice.approved_at).toLocaleString('vi-VN')}
                                </InfoRow>
                            )}
                        </div>
                    </section>

                    {/* Financial Info */}
                    <section className="space-y-3 pt-2 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {f('financialInfo')}
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{f('subtotal')}</span>
                                <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {invoice.tax_type && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">
                                        {f('taxInfo')} ({invoice.tax_type}
                                        {invoice.tax_rate ? ` — ${(parseFloat(invoice.tax_rate) * 100).toFixed(1)}%` : ''})
                                    </span>
                                    <span className="font-mono text-blue-600">
                                        +{formatCurrency(invoice.tax_amount)}
                                    </span>
                                </div>
                            )}
                            {!invoice.tax_type && parseFloat(invoice.tax_amount) > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{f('taxAmount')}</span>
                                    <span className="font-mono text-blue-600">
                                        +{formatCurrency(invoice.tax_amount)}
                                    </span>
                                </div>
                            )}
                            {parseFloat(invoice.side_fees) > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{f('sideFees')}</span>
                                    <span className="font-mono text-orange-600">
                                        +{formatCurrency(invoice.side_fees)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm pt-2 border-t font-semibold">
                                <span>{f('totalAmount')}</span>
                                <span className="font-mono text-lg">
                                    {formatCurrency(invoice.total_amount)}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Note */}
                    {invoice.note && (
                        <section className="space-y-2 pt-2 border-t">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {f('note')}
                            </h3>
                            <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                                {invoice.note}
                            </p>
                        </section>
                    )}

                    {/* Reference IDs */}
                    <section className="space-y-2 pt-2 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {f('referenceInfo')}
                        </h3>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                            <InfoRow label={f('referenceId')}>
                                <span className="font-mono text-xs">{invoice.reference_id}</span>
                            </InfoRow>
                            {invoice.tax_rule_id && (
                                <InfoRow label={f('taxRuleId')}>
                                    <span className="font-mono text-xs">{invoice.tax_rule_id}</span>
                                </InfoRow>
                            )}
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="font-medium">{children}</div>
    </div>
);
