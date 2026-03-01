import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useListShipments, useUpdateShipmentStatus, useShipmentHistory, type Shipment } from "@/hooks/useOrders";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/atoms/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/atoms/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { Search, Truck, ChevronLeft, ChevronRight, Eye, ArrowRight } from "lucide-react";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PREPARING: "secondary",
    IN_TRANSIT: "outline",
    DELIVERED: "default",
};

const STATUS_COLORS: Record<string, string> = {
    PREPARING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    IN_TRANSIT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const ALL_STATUSES = ["PREPARING", "IN_TRANSIT", "DELIVERED"] as const;

export const Shipments: React.FC = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const limit = 20;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useListShipments(page, limit, debouncedSearch);
    const shipments = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Truck className="h-6 w-6 text-primary" />
                    {t("shipments.title")}
                </h1>
                <p className="text-muted-foreground">{t("shipments.subtitle")}</p>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-10"
                        placeholder={t("shipments.searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("shipments.columns.trackingCode")}</TableHead>
                            <TableHead>{t("shipments.columns.carrier")}</TableHead>
                            <TableHead>{t("shipments.columns.status")}</TableHead>
                            <TableHead>{t("shipments.columns.location")}</TableHead>
                            <TableHead>{t("shipments.columns.createdAt")}</TableHead>
                            <TableHead className="text-right">{t("common.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    {t("common.loading")}
                                </TableCell>
                            </TableRow>
                        ) : shipments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {t("shipments.noShipments")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            shipments.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-mono font-semibold">{s.tracking_code}</TableCell>
                                    <TableCell>{s.carrier_name || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[s.status] || "secondary"}>
                                            {t(`shipment.statuses.${s.status}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{s.current_location || "—"}</TableCell>
                                    <TableCell>{new Date(s.created_at).toLocaleString("vi-VN")}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedShipment(s)}>
                                            <Eye className="h-4 w-4 mr-1" />
                                            {t("common.details")}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                        {t("common.showing", {
                            from: (page - 1) * limit + 1,
                            to: Math.min(page * limit, total),
                            total,
                        })}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                            <ChevronLeft className="h-4 w-4" />
                            {t("common.previous")}
                        </Button>
                        <span className="px-2">{t("common.page")} {page} / {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                            {t("common.next")}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <ShipmentDetailDialog
                shipment={selectedShipment}
                open={!!selectedShipment}
                onOpenChange={(open) => { if (!open) setSelectedShipment(null); }}
                onUpdated={(updated) => setSelectedShipment(updated)}
            />
        </div>
    );
};

// --- Reusable InfoRow ---
const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="font-medium">{children}</div>
    </div>
);

// --- Shipment Detail Dialog ---
const ShipmentDetailDialog: React.FC<{
    shipment: Shipment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdated: (shipment: Shipment) => void;
}> = ({ shipment, open, onOpenChange, onUpdated }) => {
    const { t } = useTranslation();
    const updateStatus = useUpdateShipmentStatus();
    const [newStatus, setNewStatus] = useState("");
    const [newLocation, setNewLocation] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const { data: history, refetch: refetchHistory } = useShipmentHistory(shipment?.id ?? null);

    useEffect(() => {
        if (shipment) {
            setNewStatus("");
            setNewLocation(shipment.current_location || "");
            setError(null);
            setSuccess(null);
        }
    }, [shipment?.id]);

    if (!shipment) return null;

    const currentIdx = ALL_STATUSES.indexOf(shipment.status as typeof ALL_STATUSES[number]);
    // Allow IN_TRANSIT → IN_TRANSIT for multi-warehouse relay
    const nextStatuses = ALL_STATUSES.filter((s, i) =>
        i > currentIdx || (s === "IN_TRANSIT" && shipment.status === "IN_TRANSIT")
    );
    const isDelivered = shipment.status === "DELIVERED";

    const handleUpdate = async () => {
        if (!newStatus) return;
        setError(null);
        setSuccess(null);
        try {
            const updated = await updateStatus.mutateAsync({
                id: shipment.id,
                status: newStatus,
                current_location: newLocation,
            });
            setSuccess(t("shipments.detail.updateSuccess"));
            setNewStatus("");
            onUpdated(updated);
            refetchHistory();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        {t("shipments.detail.title")}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Tracking & Status */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("shipments.detail.trackingInfo")}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <InfoRow label={t("shipment.trackingCode")}>
                                <span className="font-mono font-bold text-base">{shipment.tracking_code}</span>
                            </InfoRow>
                            <InfoRow label={t("shipment.status")}>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[shipment.status] || "bg-gray-100 text-gray-800"}`}>
                                    {t(`shipment.statuses.${shipment.status}`)}
                                </span>
                            </InfoRow>
                        </div>
                    </div>

                    {/* Carrier & Location */}
                    <div className="space-y-3 pt-2 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("shipments.detail.deliveryInfo")}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <InfoRow label={t("shipment.carrier")}>
                                {shipment.carrier_name || "—"}
                            </InfoRow>
                            <InfoRow label={t("shipment.currentLocation")}>
                                {shipment.current_location || "—"}
                            </InfoRow>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-3 pt-2 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("shipments.detail.metadata")}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <InfoRow label={t("shipments.detail.orderId")}>
                                <span className="font-mono text-xs">{shipment.order_id}</span>
                            </InfoRow>
                            <InfoRow label={t("shipments.detail.shipmentId")}>
                                <span className="font-mono text-xs">{shipment.id}</span>
                            </InfoRow>
                            <InfoRow label={t("shipment.createdAt")}>
                                {new Date(shipment.created_at).toLocaleString("vi-VN")}
                            </InfoRow>
                            <InfoRow label={t("shipments.detail.updatedAt")}>
                                {new Date(shipment.updated_at).toLocaleString("vi-VN")}
                            </InfoRow>
                        </div>
                    </div>

                    {/* Status History Timeline */}
                    <div className="space-y-3 pt-2 border-t">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("shipments.history.title")}
                        </h3>
                        {history && history.length > 0 ? (
                            <div className="relative space-y-0">
                                {/* Timeline line */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                                {history.map((h, idx) => (
                                    <div key={h.id} className="relative flex gap-3 pb-4 last:pb-0">
                                        {/* Dot */}
                                        <div className={`relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-background ${idx === history.length - 1 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[h.old_status] || "bg-gray-100 text-gray-800"}`}>
                                                    {t(`shipment.statuses.${h.old_status}`)}
                                                </span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[h.new_status] || "bg-gray-100 text-gray-800"}`}>
                                                    {t(`shipment.statuses.${h.new_status}`)}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                                                <p>{new Date(h.created_at).toLocaleString("vi-VN")}</p>
                                                {h.location && (
                                                    <p>📍 {h.location}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">{t("shipments.history.empty")}</p>
                        )}
                    </div>

                    {/* Status Update Section */}
                    {!isDelivered && (
                        <div className="space-y-3 pt-2 border-t">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                {t("shipments.detail.updateStatus")}
                            </h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{t("shipments.detail.newStatus")}</label>
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("shipments.detail.selectStatus")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {nextStatuses.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {t(`shipment.statuses.${s}`)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{t("shipment.currentLocation")}</label>
                                        <Input
                                            value={newLocation}
                                            onChange={(e) => setNewLocation(e.target.value)}
                                            placeholder={t("shipments.detail.locationPlaceholder")}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                                )}
                                {success && (
                                    <p className="text-sm text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/20 rounded-md px-3 py-2">{success}</p>
                                )}

                                <Button
                                    onClick={handleUpdate}
                                    disabled={!newStatus || updateStatus.isPending}
                                    className="w-full"
                                >
                                    {updateStatus.isPending ? t("common.saving") : t("shipments.detail.updateButton")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {isDelivered && (
                        <div className="pt-2 border-t">
                            <p className="text-sm text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/20 rounded-md px-3 py-2 text-center">
                                ✅ {t("shipments.detail.deliveredMessage")}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
