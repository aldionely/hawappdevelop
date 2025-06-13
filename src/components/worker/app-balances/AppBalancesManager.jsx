import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { AppBalancesDisplay } from '@/components/worker/AppBalancesDisplay';
import { UpdateBalanceDialog } from './UpdateBalanceDialog';
import { BalanceHistory } from './BalanceHistory';
import { useData } from '@/contexts/DataContext';

export const AppBalancesManager = ({ activeShiftData }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('PENAMBAHAN'); // 'PENAMBAHAN' or 'PENGURANGAN'
  const { products } = useData();
  
  const openDialog = (type) => {
    setDialogType(type);
    setIsDialogOpen(true);
  };
  
  return (
    <div className="space-y-4">
      <div className="p-3 border rounded-lg bg-white">
        <AppBalancesDisplay balances={activeShiftData.app_balances} title="Saldo Aplikasi Saat Ini" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => openDialog('PENAMBAHAN')}>
            <PlusCircle size={16} className="mr-2" /> Tambah Saldo
          </Button>
          <Button variant="outline" size="sm" onClick={() => openDialog('PENGURANGAN')}>
            <MinusCircle size={16} className="mr-2" /> Kurang Saldo
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
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type={dialogType}
        currentBalances={activeShiftData.app_balances}
      />
    </div>
  );
};