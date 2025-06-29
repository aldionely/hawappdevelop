import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export const RequestStockDialog = ({ isOpen, onOpenChange, accessory }) => {
    const { activeShift, createStockRequest } = useData();
    const { user } = useAuth();
    const { toast } = useToast();

    const [quantity, setQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!accessory || !quantity || parseInt(quantity, 10) <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Harap isi jumlah yang valid.' });
            return;
        }

        setIsSubmitting(true);
        const requestData = {
            shift_id: activeShift?.id,
            product_id: accessory.id, // Langsung ambil dari prop
            product_type: 'AKSESORIS',
            worker_username: user?.name || 'pekerja',
            location: activeShift?.lokasi,
            request_type: 'REQUEST_STOCK',
            quantity: parseInt(quantity, 10),
            status: 'PENDING',
        };

        const result = await createStockRequest(requestData);

        if (result.success) {
            toast({ title: 'Berhasil', description: `Permintaan stok untuk ${accessory.name} telah dikirim.` });
            onOpenChange(false);
        } else {
            toast({ variant: 'destructive', title: 'Gagal', description: result.error?.message || 'Gagal mengirim permintaan.' });
        }
        setIsSubmitting(false);
    };

    React.useEffect(() => {
        if (!isOpen) {
            setQuantity('');
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Stok</DialogTitle>
                    <DialogDescription>
                        Request stok untuk : <span className="font-semibold">{accessory?.name}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Input 
                        type="number"
                        placeholder="Jumlah yang diminta"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Batal</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};