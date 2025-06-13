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
      <div className="p-3 border rounded-lg bg-white">
        <h2 className="text-md sm:text-lg font-semibold mb-2">Shift Sedang Berjalan</h2>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <p>Mulai: {formatTime(shiftData.startTime)}</p>
          <p>Lokasi: {shiftData.lokasi}</p>
          <p>Kas Awal: Rp {(shiftData.kasAwal || 0).toLocaleString()}</p>
          <p>Uang Seharusnya: Rp {expectedBalance.toLocaleString()}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <p className="text-green-600">Uang Masuk: Rp {(shiftData.totalIn || 0).toLocaleString()}</p>
            <p className="text-red-600">Uang Keluar: Rp {(shiftData.totalOut || 0).toLocaleString()}</p>
            <p className={`font-semibold ${(shiftData.uangTransaksi || 0) >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
                Uang Transaksi: Rp {(shiftData.uangTransaksi || 0).toLocaleString()}
            </p>
             <p className="text-purple-600">Total Admin: Rp {(shiftData.totalAdminFee || 0).toLocaleString()}</p>
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