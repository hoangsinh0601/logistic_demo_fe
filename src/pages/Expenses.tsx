import React, { useState } from "react";
import { ExpenseForm } from "@/components/organisms/ExpenseForm";
import { useGetExpenses } from "@/hooks/useExpenses";
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

export const Expenses: React.FC = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const { data, isLoading } = useGetExpenses(page, limit);
    const expenses = data?.expenses ?? [];
    const total = data?.total ?? 0;
    const { currency, toggle, format, isLoading: rateLoading, rate } = useCurrencyDisplay();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("expenses.title")}</h1>
                    <p className="text-muted-foreground">{t("expenses.subtitle")}</p>
                </div>
                <CurrencyToggle currency={currency} onToggle={toggle} isLoading={rateLoading} rate={rate} />
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
                                        <TableHead className="text-right">{t("expenses.columns.convertedUSD")}</TableHead>
                                        <TableHead className="text-right">{t("expenses.columns.fctAmount")}</TableHead>
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
                                                {format(exp.original_amount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {format(exp.converted_amount_usd)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {exp.is_foreign_vendor ? format(exp.fct_amount) : "—"}
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
                                                {new Date(exp.created_at).toLocaleDateString("en-US")}
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
