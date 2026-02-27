import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetProducts, useDeleteProduct } from '../../hooks/useProducts';
import type { Product } from '../../types';
import { useInventorySocket } from '../../hooks/useInventorySocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu"
import { ProductFormModal } from '../molecules/ProductFormModal';
import { OrderForm } from '../molecules/OrderForm';
import { DataTable, usePagination } from '@/components/molecules/DataTable';
import type { ColumnDef } from '@/components/molecules/DataTable';

export const InventoryTable: React.FC = () => {
    const { data, isLoading, error } = useGetProducts();
    const products = data?.products ?? [];
    const deleteProduct = useDeleteProduct();
    const { t } = useTranslation();
    const { page, limit, setPage, setLimit } = usePagination(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const { latestUpdate } = useInventorySocket();
    const highlightedRow = latestUpdate?.product_id || null;

    if (isLoading) return <div className="p-8">{t('common.loading')}</div>;
    if (error) return <div className="p-8 text-destructive">{t('common.error')} loading inventory</div>;

    const handleCreateNew = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct.mutateAsync(id);
        } catch (e) {
            console.error('Failed to delete product', e);
            alert(t('Failed to delete product'));
        }
    };

    // Client-side pagination
    const total = products.length;
    const paginatedProducts = products.slice((page - 1) * limit, page * limit);

    const columns: ColumnDef<Product>[] = [
        {
            key: 'sku',
            headerKey: 'inventory.columns.sku',
            headerClassName: 'w-[100px]',
            className: 'font-medium',
            render: (product) => product.sku,
        },
        {
            key: 'name',
            headerKey: 'inventory.columns.name',
            render: (product) => product.name,
        },
        {
            key: 'price',
            headerKey: 'inventory.columns.price',
            render: (product) => `$${product.price.toFixed(2)}`,
        },
        {
            key: 'stock',
            headerKey: 'inventory.columns.stock',
            headerClassName: 'text-right',
            className: 'text-right',
            render: (product) => product.current_stock,
        },
        {
            key: 'actions',
            header: '',
            headerClassName: 'w-[50px]',
            render: (product) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Pencil className="mr-2 h-4 w-4" /> {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(product.id)}>
                            <Trash className="mr-2 h-4 w-4" /> {t('common.delete')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xl">{t('inventory.title')}</CardTitle>
                <div className="flex gap-2">
                    <Button onClick={handleCreateNew} className="h-10 w-32">{t('inventory.addProduct')}</Button>
                    <OrderForm />
                </div>
            </CardHeader>
            <CardContent>
                <DataTable<Product>
                    columns={columns}
                    data={paginatedProducts}
                    rowKey={(product) => product.id}
                    rowClassName={(product) =>
                        highlightedRow === product.id
                            ? 'bg-yellow-100 text-yellow-900 font-bold hover:bg-yellow-200/80 transition-colors duration-500'
                            : 'transition-colors duration-500'
                    }
                    pagination={{
                        page,
                        limit,
                        total,
                        onPageChange: setPage,
                        onLimitChange: setLimit,
                    }}
                />
            </CardContent>

            <ProductFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                product={selectedProduct}
            />
        </Card>
    );
};
