// FILE: src/contexts/DataContext.jsx (PERBAIKAN FINAL LENGKAP)

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { initialAppBalances, appBalanceKeysAndNames as appBalanceDefinitions } from "@/lib/shiftConstants";
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

    // --- FUNGSI-FUNGSI INTI YANG DISTABILKAN DENGAN useCallback ---

    const fetchData = useCallback(async (apiCall, setter, errorMessageContext) => {
        try {
            const result = await apiCall();
            if (result.success) {
                if (setter === setActiveShifts || setter === setShiftArchives) {
                    setter((result.data || []).map(transformShiftData));
                } else {
                    setter(result.data || []);
                }
            } else { handleSupabaseError(result.error, errorMessageContext); }
        } catch (error) { handleSupabaseError(error, `Network or unexpected error in ${errorMessageContext}`); }
    }, []);

    const fetchWorkers = useCallback(() => fetchData(fetchWorkersAPI, setWorkers, "fetching workers"), [fetchData]);
    const fetchActiveShifts = useCallback(() => fetchData(fetchActiveShiftsAPI, setActiveShifts, "fetching active shifts"), [fetchData]);
    const fetchShiftArchives = useCallback(() => fetchData(fetchShiftArchivesAPI, setShiftArchives, "fetching shift archives"), [fetchData]);
    const fetchAdminFeeRules = useCallback(() => fetchData(fetchAdminFeeRulesAPI, setAdminFeeRules, "fetching admin fee rules"), [fetchData]);
    const fetchProducts = useCallback(() => fetchData(fetchProductsAPI, setProducts, "fetching products"), [fetchData]);
    const fetchVouchers = useCallback(() => fetchData(fetchVouchersAPI, setVouchers, "fetching vouchers"), [fetchData]);

    const fetchAllInitialData = useCallback(async () => {
        if (!user) { setLoadingData(false); return; }
        setLoadingData(true);
        await Promise.all([
            fetchWorkers(), fetchActiveShifts(), fetchShiftArchives(),
            fetchAdminFeeRules(), fetchProducts(), fetchVouchers()
        ]);
        setLoadingData(false);
    }, [user, fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers]);

    useEffect(() => { fetchAllInitialData(); }, [fetchAllInitialData]);

    // --- LISTENER REAL-TIME YANG EFISIEN ---
    useEffect(() => {
    if (!user) return; // Jangan subscribe jika belum login

    console.log("Setting up real-time listeners...");

    const channels = [
        supabase.channel('public:active_shifts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_shifts' }, (payload) => {
                console.log('REAL-TIME: Perubahan terdeteksi di active_shifts!', payload);
                fetchActiveShifts();
            })
            .subscribe((status) => {
                console.log('Status langganan active_shifts:', status);
            }),

        supabase.channel('public:shift_archives')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_archives' }, (payload) => {
                console.log('REAL-TIME: Perubahan terdeteksi di shift_archives!', payload);
                fetchShiftArchives();
            })
            .subscribe((status) => {
                console.log('Status langganan shift_archives:', status);
            }),
            
        supabase.channel('public:vouchers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, (payload) => {
                console.log('REAL-TIME: Perubahan terdeteksi di vouchers!', payload);
                fetchVouchers();
            })
            .subscribe((status) => {
                console.log('Status langganan vouchers:', status);
            })
    ];

    return () => {
        console.log("Removing real-time listeners.");
        channels.forEach(channel => supabase.removeChannel(channel));
    };
}, [user, fetchActiveShifts, fetchShiftArchives, fetchVouchers]);


    // --- EKSPOR SEMUA STATE DAN FUNGSI MELALUI useMemo AGAR STABIL ---
    const value = useMemo(() => {
        // Fungsi-fungsi ini didefinisikan di dalam useMemo agar bisa mengakses state terbaru seperti `activeShifts` dan `products`
        const getActiveShiftForCurrentUser = () => {
            if (user && user.role === 'worker') {
                return activeShifts.find(shift => shift.username === user.username) || null;
            }
            return null;
        };
        const activeShift = getActiveShiftForCurrentUser();

        const processTransactionTotals = (transactions) => { /* ... (logika dari file Anda) ... */ 
            let newTotalIn = 0, newTotalOut = 0, newTotalNominalAdminFee = 0, newTotalProductAdminFeeValue = 0;
            (transactions || []).forEach(tx => {
                if (tx.type === 'in') newTotalIn += tx.amount; else newTotalOut += tx.amount;
                newTotalNominalAdminFee += (tx.adminFee || 0);
                newTotalProductAdminFeeValue += (tx.productAdminFee || 0);
            });
            return {
                totalIn: newTotalIn, totalOut: newTotalOut,
                uangTransaksi: newTotalIn - newTotalOut,
                totalAdminFee: newTotalNominalAdminFee + newTotalProductAdminFeeValue,
            };
        };

        const recalculateAppBalances = async (shiftId, initialBalances, transactions) => { /* ... (logika dari file Anda) ... */ 
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
        };
        
        const updateActiveShift = async (shiftData) => { /* ... (logika dari file Anda) ... */
            const result = await updateActiveShiftAPI(shiftData, ensureValidAppBalances, transformShiftData);
            if (result.success) await fetchActiveShifts();
            return result;
         };
        
        const updateVoucherStock = async (voucherId, quantityChanged, transactionType, description) => {
            // Periksa apakah user adalah admin berdasarkan ID statisnya.
            // Jika ya, gunakan null sebagai userId karena "admin_user" bukan UUID yang valid.
            const isSpecialAdmin = user?.id === 'admin_user';

            const result = await updateVoucherStockAPI({
                voucherId,
                quantityChanged,
                transactionType,
                description,
                userId: isSpecialAdmin ? null : user?.id, // <-- PERUBAHAN DI SINI
                username: user?.name,
                shiftId: activeShift?.id // Ini akan otomatis undefined/null untuk admin
            });
            if (result.success) await fetchVouchers();
            return result;
        };


        const sellVoucherAndUpdateShift = async (voucher) => { /* ... (logika dari file Anda) ... */ 
            if (!activeShift) return { success: false, error: "Tidak ada shift aktif." };
            const stockResult = await updateVoucherStock(voucher.id, -1, 'PENJUALAN', `Penjualan ${voucher.name}`);
            if (!stockResult.success) return stockResult;
            const profit = voucher.sell_price - voucher.cost_price;
            const newTransaction = {
                id: `tx_vcr_${Date.now()}`, timestamp: new Date().toISOString(), type: 'in',
                amount: voucher.sell_price, description: voucher.name,
                adminFee: 0, productAdminFee: profit >= 0 ? profit : 0
            };
            const updatedTransactions = [...activeShift.transactions, newTransaction];
            const newTotals = processTransactionTotals(updatedTransactions);
            const newAppBalances = await recalculateAppBalances(activeShift.id, activeShift.initial_app_balances, updatedTransactions);
            const updatedShiftDetails = { ...activeShift, ...newTotals, transactions: updatedTransactions, app_balances: newAppBalances };
            return await updateActiveShift(updatedShiftDetails);
        };
        
        // Objek yang diekspor ke seluruh aplikasi
        return {
            workers, activeShifts, shiftArchives, adminFeeRules, products, vouchers,
            loadingData, activeShift, currentUserAppBalanceLogs,
            appBalanceKeysAndNames: appBalanceDefinitions,
            initialAppBalances,
            
            // --- MEMASTIKAN SEMUA FUNGSI ADA DI SINI ---
            getActiveShiftForCurrentUser,
            processTransactionTotals,
            recalculateAppBalances,
            updateActiveShift,
            sellVoucherAndUpdateShift,
            updateVoucherStock, // Fungsi yang error karena sebelumnya tidak ada
            fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchVoucherLogsAPI,

            addWorker: async (data) => { const res = await addWorkerAPI(data); if (res.success) fetchWorkers(); return res; },
            removeWorker: async (id) => { const res = await removeWorkerAPI(id); if (res.success) fetchAllInitialData(); return res; },
            updateWorkerPassword: async (id, pw) => { const res = await updateWorkerPasswordAPI(id, pw); if (res.success) fetchWorkers(); return res; },
            endShift: async (data) => { const res = await endShiftAPI(data, ensureValidAppBalances, transformShiftData); if(res.success) {fetchActiveShifts(); fetchShiftArchives();} return res; },
            removeShiftArchive: async (id) => { const res = await removeShiftArchiveAPI(id); if(res.success) fetchShiftArchives(); return res; },
            addAdminFeeRule: async (data) => { const res = await addAdminFeeRuleAPI(data); if(res.success) fetchAdminFeeRules(); return res; },
            updateAdminFeeRule: async (id, data) => { const res = await updateAdminFeeRuleAPI(id, data); if(res.success) fetchAdminFeeRules(); return res; },
            removeAdminFeeRule: async (id) => { const res = await removeAdminFeeRuleAPI(id); if(res.success) fetchAdminFeeRules(); return res; },
            addProduct: async (data) => { const res = await addProductAPI(data); if(res.success) fetchProducts(); return res; },
            updateProduct: async (id, data) => { const res = await updateProductAPI(id, data); if(res.success) fetchProducts(); return res; },
            removeProduct: async (id) => { const res = await removeProductAPI(id); if(res.success) fetchProducts(); return res; },
            addVoucher: async (data) => { const res = await addVoucherAPI(data); if(res.success) fetchVouchers(); return res; },
            updateVoucher: async (id, data) => { const res = await updateVoucherAPI(id, data); if(res.success) fetchVouchers(); return res; },
            deleteVoucher: async (id) => { const res = await deleteVoucherAPI(id); if(res.success) fetchVouchers(); return res; },
            updateManualAppBalance: async (appKey, appName, amount, type, description) => {
                if (!activeShift) return { success: false, error: "Tidak ada shift aktif." };
                const previousBalance = parseSafeNumber(activeShift.app_balances[appKey]);
                const numericAmount = parseSafeNumber(amount);
                const changeAmount = type === 'PENAMBAHAN' ? numericAmount : -numericAmount;
                const newBalance = previousBalance + changeAmount;
                const logResult = await logAppBalanceUpdateAPI({
                  shift_id: activeShift.id, user_id: user.id, username: user.name,
                  app_key: appKey, app_name: appName, type, amount: numericAmount, description,
                  previous_balance: previousBalance, new_balance: newBalance
                });
                if (!logResult.success) return { success: false, error: "Gagal mencatat log saldo." };
                const newAppBalances = { ...activeShift.app_balances, [appKey]: newBalance };
                return await updateActiveShift({ ...activeShift, app_balances: newAppBalances });
            },
        };
    }, [
        // Array dependensi untuk useMemo
        user, workers, activeShifts, shiftArchives, adminFeeRules, products, vouchers,
        loadingData, currentUserAppBalanceLogs,
        fetchAllInitialData, fetchWorkers, fetchActiveShifts, fetchShiftArchives,
        fetchAdminFeeRules, fetchProducts, fetchVouchers
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("useData must be used within a DataProvider");
    return context;
};