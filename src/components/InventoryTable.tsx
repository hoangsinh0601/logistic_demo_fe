import React, { useState } from 'react';
import { useGetProducts, useDeleteProduct } from '../hooks/useProducts';
import type { Product } from '../types';
import { useInventorySocket } from '../hooks/useInventorySocket';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductFormModal } from './ProductFormModal';

export const InventoryTable: React.FC = () => {
    const { data: products = [], isLoading, error } = useGetProducts();
    const deleteProduct = useDeleteProduct();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const { latestUpdate } = useInventorySocket();

    const highlightedRow = latestUpdate?.product_id || null;

    if (isLoading) return <div className="p-8">Loading Inventory...</div>;
    if (error) return <div className="p-8 text-destructive">Error loading inventory</div>;

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
            alert('Failed to delete product');
        }
    };

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Stock Overview</CardTitle>
                <Button onClick={handleCreateNew} size="sm">Add Product</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">SKU</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right">Current Stock</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map(product => (
                                <TableRow
                                    key={product.id}
                                    className={`transition-colors duration-500 ${highlightedRow === product.id ? 'bg-yellow-100 text-yellow-900 font-bold hover:bg-yellow-200/80' : ''
                                        }`}
                                >
                                    <TableCell className="font-medium">{product.sku}</TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>${product.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{product.current_stock}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(product)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit Product
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(product.id)}>
                                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <ProductFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                product={selectedProduct}
            />
        </Card>
    );
};
