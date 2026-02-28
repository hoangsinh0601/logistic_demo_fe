import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchTaxRules } from '@/hooks/useTaxRules';
import { Input } from '@/components/atoms/input';
import { Search, Loader2, ChevronDown, Check, X } from 'lucide-react';
import type { TaxRule } from '@/types';

interface TaxRuleSearchSelectProps {
    /** Multi-select: array of selected rule IDs */
    selectedIds: string[];
    /** Called when selection changes */
    onChange: (ids: string[]) => void;
    /** If true, only allow single selection */
    single?: boolean;
    placeholder?: string;
}

export const TaxRuleSearchSelect: React.FC<TaxRuleSearchSelectProps> = ({
    selectedIds,
    onChange,
    single = false,
    placeholder,
}) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useSearchTaxRules(debouncedSearch);

    // Flatten all pages
    const taxRules = useMemo(
        () => data?.pages.flatMap((page) => page.items) ?? [],
        [data],
    );

    // Track selected rules for display labels
    const [selectedRulesCache, setSelectedRulesCache] = useState<Map<string, TaxRule>>(new Map());

    // Update cache when new data arrives
    useEffect(() => {
        setSelectedRulesCache((prev) => {
            const next = new Map(prev);
            for (const rule of taxRules) {
                if (selectedIds.includes(rule.id)) {
                    next.set(rule.id, rule);
                }
            }
            return next;
        });
    }, [taxRules, selectedIds]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        if (!sentinelRef.current || !isOpen) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { root: listRef.current, threshold: 0.1 },
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleToggle = useCallback(
        (rule: TaxRule) => {
            if (single) {
                // Single-select: toggle or replace
                const newIds = selectedIds.includes(rule.id) ? [] : [rule.id];
                onChange(newIds);
                setSelectedRulesCache((prev) => {
                    const next = new Map(prev);
                    if (newIds.length) {
                        next.set(rule.id, rule);
                    }
                    return next;
                });
                setIsOpen(false);
                setSearch('');
            } else {
                // Multi-select: toggle
                const newIds = selectedIds.includes(rule.id)
                    ? selectedIds.filter((id) => id !== rule.id)
                    : [...selectedIds, rule.id];
                onChange(newIds);
                setSelectedRulesCache((prev) => {
                    const next = new Map(prev);
                    next.set(rule.id, rule);
                    return next;
                });
            }
        },
        [selectedIds, onChange, single],
    );

    const removeId = useCallback(
        (id: string) => {
            onChange(selectedIds.filter((sid) => sid !== id));
        },
        [selectedIds, onChange],
    );

    const formatRuleLabel = (rule: TaxRule) => {
        const ratePercent = (parseFloat(rule.rate) * 100).toFixed(1);
        return `${rule.description || rule.tax_type} — ${ratePercent}%`;
    };

    const displayText = useMemo(() => {
        if (selectedIds.length === 0) return '';
        if (single) {
            const rule = selectedRulesCache.get(selectedIds[0]);
            return rule ? formatRuleLabel(rule) : selectedIds[0];
        }
        return `${selectedIds.length} ${t('common.selected', { defaultValue: 'selected' })}`;
    }, [selectedIds, selectedRulesCache, single, t]);

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
                <span className={displayText ? 'text-foreground truncate' : 'text-muted-foreground'}>
                    {displayText || placeholder || t('expenses.form.taxSectionHint')}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </button>

            {/* Selected tags (multi-select only) */}
            {!single && selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedIds.map((id) => {
                        const rule = selectedRulesCache.get(id);
                        const label = rule ? formatRuleLabel(rule) : id;
                        return (
                            <span
                                key={id}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-purple-100 text-purple-800 border border-purple-200"
                            >
                                {label}
                                <button
                                    type="button"
                                    onClick={() => removeId(id)}
                                    className="hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
                    {/* Search Input */}
                    <div className="flex items-center gap-2 border-b px-3 py-2">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('taxRules.form.searchPlaceholder', { defaultValue: 'Search tax rules...' })}
                            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
                        />
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                    </div>

                    {/* Tax Rules List */}
                    <div ref={listRef} className="max-h-56 overflow-y-auto">
                        {taxRules.length === 0 && !isLoading ? (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                {t('common.noData')}
                            </div>
                        ) : (
                            taxRules.map((rule) => {
                                const isSelected = selectedIds.includes(rule.id);
                                const ratePercent = (parseFloat(rule.rate) * 100).toFixed(1);
                                return (
                                    <button
                                        key={rule.id}
                                        type="button"
                                        onClick={() => handleToggle(rule)}
                                        className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer ${isSelected ? 'bg-accent/50 font-medium' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {!single && (
                                                <div className={`flex items-center justify-center h-4 w-4 rounded border shrink-0 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300'
                                                    }`}>
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                            )}
                                            <span className="truncate">
                                                {rule.description || rule.tax_type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2 shrink-0">
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                                                {rule.tax_type}
                                            </span>
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {ratePercent}%
                                            </span>
                                            {single && isSelected && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}

                        {/* Infinite scroll sentinel */}
                        <div ref={sentinelRef} className="h-1" />

                        {isFetchingNextPage && (
                            <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
