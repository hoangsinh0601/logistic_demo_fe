import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import { Can } from '@/components/atoms/Can';
import type { ApprovalRequest, ApprovalRequestType, ApprovalStatus } from '@/types';

interface ApprovalDetailDialogProps {
    approval: ApprovalRequest | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove?: (id: string) => void;
    onReject?: (id: string, reason: string) => void;
    isApproving?: boolean;
    isRejecting?: boolean;
}

const statusVariant: Record<ApprovalStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PENDING: 'outline',
    APPROVED: 'default',
    REJECTED: 'destructive',
};

export const ApprovalDetailDialog: React.FC<ApprovalDetailDialogProps> = ({
    approval,
    open,
    onOpenChange,
    onApprove,
    onReject,
    isApproving = false,
    isRejecting = false,
}) => {
    const { t } = useTranslation();
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const requestData = useMemo(() => {
        if (!approval?.request_data) return null;
        try {
            return JSON.parse(approval.request_data) as Record<string, unknown>;
        } catch {
            return null;
        }
    }, [approval?.request_data]);

    if (!approval) return null;

    const f = (key: string) => t(`approvals.detailField.${key}`);
    const isPending = approval.status === 'PENDING';

    const handleRejectSubmit = () => {
        if (onReject) {
            onReject(approval.id, rejectReason);
            setShowRejectForm(false);
            setRejectReason('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) {
                setShowRejectForm(false);
                setRejectReason('');
            }
            onOpenChange(v);
        }}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('approvals.detailTitle')}</DialogTitle>
                </DialogHeader>

                {/* Request Meta Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('approvals.detailRequestInfo')}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <InfoRow label={f('requestType')}>
                            <Badge variant="secondary">
                                {t(`approvals.requestTypes.${approval.request_type}`) || approval.request_type}
                            </Badge>
                        </InfoRow>
                        <InfoRow label={f('status')}>
                            <Badge variant={statusVariant[approval.status]}>
                                {t(`approvals.status${approval.status.charAt(0) + approval.status.slice(1).toLowerCase()}`)}
                            </Badge>
                        </InfoRow>
                        <InfoRow label={f('requester')}>
                            {approval.requester_name || '—'}
                        </InfoRow>
                        <InfoRow label={f('createdAt')}>
                            {new Date(approval.created_at).toLocaleString('vi-VN')}
                        </InfoRow>
                        {approval.approver_name && (
                            <InfoRow label={f('approver')}>
                                {approval.approver_name}
                            </InfoRow>
                        )}
                        {approval.approved_at && (
                            <InfoRow label={f('approvedAt')}>
                                {new Date(approval.approved_at).toLocaleString('vi-VN')}
                            </InfoRow>
                        )}
                        {approval.rejection_reason && (
                            <div className="col-span-2">
                                <InfoRow label={f('rejectionReason')}>
                                    <span className="text-destructive">{approval.rejection_reason}</span>
                                </InfoRow>
                            </div>
                        )}
                    </div>
                </div>

                {/* Request Data */}
                {requestData && (
                    <div className="space-y-3 pt-2 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('approvals.detailRequestData')}
                        </h3>
                        <RequestDataView type={approval.request_type} data={requestData} />
                    </div>
                )}

                {/* Approve / Reject Actions */}
                {isPending && onApprove && onReject && (
                    <Can permission="approvals.approve">
                        <div className="pt-4 border-t space-y-3">
                            {!showRejectForm ? (
                                <div className="flex items-center justify-end gap-3">
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={isRejecting}
                                    >
                                        {t('approvals.reject')}
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => onApprove(approval.id)}
                                        disabled={isApproving}
                                    >
                                        {isApproving ? t('common.loading') : t('approvals.approve')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <textarea
                                        className="text-sm border rounded-md p-3 w-full min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                        placeholder={t('approvals.rejectReason')}
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                    <div className="flex items-center justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleRejectSubmit}
                                            disabled={isRejecting}
                                        >
                                            {isRejecting ? t('common.loading') : t('approvals.confirmReject')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Can>
                )}
            </DialogContent>
        </Dialog>
    );
};

// Reusable info row
const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="font-medium">{children}</div>
    </div>
);

// Render request data based on type
const RequestDataView: React.FC<{ type: ApprovalRequestType; data: Record<string, unknown> }> = ({ type, data }) => {
    const { t } = useTranslation();
    const f = (key: string) => t(`approvals.detailField.${key}`);

    switch (type) {
        case 'CREATE_ORDER':
            return <OrderDataView data={data} f={f} />;
        case 'CREATE_PRODUCT':
            return <ProductDataView data={data} f={f} />;
        case 'CREATE_EXPENSE':
            return <ExpenseDataView data={data} f={f} />;
        default:
            return <GenericDataView data={data} />;
    }
};

const OrderDataView: React.FC<{ data: Record<string, unknown>; f: (k: string) => string }> = ({ data, f }) => {
    const items = Array.isArray(data.items) ? data.items as Record<string, unknown>[] : [];
    const hasPartner = Boolean(data.partner_name || data.company_name);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label={f('orderCode')}>{String(data.order_code || '—')}</InfoRow>
                <InfoRow label={f('orderType')}>
                    <Badge variant="outline">{String(data.type || '—')}</Badge>
                </InfoRow>
                {Boolean(data.note) && <div className="col-span-2"><InfoRow label={f('note')}>{String(data.note)}</InfoRow></div>}
            </div>

            {/* Partner Info */}
            {hasPartner && (
                <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium">{f('partnerInfo')}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {Boolean(data.partner_name) && (
                            <InfoRow label={f('partnerName')}>{String(data.partner_name)}</InfoRow>
                        )}
                        {Boolean(data.company_name) && (
                            <InfoRow label={f('companyName')}>{String(data.company_name)}</InfoRow>
                        )}
                        {Boolean(data.tax_code) && (
                            <InfoRow label={f('taxCode')}>{String(data.tax_code)}</InfoRow>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {Boolean(data.origin_address) && (
                            <InfoRow label={f('originAddress')}>{String(data.origin_address)}</InfoRow>
                        )}
                        {Boolean(data.shipping_address) && (
                            <InfoRow label={f('shippingAddress')}>{String(data.shipping_address)}</InfoRow>
                        )}
                    </div>
                </div>
            )}

            {items.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">{f('items')}</p>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{f('productId')}</TableHead>
                                    <TableHead className="text-right">{f('quantity')}</TableHead>
                                    <TableHead className="text-right">{f('unitPrice')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-mono text-xs">
                                            {String(item.product_name || item.product_id || '—')}
                                        </TableCell>
                                        <TableCell className="text-right">{String(item.quantity)}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {Number(item.unit_price).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProductDataView: React.FC<{ data: Record<string, unknown>; f: (k: string) => string }> = ({ data, f }) => (
    <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoRow label={f('sku')}><span className="font-mono">{String(data.sku || '—')}</span></InfoRow>
        <InfoRow label={f('name')}>{String(data.name || '—')}</InfoRow>
        <InfoRow label={f('price')}><span className="font-mono">{Number(data.price || 0).toLocaleString()}</span></InfoRow>
        <InfoRow label={f('quantity')}>{String(data.current_stock ?? data.quantity ?? '—')}</InfoRow>
    </div>
);

const ExpenseDataView: React.FC<{ data: Record<string, unknown>; f: (k: string) => string }> = ({ data, f }) => (
    <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoRow label={f('description')}>{String(data.description || '—')}</InfoRow>
        <InfoRow label={f('currency')}><Badge variant="outline">{String(data.currency || 'VND')}</Badge></InfoRow>
        <InfoRow label={f('amount')}><span className="font-mono">{Number(data.original_amount || data.amount || 0).toLocaleString()}</span></InfoRow>
    </div>
);

const GenericDataView: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-64">
        {JSON.stringify(data, null, 2)}
    </pre>
);
