import React, { useState, useEffect } from "react";
import { useGetInvoices } from "@/hooks/useInvoices";
import { useCurrencyDisplay } from "@/hooks/useCurrencyDisplay";
import { CurrencyToggle } from "@/components/atoms/CurrencyToggle";
import { Pagination } from "@/components/molecules/Pagination";
import { useTranslation } from "react-i18next";
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
import { Input } from "@/components/atoms/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Search } from "lucide-react";

export const Invoices: React.FC = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Filters
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refType, setRefType] = useState("");
    const [status, setStatus] = useState("APPROVED");

    // Debounce invoice_no search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [refType, status]);

    const { data, isLoading } = useGetInvoices(
        {
            status: status && status !== "ALL" ? status : undefined,
            invoiceNo: debouncedSearch || undefined,
            refType: refType && refType !== "ALL" ? refType : undefined,
        },
        page,
        limit,
    );
    const invoices = data?.invoices ?? [];
    const total = data?.total ?? 0;
    const { currency, toggle, format, isLoading: rateLoading, rate } = useCurrencyDisplay();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("invoices.title")}</h1>
                    <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
                </div>
                <CurrencyToggle currency={currency} onToggle={toggle} isLoading={rateLoading} rate={rate} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t("invoices.listTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t("invoices.searchInvoiceNo")}
                                className="pl-9 h-9"
                            />
                        </div>

                        <Select value={refType} onValueChange={setRefType}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder={t("invoices.filterRefType")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t("invoices.allRefTypes")}</SelectItem>
                                <SelectItem value="ORDER_IMPORT">{t("invoices.refTypes.ORDER_IMPORT")}</SelectItem>
                                <SelectItem value="ORDER_EXPORT">{t("invoices.refTypes.ORDER_EXPORT")}</SelectItem>
                                <SelectItem value="EXPENSE">{t("invoices.refTypes.EXPENSE")}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder={t("invoices.filterStatus")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t("invoices.allStatuses")}</SelectItem>
                                <SelectItem value="PENDING">{t("invoices.statuses.PENDING")}</SelectItem>
                                <SelectItem value="APPROVED">{t("invoices.statuses.APPROVED")}</SelectItem>
                                <SelectItem value="REJECTED">{t("invoices.statuses.REJECTED")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <p className="text-muted-foreground text-center py-8">{t("common.loading")}</p>
                    ) : !invoices || invoices.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            {t("invoices.noInvoices")}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("invoices.columns.invoiceNo")}</TableHead>
                                        <TableHead>{t("invoices.columns.referenceType")}</TableHead>
                                        <TableHead className="text-right">{t("invoices.columns.subtotal")}</TableHead>
                                        <TableHead className="text-right">{t("invoices.columns.taxAmount")}</TableHead>
                                        <TableHead className="text-right">{t("invoices.columns.sideFees")}</TableHead>
                                        <TableHead className="text-right">{t("invoices.columns.totalAmount")}</TableHead>
                                        <TableHead>{t("invoices.columns.status")}</TableHead>
                                        <TableHead>{t("invoices.columns.createdAt")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-mono font-medium">
                                                {inv.invoice_no}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{t(`invoices.refTypes.${inv.reference_type}`) || inv.reference_type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {format(inv.subtotal)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {format(inv.tax_amount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {format(inv.side_fees)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold">
                                                {format(inv.total_amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={inv.approval_status === "APPROVED" ? "default" : "secondary"}>
                                                    {t(`invoices.statuses.${inv.approval_status}`) || inv.approval_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(inv.created_at).toLocaleDateString("vi-VN")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <Pagination
                        page={page}
                        limit={limit}
                        total={total}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                    />
                </CardContent>
            </Card>
        </div>
    );
};
