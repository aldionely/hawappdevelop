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
  const [uangMakan, setUangMakan] = useState("");
  const [displayUangMakan, setDisplayUangMakan] = useState("");
  const { toast } = useToast();

  const baseExpectedBalance = (shiftData.kasAwal || 0) + (shiftData.totalIn || 0) - (shiftData.totalOut || 0);
  const numericUangMakan = parseFloat(parseFormattedNumber(uangMakan)) || 0;
  const finalExpectedBalance = baseExpectedBalance - numericUangMakan;
  const selisih = parseFormattedNumber(displayActualKasAkhir) - finalExpectedBalance;

  const totalAdminFee = shiftData.totalAdminFee || 0;
  const finalAdminFee = totalAdminFee - numericUangMakan;

  const handleKasAkhirChange = (e) => {
    const value = e.target.value;
    setActualKasAkhir(parseFormattedNumber(value));
    setDisplayActualKasAkhir(formatNumberInput(value));
  };
  
  const handleUangMakanChange = (e) => {
    const value = e.target.value;
    setUangMakan(parseFormattedNumber(value));
    setDisplayUangMakan(formatNumberInput(value));
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
    onConfirmEndShift(numericKasAkhir, notes, numericUangMakan, finalAdminFee);
    onOpenChange(false); 
  };

  useEffect(() => {
    if (isOpen) {
        setActualKasAkhir("");
        setDisplayActualKasAkhir("");
        setNotes(shiftData.notes || "");
        setUangMakan("");
        setDisplayUangMakan("");
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
          
          {/* --- BAGIAN ATAS --- */}
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Uang Harian"
            value={displayUangMakan}
            onChange={handleUangMakanChange}
            className="text-xs sm:text-sm"
          />

          {/* --- BAGIAN TENGAH --- */}
          <div className="p-2 bg-gray-100 rounded-md text-xs">
            <p>Total Uang Seharusnya di Tangan: Rp {finalExpectedBalance.toLocaleString()}</p>
          </div>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Uang Aktual"
            value={displayActualKasAkhir}
            onChange={handleKasAkhirChange}
            className="text-xs sm:text-sm"
            required
          />
          {displayActualKasAkhir && !isNaN(selisih) && (
            <div className={`p-2 rounded-md text-xs ${selisih === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              Selisih Kas: Rp {Math.abs(selisih).toLocaleString()} {selisih === 0 ? '(Sesuai)' : selisih > 0 ? '(Lebih)' : '(Kurang)'}
            </div>
          )}
          <Textarea
            placeholder="Catatan akhir shift (opsional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs sm:text-sm"
          />
          
          {/* --- BAGIAN PALING BAWAH --- */}
          <div className="space-y-2 pt-3 mt-3 border-t">
            <h4 className="text-sm font-semibold text-center">Rincian Admin</h4>
            <div className="flex justify-between items-center text-xs">
              <span>Total Admin dari Transaksi:</span>
              <span className="font-medium">Rp {totalAdminFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>Potong Uang Harian:</span>
              <span className="font-medium text-red-600">- Rp {numericUangMakan.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
              <span className="font-bold text-sm text-blue-800">Total Final Admin:</span>
              <span className="font-bold text-lg text-blue-800">Rp {finalAdminFee.toLocaleString()}</span>
            </div>
          </div>
          
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