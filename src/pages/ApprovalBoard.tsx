import React, { useState, useMemo } from "react";
import { useGetApprovals, useRejectRequest } from "@/hooks/useApprovals";
import { useTranslation } from "react-i18next";
import { DataTable, usePagination } from "@/components/molecules/DataTable";
import type { ColumnDef } from "@/components/molecules/DataTable";
import { ApprovalDetailDialog } from "@/components/molecules/ApprovalDetailDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Eye } from "lucide-react";
import type { ApprovalStatus, ApprovalRequestType, ApprovalRequest } from "@/types";

const statusBadgeVariant: Record<ApprovalStatus, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    APPROVED: "default",
    REJECTED: "destructive",
};

const requestTypeBadgeVariant: Record<ApprovalRequestType, "default" | "secondary" | "destructive" | "outline"> = {
    CREATE_ORDER: "default",
    CREATE_PRODUCT: "secondary",
    CREATE_EXPENSE: "outline",
};

export const ApprovalBoard: React.FC = () => {
    const { t } = useTranslation();
    const [statusFilter, setStatusFilter] = useState<string>("PENDING");
    const { page, limit, setPage, setLimit } = usePagination(20);
    const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);

    const effectiveStatus = statusFilter === "ALL" ? undefined : statusFilter;
    const { data, isLoading } = useGetApprovals(effectiveStatus, page, limit);
    const approvals = data?.approvals ?? [];
    const total = data?.total ?? 0;
    const rejectMutation = useRejectRequest();

    const parseRequestData = (rawData: string): Record<string, unknown> => {
        try { return JSON.parse(rawData); } catch { return {}; }
    };

    const getRequestSummary = (type: ApprovalRequestType, rawData: string): string => {
        const parsed = parseRequestData(rawData);
        switch (type) {
            case "CREATE_ORDER":
                return `${parsed.type === "IMPORT" ? t("approvals.orderSummary.import") : t("approvals.orderSummary.export")} - ${t("orders.type")}: ${parsed.order_code || "N/A"}`;
            case "CREATE_PRODUCT":
                return `SKU: ${(parsed as Record<string, string>).sku || "N/A"} - ${(parsed as Record<string, string>).name || "N/A"}`;
            case "CREATE_EXPENSE":
                return `${(parsed as Record<string, string>).currency || "VND"} - ${(parsed as Record<string, string>).description || "N/A"}`;
            default:
                return "—";
        }
    };

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    // Called by DualApprovalPanel after warehouse/accounting approve succeeds
    const handleApprove = (_id: string) => {
        setSelectedApproval(null);
    };

    const handleReject = (id: string, reason: string) => {
        rejectMutation.mutate(
            { id, reason },
            { onSuccess: () => setSelectedApproval(null) },
        );
    };

    const columns = useMemo<ColumnDef<ApprovalRequest>[]>(() => [
        {
            key: "requestType",
            headerKey: "approvals.columns.requestType",
            render: (req) => (
                <Badge variant={requestTypeBadgeVariant[req.request_type]}>
                    {t(`approvals.requestTypes.${req.request_type}`) || req.request_type}
                </Badge>
            ),
        },
        {
            key: "summary",
            headerKey: "approvals.columns.summary",
            className: "max-w-[300px] truncate text-sm",
            render: (req) => getRequestSummary(req.request_type, req.request_data),
        },
        {
            key: "requester",
            headerKey: "approvals.columns.requester",
            className: "text-sm",
            render: (req) => req.requester_name || "—",
        },
        {
            key: "status",
            headerKey: "approvals.columns.status",
            render: (req) => (
                <div>
                    <Badge variant={statusBadgeVariant[req.status]}>
                        {t(`approvals.status${req.status.charAt(0) + req.status.slice(1).toLowerCase()}`)}
                    </Badge>
                    {req.rejection_reason && (
                        <p className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={req.rejection_reason}>
                            {t("approvals.rejectionReasonLabel")}: {req.rejection_reason}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: "approver",
            headerKey: "approvals.columns.approver",
            className: "text-sm",
            render: (req) => req.approver_name || "—",
        },
        {
            key: "createdAt",
            headerKey: "approvals.columns.createdAt",
            className: "text-sm text-muted-foreground",
            render: (req) => new Date(req.created_at).toLocaleDateString("vi-VN"),
        },
        {
            key: "actions",
            header: "",
            render: (req) => (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedApproval(req)}
                    className="h-7 px-2"
                >
                    <Eye className="h-4 w-4 mr-1" />
                    {t("approvals.viewDetail")}
                </Button>
            ),
        },
    ], [t]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("approvals.title")}</h1>
                <p className="text-muted-foreground">{t("approvals.subtitle")}</p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{t("approvals.filterStatus")}</span>
                <div className="w-48">
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                        <SelectTrigger>
                            <SelectValue placeholder={t("approvals.filterPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t("approvals.statusAll")}</SelectItem>
                            <SelectItem value="PENDING">{t("approvals.statusPending")}</SelectItem>
                            <SelectItem value="APPROVED">{t("approvals.statusApproved")}</SelectItem>
                            <SelectItem value="REJECTED">{t("approvals.statusRejected")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t("approvals.listTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground text-center py-8">{t("common.loading")}</p>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={approvals}
                            rowKey={(req) => req.id}
                            emptyMessage={t("approvals.noApprovals")}
                            pagination={{ page, limit, total, onPageChange: setPage, onLimitChange: setLimit }}
                        />
                    )}
                </CardContent>
            </Card>

            <ApprovalDetailDialog
                approval={selectedApproval}
                open={!!selectedApproval}
                onOpenChange={(open) => { if (!open) setSelectedApproval(null); }}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={false}
                isRejecting={rejectMutation.isPending}
            />
        </div>
    );
};

export default ApprovalBoard;
