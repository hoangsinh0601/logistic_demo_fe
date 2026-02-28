import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchProducts } from '@/hooks/useProducts';
import { Input } from '@/components/atoms/input';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import type { Product } from '@/types';

interface ProductSearchSelectProps {
    value: string;
    onSelect: (product: Product) => void;
    placeholder?: string;
}

export const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({
    value,
    onSelect,
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
    } = useSearchProducts(debouncedSearch);

    // Flatten all pages into a single products array
    const products = useMemo(
        () => data?.pages.flatMap((page) => page.products) ?? [],
        [data],
    );

    // Find selected product label
    const selectedProduct = products.find((p) => p.id === value);
    const displayLabel = selectedProduct
        ? `${selectedProduct.sku} - ${selectedProduct.name}`
        : '';

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

    const handleSelect = useCallback(
        (product: Product) => {
            onSelect(product);
            setIsOpen(false);
            setSearch('');
        },
        [onSelect],
    );

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
                <span className={displayLabel ? 'text-foreground' : 'text-muted-foreground'}>
                    {displayLabel || placeholder || t('orders.chooseProduct')}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </button>

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
                            placeholder={t('orders.searchProduct')}
                            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
                        />
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                    </div>

                    {/* Product List */}
                    <div ref={listRef} className="max-h-56 overflow-y-auto">
                        {products.length === 0 && !isLoading ? (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                {t('common.noData')}
                            </div>
                        ) : (
                            products.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSelect(p)}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer ${p.id === value ? 'bg-accent/50 font-medium' : ''
                                        }`}
                                >
                                    <span className="truncate">
                                        {p.sku} - {p.name}
                                    </span>
                                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                                        {t('orders.stock')}: {p.current_stock}
                                    </span>
                                </button>
                            ))
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
