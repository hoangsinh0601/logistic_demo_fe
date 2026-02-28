import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/atoms/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import type { Product } from '@/types';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';

interface ProductFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
    open,
    onOpenChange,
    product,
}) => {
    const isEditing = !!product;
    const { t } = useTranslation();

    const [sku, setSku] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState<number | ''>('');

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();

    const isPending = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (open) {
            if (isEditing && product) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSku(product.sku);

                setName(product.name);

                setPrice(product.price);
            } else {
                setSku('');
                setName('');
                setPrice('');
            }
            setErrorMsg(null);
        }
    }, [open, isEditing, product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        try {
            if (isEditing && product) {
                await updateMutation.mutateAsync({
                    id: product.id,
                    payload: { sku, name, price: Number(price) }
                });
            } else {
                await createMutation.mutateAsync({
                    sku, name, price: Number(price)
                });
            }
            onOpenChange(false);
        } catch (err: unknown) {
            setErrorMsg(getApiErrorMessage(err, t, 'errors.saveProductFailed'));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? t('inventory.productForm.editTitle') : t('inventory.productForm.createTitle')}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update product details. Changing SKU might affect external integrations."
                            : "Enter details for the new product here. Stock starts at 0 initially."}
                    </DialogDescription>
                </DialogHeader>

                {errorMsg && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sku" className="text-right">
                            {t('inventory.productForm.sku')}
                        </Label>
                        <Input
                            id="sku"
                            className="col-span-3"
                            required
                            placeholder={t('inventory.productForm.skuPlaceholder')}
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            {t('inventory.productForm.name')}
                        </Label>
                        <Input
                            id="name"
                            className="col-span-3"
                            required
                            placeholder={t('inventory.productForm.namePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            {t('inventory.productForm.price')}
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            className="col-span-3"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? t('common.loading') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
