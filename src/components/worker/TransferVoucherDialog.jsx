import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const TransferVoucherDialog = ({ isOpen, onOpenChange, voucher }) => {
    const { transferVoucherStock, activeShift } = useData();
    const { user } = useAuth();
    const { toast } = useToast();

    const [quantity, setQuantity] = useState('');
    const [displayQuantity, setDisplayQuantity] = useState('');
    const [toLocation, setToLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableLocations = useMemo(() => {
        return ['PIPITAN', 'SADIK'].filter(loc => loc !== voucher?.location);
    }, [voucher]);

    React.useEffect(() => {
        if (isOpen) {
            setQuantity('');
            setDisplayQuantity('');
            setToLocation(availableLocations[0] || '');
        }
    }, [isOpen, availableLocations]);

    const handleSubmit = async () => {
        const numQuantity = parseFormattedNumber(quantity);
        if (!voucher || !toLocation || !numQuantity || numQuantity <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Harap isi semua field dengan benar.' });
            return;
        }
        if (numQuantity > voucher.current_stock) {
            toast({ variant: 'destructive', title: 'Error', description: `Stok tidak mencukupi (Stok: ${voucher.current_stock}).` });
            return;
        }

        setIsSubmitting(true);
        const result = await transferVoucherStock({
            fromVoucherId: voucher.id,
            toLocation: toLocation,
            quantity: numQuantity,
            actorName: user?.name || 'pekerja',
            shiftId: activeShift?.id
        });

        if (result.success) {
            toast({ title: 'Berhasil', description: result.message || 'Stok berhasil dioper.' });
            onOpenChange(false);
        } else {
            const errorMessage = result.error ? result.error.message : result.message;
            toast({ variant: 'destructive', title: 'Gagal', description: errorMessage || 'Gagal mengirim permintaan.' });
        }
        setIsSubmitting(false);
    };

    if (!voucher) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Oper Stok: {voucher.name}</DialogTitle>
                    <DialogDescription>
                        Lokasi Asal: {voucher.location} | Stok Tersedia: {voucher.current_stock}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <Input 
                        type="text"
                        inputMode="numeric"
                        placeholder="Jumlah yang dioper"
                        value={displayQuantity}
                        onChange={(e) => {
                            setDisplayQuantity(formatNumberInput(e.target.value));
                            setQuantity(e.target.value);
                        }}
                    />
                    <Select value={toLocation} onValueChange={setToLocation}>
                        <SelectTrigger><SelectValue placeholder="Pilih Lokasi Tujuan" /></SelectTrigger>
                        <SelectContent>
                            {availableLocations.map(loc => (
                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Batal</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Memproses...' : 'Kirim Stok'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};