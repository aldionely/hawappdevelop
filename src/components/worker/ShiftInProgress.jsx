import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

const TransactionForm = ({ onAddTransaction }) => {
  const [type, setType] = useState("in");
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const numericValue = parseFormattedNumber(value);
    setAmount(numericValue);
    setDisplayAmount(formatNumberInput(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Masukkan jumlah transaksi yang valid.",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Masukkan deskripsi transaksi.",
      });
      return;
    }
    onAddTransaction({
      id: `tx_${Date.now()}`,
      type,
      amount: numericAmount,
      description,
      timestamp: new Date().toISOString(),
    });
    setAmount("");
    setDisplayAmount("");
    setDescription("");
    
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded-lg bg-white">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={() => setType("in")}
          variant={type === "in" ? "default" : "outline"}
          size="sm"
          className="text-xs"
        >
          Uang Masuk
        </Button>
        <Button
          type="button"
          onClick={() => setType("out")}
          variant={type === "out" ? "default" : "outline"}
          size="sm"
          className="text-xs"
        >
          Uang Keluar
        </Button>
      </div>
      <Input
        type="text"
        inputMode="decimal"
        placeholder="Jumlah (Rp)"
        value={displayAmount}
        onChange={handleAmountChange}
        className="text-xs sm:text-sm"
        required
      />
      <Input
        type="text"
        placeholder="Deskripsi Transaksi"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="text-xs sm:text-sm"
        required
      />
      <Button type="submit" className="w-full text-xs sm:text-sm" size="sm">Tambah Transaksi</Button>
    </form>
  );
};

const EndShiftDialog = ({ isOpen, onOpenChange, onConfirmEndShift, shiftData }) => {
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

  React.useEffect(() => {
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


export const ShiftInProgress = ({ shiftData, onAddTransaction, onEndShift }) => {
  const [showEndShiftDialog, setShowEndShiftDialog] = useState(false);
  const expectedBalance = (shiftData.kasAwal || 0) + (shiftData.totalIn || 0) - (shiftData.totalOut || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="p-3 border rounded-lg bg-white">
        <h2 className="text-md sm:text-lg font-semibold mb-2">Shift Sedang Berjalan</h2>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <p>Mulai: {new Date(shiftData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p>Lokasi: {shiftData.lokasi}</p>
          <p>Kas Awal: Rp {(shiftData.kasAwal || 0).toLocaleString()}</p>
          <p>Uang Seharusnya: Rp {expectedBalance.toLocaleString()}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <p className="text-green-600">Uang Masuk:</p>
            <p> Rp {(shiftData.totalIn || 0).toLocaleString()}</p>
            <p className="text-red-600">Uang Keluar:</p>
            <p> Rp {(shiftData.totalOut || 0).toLocaleString()}</p>
            <p className={`font-semibold ${(shiftData.uangBersih || 0) >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
                Uang Bersih:
            </p>
            <p> Rp {(shiftData.uangBersih || 0).toLocaleString()}</p>
             <p className="text-purple-600">Total Admin:</p>
             <p> Rp {(shiftData.totalAdminFee || 0).toLocaleString()}</p>
        </div>
      </div>

      <TransactionForm onAddTransaction={onAddTransaction} />

      <div className="p-3 border rounded-lg bg-white max-h-60 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-2">Riwayat Transaksi Shift Ini</h3>
        {shiftData.transactions && shiftData.transactions.length === 0 ? (
          <p className="text-xs text-gray-500 text-center">Belum ada transaksi.</p>
        ) : (
          <div className="space-y-1.5">
            {(shiftData.transactions || []).slice().reverse().map((tx) => (
              <div key={tx.id} className="text-xs flex justify-between items-start border-b pb-1 last:border-b-0">
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-gray-500">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {tx.adminFee > 0 && <span className="text-purple-600 ml-1">(Admin: Rp {tx.adminFee.toLocaleString()})</span>}
                  </p>
                </div>
                <p className={`font-semibold ${tx.type === "in" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "in" ? "+" : "-"} Rp {tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Button onClick={() => setShowEndShiftDialog(true)} variant="destructive" className="w-full text-xs sm:text-sm" size="sm">
        Akhiri Shift
      </Button>

      <EndShiftDialog 
        isOpen={showEndShiftDialog}
        onOpenChange={setShowEndShiftDialog}
        onConfirmEndShift={onEndShift}
        shiftData={shiftData}
      />
    </motion.div>
  );
};