import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePartners, useDeletePartner } from "@/hooks/usePartners";
import { DataTable, usePagination } from "@/components/molecules/DataTable";
import type { ColumnDef } from "@/components/molecules/DataTable";
import { PartnerForm } from "@/components/molecules/PartnerForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Plus, Pencil, Trash2, Search, UserCheck, UserX } from "lucide-react";
import { Can } from "@/components/atoms/Can";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import type { Partner, PartnerType } from "@/types";

const TYPE_OPTIONS: Array<{ value: string; labelKey: string }> = [
    { value: "ALL", labelKey: "partners.filter.all" },
    { value: "CUSTOMER", labelKey: "partners.types.CUSTOMER" },
    { value: "SUPPLIER", labelKey: "partners.types.SUPPLIER" },
    { value: "BOTH", labelKey: "partners.types.BOTH" },
];

const typeBadgeVariant: Record<PartnerType, "default" | "secondary" | "outline"> = {
    CUSTOMER: "default",
    SUPPLIER: "secondary",
    BOTH: "outline",
};

export const PartnerList: React.FC = () => {
    const { t } = useTranslation();
    const { page, limit, setPage, setLimit } = usePagination(20);
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editPartner, setEditPartner] = useState<Partner | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const deleteMutation = useDeletePartner();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, setPage]);

    const effectiveType = typeFilter === "ALL" ? undefined : typeFilter;
    const { data, isLoading } = usePartners(effectiveType, debouncedSearch || undefined, page, limit);
    const partners = data?.data ?? [];
    const total = data?.total ?? 0;

    const handleDelete = async (id: string) => {
        if (!confirm(t("partners.confirmDelete"))) return;
        try {
            await deleteMutation.mutateAsync(id);
        } catch (err: unknown) {
            setErrorMsg(getApiErrorMessage(err, t, "errors.deletePartnerFailed"));
        }
    };

    const handleEdit = (partner: Partner) => {
        setEditPartner(partner);
        setFormOpen(true);
    };

    const handleAdd = () => {
        setEditPartner(null);
        setFormOpen(true);
    };

    const handleTypeFilterChange = (value: string) => {
        setTypeFilter(value);
        setPage(1);
    };

    const columns = useMemo<ColumnDef<Partner>[]>(() => [
        {
            key: "name",
            headerKey: "partners.columns.name",
            className: "font-medium",
            render: (p) => (
                <div>
                    <div className="font-medium">{p.name}</div>
                    {p.company_name && (
                        <div className="text-xs text-muted-foreground">{p.company_name}</div>
                    )}
                </div>
            ),
        },
        {
            key: "type",
            headerKey: "partners.columns.type",
            render: (p) => (
                <Badge variant={typeBadgeVariant[p.type]}>
                    {t(`partners.types.${p.type}`)}
                </Badge>
            ),
        },
        {
            key: "contact",
            headerKey: "partners.columns.contact",
            className: "text-sm",
            render: (p) => (
                <div>
                    {p.contact_person && <div>{p.contact_person}</div>}
                    {p.phone && <div className="text-muted-foreground">{p.phone}</div>}
                    {p.email && <div className="text-muted-foreground">{p.email}</div>}
                </div>
            ),
        },
        {
            key: "taxCode",
            headerKey: "partners.columns.taxCode",
            className: "text-sm font-mono",
            render: (p) => p.tax_code || "—",
        },
        {
            key: "status",
            headerKey: "partners.columns.status",
            render: (p) => (
                <div className="flex items-center gap-1">
                    {p.is_active ? (
                        <Badge variant="default" className="gap-1">
                            <UserCheck className="h-3 w-3" />
                            {t("partners.active")}
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="gap-1">
                            <UserX className="h-3 w-3" />
                            {t("partners.inactive")}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: "actions",
            header: "",
            render: (p) => (
                <Can permission="partners.write">
                    <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(p.id)}
                            disabled={deleteMutation.isPending}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </Can>
            ),
        },
    ], [t, deleteMutation.isPending]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("partners.title")}</h1>
                    <p className="text-muted-foreground">{t("partners.subtitle")}</p>
                </div>
                <Can permission="partners.write">
                    <Button onClick={handleAdd} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t("partners.addButton")}
                    </Button>
                </Can>
            </div>

            {errorMsg && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                    {errorMsg}
                    <Button variant="ghost" size="sm" className="ml-2" onClick={() => setErrorMsg(null)}>✕</Button>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t("partners.listTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t("partners.searchPlaceholder")}
                                className="pl-9 h-9"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TYPE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {t(opt.labelKey)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <p className="text-muted-foreground text-center py-8">{t("common.loading")}</p>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={partners}
                            rowKey={(p) => p.id}
                            emptyMessage={t("partners.noPartners")}
                            pagination={{ page, limit, total, onPageChange: setPage, onLimitChange: setLimit }}
                        />
                    )}
                </CardContent>
            </Card>

            <PartnerForm
                open={formOpen}
                onOpenChange={setFormOpen}
                editPartner={editPartner}
            />
        </div>
    );
};

export default PartnerList;
