import React, { useState } from 'react';
import type { OrderPayload } from '../types';
import { useGetProducts, useCreateOrder } from '@/hooks/useProducts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export const OrderForm: React.FC = () => {
    const { data: products = [], isLoading } = useGetProducts();
    const createOrder = useCreateOrder();

    const [type, setType] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
    const [note, setNote] = useState('');

    // Default values for initial item
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [price, setPrice] = useState<number>(0);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

        const payload: OrderPayload = {
            order_code: `ORD-${Date.now()}`,
            type,
            note,
            items: [
                {
                    product_id: selectedProductId,
                    quantity: Number(quantity),
                    unit_price: Number(price), // Real logic có thể tự query unit_price base code product lookup, mình gõ thay cho ví dụ
                }
            ]
        };

        try {
            await createOrder.mutateAsync(payload);
            setSuccessMsg('Order created successfully!');
            // Reset form
            setQuantity(1);
            setNote('');
            setSelectedProductId('');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Failed to create order');
        }
    };

    if (isLoading) return <div>Loading Order Form...</div>;

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-xl">Create New Order</CardTitle>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {errorMsg && <div className="p-3 text-sm text-destructive bg-destructive/15 rounded-md">{errorMsg}</div>}
                    {successMsg && <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">{successMsg}</div>}

                    <div className="space-y-2">
                        <Label>Order Type</Label>
                        <Select value={type} onValueChange={(val: 'IMPORT' | 'EXPORT') => setType(val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IMPORT">Import Stock (In)</SelectItem>
                                <SelectItem value="EXPORT">Export Stock (Out)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Select Product</Label>
                        <Select
                            value={selectedProductId}
                            onValueChange={(val) => {
                                setSelectedProductId(val);
                                const p = products.find(x => x.id === val);
                                if (p) setPrice(p.price);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="--- Choose Product ---" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.sku} - {p.name} (Stock: {p.current_stock})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min="1"
                                required
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label>Unit Price ($)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={price}
                                onChange={e => setPrice(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Note (Optional)</Label>
                        <Input
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Add a note..."
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        disabled={createOrder.isPending || !selectedProductId}
                        className="w-full"
                    >
                        {createOrder.isPending ? 'Submitting...' : 'Submit Order'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
