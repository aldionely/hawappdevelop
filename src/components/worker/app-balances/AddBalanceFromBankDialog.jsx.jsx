import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast'; // <-- PERBAIKAN DI SINI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

export const AddBalanceFromBankDialog = ({ isOpen, onOpenChange, currentBalances }) => {
  const { appBalanceKeysAndNames, transferFromBankToShift } = useData();
  const { toast } = useToast();

  const [toAppKey, setToAppKey] = useState('');
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setToAppKey('');
      setAmount('');
      setDisplayAmount('');
      setDescription('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const numAmount = parseFormattedNumber(amount);
    
    if (!toAppKey || !numAmount || numAmount <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Harap pilih aplikasi tujuan dan isi jumlah dengan benar.' });
      return;
    }

    setIsSubmitting(true);
    const result = await transferFromBankToShift(toAppKey, numAmount, description);

    if (result.success) {
      toast({ title: 'Berhasil', description: `Saldo berhasil ditambahkan dari BANK HAW.` });
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Gagal', description: result.error?.message || 'Gagal menambah saldo.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Tambah Saldo dari BANK HAW</DialogTitle>
          <DialogDescription>
            Dana akan ditransfer dari kas pusat (BANK HAW) ke aplikasi yang Anda pilih.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Ke Aplikasi</label>
            <Select value={toAppKey} onValueChange={setToAppKey}>
                <SelectTrigger><SelectValue placeholder="Pilih Aplikasi Tujuan" /></SelectTrigger>
                <SelectContent>
                {appBalanceKeysAndNames.map(app => (
                    <SelectItem key={app.key} value={app.key}>
                    {app.name} (Saldo: Rp {(currentBalances[app.key] || 0).toLocaleString()})
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
          </div>
          <Input 
            placeholder="Jumlah (Rp)" 
            type="text"
            inputMode="decimal"
            value={displayAmount} 
            onChange={(e) => {
              setDisplayAmount(formatNumberInput(e.target.value));
              setAmount(e.target.value);
            }} 
          />
          <Textarea 
            placeholder="Keterangan (Opsional)" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Batal</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Konfirmasi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};