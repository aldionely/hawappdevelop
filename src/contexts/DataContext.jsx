import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { initialAppBalances, appBalanceKeysAndNames as appBalanceDefinitions } from "@/components/worker/StartShiftForm";
import { fetchWorkersAPI, addWorkerAPI, removeWorkerAPI, updateWorkerPasswordAPI } from "@/lib/api/workerService";
import { fetchActiveShiftsAPI, updateActiveShiftAPI, endShiftAPI, fetchShiftArchivesAPI, removeShiftArchiveAPI } from "@/lib/api/shiftService";
import { fetchAdminFeeRulesAPI, addAdminFeeRuleAPI, updateAdminFeeRuleAPI, removeAdminFeeRuleAPI } from "@/lib/api/adminFeeRuleService";
import { fetchProductsAPI, addProductAPI, updateProductAPI, removeProductAPI } from "@/lib/api/productService";
import { fetchVouchersAPI, addVoucherAPI, updateVoucherAPI, deleteVoucherAPI, updateVoucherStockAPI, fetchVoucherLogsAPI } from "@/lib/api/voucherService";
import { fetchAppBalanceLogsAPI, logAppBalanceUpdateAPI } from "@/lib/api/appBalanceService";
import { handleSupabaseError } from "@/lib/errorHandler";
import { transformShiftData, ensureValidAppBalances, parseSafeNumber } from "@/lib/dataTransformation";
import { calculateProductAdminFee, updateAppBalancesFromTransaction } from "@/lib/productAndBalanceHelper";

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [activeShifts, setActiveShifts] = useState([]);
  const [shiftArchives, setShiftArchives] = useState([]);
  const [adminFeeRules, setAdminFeeRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [currentUserAppBalanceLogs, setCurrentUserAppBalanceLogs] = useState([]);

  const getActiveShiftForCurrentUser = useCallback(() => {
    if (user && user.role === 'worker') {
      const currentActiveShift = activeShifts.find(shift => shift.username === user.username);
      return transformShiftData(currentActiveShift);
    }
    return null;
  }, [user, activeShifts]);

  const activeShift = getActiveShiftForCurrentUser();

  const fetchData = useCallback(async (apiCall, setter, errorMessageContext) => {
    try {
      const result = await apiCall();
      if (result.success) {
        if (setter === setActiveShifts || setter === setShiftArchives) {
          setter((result.data || []).map(transformShiftData).filter(s => s !== null));
        } else {
          setter(result.data || []);
        }
      } else {
        handleSupabaseError(result.error, errorMessageContext);
        setter([]);
      }
    } catch (error) {
      handleSupabaseError(error, `Network or unexpected error in ${errorMessageContext}`);
      setter([]);
    }
  }, []);

  const fetchAllInitialData = useCallback(async () => {
    if (!user) {
        setLoadingData(false);
        setWorkers([]);
        setActiveShifts([]);
        setShiftArchives([]);
        setAdminFeeRules([]);
        setProducts([]);
        setVouchers([]);
        return;
    };
    setLoadingData(true);
    await Promise.all([
      fetchData(fetchWorkersAPI, setWorkers, "fetching workers"),
      fetchData(fetchActiveShiftsAPI, setActiveShifts, "fetching active shifts"),
      fetchData(fetchShiftArchivesAPI, setShiftArchives, "fetching shift archives"),
      fetchData(fetchAdminFeeRulesAPI, setAdminFeeRules, "fetching admin fee rules"),
      fetchData(fetchProductsAPI, setProducts, "fetching products"),
      fetchData(fetchVouchersAPI, setVouchers, "fetching vouchers")
    ]);
    setLoadingData(false);
  }, [fetchData, user]);

  useEffect(() => {
    fetchAllInitialData();
  }, [fetchAllInitialData]);

  const fetchCurrentUserAppBalanceLogs = useCallback(async (shiftId) => {
    if (!shiftId) {
      setCurrentUserAppBalanceLogs([]);
      return;
    }
    const result = await fetchAppBalanceLogsAPI(shiftId);
    if (result.success) {
      setCurrentUserAppBalanceLogs(result.data);
    }
  }, []);

  useEffect(() => {
    if (activeShift?.id) {
      fetchCurrentUserAppBalanceLogs(activeShift.id);
    } else {
      setCurrentUserAppBalanceLogs([]);
    }
  }, [activeShift?.id, fetchCurrentUserAppBalanceLogs]);

  useEffect(() => {
    const shiftChannel = supabase.channel('active-shifts-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'active_shifts' }, () => fetchData(fetchActiveShiftsAPI, setActiveShifts, "realtime fetching active shifts")).subscribe();
    const voucherChannel = supabase.channel('vouchers-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, () => fetchData(fetchVouchersAPI, setVouchers, "realtime fetching vouchers")).subscribe();
    
    let appBalanceLogChannel;
    if (activeShift?.id) {
        appBalanceLogChannel = supabase.channel(`app-balance-logs-channel-user-${activeShift.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_balance_logs', filter: `shift_id=eq.${activeShift.id}` }, 
                (payload) => {
                    if (payload.new) {
                        setCurrentUserAppBalanceLogs(prevLogs => [payload.new, ...prevLogs].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
                    } else {
                        fetchCurrentUserAppBalanceLogs(activeShift.id);
                    }
                }
            ).subscribe();
    }
    
    return () => {
      supabase.removeChannel(shiftChannel);
      supabase.removeChannel(voucherChannel);
      if (appBalanceLogChannel) supabase.removeChannel(appBalanceLogChannel);
    };
  }, [fetchData, activeShift?.id, fetchCurrentUserAppBalanceLogs]);

  const recalculateAppBalances = useCallback(async (shiftId, initialBalances, transactions) => {
    const logResult = await fetchAppBalanceLogsAPI(shiftId);
    const manualLogs = logResult.success ? logResult.data : [];

    let recalculatedBalances = ensureValidAppBalances(initialBalances);
    
    const chronologicalManualLogs = manualLogs.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    for (const log of chronologicalManualLogs) {
        const change = log.type === 'PENAMBAHAN' ? log.amount : -log.amount;
        recalculatedBalances[log.app_key] = (recalculatedBalances[log.app_key] || 0) + change;
    }
    
    let balancesAfterManualUpdates = { ...recalculatedBalances };

    for (const tx of transactions) {
        const productDetails = calculateProductAdminFee(tx.description, products);
        balancesAfterManualUpdates = updateAppBalancesFromTransaction(balancesAfterManualUpdates, tx, appBalanceDefinitions, productDetails);
    }
    
    return balancesAfterManualUpdates;
  }, [products]);

  const processTransactionTotals = useCallback((transactions) => {
    let newTotalIn = 0, newTotalOut = 0, newTotalNominalAdminFee = 0, newTotalProductAdminFeeValue = 0;
    transactions.forEach(tx => {
        if (tx.type === 'in') newTotalIn += tx.amount; else newTotalOut += tx.amount;
        newTotalNominalAdminFee += (tx.adminFee || 0);
        newTotalProductAdminFeeValue += (tx.productAdminFee || 0);
    });
    return {
        totalIn: newTotalIn, 
        totalOut: newTotalOut,
        uangTransaksi: newTotalIn - newTotalOut,
        totalAdminFee: newTotalNominalAdminFee + newTotalProductAdminFeeValue,
    };
  }, []);
  
  const addWorker = async (workerData) => {
    const result = await addWorkerAPI(workerData);
    if (result.success) await fetchData(fetchWorkersAPI, setWorkers, "re-fetching workers after add");
    return result;
  };

  const removeWorker = async (workerId) => {
    const workerToRemove = workers.find(w => w.id === workerId);
    if (!workerToRemove) return { success: false, error: "Worker not found" };
    const result = await removeWorkerAPI(workerId, workerToRemove.username);
    if (result.success) {
      await Promise.all([
        fetchData(fetchWorkersAPI, setWorkers, "re-fetching workers after remove"),
        fetchData(fetchActiveShiftsAPI, setActiveShifts, "re-fetching active shifts after worker remove"),
        fetchData(fetchShiftArchivesAPI, setShiftArchives, "re-fetching archives after worker remove")
      ]);
    }
    return result;
  };
  
  const updateWorkerPassword = async (workerId, newPassword) => {
    const result = await updateWorkerPasswordAPI(workerId, newPassword);
    if (result.success) await fetchData(fetchWorkersAPI, setWorkers, "re-fetching workers after password update");
    return result;
  };

  const updateActiveShift = async (shiftData) => {
    const result = await updateActiveShiftAPI(shiftData, ensureValidAppBalances, transformShiftData);
    if (result.success) await fetchData(fetchActiveShiftsAPI, setActiveShifts, "re-fetching active shifts after update");
    return result;
  };

  const endShift = async (shiftData) => {
    const result = await endShiftAPI(shiftData, ensureValidAppBalances, transformShiftData);
    if (result.success) {
      await Promise.all([
        fetchData(fetchActiveShiftsAPI, setActiveShifts, "re-fetching active shifts after end shift"),
        fetchData(fetchShiftArchivesAPI, setShiftArchives, "re-fetching archives after end shift")
      ]);
    }
    return result;
  };

  const removeShiftArchive = async (shiftId) => {
    const result = await removeShiftArchiveAPI(shiftId);
    if (result.success) await fetchData(fetchShiftArchivesAPI, setShiftArchives, "re-fetching archives after remove");
    return result;
  };

  const addAdminFeeRule = async (ruleData) => {
    const result = await addAdminFeeRuleAPI(ruleData);
    if (result.success) await fetchData(fetchAdminFeeRulesAPI, setAdminFeeRules, "re-fetching admin fee rules after add");
    return result;
  };

  const updateAdminFeeRule = async (ruleId, ruleData) => {
    const result = await updateAdminFeeRuleAPI(ruleId, ruleData);
    if (result.success) await fetchData(fetchAdminFeeRulesAPI, setAdminFeeRules, "re-fetching admin fee rules after update");
    return result;
  };

  const removeAdminFeeRule = async (ruleId) => {
    const result = await removeAdminFeeRuleAPI(ruleId);
    if (result.success) await fetchData(fetchAdminFeeRulesAPI, setAdminFeeRules, "re-fetching admin fee rules after remove");
    return result;
  };

  const addProduct = async (productData) => {
    const result = await addProductAPI(productData);
    if (result.success) await fetchData(fetchProductsAPI, setProducts, "re-fetching products after add");
    return result;
  };

  const updateProduct = async (productId, productData) => {
    const result = await updateProductAPI(productId, productData);
    if (result.success) await fetchData(fetchProductsAPI, setProducts, "re-fetching products after update");
    return result;
  };

  const removeProduct = async (productId) => {
    const result = await removeProductAPI(productId);
    if (result.success) await fetchData(fetchProductsAPI, setProducts, "re-fetching products after remove");
    return result;
  };

  const addVoucher = async (voucherData) => {
    const result = await addVoucherAPI(voucherData);
    if (result.success) await fetchData(fetchVouchersAPI, setVouchers, "re-fetching vouchers after add");
    return result;
  };

  const updateVoucher = async (voucherId, voucherData) => {
    const result = await updateVoucherAPI(voucherId, voucherData);
    if (result.success) await fetchData(fetchVouchersAPI, setVouchers, "re-fetching vouchers after update");
    return result;
  };

  const deleteVoucher = async (voucherId) => {
    const result = await deleteVoucherAPI(voucherId);
    if (result.success) await fetchData(fetchVouchersAPI, setVouchers, "re-fetching vouchers after delete");
    return result;
  };

  const updateVoucherStock = async (voucherId, quantityChanged, transactionType, description) => {
  const shiftId = activeShift?.id || null;
  const userIdForLog = user.role === 'admin' ? null : user.id;

  const result = await updateVoucherStockAPI({
    voucherId,
    quantityChanged,
    transactionType,
    description,
    userId: userIdForLog,
    username: user.name,
    shiftId
  });

  if (result.success) {
    await fetchData(fetchVouchersAPI, setVouchers, "re-fetching vouchers after stock update");
  }

  return result;
};

  
  const sellVoucherAndUpdateShift = async (voucher) => {
  if (!activeShift) return { success: false, error: "Tidak ada shift aktif untuk mencatat penjualan." };

  const stockUpdateResult = await updateVoucherStock(voucher.id, -1, 'PENJUALAN', voucher.name);
  if (!stockUpdateResult.success) return { success: false, error: stockUpdateResult.error?.message || "Gagal memperbarui stok voucher." };

  const profit = voucher.sell_price - voucher.cost_price;
  const newTransaction = {
    id: `tx_vcr_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'in',
    amount: voucher.sell_price,
    description: voucher.name,
    adminFee: 0,
    productAdminFee: profit >= 0 ? profit : 0
  };

  const updatedTransactions = [...activeShift.transactions, newTransaction];
  const newTotals = processTransactionTotals(updatedTransactions);
  const newAppBalances = await recalculateAppBalances(
    activeShift.id,
    activeShift.initial_app_balances,
    updatedTransactions
  );

  const updatedShiftDetails = {
    ...activeShift,
    transactions: updatedTransactions,
    ...newTotals,
    app_balances: newAppBalances
  };

  const shiftUpdateResult = await updateActiveShift(updatedShiftDetails);
  if (!shiftUpdateResult.success) {
    return {
      success: false,
      error: "Stok voucher diperbarui, tetapi gagal mencatat transaksi di shift."
    };
  }

  
  await fetchData(fetchVouchersAPI, setVouchers, "refresh setelah penjualan voucher");

  return { success: true };
};


  const updateManualAppBalance = async (appKey, appName, amount, type, description) => {
  if (!activeShift) return { success: false, error: "Tidak ada shift aktif." };

  const previousBalance = parseSafeNumber(activeShift.app_balances[appKey]);
  const numericAmount = parseSafeNumber(amount);
  const changeAmount = type === 'PENAMBAHAN' ? numericAmount : -numericAmount;
  const newBalance = previousBalance + changeAmount;

  const logResult = await logAppBalanceUpdateAPI({
    shift_id: activeShift.id,
    user_id: user.id,
    username: user.name,
    app_key: appKey,
    app_name: appName,
    type,
    amount: numericAmount,
    description,
    previous_balance: previousBalance,
    new_balance: newBalance
  });

  if (!logResult.success) {
    return { success: false, error: "Gagal mencatat log saldo." };
  }

  // ⬇️ Tambahkan baris ini untuk update context secara langsung
  if (logResult.data) {
    setCurrentUserAppBalanceLogs(prev => [logResult.data, ...prev]);
  }

  const newAppBalances = {
    ...activeShift.app_balances,
    [appKey]: newBalance
  };

  const shiftUpdateResult = await updateActiveShift({
    ...activeShift,
    app_balances: newAppBalances
  });

  return shiftUpdateResult;
};


  const value = {
    workers, addWorker, removeWorker, updateWorkerPassword,
    activeShifts, updateActiveShift, endShift, getActiveShiftForCurrentUser,
    shiftArchives, removeShiftArchive,
    adminFeeRules, addAdminFeeRule, updateAdminFeeRule, removeAdminFeeRule,
    products, addProduct, updateProduct, removeProduct,
    vouchers, addVoucher, updateVoucher, deleteVoucher, updateVoucherStock, sellVoucherAndUpdateShift, fetchVoucherLogsAPI,
    loadingData,
    fetchWorkers: () => fetchData(fetchWorkersAPI, setWorkers, "manual fetching workers"),
    fetchActiveShifts: () => fetchData(fetchActiveShiftsAPI, setActiveShifts, "manual fetching active shifts"),
    fetchShiftArchives: () => fetchData(fetchShiftArchivesAPI, setShiftArchives, "manual fetching shift archives"),
    fetchAdminFeeRules: () => fetchData(fetchAdminFeeRulesAPI, setAdminFeeRules, "manual fetching admin fee rules"),
    fetchProducts: () => fetchData(fetchProductsAPI, setProducts, "manual fetching products"),
    fetchVouchers: () => fetchData(fetchVouchersAPI, setVouchers, "manual fetching vouchers"),
    appBalanceKeysAndNames: appBalanceDefinitions, 
    initialAppBalances,
    processTransactionTotals,
    recalculateAppBalances,
    fetchAppBalanceLogsAPI,
    updateManualAppBalance,
    currentUserAppBalanceLogs,
    fetchVouchersAPI,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};