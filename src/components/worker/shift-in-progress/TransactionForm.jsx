import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';

export const TransactionForm = ({ onAddTransaction, editingTransaction, onSaveEdit, onCancelEdit }) => {
  const [currentType, setCurrentType] = useState("in");
  const [amount, setAmount] = useState(""); // Nominal uang masuk/keluar fisik
  const [displayAmount, setDisplayAmount] = useState("");
  
  const [saldoKeluarAplikasi, setSaldoKeluarAplikasi] = useState(""); // Untuk Uang Masuk -> Saldo Aplikasi Keluar
  const [displaySaldoKeluarAplikasi, setDisplaySaldoKeluarAplikasi] = useState("");

  const [saldoMasukAplikasi, setSaldoMasukAplikasi] = useState(""); // Untuk Uang Keluar -> Saldo Aplikasi Masuk
  const [displaySaldoMasukAplikasi, setDisplaySaldoMasukAplikasi] = useState("");

  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const descriptionInputRef = useRef(null);
  const amountInputRef = useRef(null);
  const saldoKeluarAplikasiInputRef = useRef(null);
  const saldoMasukAplikasiInputRef = useRef(null);

  useEffect(() => {
    if (editingTransaction) {
      setCurrentType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setDisplayAmount(formatNumberInput(String(editingTransaction.amount)));
      setDescription(editingTransaction.description);

      if (editingTransaction.type === 'in' && editingTransaction.saldoKeluarAplikasi) {
        setSaldoKeluarAplikasi(String(editingTransaction.saldoKeluarAplikasi));
        setDisplaySaldoKeluarAplikasi(formatNumberInput(String(editingTransaction.saldoKeluarAplikasi)));
      } else {
        setSaldoKeluarAplikasi("");
        setDisplaySaldoKeluarAplikasi("");
      }

      if (editingTransaction.type === 'out' && editingTransaction.saldoMasukAplikasi) {
        setSaldoMasukAplikasi(String(editingTransaction.saldoMasukAplikasi));
        setDisplaySaldoMasukAplikasi(formatNumberInput(String(editingTransaction.saldoMasukAplikasi)));
      } else {
        setSaldoMasukAplikasi("");
        setDisplaySaldoMasukAplikasi("");
      }
      descriptionInputRef.current?.focus();
    } else {
      setAmount("");
      setDisplayAmount("");
      setDescription("");
      setSaldoKeluarAplikasi("");
      setDisplaySaldoKeluarAplikasi("");
      setSaldoMasukAplikasi("");
      setDisplaySaldoMasukAplikasi("");
      descriptionInputRef.current?.focus();
    }
  }, [editingTransaction]);

  const resetFormFields = () => {
    setAmount("");
    setDisplayAmount("");
    setDescription("");
    setSaldoKeluarAplikasi("");
    setDisplaySaldoKeluarAplikasi("");
    setSaldoMasukAplikasi("");
    setDisplaySaldoMasukAplikasi("");
    descriptionInputRef.current?.focus();
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(parseFormattedNumber(value));
    setDisplayAmount(formatNumberInput(value));
  };

  const handleSaldoKeluarAplikasiChange = (e) => {
    const value = e.target.value;
    setSaldoKeluarAplikasi(parseFormattedNumber(value));
    setDisplaySaldoKeluarAplikasi(formatNumberInput(value));
  };

  const handleSaldoMasukAplikasiChange = (e) => {
    const value = e.target.value;
    setSaldoMasukAplikasi(parseFormattedNumber(value));
    setDisplaySaldoMasukAplikasi(formatNumberInput(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (!description.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Masukkan deskripsi transaksi." });
      descriptionInputRef.current?.focus();
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Masukkan jumlah uang fisik yang valid." });
      amountInputRef.current?.focus();
      return;
    }
    
    let numSaldoKeluarAplikasi = null;
    if (currentType === 'in' && saldoKeluarAplikasi) {
      numSaldoKeluarAplikasi = parseFloat(saldoKeluarAplikasi);
      if (isNaN(numSaldoKeluarAplikasi) || numSaldoKeluarAplikasi <= 0) {
        toast({ variant: "destructive", title: "Error", description: "Masukkan Saldo Keluar Aplikasi yang valid jika diisi." });
        saldoKeluarAplikasiInputRef.current?.focus();
        return;
      }
    }

    let numSaldoMasukAplikasi = null;
    if (currentType === 'out' && saldoMasukAplikasi) {
      numSaldoMasukAplikasi = parseFloat(saldoMasukAplikasi);
      if (isNaN(numSaldoMasukAplikasi) || numSaldoMasukAplikasi <= 0) {
        toast({ variant: "destructive", title: "Error", description: "Masukkan Saldo Masuk Aplikasi yang valid jika diisi." });
        saldoMasukAplikasiInputRef.current?.focus();
        return;
      }
    }

    const transactionData = {
      type: currentType,
      amount: numericAmount, // Uang fisik
      description,
      saldoKeluarAplikasi: currentType === 'in' ? numSaldoKeluarAplikasi : null,
      saldoMasukAplikasi: currentType === 'out' ? numSaldoMasukAplikasi : null,
      // adminCalculationAmount is deprecated, replaced by saldoMasukAplikasi for 'out' type admin fee calc
      adminCalculationAmount: currentType === 'out' ? numSaldoMasukAplikasi : null, 
    };

    if (editingTransaction) {
      onSaveEdit({ ...editingTransaction, ...transactionData });
    } else {
      onAddTransaction({ ...transactionData, id: `tx_${Date.now()}`, timestamp: new Date().toISOString() });
    }
    
    resetFormFields(); 
  };
  
  const handleTypeChange = (newType) => {
    setCurrentType(newType);
    // Reset app balance fields when type changes to avoid confusion
    setSaldoKeluarAplikasi("");
    setDisplaySaldoKeluarAplikasi("");
    setSaldoMasukAplikasi("");
    setDisplaySaldoMasukAplikasi("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded-lg bg-white">
      <h3 className="text-sm font-semibold mb-2">{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={() => handleTypeChange("in")}
          variant={currentType === "in" ? "default" : "outline"}
          size="sm"
          className="text-xs"
        >
          Uang Masuk
        </Button>
        <Button
          type="button"
          onClick={() => handleTypeChange("out")}
          variant={currentType === "out" ? "default" : "outline"}
          size="sm"
          className="text-xs"
        >
          Uang Keluar
        </Button>
      </div>
      <Input
        ref={descriptionInputRef}
        type="text"
        placeholder="Deskripsi Transaksi"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="text-xs sm:text-sm"
        required
      />
      {currentType === 'in' && (
        <Input
          ref={saldoKeluarAplikasiInputRef}
          type="text"
          inputMode="decimal"
          placeholder="Saldo Keluar (Opsional)"
          value={displaySaldoKeluarAplikasi}
          onChange={handleSaldoKeluarAplikasiChange}
          className="text-xs sm:text-sm"
        />
      )}
      {currentType === 'out' && (
        <Input
          ref={saldoMasukAplikasiInputRef}
          type="text"
          inputMode="decimal"
          placeholder="Saldo Masuk (Opsional)"
          value={displaySaldoMasukAplikasi}
          onChange={handleSaldoMasukAplikasiChange}
          className="text-xs sm:text-sm"
        />
      )}
      <Input
        ref={amountInputRef}
        type="text"
        inputMode="decimal"
        placeholder={currentType === 'out' ? "Jumlah Uang Keluar" : "Jumlah Uang Masuk"}
        value={displayAmount}
        onChange={handleAmountChange}
        className="text-xs sm:text-sm"
        required
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSubmit(e);
          }
        }}
      />
      <div className="flex space-x-2">
        {editingTransaction && (
          <Button type="button" variant="outline" onClick={onCancelEdit} className="w-full text-xs sm:text-sm" size="sm">
            Batal Edit
          </Button>
        )}
        <Button type="submit" className="w-full text-xs sm:text-sm" size="sm">
          {editingTransaction ? 'Simpan Perubahan' : 'Tambah Transaksi'}
        </Button>
      </div>
    </form>
  );
};