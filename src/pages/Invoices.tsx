import React from "react";
import { useGetInvoices } from "@/hooks/useInvoices";
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

function formatVND(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(num));
}

export const Invoices: React.FC = () => {
    const { t } = useTranslation();
    const { data: invoices, isLoading } = useGetInvoices("APPROVED");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("invoices.title")}</h1>
                <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
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
                                        <TableHead>{t("invoices.columns.type")}</TableHead>
                                        <TableHead>{t("invoices.columns.tax")}</TableHead>
                                        <TableHead className="text-right">{t("invoices.columns.subtotal")}</TableHead>
                                        <TableHead className="text-right">{t("invoices.columns.taxAmount")}</TableHead>
                                        <TableHead className="text-right">{t("invoices.columns.sideFees")}</TableHead>
                                        <TableHead className="text-right">{t("invoices.columns.totalAmount")}</TableHead>
                                        <TableHead>{t("invoices.columns.issuedDate")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-mono text-sm">
                                                {inv.invoice_no}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {t(`invoices.refTypes.${inv.reference_type}`) || inv.reference_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {inv.tax_type
                                                    ? `${inv.tax_type} (${(parseFloat(inv.tax_rate || "0") * 100).toFixed(0)}%)`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatVND(inv.subtotal)} ₫
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatVND(inv.tax_amount)} ₫
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatVND(inv.side_fees)} ₫
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold">
                                                {formatVND(inv.total_amount)} ₫
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
                </CardContent>
            </Card>
        </div>
    );
};
