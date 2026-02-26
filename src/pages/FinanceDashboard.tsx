import React, { useState, useMemo } from "react";
import { useGetRevenue } from "@/hooks/useRevenue";
import { useGetStatistics, type ProductRanking } from "@/hooks/useStatistics";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Badge } from "@/components/atoms/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Package } from "lucide-react";

function formatUSD(value: string | number): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "$0";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.round(num));
}

export const FinanceDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [groupBy, setGroupBy] = useState("month");

    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        switch (groupBy) {
            case "week":
                start.setMonth(now.getMonth() - 2); // ~8 weeks
                break;
            case "month":
                start.setFullYear(now.getFullYear() - 1); // 12 months
                break;
            case "quarter":
                start.setFullYear(now.getFullYear() - 2); // 8 quarters
                break;
            case "year":
                start.setFullYear(now.getFullYear() - 4); // 5 years
                break;
            default:
                start.setFullYear(now.getFullYear() - 1);
        }

        return {
            startDate: start.toISOString(),
            endDate: now.toISOString(),
        };
    }, [groupBy]);

    const { data: revenueData, isLoading: revenueLoading } = useGetRevenue(groupBy, startDate, endDate);
    const { data: statsData, isLoading: statsLoading } = useGetStatistics(startDate, endDate);

    // ── Revenue chart data ──
    const chartData = useMemo(() => {
        if (!revenueData) return [];
        return revenueData.map((d) => ({
            period: d.period,
            revenue: parseFloat(d.total_revenue),
            expense: parseFloat(d.total_expense),
            taxCollected: parseFloat(d.total_tax_collected),
            taxPaid: parseFloat(d.total_tax_paid),
            sideFees: parseFloat(d.total_side_fees),
        }));
    }, [revenueData]);

    const totals = useMemo(() => {
        if (!revenueData || revenueData.length === 0) {
            return { revenue: 0, expense: 0, taxCollected: 0, taxPaid: 0, sideFees: 0, profit: 0 };
        }
        return revenueData.reduce(
            (acc, d) => ({
                revenue: acc.revenue + parseFloat(d.total_revenue),
                expense: acc.expense + parseFloat(d.total_expense),
                taxCollected: acc.taxCollected + parseFloat(d.total_tax_collected),
                taxPaid: acc.taxPaid + parseFloat(d.total_tax_paid),
                sideFees: acc.sideFees + parseFloat(d.total_side_fees),
                profit: acc.revenue + parseFloat(d.total_revenue) - acc.expense - parseFloat(d.total_expense),
            }),
            { revenue: 0, expense: 0, taxCollected: 0, taxPaid: 0, sideFees: 0, profit: 0 },
        );
    }, [revenueData]);

    const groupByPeriodLabel: Record<string, string> = {
        week: t("dashboard.week"),
        month: t("dashboard.month"),
        quarter: t("dashboard.quarter"),
        year: t("dashboard.year"),
    };

    const isLoading = revenueLoading || statsLoading;

    // ── Product ranking table ──
    const RankingTable: React.FC<{ items: ProductRanking[]; emptyText: string }> = ({ items, emptyText }) => (
        items.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">{emptyText}</p>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">{t("dashboard.rankColumns.rank")}</TableHead>
                        <TableHead className="w-24">{t("dashboard.rankColumns.sku")}</TableHead>
                        <TableHead>{t("dashboard.rankColumns.product")}</TableHead>
                        <TableHead className="text-right">{t("dashboard.rankColumns.quantity")}</TableHead>
                        <TableHead className="text-right">{t("dashboard.rankColumns.value")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, idx) => (
                        <TableRow key={item.product_id}>
                            <TableCell>
                                <Badge variant={idx < 3 ? "default" : "secondary"} className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                                    {idx + 1}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">{item.product_sku}</TableCell>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-right font-mono">{item.total_quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono">{formatUSD(item.total_value)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    );

    return (
        <div className="space-y-6">
            {/* Header + Filter */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
                    <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
                </div>
                <div className="w-48">
                    <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger>
                            <SelectValue placeholder={t("dashboard.groupBy")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">{t("dashboard.byWeek")}</SelectItem>
                            <SelectItem value="month">{t("dashboard.byMonth")}</SelectItem>
                            <SelectItem value="quarter">{t("dashboard.byQuarter")}</SelectItem>
                            <SelectItem value="year">{t("dashboard.byYear")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ═══════ Finance Summary Cards ═══════ */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.revenue")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold text-green-600">{formatUSD(totals.revenue)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.expense")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold text-red-600">{formatUSD(totals.expense)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.profit")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-xl font-bold ${totals.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatUSD(totals.profit)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.taxCollected")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold text-blue-600">{formatUSD(totals.taxCollected)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.taxPaid")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold text-orange-600">{formatUSD(totals.taxPaid)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.sideFees")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold text-gray-600">{formatUSD(totals.sideFees)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* ═══════ Order Statistics Cards ═══════ */}
            <div>
                <h2 className="text-lg font-semibold tracking-tight mb-3">{t("dashboard.orderStatsTitle")}</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("dashboard.totalImport")}</CardTitle>
                            <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {statsLoading ? "..." : (statsData?.total_import_orders ?? 0).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("dashboard.totalExport")}</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {statsLoading ? "..." : (statsData?.total_export_orders ?? 0).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t("dashboard.totalOrders")}</CardTitle>
                            <Package className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {statsLoading ? "..." : ((statsData?.total_import_orders ?? 0) + (statsData?.total_export_orders ?? 0)).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ═══════ Revenue & Expense Chart ═══════ */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {t("dashboard.chartTitle", { period: groupByPeriodLabel[groupBy] || t("dashboard.month") })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground text-center py-12">{t("dashboard.loadingData")}</p>
                    ) : chartData.length === 0 ? (
                        <p className="text-muted-foreground text-center py-12">{t("dashboard.noDataInPeriod")}</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="period"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(v: string) => {
                                        const d = new Date(v);
                                        if (groupBy === "year") return `${d.getFullYear()}`;
                                        if (groupBy === "month") return `T${d.getMonth() + 1}/${d.getFullYear()}`;
                                        if (groupBy === "quarter") return `Q${Math.ceil((d.getMonth() + 1) / 3)}/${d.getFullYear()}`;
                                        return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
                                    }}
                                />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(v: number) =>
                                        v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` :
                                            v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` :
                                                v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` :
                                                    v.toString()
                                    }
                                />
                                <Tooltip
                                    formatter={(value: number | undefined) => (value != null ? formatUSD(value) : "—")}
                                    labelFormatter={(label) => new Date(String(label)).toLocaleDateString("vi-VN")}
                                />
                                <Legend />
                                <Bar dataKey="revenue" name={t("dashboard.revenue")} fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name={t("dashboard.expense")} fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="taxCollected" name={t("dashboard.taxCollected")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="taxPaid" name={t("dashboard.taxPaid")} fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* ═══════ Product Rankings ═══════ */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowDownRight className="h-5 w-5 text-emerald-500" />
                            {t("dashboard.topImported")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <p className="text-muted-foreground text-center py-6">{t("common.loading")}</p>
                        ) : (
                            <RankingTable
                                items={statsData?.top_imported_items ?? []}
                                emptyText={t("dashboard.noRankingData")}
                            />
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ArrowUpRight className="h-5 w-5 text-blue-500" />
                            {t("dashboard.topExported")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <p className="text-muted-foreground text-center py-6">{t("common.loading")}</p>
                        ) : (
                            <RankingTable
                                items={statsData?.top_exported_items ?? []}
                                emptyText={t("dashboard.noRankingData")}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
