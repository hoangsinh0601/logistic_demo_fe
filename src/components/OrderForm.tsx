import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderPayload } from '../types';
import { useGetProducts, useCreateOrder } from '@/hooks/useProducts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';

export const OrderForm: React.FC = () => {
    const { data: products = [], isLoading } = useGetProducts();
    const createOrder = useCreateOrder();
    const { t } = useTranslation();

    const [open, setOpen] = useState(false);
    const [type, setType] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
    const [note, setNote] = useState('');

    type OrderItemState = {
        productId: string;
        quantity: number;
        price: number;
    };

    const [items, setItems] = useState<OrderItemState[]>([
        { productId: '', quantity: 1, price: 0 }
    ]);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, price: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof OrderItemState, value: string | number) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = { ...newItems[index], [field]: value as never };
            return newItems;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        const validItems = items.filter(item => item.productId !== '');

        if (validItems.length === 0) {
            setErrorMsg('Please select at least one product.');
            return;
        }

        const payload: OrderPayload = {
            order_code: `ORD-${Date.now()}`,
            type,
            note,
            items: validItems.map(item => ({
                product_id: item.productId,
                quantity: Number(item.quantity),
                unit_price: Number(item.price),
            }))
        };

        try {
            await createOrder.mutateAsync(payload);
            setSuccessMsg(t('common.success'));
            // Reset form
            setItems([{ productId: '', quantity: 1, price: 0 }]);
            setNote('');
            setTimeout(() => {
                setOpen(false);
                setSuccessMsg(null);
            }, 1000);
        } catch (err: unknown) {
            if (err instanceof Error && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                setErrorMsg(axiosError.response?.data?.message || t('common.error'));
            } else {
                setErrorMsg(t('common.error'));
            }
        }
    };

    if (isLoading) {
        return <Button disabled className="w-full h-12"><ShoppingCart className="mr-2 h-5 w-5" />{t('common.loading')}</Button>;
    }

    const totalOrderValue = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-44 h-10 font-medium shadow-sm" variant="default">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {t('orders.createTitle')}
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">{t('orders.createTitle')}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">{t('orders.subtitle')}</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                    {errorMsg && <div className="p-3 text-sm text-destructive bg-destructive/15 rounded-md">{errorMsg}</div>}
                    {successMsg && <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">{successMsg}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('orders.type')}</Label>
                            <Select value={type} onValueChange={(val: 'IMPORT' | 'EXPORT') => setType(val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IMPORT">{t('orders.typeImport')}</SelectItem>
                                    <SelectItem value="EXPORT">{t('orders.typeExport')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('orders.note')}</Label>
                            <Input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder={t('orders.notePlaceholder')}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Order Items</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddItem}
                                className="h-8 border-dashed"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-start gap-4 p-3 border rounded-md bg-muted/20 relative group">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t('orders.product')}</Label>
                                        <Select
                                            value={item.productId}
                                            onValueChange={(val) => {
                                                const p = products.find(x => x.id === val);
                                                handleItemChange(index, 'productId', val);
                                                if (p) handleItemChange(index, 'price', p.price);
                                            }}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder={t('orders.chooseProduct')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.sku} - {p.name} ({t('orders.stock')}: {p.current_stock})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-24 space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t('orders.quantity')}</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            required
                                            value={item.quantity}
                                            onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t('orders.unitPrice')}</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={item.price}
                                            onChange={e => handleItemChange(index, 'price', Number(e.target.value))}
                                            className="h-9"
                                        />
                                    </div>

                                    {items.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveItem(index)}
                                            className="mt-6 h-9 w-9 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">{t('common.delete')}</span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t flex flex-col gap-4">
                        <div className="flex justify-between w-full items-center">
                            <Label className="text-muted-foreground">{t('orders.totalValue')}</Label>
                            <span className="text-lg font-semibold tracking-tight">${totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-end gap-3 w-full">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={createOrder.isPending || items.every(i => !i.productId)}
                            >
                                {createOrder.isPending ? t('orders.submitting') : t('orders.submitCount', { count: items.filter(i => i.productId).length })}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
