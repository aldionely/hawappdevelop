import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export const ReturnItemDialog = ({ isOpen, onOpenChange, accessory }) => {
    const { activeShift, createStockRequest } = useData();
    const { user } = useAuth();
    const { toast } = useToast();

    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!accessory || !quantity || parseInt(quantity, 10) <= 0 || !description.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Harap isi jumlah dan deskripsi alasan retur.' });
            return;
        }

        setIsSubmitting(true);
        const requestData = {
            shift_id: activeShift?.id,
            product_id: accessory.id,
            product_type: 'AKSESORIS',
            worker_username: user?.name || 'pekerja',
            location: activeShift?.lokasi,
            request_type: 'RETURN_ITEM',
            quantity: parseInt(quantity, 10),
            description: description,
            status: 'PENDING',
        };

        const result = await createStockRequest(requestData);
        if (result.success) {
            toast({ title: 'Berhasil', description: `Permintaan retur untuk ${accessory.name} telah dikirim.` });
            onOpenChange(false);
        } else {
            toast({ variant: 'destructive', title: 'Gagal', description: result.error?.message || 'Gagal mengirim permintaan.' });
        }
        setIsSubmitting(false);
    };

    React.useEffect(() => {
        if (!isOpen) {
            setQuantity('');
            setDescription('');
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Retur Barang</DialogTitle>
                    <DialogDescription>
                        Mengembalikan barang: <span className="font-semibold">{accessory?.name}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <Input 
                        type="number"
                        placeholder="Jumlah yang diretur"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                    <Textarea 
                        placeholder="Deskripsi / Alasan Retur (contoh: 'barang rusak', 'salah beli')"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Batal</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Mengirim...' : 'Kirim Form Retur'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};