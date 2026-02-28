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
import { useGetTaxRules } from "@/hooks/useTaxRules";
import { TaxRuleSearchSelect } from "@/components/molecules/TaxRuleSearchSelect";
import { useTranslation } from "react-i18next";
import type { CurrencyCode, DocumentType, FCTType, CreateExpensePayload } from "@/types";

const CURRENCIES: CurrencyCode[] = ["USD", "EUR", "JPY", "CNY", "KRW", "VND"];

const CURRENCY_LABELS: Record<CurrencyCode, string> = {
    USD: "USD - US Dollar",
    EUR: "EUR - Euro",
    JPY: "JPY - Japanese Yen",
    CNY: "CNY - Chinese Yuan",
    KRW: "KRW - Korean Won",
    VND: "VND - Việt Nam Đồng",
};

const DOCUMENT_TYPES: DocumentType[] = ["VAT_INVOICE", "DIRECT_INVOICE", "RETAIL_RECEIPT", "NONE"];

// Helpers for safe decimal math without floating-point issues
function safeMultiply(a: string, b: string): string {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return "0";
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

function localFormatCurrency(value: string, curr: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(num) + " " + curr;
}

interface TaxPreviewItem {
    name: string;
    ratePercent: string;
    amount: string;
    taxType: string;
}

export const ExpenseForm: React.FC = () => {
    const { t } = useTranslation();

    // Form state
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [exchangeRate, setExchangeRate] = useState("");
    const [originalAmount, setOriginalAmount] = useState("");
    const [selectedTaxRuleIds, setSelectedTaxRuleIds] = useState<string[]>([]);
    const [isForeignVendor, setIsForeignVendor] = useState(false);
    const [fctType, setFctType] = useState<FCTType>("NET");
    const [documentType, setDocumentType] = useState<DocumentType>("NONE");
    const [vendorTaxCode, setVendorTaxCode] = useState("");
    const [documentUrl, setDocumentUrl] = useState("");
    const [description, setDescription] = useState("");

    // Fetch all tax rules
    const { data: taxRulesData } = useGetTaxRules(1, 100);
    const taxRules = taxRulesData?.items ?? [];

    const createExpense = useCreateExpense();

    // Auto-set exchange rate to 1 for USD
    useEffect(() => {
        if (currency === "USD") {
            setExchangeRate("1");
        } else {
            setExchangeRate("");
        }
    }, [currency]);

    // Toggle a tax rule selection
    const setSelectedTaxIds = (ids: string[]) => setSelectedTaxRuleIds(ids);

    // Check if any selected tax rule is FCT type
    const hasFctSelected = useMemo(() => {
        return taxRules.some(
            (r) => selectedTaxRuleIds.includes(r.id) && r.tax_type === "FCT"
        );
    }, [selectedTaxRuleIds, taxRules]);

    // Preview calculations
    const preview = useMemo(() => {
        const amount = originalAmount || "0";
        const rate = currency === "USD" ? "1" : (exchangeRate || "0");
        const convertedUSD = safeMultiply(amount, rate);

        // Calculate tax for each selected rule
        const taxItems: TaxPreviewItem[] = [];
        let totalTaxUSD = 0;

        for (const rule of taxRules) {
            if (!selectedTaxRuleIds.includes(rule.id)) continue;
            const rateDecimal = parseFloat(rule.rate);
            const ratePercent = (rateDecimal * 100).toFixed(2);
            let taxAmount = "0";

            if (rule.tax_type === "FCT" && isForeignVendor) {
                if (fctType === "NET") {
                    taxAmount = safeMultiply(convertedUSD, rule.rate);
                } else {
                    // GROSS: tax = converted * rate / (1 + rate)
                    const divisor = (1 + rateDecimal).toFixed(6);
                    taxAmount = safeDivide(safeMultiply(convertedUSD, rule.rate), divisor);
                }
            } else if (rule.tax_type !== "FCT") {
                taxAmount = safeMultiply(convertedUSD, rule.rate);
            }

            if (parseFloat(taxAmount) > 0) {
                taxItems.push({
                    name: rule.description || rule.tax_type,
                    ratePercent,
                    amount: taxAmount,
                    taxType: rule.tax_type,
                });
                totalTaxUSD += parseFloat(taxAmount);
            }
        }

        const totalTaxInOriginal = parseFloat(rate) > 0 ? safeDivide(totalTaxUSD.toFixed(4), rate) : "0";
        const totalPayable = (parseFloat(amount) + parseFloat(totalTaxInOriginal)).toFixed(4);

        return {
            convertedUSD,
            taxItems,
            totalTaxUSD: totalTaxUSD.toFixed(4),
            totalPayable,
        };
    }, [originalAmount, exchangeRate, currency, selectedTaxRuleIds, taxRules, isForeignVendor, fctType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: CreateExpensePayload = {
            currency,
            exchange_rate: currency === "USD" ? "1" : exchangeRate,
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
                setCurrency("USD");
                setExchangeRate("");
                setOriginalAmount("");
                setSelectedTaxRuleIds([]);
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
    const isNotUSD = currency !== "USD";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                        {t("expenses.form.cardTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">{t("expenses.form.description")}</Label>
                            <Input
                                id="description"
                                placeholder={t("expenses.form.descriptionPlaceholder")}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Currency Section */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                💱 {t("expenses.form.currencySection")}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency">{t("expenses.form.currencyLabel")}</Label>
                                    <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                                        <SelectTrigger id="currency">
                                            <SelectValue placeholder={t("expenses.form.currencyPlaceholder")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CURRENCIES.map((c) => (
                                                <SelectItem key={c} value={c}>{CURRENCY_LABELS[c]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="original_amount">{t("expenses.form.originalAmount")}</Label>
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

                            {/* Exchange Rate — only shown when not USD */}
                            {isNotUSD && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label htmlFor="exchange_rate" className="text-orange-700">
                                        {t("expenses.form.exchangeRate")}
                                    </Label>
                                    <Input
                                        id="exchange_rate"
                                        type="number"
                                        step="0.000001"
                                        min="0"
                                        placeholder={t("expenses.form.exchangeRatePlaceholder")}
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(e.target.value)}
                                        required
                                        className="border-orange-300 focus-visible:ring-orange-400"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t("expenses.form.exchangeRateHint")}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Tax Rules Section */}
                        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                                🏛️ {t("expenses.form.taxSection")}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {t("expenses.form.taxSectionHint")}
                            </p>

                            <TaxRuleSearchSelect
                                selectedIds={selectedTaxRuleIds}
                                onChange={setSelectedTaxIds}
                                placeholder={t("expenses.form.taxSectionHint")}
                            />

                            {/* FCT-specific options: show only when a FCT rule is selected */}
                            {hasFctSelected && (
                                <div className="space-y-4 pt-3 border-t border-purple-200 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="is_foreign_vendor"
                                            checked={isForeignVendor}
                                            onChange={(e) => setIsForeignVendor(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="is_foreign_vendor" className="cursor-pointer">
                                            {t("expenses.form.foreignVendor")}
                                        </Label>
                                    </div>

                                    {isForeignVendor && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label>{t("expenses.form.fctMethod")}</Label>
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
                                                        <strong>{t("expenses.form.fctNet")}</strong> — {t("expenses.form.fctNetDesc")}
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
                                                        <strong>{t("expenses.form.fctGross")}</strong> — {t("expenses.form.fctGrossDesc")}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Document Section */}
                        <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 space-y-4">
                            <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                                📄 {t("expenses.form.documentSection")}
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="document_type">{t("expenses.form.documentType")}</Label>
                                <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
                                    <SelectTrigger id="document_type">
                                        <SelectValue placeholder={t("expenses.form.documentTypePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DOCUMENT_TYPES.map((d) => (
                                            <SelectItem key={d} value={d}>{t(`expenses.documentTypes.${d}`)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {isVATInvoice && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor_tax_code" className="text-red-600">
                                            {t("expenses.form.vendorTaxCode")}
                                        </Label>
                                        <Input
                                            id="vendor_tax_code"
                                            placeholder={t("expenses.form.vendorTaxCodePlaceholder")}
                                            value={vendorTaxCode}
                                            onChange={(e) => setVendorTaxCode(e.target.value)}
                                            required
                                            className="border-red-300 focus-visible:ring-red-400"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="document_url">{t("expenses.form.documentUrl")}</Label>
                                        <Input
                                            id="document_url"
                                            placeholder={t("expenses.form.documentUrlPlaceholder")}
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
                                    ? `✅ ${t("expenses.form.deductibleYes")}`
                                    : `⚠️ ${t("expenses.form.deductibleNo")}`}
                            </p>
                            <Button
                                type="submit"
                                disabled={createExpense.isPending || !originalAmount}
                                className="min-w-[140px]"
                            >
                                {createExpense.isPending ? t("expenses.form.saving") : t("expenses.form.save")}
                            </Button>
                        </div>

                        {createExpense.isError && (
                            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                ❌ {(createExpense.error as Error)?.message || t("expenses.form.error")}
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
                        {t("expenses.preview.title")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Total Payable in Original Currency */}
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4 space-y-1">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                            {t("expenses.preview.totalPayable", { currency })}
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                            {localFormatCurrency(preview.totalPayable, currency)}
                        </p>
                        {preview.taxItems.length > 0 && (
                            <p className="text-xs text-blue-600">
                                {t("expenses.preview.totalPayableHint")}
                            </p>
                        )}
                    </div>

                    {/* Converted to USD */}
                    <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 p-4 space-y-1">
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                            {t("expenses.preview.convertedUSD")}
                        </p>
                        <p className="text-2xl font-bold text-emerald-900">
                            ${parseFloat(preview.convertedUSD).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {isNotUSD && exchangeRate && (
                            <p className="text-xs text-emerald-600">
                                {t("expenses.preview.rate", {
                                    currency,
                                    rate: parseFloat(exchangeRate).toLocaleString("en-US", { maximumFractionDigits: 6 }),
                                })}
                            </p>
                        )}
                    </div>

                    {/* Tax Items */}
                    {preview.taxItems.map((item, idx) => (
                        <div
                            key={idx}
                            className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 p-4 space-y-1 animate-in fade-in duration-300"
                        >
                            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                                {t("expenses.preview.taxAmount", { name: item.name, rate: item.ratePercent })}
                            </p>
                            <p className="text-2xl font-bold text-amber-900">
                                ${parseFloat(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            {item.taxType === "FCT" && (
                                <p className="text-xs text-amber-600">
                                    {t("expenses.preview.taxMethodHint", {
                                        rate: item.ratePercent,
                                        method: fctType === "NET" ? t("expenses.form.fctNetDesc") : t("expenses.form.fctGrossDesc"),
                                    })}
                                </p>
                            )}
                        </div>
                    ))}

                    {/* Deductibility Status */}
                    <div className={`rounded-lg p-3 text-center text-sm font-medium ${isVATInvoice && vendorTaxCode
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                        {isVATInvoice && vendorTaxCode
                            ? `✅ ${t("expenses.preview.deductible")}`
                            : `⚠️ ${t("expenses.preview.notDeductible")}`}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
