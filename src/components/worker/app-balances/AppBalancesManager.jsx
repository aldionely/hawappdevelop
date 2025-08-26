import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, Shuffle } from 'lucide-react';
import { AppBalancesDisplay } from '@/components/worker/AppBalancesDisplay';
import { UpdateBalanceDialog } from './UpdateBalanceDialog';
import { TransferBalanceDialog } from './TransferBalanceDialog';
// --- PERBAIKAN: Tambahkan ekstensi .jsx pada import ---
import { AddBalanceFromBankDialog } from './AddBalanceFromBankDialog.jsx'; 
import { BalanceHistory } from './BalanceHistory';
import { useData } from '@/contexts/DataContext';

export const AppBalancesManager = ({ activeShiftData }) => {
  // --- State dialog dipisah ---
  const [isAddFromBankDialogOpen, setIsAddFromBankDialogOpen] = useState(false);
  const [isReduceDialogOpen, setIsReduceDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  
  const { products } = useData();

  const { totalInitialBalance, totalCurrentBalance } = useMemo(() => {
    const initial = activeShiftData.initial_app_balances || {};
    const current = activeShiftData.app_balances || {};

    const totalInitial = Object.values(initial).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const totalCurrent = Object.values(current).reduce((sum, val) => sum + (Number(val) || 0), 0);

    return { totalInitialBalance: totalInitial, totalCurrentBalance: totalCurrent };
  }, [activeShiftData.initial_app_balances, activeShiftData.app_balances]);

  return (
    <div className="space-y-4">
      <div className="p-3 border rounded-lg bg-white">
        
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 font-medium">Total Saldo Awal</p>
                <p className="font-bold text-base text-blue-900">
                    Rp {totalInitialBalance.toLocaleString()}
                </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800 font-medium">Total Saldo Saat Ini</p>
                <p className="font-bold text-base text-green-900">
                    Rp {totalCurrentBalance.toLocaleString()}
                </p>
            </div>
        </div>

        <AppBalancesDisplay balances={activeShiftData.app_balances} title="Saldo Aplikasi Saat Ini" />
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          {/* Tombol "Tambah" sekarang membuka dialog baru */}
          <Button variant="outline" size="sm" onClick={() => setIsAddFromBankDialogOpen(true)}>
            <PlusCircle size={16} className="mr-2" /> Tambah
          </Button>
          <Button variant="outline" size="xs" onClick={() => setIsTransferDialogOpen(true)}>
            <Shuffle size={16} className="mr-2" /> Oper Saldo
          </Button>
          {/* Tombol "Kurang" sekarang punya state sendiri */}
          <Button variant="outline" size="sm" onClick={() => setIsReduceDialogOpen(true)}>
            <MinusCircle size={16} className="mr-2" /> Kurang
          </Button>
        </div>
      </div>
      
      <div className="p-3 border rounded-lg bg-white">
        <BalanceHistory 
          transactions={activeShiftData.transactions}
          products={products}
        />
      </div>

      {/* Render dialog untuk tambah saldo dari BANK HAW */}
      <AddBalanceFromBankDialog
        isOpen={isAddFromBankDialogOpen}
        onOpenChange={setIsAddFromBankDialogOpen}
        currentBalances={activeShiftData.app_balances}
      />

      {/* Dialog untuk mengurangi saldo (sebelumnya UpdateBalanceDialog) */}
      <UpdateBalanceDialog
        isOpen={isReduceDialogOpen}
        onOpenChange={setIsReduceDialogOpen}
        type="PENGURANGAN"
        currentBalances={activeShiftData.app_balances}
      />

      <TransferBalanceDialog
        isOpen={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        currentBalances={activeShiftData.app_balances}
      />
    </div>
  );
};