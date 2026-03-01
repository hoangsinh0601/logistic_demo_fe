import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import { Can } from '@/components/atoms/Can';
import { useApproveWarehouse, useApproveAccounting, useRejectWarehouse, useRejectAccounting, useOrderShipment } from '@/hooks/useOrders';
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

                {/* Dual Approval Panel — for CREATE_ORDER, shown while PENDING */}
                {approval.request_type === 'CREATE_ORDER' && approval.status === 'PENDING' && (
                    <DualApprovalPanel approval={approval} onReject={onReject} isRejecting={isRejecting} onApprove={onApprove} />
                )}

                {/* Shipment Tracking Card — for CREATE_ORDER only */}
                {approval.request_type === 'CREATE_ORDER' && (
                    <ShipmentTrackingCard referenceId={approval.reference_id} />
                )}

                {/* Approve / Reject Actions (for non-order types) */}
                {isPending && approval.request_type !== 'CREATE_ORDER' && onApprove && onReject && (
                    <Can anyOf={["orders.approve_warehouse", "orders.approve_accounting"]}>
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

            {/* Carrier Info */}
            {Boolean(data.carrier_name) && (
                <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium">{f('carrierInfo')}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <InfoRow label={f('carrierName')}>{String(data.carrier_name)}</InfoRow>
                        {Boolean(data.carrier_company) && (
                            <InfoRow label={f('carrierCompany')}>{String(data.carrier_company)}</InfoRow>
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

// Dual Approval Panel — independent Warehouse + Accounting approvals with per-flow reject
const DualApprovalPanel: React.FC<{ approval: ApprovalRequest; onReject?: (id: string, reason: string) => void; isRejecting?: boolean; onApprove?: (id: string) => void }> = ({
    approval,
    onApprove,
}) => {
    const { t } = useTranslation();
    const approveWarehouse = useApproveWarehouse();
    const approveAccounting = useApproveAccounting();
    const rejectWarehouse = useRejectWarehouse();
    const rejectAccounting = useRejectAccounting();
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [rejectTarget, setRejectTarget] = useState<'warehouse' | 'accounting' | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const warehouseStatus = approval.warehouse_approval;
    const accountingStatus = approval.accounting_approval;
    const warehouseDone = warehouseStatus === 'APPROVED';
    const accountingDone = accountingStatus === 'APPROVED';
    const isPending = approval.status === 'PENDING';

    const getStatusBadge = (status: string, doneLabel: string) => {
        if (status === 'APPROVED') return <Badge variant="default">{doneLabel}</Badge>;
        if (status === 'REJECTED') return <Badge variant="destructive">{t('approvals.statusRejected')}</Badge>;
        return <Badge variant="secondary">{t('approvals.dualApproval.pending')}</Badge>;
    };

    const handleWarehouseApprove = async () => {
        if (!window.confirm(t('approvals.dualApproval.confirmWarehouse'))) return;
        setError(null);
        try {
            await approveWarehouse.mutateAsync(approval.id);
            onApprove?.(approval.id);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const handleAccountingApprove = async () => {
        if (!window.confirm(t('approvals.dualApproval.confirmAccounting'))) return;
        setError(null);
        try {
            await approveAccounting.mutateAsync(approval.id);
            onApprove?.(approval.id);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const handleRejectSubmit = async () => {
        if (!window.confirm(t('approvals.dualApproval.confirmReject'))) return;
        setError(null);
        setSuccessMsg(null);
        try {
            if (rejectTarget === 'warehouse') {
                await rejectWarehouse.mutateAsync({ id: approval.id, reason: rejectReason });
                setSuccessMsg(t('toast.rejectWarehouseSuccess'));
            } else if (rejectTarget === 'accounting') {
                await rejectAccounting.mutateAsync({ id: approval.id, reason: rejectReason });
                setSuccessMsg(t('toast.rejectAccountingSuccess'));
            }
            setRejectTarget(null);
            setRejectReason('');
            // Auto-close dialog after a short delay
            setTimeout(() => onApprove?.(approval.id), 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const isRejectPending = rejectWarehouse.isPending || rejectAccounting.isPending;

    return (
        <div className="space-y-3 pt-3 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t('approvals.dualApproval.title')}
            </h3>

            {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            {successMsg && (
                <p className="text-sm text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/20 rounded-md px-3 py-2">{successMsg}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* Warehouse Section */}
                <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{t('approvals.dualApproval.warehouse')}</p>
                    {getStatusBadge(warehouseStatus, t('approvals.dualApproval.delivered'))}
                    {!warehouseDone && warehouseStatus !== 'REJECTED' && isPending && (
                        <Can permission="orders.approve_warehouse">
                            <div className="flex gap-2 mt-2">
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleWarehouseApprove}
                                    disabled={approveWarehouse.isPending}
                                >
                                    {approveWarehouse.isPending ? t('common.loading') : t('approvals.dualApproval.approveWarehouse')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => setRejectTarget('warehouse')}
                                    disabled={isRejectPending}
                                >
                                    {t('approvals.reject')}
                                </Button>
                            </div>
                        </Can>
                    )}
                </div>

                {/* Accounting Section */}
                <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{t('approvals.dualApproval.accounting')}</p>
                    {getStatusBadge(accountingStatus, t('approvals.dualApproval.invoiced'))}
                    {!accountingDone && accountingStatus !== 'REJECTED' && isPending && (
                        <Can permission="orders.approve_accounting">
                            <div className="flex gap-2 mt-2">
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={handleAccountingApprove}
                                    disabled={approveAccounting.isPending}
                                >
                                    {approveAccounting.isPending ? t('common.loading') : t('approvals.dualApproval.approveAccounting')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => setRejectTarget('accounting')}
                                    disabled={isRejectPending}
                                >
                                    {t('approvals.reject')}
                                </Button>
                            </div>
                        </Can>
                    )}
                </div>
            </div>

            {/* Reject Reason Form — appears when a reject target is selected */}
            {rejectTarget && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 mt-2 p-3 border border-destructive/30 rounded-lg bg-destructive/5">
                    <p className="text-sm font-medium">
                        {rejectTarget === 'warehouse'
                            ? t('approvals.dualApproval.rejectWarehouseTitle')
                            : t('approvals.dualApproval.rejectAccountingTitle')}
                    </p>
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
                            onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRejectSubmit}
                            disabled={isRejectPending}
                        >
                            {isRejectPending ? t('common.loading') : t('approvals.confirmReject')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Shipment Tracking Card — shown when warehouse has created a shipment for the order
const ShipmentTrackingCard: React.FC<{ referenceId: string }> = ({ referenceId }) => {
    const { t } = useTranslation();
    const { data: shipment, isLoading } = useOrderShipment(referenceId);

    if (isLoading || !shipment) return null;

    const statusColors: Record<string, string> = {
        PREPARING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        IN_TRANSIT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };

    return (
        <div className="space-y-3 pt-3 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                🚚 {t('shipment.title')}
            </h3>
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoRow label={t('shipment.trackingCode')}>
                        <span className="font-mono font-semibold">{shipment.tracking_code || '—'}</span>
                    </InfoRow>
                    <InfoRow label={t('shipment.carrier')}>
                        {shipment.carrier_name || '—'}
                    </InfoRow>
                    <InfoRow label={t('shipment.status')}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[shipment.status] || 'bg-gray-100 text-gray-800'}`}>
                            {t(`shipment.statuses.${shipment.status}`)}
                        </span>
                    </InfoRow>
                    <InfoRow label={t('shipment.currentLocation')}>
                        {shipment.current_location || '—'}
                    </InfoRow>
                    {shipment.created_at && (
                        <InfoRow label={t('shipment.createdAt')}>
                            {new Date(shipment.created_at).toLocaleString('vi-VN')}
                        </InfoRow>
                    )}
                </div>
            </div>
        </div>
    );
};
