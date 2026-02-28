import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Button } from '@/components/atoms/button';
import { useUpdateInvoice } from '@/hooks/useInvoices';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
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
    const updateMutation = useUpdateInvoice();

    // Editable partner fields (only for PENDING invoices)
    const [companyName, setCompanyName] = useState('');
    const [taxCode, setTaxCode] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [editMsg, setEditMsg] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        if (invoice) {
            setCompanyName(invoice.company_name || '');
            setTaxCode(invoice.tax_code || '');
            setBillingAddress(invoice.billing_address || '');
            setEditMsg(null);
            setEditError(null);
        }
    }, [invoice]);

    if (!invoice) return null;

    const f = (key: string) => t(`invoices.detail.${key}`);
    const isPending = invoice.approval_status === 'PENDING';

    const handleSavePartnerInfo = async () => {
        setEditMsg(null);
        setEditError(null);
        try {
            await updateMutation.mutateAsync({
                id: invoice.id,
                company_name: companyName,
                tax_code: taxCode,
                billing_address: billingAddress,
            });
            setEditMsg(t('common.success'));
        } catch (err: unknown) {
            setEditError(getApiErrorMessage(err, t, 'common.errorOccurred'));
        }
    };

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

                    {/* Partner Info — editable for PENDING, read-only otherwise */}
                    <section className="space-y-3 pt-2 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {f('partnerInfo')}
                        </h3>

                        {editMsg && <div className="p-2 text-xs text-green-700 bg-green-100 rounded">{editMsg}</div>}
                        {editError && <div className="p-2 text-xs text-destructive bg-destructive/10 rounded">{editError}</div>}

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">{f('companyName')}</Label>
                                {isPending ? (
                                    <Input
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                ) : (
                                    <p className="text-sm font-medium">{invoice.company_name || '—'}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">{f('taxCode')}</Label>
                                {isPending ? (
                                    <Input
                                        value={taxCode}
                                        onChange={e => setTaxCode(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                ) : (
                                    <p className="text-sm font-medium">{invoice.tax_code || '—'}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">{f('billingAddress')}</Label>
                                {isPending ? (
                                    <Input
                                        value={billingAddress}
                                        onChange={e => setBillingAddress(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                ) : (
                                    <p className="text-sm font-medium">{invoice.billing_address || '—'}</p>
                                )}
                            </div>
                            {isPending && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={updateMutation.isPending}
                                    onClick={handleSavePartnerInfo}
                                    className="h-7 text-xs"
                                >
                                    {updateMutation.isPending ? t('common.saving') : f('updatePartnerInfo')}
                                </Button>
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
