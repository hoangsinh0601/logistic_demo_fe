import React, { useState } from "react";
import { useGetTaxRules, useCreateTaxRule, useUpdateTaxRule, useDeleteTaxRule } from "@/hooks/useTaxRules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
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
import type { TaxType, TaxRule } from "@/types";

const TAX_TYPE_OPTIONS: { value: TaxType; label: string; color: string }[] = [
    { value: "VAT_INLAND", label: "VAT Nội địa", color: "bg-blue-100 text-blue-800" },
    { value: "VAT_INTL", label: "VAT Quốc tế", color: "bg-indigo-100 text-indigo-800" },
    { value: "FCT", label: "Thuế Nhà thầu (FCT)", color: "bg-amber-100 text-amber-800" },
];

interface TaxRuleFormData {
    taxType: TaxType;
    rate: string;
    effectiveFrom: string;
    effectiveTo: string;
    description: string;
}

const INITIAL_FORM: TaxRuleFormData = {
    taxType: "FCT",
    rate: "",
    effectiveFrom: "",
    effectiveTo: "",
    description: "",
};

export const TaxRules: React.FC = () => {
    const { data: rules, isLoading } = useGetTaxRules();
    const createTaxRule = useCreateTaxRule();
    const updateTaxRule = useUpdateTaxRule();
    const deleteTaxRule = useDeleteTaxRule();

    const [form, setForm] = useState<TaxRuleFormData>(INITIAL_FORM);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const rateDecimal = (parseFloat(form.rate) / 100).toFixed(6);
        const payload = {
            tax_type: form.taxType,
            rate: rateDecimal,
            effective_from: form.effectiveFrom,
            effective_to: form.effectiveTo || undefined,
            description: form.description || undefined,
        };

        const onSuccess = () => {
            setForm(INITIAL_FORM);
            setShowForm(false);
            setEditingId(null);
        };

        if (editingId) {
            updateTaxRule.mutate({ id: editingId, payload }, { onSuccess });
        } else {
            createTaxRule.mutate(payload, { onSuccess });
        }
    };

    const handleEdit = (rule: TaxRule) => {
        setForm({
            taxType: rule.tax_type as TaxType,
            rate: (parseFloat(rule.rate) * 100).toFixed(2),
            effectiveFrom: rule.effective_from,
            effectiveTo: rule.effective_to || "",
            description: rule.description,
        });
        setEditingId(rule.id);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        deleteTaxRule.mutate(id, {
            onSuccess: () => setDeleteConfirmId(null),
        });
    };

    const handleCancel = () => {
        setForm(INITIAL_FORM);
        setShowForm(false);
        setEditingId(null);
    };

    const getTaxTypeLabel = (type: string) => {
        const opt = TAX_TYPE_OPTIONS.find((o) => o.value === type);
        return opt || { label: type, color: "bg-gray-100 text-gray-800" };
    };

    const isPending = createTaxRule.isPending || updateTaxRule.isPending;
    const isError = createTaxRule.isError || updateTaxRule.isError;
    const error = createTaxRule.error || updateTaxRule.error;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý Thuế suất</h1>
                    <p className="text-muted-foreground">
                        Cấu hình thuế suất VAT, FCT theo thời gian hiệu lực.
                    </p>
                </div>
                <Button onClick={() => showForm ? handleCancel() : setShowForm(true)}>
                    {showForm ? "Đóng" : "+ Thêm thuế suất"}
                </Button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <Card className="border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            {editingId ? "Chỉnh sửa thuế suất" : "Thêm thuế suất mới"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tax_type">Loại thuế *</Label>
                                <Select value={form.taxType} onValueChange={(v) => setForm(f => ({ ...f, taxType: v as TaxType }))}>
                                    <SelectTrigger id="tax_type">
                                        <SelectValue placeholder="Chọn loại thuế" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TAX_TYPE_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rate">Thuế suất (%) *</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="VD: 5, 10, 8"
                                    value={form.rate}
                                    onChange={(e) => setForm(f => ({ ...f, rate: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="effective_from">Hiệu lực từ *</Label>
                                <Input
                                    id="effective_from"
                                    type="date"
                                    value={form.effectiveFrom}
                                    onChange={(e) => setForm(f => ({ ...f, effectiveFrom: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="effective_to">Hiệu lực đến (tùy chọn)</Label>
                                <Input
                                    id="effective_to"
                                    type="date"
                                    value={form.effectiveTo}
                                    onChange={(e) => setForm(f => ({ ...f, effectiveTo: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="tax_description">Mô tả</Label>
                                <Input
                                    id="tax_description"
                                    placeholder="VD: Thuế nhà thầu 5% theo NĐ 126/2020"
                                    value={form.description}
                                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>

                            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                                <Button type="submit" disabled={isPending} className="min-w-[120px]">
                                    {isPending ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
                                </Button>
                                <Button type="button" variant="ghost" onClick={handleCancel}>
                                    Hủy
                                </Button>
                            </div>

                            {isError && (
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md sm:col-span-2 lg:col-span-3">
                                    ❌ {(error as Error)?.message || "Có lỗi xảy ra"}
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Rules Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Danh sách thuế suất {rules ? `(${rules.length})` : ""}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground text-center py-8">Đang tải...</p>
                    ) : !rules || rules.length === 0 ? (
                        <div className="text-center py-12 space-y-3">
                            <p className="text-4xl">📋</p>
                            <p className="text-muted-foreground">Chưa có thuế suất nào. Nhấn "Thêm thuế suất" để bắt đầu.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Loại thuế</TableHead>
                                        <TableHead className="text-right">Thuế suất</TableHead>
                                        <TableHead>Hiệu lực từ</TableHead>
                                        <TableHead>Hiệu lực đến</TableHead>
                                        <TableHead>Mô tả</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rules.map((rule) => {
                                        const typeInfo = getTaxTypeLabel(rule.tax_type);
                                        const ratePercent = (parseFloat(rule.rate) * 100).toFixed(2);
                                        const now = new Date().toISOString().split("T")[0];
                                        const isActive =
                                            rule.effective_from <= now &&
                                            (rule.effective_to === null || rule.effective_to >= now);

                                        return (
                                            <TableRow key={rule.id}>
                                                <TableCell>
                                                    <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-lg">
                                                    {ratePercent}%
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(rule.effective_from).toLocaleDateString("vi-VN")}
                                                </TableCell>
                                                <TableCell>
                                                    {rule.effective_to
                                                        ? new Date(rule.effective_to).toLocaleDateString("vi-VN")
                                                        : <span className="text-muted-foreground italic">Không giới hạn</span>}
                                                </TableCell>
                                                <TableCell className="max-w-[250px] truncate">
                                                    {rule.description || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {isActive ? (
                                                        <Badge className="bg-green-100 text-green-800">Đang áp dụng</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Hết hiệu lực</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(rule)}
                                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                        >
                                                            ✏️
                                                        </Button>
                                                        {deleteConfirmId === rule.id ? (
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(rule.id)}
                                                                    disabled={deleteTaxRule.isPending}
                                                                >
                                                                    {deleteTaxRule.isPending ? "..." : "Xóa"}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeleteConfirmId(null)}
                                                                >
                                                                    Hủy
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeleteConfirmId(rule.id)}
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                            >
                                                                🗑️
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {deleteTaxRule.isError && (
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md mt-4">
                            ❌ {(deleteTaxRule.error as Error)?.message || "Xóa thất bại"}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
