import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export const EndShiftDialog = ({ isOpen, onOpenChange, onConfirmEndShift, shiftData }) => {
  const [actualKasAkhir, setActualKasAkhir] = useState("");
  const [displayActualKasAkhir, setDisplayActualKasAkhir] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const expectedBalance = (shiftData.kasAwal || 0) + (shiftData.totalIn || 0) - (shiftData.totalOut || 0);
  const selisih = parseFormattedNumber(displayActualKasAkhir) - expectedBalance;

  const handleKasAkhirChange = (e) => {
    const value = e.target.value;
    const numericValue = parseFormattedNumber(value);
    setActualKasAkhir(numericValue);
    setDisplayActualKasAkhir(formatNumberInput(value));
  };

  const handleConfirm = () => {
    const numericKasAkhir = parseFloat(actualKasAkhir);
    if (isNaN(numericKasAkhir) || numericKasAkhir < 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Masukkan kas akhir aktual yang valid.",
      });
      return;
    }
    onConfirmEndShift(numericKasAkhir, notes);
    onOpenChange(false); 
    setActualKasAkhir("");
    setDisplayActualKasAkhir("");
    setNotes("");
  };

  useEffect(() => {
    if (isOpen) {
        setActualKasAkhir("");
        setDisplayActualKasAkhir("");
        setNotes(shiftData.notes || "");
    }
  }, [isOpen, shiftData.notes]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Akhiri Shift</DialogTitle>
          <DialogDescription>
            Pastikan semua transaksi sudah dicatat sebelum mengakhiri shift.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="p-2 bg-gray-100 rounded-md text-xs">
            <p>Total Uang Seharusnya: Rp {expectedBalance.toLocaleString()}</p>
          </div>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Uang Aktual di Tangan (Rp)"
            value={displayActualKasAkhir}
            onChange={handleKasAkhirChange}
            className="text-xs sm:text-sm"
            required
          />
          {displayActualKasAkhir && !isNaN(selisih) && (
            <div className={`p-2 rounded-md text-xs ${selisih === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              Selisih: Rp {Math.abs(selisih).toLocaleString()} {selisih === 0 ? '(Sesuai)' : selisih > 0 ? '(Lebih)' : '(Kurang)'}
            </div>
          )}
          <Textarea
            placeholder="Catatan akhir shift (opsional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs sm:text-sm"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Batal</Button>
          </DialogClose>
          <Button onClick={handleConfirm} size="sm">Konfirmasi & Akhiri Shift</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};