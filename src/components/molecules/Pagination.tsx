import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/atoms/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";

interface PaginationProps {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

const LIMIT_OPTIONS = [5, 10, 20, 50];

export const Pagination: React.FC<PaginationProps> = ({
    page,
    limit,
    total,
    onPageChange,
    onLimitChange,
}) => {
    const { t } = useTranslation();
    const totalPages = Math.max(1, Math.ceil(total / limit));

    if (total <= 0) return null;

    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t("common.rowsPerPage")}</span>
                <Select
                    value={String(limit)}
                    onValueChange={(val) => {
                        onLimitChange(Number(val));
                        onPageChange(1);
                    }}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {LIMIT_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={String(opt)}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="ml-2">
                    {t("common.showing", {
                        from: Math.min((page - 1) * limit + 1, total),
                        to: Math.min(page * limit, total),
                        total,
                    })}
                </span>
            </div>

            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                >
                    {t("common.previous")}
                </Button>
                <div className="text-sm text-muted-foreground w-20 text-center">
                    {t("common.page")} {page} / {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                >
                    {t("common.next")}
                </Button>
            </div>
        </div>
    );
};
