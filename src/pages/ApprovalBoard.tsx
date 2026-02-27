import React, { useState } from "react";
import { useGetApprovals, useApproveRequest, useRejectRequest } from "@/hooks/useApprovals";
import { useTranslation } from "react-i18next";
import { Can } from "@/components/atoms/Can";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import type { ApprovalStatus, ApprovalRequestType } from "@/types";

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
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const effectiveStatus = statusFilter === "ALL" ? undefined : statusFilter;
    const { data: approvals, isLoading } = useGetApprovals(effectiveStatus);
    const approveMutation = useApproveRequest();
    const rejectMutation = useRejectRequest();

    const handleApprove = (id: string) => {
        if (confirm(t("approvals.confirmApprove"))) {
            approveMutation.mutate(id);
        }
    };

    const handleReject = (id: string) => {
        rejectMutation.mutate(
            { id, reason: rejectReason },
            {
                onSuccess: () => {
                    setRejectingId(null);
                    setRejectReason("");
                },
            }
        );
    };

    const parseRequestData = (data: string): Record<string, unknown> => {
        try {
            return JSON.parse(data);
        } catch {
            return {};
        }
    };

    const getRequestSummary = (type: ApprovalRequestType, data: string): string => {
        const parsed = parseRequestData(data);
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
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

            {/* Approval Request Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t("approvals.listTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground text-center py-8">{t("common.loading")}</p>
                    ) : !approvals || approvals.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            {t("approvals.noApprovals")}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("approvals.columns.requestType")}</TableHead>
                                        <TableHead>{t("approvals.columns.summary")}</TableHead>
                                        <TableHead>{t("approvals.columns.requester")}</TableHead>
                                        <TableHead>{t("approvals.columns.status")}</TableHead>
                                        <TableHead>{t("approvals.columns.approver")}</TableHead>
                                        <TableHead>{t("approvals.columns.createdAt")}</TableHead>
                                        <TableHead>{t("approvals.columns.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvals.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell>
                                                <Badge variant={requestTypeBadgeVariant[req.request_type]}>
                                                    {t(`approvals.requestTypes.${req.request_type}`) || req.request_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm max-w-[300px] truncate">
                                                {getRequestSummary(req.request_type, req.request_data)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {req.requester_name || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusBadgeVariant[req.status]}>
                                                    {t(`approvals.status${req.status.charAt(0) + req.status.slice(1).toLowerCase()}`)}
                                                </Badge>
                                                {req.rejection_reason && (
                                                    <p className="text-xs text-destructive mt-1 max-w-[200px] truncate"
                                                        title={req.rejection_reason}>
                                                        {t("approvals.rejectionReasonLabel")}: {req.rejection_reason}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {req.approver_name || "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(req.created_at).toLocaleDateString("vi-VN")}
                                            </TableCell>
                                            <TableCell>
                                                {req.status === "PENDING" && (
                                                    <Can permission="approvals.approve">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    onClick={() => handleApprove(req.id)}
                                                                    disabled={approveMutation.isPending}
                                                                >
                                                                    {t("approvals.approve")}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => setRejectingId(
                                                                        rejectingId === req.id ? null : req.id
                                                                    )}
                                                                    disabled={rejectMutation.isPending}
                                                                >
                                                                    {t("approvals.reject")}
                                                                </Button>
                                                            </div>
                                                            {rejectingId === req.id && (
                                                                <div className="flex flex-col gap-1">
                                                                    <textarea
                                                                        className="text-sm border rounded p-1 w-full min-h-[60px] resize-none"
                                                                        placeholder={t("approvals.rejectReason")}
                                                                        value={rejectReason}
                                                                        onChange={(e) => setRejectReason(e.target.value)}
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleReject(req.id)}
                                                                        disabled={rejectMutation.isPending}
                                                                    >
                                                                        {t("approvals.confirmReject")}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Can>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
