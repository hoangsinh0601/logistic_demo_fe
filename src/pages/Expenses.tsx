import React from "react";
import { ExpenseForm } from "@/components/organisms/ExpenseForm";
import { useGetExpenses } from "@/hooks/useExpenses";
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

export const Expenses: React.FC = () => {
    const { t } = useTranslation();
    const { data: expenses, isLoading } = useGetExpenses();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("expenses.title")}</h1>
                <p className="text-muted-foreground">{t("expenses.subtitle")}</p>
            </div>

            {/* Expense Form */}
            <ExpenseForm />

            {/* Expense List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t("expenses.listTitle")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground text-center py-8">{t("common.loading")}</p>
                    ) : !expenses || expenses.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            {t("expenses.noExpenses")}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("expenses.columns.description")}</TableHead>
                                        <TableHead>{t("expenses.columns.currency")}</TableHead>
                                        <TableHead className="text-right">{t("expenses.columns.originalAmount")}</TableHead>
                                        <TableHead className="text-right">{t("expenses.columns.convertedVND")}</TableHead>
                                        <TableHead className="text-right">{t("expenses.columns.fctVND")}</TableHead>
                                        <TableHead>{t("expenses.columns.document")}</TableHead>
                                        <TableHead>{t("expenses.columns.deductible")}</TableHead>
                                        <TableHead>{t("expenses.columns.createdAt")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map((exp) => (
                                        <TableRow key={exp.id}>
                                            <TableCell className="max-w-[200px] truncate">
                                                {exp.description || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{exp.currency}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {parseFloat(exp.original_amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatVND(exp.converted_amount_vnd)} ₫
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {exp.is_foreign_vendor ? `${formatVND(exp.fct_amount_vnd)} ₫` : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={exp.document_type === "VAT_INVOICE" ? "default" : "secondary"}>
                                                    {t(`expenses.documentTypes.${exp.document_type}`) || exp.document_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {exp.is_deductible_expense ? (
                                                    <span className="text-green-600 font-medium">✅ {t("common.valid")}</span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(exp.created_at).toLocaleDateString("vi-VN")}
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
