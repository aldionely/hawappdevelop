import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { ShiftInProgress } from './ShiftInProgress';
import { calculateAdminFee } from '@/lib/adminFeeHelper';
import { calculateProductAdminFee } from '@/lib/productAndBalanceHelper';

export const ShiftInProgressManager = ({ initialShiftData, onShiftEnded }) => {
  const { user } = useAuth();
  const { 
    updateActiveShift, 
    endShift, 
    adminFeeRules, 
    products, 
    vouchers, 
    initialAppBalances, 
    processTransactionTotals,
    recalculateAppBalances,
  } = useData();
  const { toast } = useToast();
  const [shiftData, setShiftData] = useState(initialShiftData);

  useEffect(() => {
    setShiftData(initialShiftData);
  }, [initialShiftData]);

  const handleTransactionChange = async (updatedTransactions) => {
    const newTotals = processTransactionTotals(updatedTransactions);
    const newAppBalances = await recalculateAppBalances(shiftData.id, shiftData.initial_app_balances, updatedTransactions);
    
    const updatedShiftDetails = {
      ...shiftData,
      transactions: updatedTransactions,
      ...newTotals,
      app_balances: newAppBalances
    };
    
    const result = await updateActiveShift(updatedShiftDetails);
    
    if (result.success && result.data) {
      localStorage.setItem(`shift_inprogress_${user.username}`, JSON.stringify(result.data));
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan perubahan",
        description: result.error?.message || "Terjadi kesalahan saat memperbarui shift.",
      });
      return false;
    }
  };

  const handleAddTransaction = async (transaction) => {
    const nominalAdminFee = calculateAdminFee(
      transaction.amount, 
      transaction.description, 
      adminFeeRules,
      transaction.type,
      transaction.saldoMasukAplikasi 
    );
    const productFeeDetails = calculateProductAdminFee(transaction, products);
    const transactionWithFees = { 
      ...transaction, 
      adminFee: nominalAdminFee || 0, 
      productAdminFee: productFeeDetails.fee || 0, 
      relatedAppKey: productFeeDetails.relatedAppKey, 
      productCostPrice: productFeeDetails.costPrice 
    };

    const updatedTransactions = [...shiftData.transactions, transactionWithFees];
    const success = await handleTransactionChange(updatedTransactions);
    if(success) {
      toast({
        title: "Transaksi Ditambahkan",
        description: `Rp ${transaction.amount.toLocaleString()} telah dicatat.`,
      });
    }
  };

  const handleEditTransaction = async (editedTransaction) => {
    const nominalAdminFee = calculateAdminFee(
      editedTransaction.amount, 
      editedTransaction.description, 
      adminFeeRules,
      editedTransaction.type,
      editedTransaction.saldoMasukAplikasi
    );
    const productFeeDetails = calculateProductAdminFee(editedTransaction, products);
    const transactionWithFees = { 
        ...editedTransaction, 
        adminFee: nominalAdminFee || 0,
        productAdminFee: productFeeDetails.fee || 0,
        relatedAppKey: productFeeDetails.relatedAppKey,
        productCostPrice: productFeeDetails.costPrice
    };
    
    const updatedTransactions = shiftData.transactions.map(tx => 
      tx.id === transactionWithFees.id ? transactionWithFees : tx
    );
    const success = await handleTransactionChange(updatedTransactions);
    if (success) {
      toast({
        title: "Transaksi Diperbarui",
        description: `Transaksi ${editedTransaction.description} telah diperbarui.`,
      });
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    const updatedTransactions = shiftData.transactions.filter(tx => tx.id !== transactionId);
    const success = await handleTransactionChange(updatedTransactions);
    if (success) {
      toast({ title: "Transaksi Dihapus" });
    }
  };

  const handleEndShiftLogic = async (actualKasAkhir, notes, uangMakan, finalAdminFee, physicalCashDetails) => {
    let finalTransactions = [...shiftData.transactions];

    if (uangMakan > 0) {
      finalTransactions.push({
        id: `tx_um_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'out',
        amount: uangMakan,
        description: 'Uang Makan',
        adminFee: 0,
        productAdminFee: 0,
      });
    }

    const newTotals = processTransactionTotals(finalTransactions);
    const expectedBalance = (shiftData.kasAwal || 0) + (newTotals.totalIn || 0) - (newTotals.totalOut || 0);
    const selisih = parseFloat(actualKasAkhir) - expectedBalance;

    const locationVouchers = vouchers.filter(v => v.location === shiftData.lokasi);
    const finalVoucherStock = locationVouchers.reduce((acc, v) => {
      acc[v.id] = v.current_stock;
      return acc;
    }, {});

    const finalShiftData = {
      ...shiftData,
      ...newTotals,
      transactions: finalTransactions, 
      endTime: new Date().toISOString(),
      kasAkhir: parseFloat(actualKasAkhir),
      expectedBalance,
      selisih,
      notes: notes || "",
      uang_makan: uangMakan,
      final_admin_fee: finalAdminFee,
      app_balances: shiftData.app_balances,
      initial_app_balances: shiftData.initial_app_balances,
      initial_voucher_stock: shiftData.initial_voucher_stock || {},
      final_voucher_stock: finalVoucherStock,
      physical_cash_details: physicalCashDetails
    };

    const result = await endShift(finalShiftData);
    if(result.success && result.data) {
      localStorage.removeItem(`shift_inprogress_${user.username}`);
      onShiftEnded(result.data); 
      toast({
        title: "Shift selesai",
        description: "Data shift telah disimpan. Lihat ringkasan laporan.",
      });
    } else {
       toast({
        variant: "destructive",
        title: "Gagal mengakhiri shift",
        description: result.error?.message || "Terjadi kesalahan saat menyimpan data akhir shift.",
      });
    }
  };
  
  if (!shiftData) return <div className="flex justify-center items-center h-32"><p>Memuat data shift...</p></div>;

  return (
    <ShiftInProgress
      shiftData={shiftData}
      onAddTransaction={handleAddTransaction}
      onEditTransaction={handleEditTransaction}
      onDeleteTransaction={handleDeleteTransaction}
      onEndShift={handleEndShiftLogic}
      currentAppBalances={shiftData.app_balances || initialAppBalances}
    />
  );
};