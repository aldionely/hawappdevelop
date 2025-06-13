import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

export const UpdateBalanceDialog = ({ isOpen, onOpenChange, type, currentBalances }) => {
  const { appBalanceKeysAndNames, updateManualAppBalance } = useData();
  const { toast } = useToast();

  const [appKey, setAppKey] = useState('');
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAppKey('');
      setAmount('');
      setDisplayAmount('');
      setDescription('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const numAmount = parseFormattedNumber(amount);
    
    if (!appKey || !numAmount || numAmount <= 0 || !description.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Semua field harus diisi dengan benar.' });
      return;
    }
    
    setIsSubmitting(true);
    const appName = appBalanceKeysAndNames.find(app => app.key === appKey)?.name || appKey;

    const result = await updateManualAppBalance(appKey, appName, numAmount, type, description);

    if (result.success) {
      toast({ title: 'Berhasil', description: `Saldo ${appName} berhasil diperbarui.` });
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Gagal', description: result.error || 'Gagal memperbarui saldo.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{type === 'PENAMBAHAN' ? 'Tambah' : 'Kurangi'} Saldo Aplikasi</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Select value={appKey} onValueChange={setAppKey}>
            <SelectTrigger><SelectValue placeholder="Pilih Aplikasi" /></SelectTrigger>
            <SelectContent>
              {appBalanceKeysAndNames.map(app => (
                <SelectItem key={app.key} value={app.key}>
                  {app.name} (Saldo: Rp {(currentBalances[app.key] || 0).toLocaleString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            placeholder="Deskripsi (contoh: Setor tunai, Tarik tunai)" 
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