import React, { useState } from "react";
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

export const Invoices: React.FC = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const { data, isLoading } = useGetInvoices("APPROVED", page, limit);
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
                <CardContent>
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
