import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Button } from "@/components/atoms/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/atoms/select";
import { useCreateExpense } from "@/hooks/useExpenses";
import type { CurrencyCode, DocumentType, FCTType, CreateExpensePayload } from "@/types";

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
    { value: "VND", label: "VND - Việt Nam Đồng" },
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "JPY", label: "JPY - Japanese Yen" },
    { value: "CNY", label: "CNY - Chinese Yuan" },
    { value: "KRW", label: "KRW - Korean Won" },
];

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
    { value: "VAT_INVOICE", label: "Hóa đơn GTGT (VAT Invoice)" },
    { value: "DIRECT_INVOICE", label: "Hóa đơn trực tiếp" },
    { value: "RETAIL_RECEIPT", label: "Phiếu thu bán lẻ" },
    { value: "NONE", label: "Không có chứng từ" },
];

// Helpers for safe decimal math without floating-point issues
function safeMultiply(a: string, b: string): string {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return "0";
    // Use integer math to avoid floating-point errors
    const decA = (a.split(".")[1] || "").length;
    const decB = (b.split(".")[1] || "").length;
    const intA = Math.round(numA * Math.pow(10, decA));
    const intB = Math.round(numB * Math.pow(10, decB));
    const result = (intA * intB) / Math.pow(10, decA + decB);
    return result.toFixed(4);
}

function safeDivide(a: string, b: string): string {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB) || numB === 0) return "0";
    return (numA / numB).toFixed(4);
}

function formatVND(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(num));
}

function formatCurrency(value: string, currency: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num) + " " + currency;
}

export const ExpenseForm: React.FC = () => {
    // Form state
    const [currency, setCurrency] = useState<CurrencyCode>("VND");
    const [exchangeRate, setExchangeRate] = useState("");
    const [originalAmount, setOriginalAmount] = useState("");
    const [isForeignVendor, setIsForeignVendor] = useState(false);
    const [fctType, setFctType] = useState<FCTType>("NET");
    const [documentType, setDocumentType] = useState<DocumentType>("NONE");
    const [vendorTaxCode, setVendorTaxCode] = useState("");
    const [documentUrl, setDocumentUrl] = useState("");
    const [description, setDescription] = useState("");

    // FCT rate — in production you'd fetch from API, for preview we use a default
    const [fctRateInput, setFctRateInput] = useState("5"); // Default 5% FCT

    const createExpense = useCreateExpense();

    // Auto-set exchange rate to 1 for VND
    useEffect(() => {
        if (currency === "VND") {
            setExchangeRate("1");
        } else {
            setExchangeRate("");
        }
    }, [currency]);

    // Preview calculations using safe math
    const preview = useMemo(() => {
        const amount = originalAmount || "0";
        const rate = currency === "VND" ? "1" : (exchangeRate || "0");
        const fctPercent = fctRateInput || "0";

        const convertedVND = safeMultiply(amount, rate);
        const fctRateDecimal = (parseFloat(fctPercent) / 100).toFixed(6);

        let fctAmountVND = "0";
        if (isForeignVendor && parseFloat(fctPercent) > 0) {
            if (fctType === "NET") {
                fctAmountVND = safeMultiply(convertedVND, fctRateDecimal);
            } else {
                // GROSS: fct = converted * rate / (1 + rate)
                const rateDecimal = parseFloat(fctRateDecimal);
                const divisor = (1 + rateDecimal).toFixed(6);
                fctAmountVND = safeDivide(safeMultiply(convertedVND, fctRateDecimal), divisor);
            }
        }

        const fctInOriginal = parseFloat(rate) > 0 ? safeDivide(fctAmountVND, rate) : "0";
        const totalPayable = (parseFloat(amount) + parseFloat(fctInOriginal)).toFixed(4);

        return {
            convertedVND,
            fctAmountVND,
            totalPayable,
        };
    }, [originalAmount, exchangeRate, currency, isForeignVendor, fctType, fctRateInput]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: CreateExpensePayload = {
            currency,
            exchange_rate: currency === "VND" ? "1" : exchangeRate,
            original_amount: originalAmount,
            is_foreign_vendor: isForeignVendor,
            document_type: documentType,
            description: description || undefined,
            document_url: documentUrl || undefined,
        };

        if (isForeignVendor) {
            payload.fct_type = fctType;
        }
        if (documentType === "VAT_INVOICE") {
            payload.vendor_tax_code = vendorTaxCode;
        }

        createExpense.mutate(payload, {
            onSuccess: () => {
                // Reset form
                setCurrency("VND");
                setExchangeRate("");
                setOriginalAmount("");
                setIsForeignVendor(false);
                setFctType("NET");
                setDocumentType("NONE");
                setVendorTaxCode("");
                setDocumentUrl("");
                setDescription("");
            },
        });
    };

    const isVATInvoice = documentType === "VAT_INVOICE";
    const isNotVND = currency !== "VND";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                        Khai báo Chi phí
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả chi phí</Label>
                            <Input
                                id="description"
                                placeholder="VD: Thanh toán vận chuyển container..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Currency Section */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                💱 Tiền tệ & Tỷ giá
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Loại tiền tệ *</Label>
                                    <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                                        <SelectTrigger id="currency">
                                            <SelectValue placeholder="Chọn loại tiền" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CURRENCIES.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="original_amount">Số tiền gốc *</Label>
                                    <Input
                                        id="original_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={originalAmount}
                                        onChange={(e) => setOriginalAmount(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Exchange Rate — only shown when not VND */}
                            {isNotVND && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label htmlFor="exchange_rate" className="text-orange-700">
                                        Tỷ giá quy đổi ra VNĐ *
                                    </Label>
                                    <Input
                                        id="exchange_rate"
                                        type="number"
                                        step="0.000001"
                                        min="0"
                                        placeholder="VD: 24850 (1 USD = 24,850 VNĐ)"
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(e.target.value)}
                                        required
                                        className="border-orange-300 focus-visible:ring-orange-400"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Nhập tỷ giá theo Ngân hàng Nhà nước tại ngày giao dịch
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* FCT Section */}
                        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                                🏛️ Thuế nhà thầu (FCT)
                            </h3>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_foreign_vendor"
                                    checked={isForeignVendor}
                                    onChange={(e) => setIsForeignVendor(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="is_foreign_vendor" className="cursor-pointer">
                                    Nhà cung cấp nước ngoài (Foreign Vendor)
                                </Label>
                            </div>

                            {isForeignVendor && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <Label>Phương thức tính FCT</Label>
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="fct_type"
                                                    value="NET"
                                                    checked={fctType === "NET"}
                                                    onChange={() => setFctType("NET")}
                                                    className="h-4 w-4 text-primary focus:ring-primary"
                                                />
                                                <span className="text-sm">
                                                    <strong>Net</strong> — Thuế tính trên giá trước thuế
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="fct_type"
                                                    value="GROSS"
                                                    checked={fctType === "GROSS"}
                                                    onChange={() => setFctType("GROSS")}
                                                    className="h-4 w-4 text-primary focus:ring-primary"
                                                />
                                                <span className="text-sm">
                                                    <strong>Gross</strong> — Thuế tính trên giá đã bao gồm thuế
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fct_rate">Thuế suất FCT (%)</Label>
                                        <Input
                                            id="fct_rate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            placeholder="5"
                                            value={fctRateInput}
                                            onChange={(e) => setFctRateInput(e.target.value)}
                                            className="max-w-[200px]"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Thuế suất sẽ được lấy từ hệ thống khi submit. Giá trị này chỉ dùng cho Preview.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Document Section */}
                        <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                                📄 Chứng từ & Chi phí hợp lệ
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="document_type">Loại chứng từ *</Label>
                                <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                                    <SelectTrigger id="document_type">
                                        <SelectValue placeholder="Chọn loại chứng từ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DOCUMENT_TYPES.map((d) => (
                                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {isVATInvoice && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor_tax_code" className="text-red-600">
                                            Mã số thuế NCC * (bắt buộc khi chọn Hóa đơn GTGT)
                                        </Label>
                                        <Input
                                            id="vendor_tax_code"
                                            placeholder="VD: 0102345678"
                                            value={vendorTaxCode}
                                            onChange={(e) => setVendorTaxCode(e.target.value)}
                                            required
                                            className="border-red-300 focus-visible:ring-red-400"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="document_url">Link chứng từ / Upload</Label>
                                        <Input
                                            id="document_url"
                                            placeholder="https://drive.google.com/..."
                                            value={documentUrl}
                                            onChange={(e) => setDocumentUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                                {isVATInvoice && vendorTaxCode
                                    ? "✅ Chi phí hợp lệ — được khấu trừ TNDN"
                                    : "⚠️ Chi phí chưa đủ điều kiện khấu trừ"}
                            </p>
                            <Button
                                type="submit"
                                disabled={createExpense.isPending || !originalAmount}
                                className="min-w-[140px]"
                            >
                                {createExpense.isPending ? "Đang lưu..." : "Lưu chi phí"}
                            </Button>
                        </div>

                        {createExpense.isError && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                ❌ {(createExpense.error as Error)?.message || "Có lỗi xảy ra"}
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Live Preview Panel */}
            <Card className="lg:col-span-1 h-fit sticky top-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        Tạm tính (Preview)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Total Payable in Original Currency */}
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4 space-y-1">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                            Tổng thanh toán ({currency})
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                            {formatCurrency(preview.totalPayable, currency)}
                        </p>
                        {isForeignVendor && (
                            <p className="text-xs text-blue-600">
                                = Gốc + FCT quy đổi
                            </p>
                        )}
                    </div>

                    {/* Converted to VND */}
                    <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 p-4 space-y-1">
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                            Quy đổi ra VNĐ
                        </p>
                        <p className="text-2xl font-bold text-emerald-900">
                            {formatVND(preview.convertedVND)} ₫
                        </p>
                        {isNotVND && exchangeRate && (
                            <p className="text-xs text-emerald-600">
                                Tỷ giá: 1 {currency} = {new Intl.NumberFormat("vi-VN").format(parseFloat(exchangeRate))} VNĐ
                            </p>
                        )}
                    </div>

                    {/* FCT Amount */}
                    {isForeignVendor && (
                        <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 p-4 space-y-1 animate-in fade-in duration-300">
                            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                                Thuế nhà thầu khấu trừ ({fctType})
                            </p>
                            <p className="text-2xl font-bold text-amber-900">
                                {formatVND(preview.fctAmountVND)} ₫
                            </p>
                            <p className="text-xs text-amber-600">
                                FCT {fctRateInput}% ({fctType === "NET" ? "trên giá trước thuế" : "trên giá đã gồm thuế"})
                            </p>
                        </div>
                    )}

                    {/* Deductibility Status */}
                    <div className={`rounded-lg p-3 text-center text-sm font-medium ${isVATInvoice && vendorTaxCode
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                        {isVATInvoice && vendorTaxCode
                            ? "✅ Chi phí hợp lệ (Deductible)"
                            : "⚠️ Chưa đủ điều kiện khấu trừ"}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
