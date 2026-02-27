import React from "react";
import { Button } from "@/components/atoms/button";

interface CurrencyToggleProps {
    currency: "USD" | "VND";
    onToggle: () => void;
    isLoading?: boolean;
    rate?: number | null;
}

/**
 * A toggle button to switch between USD and VND display.
 */
export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
    currency,
    onToggle,
    isLoading = false,
    rate,
}) => {
    return (
        <div className="flex items-center gap-3">
            <Button
                variant="outline"
                size="sm"
                onClick={onToggle}
                disabled={isLoading}
                className="gap-2 font-medium transition-all"
            >
                <span className="text-base">💱</span>
                <span className={currency === "USD" ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                    $
                </span>
                <span className="text-muted-foreground">/</span>
                <span className={currency === "VND" ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                    ₫
                </span>
            </Button>
            {currency === "VND" && rate && (
                <span className="text-xs text-muted-foreground animate-in fade-in duration-300">
                    1 USD = {rate.toLocaleString("vi-VN")} VNĐ
                </span>
            )}
            {isLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">
                    Loading rate...
                </span>
            )}
        </div>
    );
};
