import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { EndShiftDialog } from './EndShiftDialog';
import { AppBalancesDisplay } from '@/components/worker/AppBalancesDisplay'; // Import the new component

export const ShiftInProgress = ({ shiftData, onAddTransaction, onEditTransaction, onDeleteTransaction, onEndShift, currentAppBalances }) => {
  const [showEndShiftDialog, setShowEndShiftDialog] = useState(false);
  const expectedBalance = (shiftData.kasAwal || 0) + (shiftData.totalIn || 0) - (shiftData.totalOut || 0);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/*--- GANTI KODE LAMA ANDA DENGAN KODE DI BAWAH INI ---*/}
<div className="p-4 bg-white border rounded-lg shadow-sm">
  {/* Bagian Header */}
  <div className="pb-4 border-b">
    <h2 className="text-lg font-semibold leading-none tracking-tight">Shift Sedang Berjalan</h2>
    <p className="text-sm text-muted-foreground mt-1">
      Lokasi: {shiftData.lokasi} - Mulai Pukul: {new Date(shiftData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </p>
  </div>

  {/* Bagian Konten / Statistik */}
  <div className="grid grid-cols-2 gap-3 pt-4">
    {/* Kotak Statistik: Kas Awal */}
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-600 mb-1">Kas Awal</p>
      <p className="font-bold text-base">Rp {(shiftData.kasAwal || 0).toLocaleString()}</p>
    </div>

    {/* Kotak Statistik: Uang Seharusnya */}
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-600 mb-1">Uang Seharusnya</p>
      <p className="font-bold text-base text-blue-600">Rp {expectedBalance.toLocaleString()}</p>
    </div>

    {/* Kotak Statistik: Uang Masuk */}
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-600 mb-1">Uang Masuk</p>
      <p className="font-bold text-base text-green-600">Rp {(shiftData.totalIn || 0).toLocaleString()}</p>
    </div>

    {/* Kotak Statistik: Uang Keluar */}
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-600 mb-1">Uang Keluar</p>
      <p className="font-bold text-base text-red-600">Rp {(shiftData.totalOut || 0).toLocaleString()}</p>
    </div>

    {/* Kotak Statistik: Uang Transaksi */}
    <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 mb-1">Uang Transaksi</p>
        <p className="font-bold text-base">Rp {((shiftData.totalIn || 0) - (shiftData.totalOut || 0)).toLocaleString()}</p>
    </div>

    {/* Kotak Statistik: Total Admin */}
    <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 mb-1">Total Admin</p>
        <p className="font-bold text-base text-purple-600">Rp {(shiftData.totalAdminFee || 0).toLocaleString()}</p>
    </div>
  </div>
</div>
      <TransactionForm onAddTransaction={onAddTransaction} />
      
      {/* Display current app balances if available */}
      {currentAppBalances && (
        <div className="p-3 border rounded-lg bg-white">
           <AppBalancesDisplay balances={currentAppBalances} title="Saldo Aplikasi Saat Ini" />
        </div>
      )}


      <TransactionList 
        transactions={shiftData.transactions || []}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onDeleteTransaction}
      />
      
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