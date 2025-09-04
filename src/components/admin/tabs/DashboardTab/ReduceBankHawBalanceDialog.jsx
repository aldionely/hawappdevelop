import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

export const ReduceBankHawBalanceDialog = ({ isOpen, onOpenChange }) => {
  const { adminReduceFromBankHaw } = useData();
  const { toast } = useToast();

  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDisplayAmount('');
      setDescription('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const numAmount = parseFormattedNumber(amount);
    
    if (!numAmount || numAmount <= 0 || !description.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Jumlah dan deskripsi/alasan harus diisi.' });
      return;
    }
    
    setIsSubmitting(true);
    const result = await adminReduceFromBankHaw(numAmount, description);

    if (result.success) {
      toast({ title: 'Berhasil', description: `Saldo BANK HAW berhasil dikurangi.` });
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Gagal', description: result.error?.message || 'Gagal memperbarui saldo.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kurangi Saldo BANK HAW</DialogTitle>
          <DialogDescription>
            Dana akan ditarik secara manual dari saldo pusat. Pastikan Anda memiliki alasan yang jelas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input 
            placeholder="Jumlah Pengurangan (Rp)" 
            type="text"
            inputMode="decimal"
            value={displayAmount} 
            onChange={(e) => {
              setDisplayAmount(formatNumberInput(e.target.value));
              setAmount(e.target.value);
            }} 
          />
          <Textarea 
            placeholder="Deskripsi / Alasan Pengurangan (Wajib)" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Batal</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting} variant="destructive">
            {isSubmitting ? 'Memproses...' : 'Konfirmasi Pengurangan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};