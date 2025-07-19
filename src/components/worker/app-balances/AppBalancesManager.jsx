// src/components/worker/app-balances/AppBalancesManager.jsx

import React, { useState, useMemo } from 'react'; // 1. Impor useMemo
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, Shuffle } from 'lucide-react';
import { AppBalancesDisplay } from '@/components/worker/AppBalancesDisplay';
import { UpdateBalanceDialog } from './UpdateBalanceDialog';
import { TransferBalanceDialog } from './TransferBalanceDialog';
import { BalanceHistory } from './BalanceHistory';
import { useData } from '@/contexts/DataContext';

export const AppBalancesManager = ({ activeShiftData }) => {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('PENAMBAHAN');
  const { products } = useData();

  // 2. Hitung total saldo awal dan saat ini menggunakan useMemo
  const { totalInitialBalance, totalCurrentBalance } = useMemo(() => {
    const initial = activeShiftData.initial_app_balances || {};
    const current = activeShiftData.app_balances || {};

    const totalInitial = Object.values(initial).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const totalCurrent = Object.values(current).reduce((sum, val) => sum + (Number(val) || 0), 0);

    return { totalInitialBalance: totalInitial, totalCurrentBalance: totalCurrent };
  }, [activeShiftData.initial_app_balances, activeShiftData.app_balances]);

  const openUpdateDialog = (type) => {
    setDialogType(type);
    setIsUpdateDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 border rounded-lg bg-white">
        
        {/* 3. Tampilkan statistik total saldo di sini */}
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
          <Button variant="outline" size="sm" onClick={() => openUpdateDialog('PENAMBAHAN')}>
            <PlusCircle size={16} className="mr-2" /> Tambah
          </Button>
          <Button variant="outline" size="xs" onClick={() => setIsTransferDialogOpen(true)}>
            <Shuffle size={16} className="mr-2" /> Pindah Saldo
          </Button>
          <Button variant="outline" size="sm" onClick={() => openUpdateDialog('PENGURANGAN')}>
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

      <UpdateBalanceDialog
        isOpen={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        type={dialogType}
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