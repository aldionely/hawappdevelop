import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

export const DepositCashDialog = ({ isOpen, onOpenChange, shift }) => {
    const { adminDepositShiftCash } = useData();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State untuk menyimpan jumlah yang akan disetor
    const [depositDetails, setDepositDetails] = useState({ ratusan: '', puluhan: '', ribuan: '', koin: '' });
    const [displayDepositDetails, setDisplayDepositDetails] = useState({ ratusan: '', puluhan: '', ribuan: '', koin: '' });

    const availableCash = useMemo(() => shift?.physical_cash_details || {}, [shift]);

    useEffect(() => {
        if (shift) {
            // Saat dialog terbuka, isi form dengan jumlah maksimal yang bisa disetor
            const initialNumeric = {
                ratusan: availableCash.ratusan || '',
                puluhan: availableCash.puluhan || '',
                ribuan: availableCash.ribuan || '',
                koin: availableCash.koin || ''
            };
            setDepositDetails(initialNumeric);
            setDisplayDepositDetails({
                ratusan: formatNumberInput(String(initialNumeric.ratusan)),
                puluhan: formatNumberInput(String(initialNumeric.puluhan)),
                ribuan: formatNumberInput(String(initialNumeric.ribuan)),
                koin: formatNumberInput(String(initialNumeric.koin))
            });
        }
    }, [shift, isOpen]);
    
    const handleDepositDetailChange = (field, value) => {
        const numericValue = parseFormattedNumber(value);
        const maxAmount = availableCash[field] || 0;
        
        // Validasi agar tidak melebihi uang yang ada
        if (numericValue > maxAmount) {
            toast({ variant: "destructive", title: "Input Melebihi Batas", description: `Maksimal untuk ${field} adalah Rp ${maxAmount.toLocaleString()}`});
            setDepositDetails(prev => ({ ...prev, [field]: maxAmount }));
            setDisplayDepositDetails(prev => ({ ...prev, [field]: formatNumberInput(String(maxAmount)) }));
        } else {
            setDepositDetails(prev => ({ ...prev, [field]: numericValue }));
            setDisplayDepositDetails(prev => ({ ...prev, [field]: formatNumberInput(value) }));
        }
    };
    
    const totalDeposit = useMemo(() => {
        return Object.values(depositDetails).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }, [depositDetails]);

    const handleSubmit = async () => {
        if (totalDeposit <= 0) {
            toast({ variant: "destructive", title: "Error", description: "Jumlah setoran tidak boleh nol."});
            return;
        }
        setIsSubmitting(true);
        const finalDepositDetails = {
            ratusan: Number(depositDetails.ratusan) || 0,
            puluhan: Number(depositDetails.puluhan) || 0,
            ribuan: Number(depositDetails.ribuan) || 0,
            koin: Number(depositDetails.koin) || 0,
        };

        const result = await adminDepositShiftCash(shift.id, finalDepositDetails);
        if (result.success) {
            toast({ title: "Berhasil", description: "Uang shift telah disetor ke BANK HAW." });
            onOpenChange(false);
        } else {
            toast({ variant: "destructive", title: "Gagal", description: result.error?.message || "Gagal melakukan setoran." });
        }
        setIsSubmitting(false);
    };

    if (!shift) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Setor Uang Fisik ke BANK HAW</DialogTitle>
                    <DialogDescription>
                        Masukkan jumlah uang yang disetor dari shift {shift.workerName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <p className="text-sm font-semibold text-center">Uang Fisik Tersedia</p>
                    <div className="grid grid-cols-2 text-xs p-2 bg-gray-50 rounded-md">
                        <span>Ratusan: Rp {(availableCash.ratusan || 0).toLocaleString()}</span>
                        <span>Puluhan: Rp {(availableCash.puluhan || 0).toLocaleString()}</span>
                        <span>Ribuan: Rp {(availableCash.ribuan || 0).toLocaleString()}</span>
                        <span>Koin: Rp {(availableCash.koin || 0).toLocaleString()}</span>
                    </div>
                    
                    <p className="text-sm font-semibold text-center pt-2">Jumlah yang Disetor</p>
                    <Input type="text" inputMode="decimal" placeholder="Ratusan Ribu (Rp)" value={displayDepositDetails.ratusan} onChange={(e) => handleDepositDetailChange('ratusan', e.target.value)} />
                    <Input type="text" inputMode="decimal" placeholder="Puluhan Ribu (Rp)" value={displayDepositDetails.puluhan} onChange={(e) => handleDepositDetailChange('puluhan', e.target.value)} />
                    <Input type="text" inputMode="decimal" placeholder="Ribuan (Rp)" value={displayDepositDetails.ribuan} onChange={(e) => handleDepositDetailChange('ribuan', e.target.value)} />
                    <Input type="text" inputMode="decimal" placeholder="Koin (Rp)" value={displayDepositDetails.koin} onChange={(e) => handleDepositDetailChange('koin', e.target.value)} />
                    
                    <div className="p-2 bg-blue-100 rounded-md text-center">
                        <p className="text-sm text-blue-800">Total Akan Disetor</p>
                        <p className="font-bold text-lg text-blue-900">Rp {totalDeposit.toLocaleString()}</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Batal</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>Setor Uang</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
