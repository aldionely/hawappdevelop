import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

export const EditCashDialog = ({ isOpen, onOpenChange, shift }) => {
    const { adminEditShiftCash } = useData();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [cashDetails, setCashDetails] = useState({ ratusan: '', puluhan: '', ribuan: '', koin: '' });
    const [displayCashDetails, setDisplayCashDetails] = useState({ ratusan: '', puluhan: '', ribuan: '', koin: '' });

    useEffect(() => {
        if (shift?.physical_cash_details) {
            const details = shift.physical_cash_details;
            const initialNumeric = {
                ratusan: details.ratusan || '',
                puluhan: details.puluhan || '',
                ribuan: details.ribuan || '',
                koin: details.koin || ''
            };
            setCashDetails(initialNumeric);
            setDisplayCashDetails({
                ratusan: formatNumberInput(String(initialNumeric.ratusan)),
                puluhan: formatNumberInput(String(initialNumeric.puluhan)),
                ribuan: formatNumberInput(String(initialNumeric.ribuan)),
                koin: formatNumberInput(String(initialNumeric.koin))
            });
        }
    }, [shift]);

    const handleCashDetailChange = (field, value) => {
        setCashDetails(prev => ({ ...prev, [field]: parseFormattedNumber(value) }));
        setDisplayCashDetails(prev => ({ ...prev, [field]: formatNumberInput(value) }));
    };

    const totalUangFisik = useMemo(() => {
        return Object.values(cashDetails).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }, [cashDetails]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const finalCashDetails = {
            ratusan: Number(cashDetails.ratusan) || 0,
            puluhan: Number(cashDetails.puluhan) || 0,
            ribuan: Number(cashDetails.ribuan) || 0,
            koin: Number(cashDetails.koin) || 0,
        };

        const result = await adminEditShiftCash(shift.id, finalCashDetails);
        if (result.success) {
            toast({ title: "Berhasil", description: "Rincian uang fisik telah diperbarui." });
            onOpenChange(false);
        } else {
            toast({ variant: "destructive", title: "Gagal", description: result.error?.message || "Gagal memperbarui data." });
        }
        setIsSubmitting(false);
    };

    if (!shift) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Uang Fisik Shift</DialogTitle>
                    <DialogDescription>
                        Koreksi rincian uang fisik untuk shift {shift.workerName} pada {new Date(shift.startTime).toLocaleDateString('id-ID')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <Input type="text" inputMode="decimal" placeholder="Ratusan Ribu (Rp)" value={displayCashDetails.ratusan} onChange={(e) => handleCashDetailChange('ratusan', e.target.value)} />
                    <Input type="text" inputMode="decimal" placeholder="Puluhan Ribu (Rp)" value={displayCashDetails.puluhan} onChange={(e) => handleCashDetailChange('puluhan', e.target.value)} />
                    <Input type="text" inputMode="decimal" placeholder="Ribuan (Rp)" value={displayCashDetails.ribuan} onChange={(e) => handleCashDetailChange('ribuan', e.target.value)} />
                    <Input type="text" inputMode="decimal" placeholder="Koin (Rp)" value={displayCashDetails.koin} onChange={(e) => handleCashDetailChange('koin', e.target.value)} />
                    <div className="p-2 bg-gray-100 rounded-md text-center">
                        <p className="text-sm">Total Uang Fisik Baru</p>
                        <p className="font-bold text-lg">Rp {totalUangFisik.toLocaleString()}</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Batal</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>Simpan Perubahan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
