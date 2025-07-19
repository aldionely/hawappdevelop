// src/components/worker/app-balances/TransferBalanceDialog.jsx

import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

export const TransferBalanceDialog = ({ isOpen, onOpenChange, currentBalances }) => {
  const { appBalanceKeysAndNames, transferAppBalance } = useData();
  const { toast } = useToast();

  const [fromAppKey, setFromAppKey] = useState('');
  const [toAppKey, setToAppKey] = useState('');
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFromAppKey('');
      setToAppKey('');
      setAmount('');
      setDisplayAmount('');
      setDescription('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const numAmount = parseFormattedNumber(amount);
    
    if (!fromAppKey || !toAppKey || !numAmount || numAmount <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Harap isi semua field dengan benar.' });
      return;
    }
    
    if (fromAppKey === toAppKey) {
        toast({ variant: 'destructive', title: 'Error', description: 'Aplikasi asal dan tujuan tidak boleh sama.' });
        return;
    }

    if ((currentBalances[fromAppKey] || 0) < numAmount) {
        toast({ variant: 'destructive', title: 'Error', description: 'Saldo aplikasi asal tidak mencukupi.' });
        return;
    }

    setIsSubmitting(true);
    const result = await transferAppBalance(fromAppKey, toAppKey, numAmount, description);

    if (result.success) {
      toast({ title: 'Berhasil', description: `Saldo berhasil dioper.` });
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Gagal', description: result.error || 'Gagal mengoper saldo.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Oper Saldo Aplikasi</DialogTitle>
          <DialogDescription>
            pilih aplikasi di bawah untuk di pindahkan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Dari Aplikasi</label>
            <Select value={fromAppKey} onValueChange={setFromAppKey}>
                <SelectTrigger><SelectValue placeholder="Pilih Aplikasi" /></SelectTrigger>
                <SelectContent>
                {appBalanceKeysAndNames.map(app => (
                    <SelectItem key={app.key} value={app.key}>
                    {app.name} (Saldo: Rp {(currentBalances[app.key] || 0).toLocaleString()})
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
          </div>
           <div>
            <label className="text-sm font-medium">Ke Aplikasi</label>
            <Select value={toAppKey} onValueChange={setToAppKey}>
                <SelectTrigger><SelectValue placeholder="Pilih Aplikasi" /></SelectTrigger>
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
            placeholder="Keterangan" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Batal</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Konfirmasi Oper'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};