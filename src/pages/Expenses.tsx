import React from "react";
import { ExpenseForm } from "@/components/organisms/ExpenseForm";
import { useGetExpenses } from "@/hooks/useExpenses";
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
    const { data: expenses, isLoading } = useGetExpenses();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Quản lý Chi phí</h1>
                <p className="text-muted-foreground">
                    Khai báo chi phí đa tiền tệ, thuế nhà thầu (FCT) và kiểm soát chứng từ hợp lệ.
                </p>
            </div>

            {/* Expense Form */}
            <ExpenseForm />

            {/* Expense List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Danh sách chi phí</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground text-center py-8">Đang tải...</p>
                    ) : !expenses || expenses.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            Chưa có khoản chi phí nào. Tạo chi phí mới ở form phía trên.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead>Tiền tệ</TableHead>
                                        <TableHead className="text-right">Số tiền gốc</TableHead>
                                        <TableHead className="text-right">Quy đổi VNĐ</TableHead>
                                        <TableHead className="text-right">FCT (VNĐ)</TableHead>
                                        <TableHead>Chứng từ</TableHead>
                                        <TableHead>Khấu trừ</TableHead>
                                        <TableHead>Ngày tạo</TableHead>
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
                                                    {exp.document_type === "VAT_INVOICE" ? "HĐ GTGT" :
                                                        exp.document_type === "DIRECT_INVOICE" ? "HĐ Trực tiếp" :
                                                            exp.document_type === "RETAIL_RECEIPT" ? "Phiếu thu" : "Không"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {exp.is_deductible_expense ? (
                                                    <span className="text-green-600 font-medium">✅ Hợp lệ</span>
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
