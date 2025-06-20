// FILE: src/contexts/DataContext.jsx (PERBAIKAN FINAL LENGKAP DENGAN LISTENER LOG)

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
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

    // --- FUNGSI-FUNGSI FETCH DATA YANG STABIL ---
    // Pola ini sudah stabil dari perbaikan sebelumnya.
    const fetchWorkers = useCallback(async () => {
        try {
            const result = await fetchWorkersAPI();
            if (result.success) setWorkers(result.data || []);
            else handleSupabaseError(result.error, "fetching workers");
        } catch (error) { handleSupabaseError(error, "Network or unexpected error in fetching workers"); }
    }, []);

    const fetchActiveShifts = useCallback(async () => {
        try {
            const result = await fetchActiveShiftsAPI();
            if (result.success) setActiveShifts((result.data || []).map(transformShiftData));
            else handleSupabaseError(result.error, "fetching active shifts");
        } catch (error) { handleSupabaseError(error, "Network or unexpected error in fetching active shifts"); }
    }, []);

    const fetchShiftArchives = useCallback(async () => {
        try {
            const result = await fetchShiftArchivesAPI();
            if (result.success) setShiftArchives((result.data || []).map(transformShiftData));
            else handleSupabaseError(result.error, "fetching shift archives");
        } catch (error) { handleSupabaseError(error, "Network or unexpected error in fetching shift archives"); }
    }, []);

    const fetchAdminFeeRules = useCallback(async () => {
        try {
            const result = await fetchAdminFeeRulesAPI();
            if (result.success) setAdminFeeRules(result.data || []);
            else handleSupabaseError(result.error, "fetching admin fee rules");
        } catch (error) { handleSupabaseError(error, "Network or unexpected error in fetching admin fee rules"); }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const result = await fetchProductsAPI();
            if (result.success) setProducts(result.data || []);
            else handleSupabaseError(result.error, "fetching products");
        } catch (error) { handleSupabaseError(error, "Network or unexpected error in fetching products"); }
    }, []);

    const fetchVouchers = useCallback(async () => {
        try {
            const result = await fetchVouchersAPI();
            if (result.success) setVouchers(result.data || []);
            else handleSupabaseError(result.error, "fetching vouchers");
        } catch (error) { handleSupabaseError(error, "Network or unexpected error in fetching vouchers"); }
    }, []);

    // --- [BARU] FUNGSI UNTUK LOG SALDO REAL-TIME ---
    // Diletakkan di sini agar konsisten dengan fungsi fetch lainnya.
    const fetchCurrentUserAppBalanceLogs = useCallback(async () => {
        const currentShift = activeShifts.find(shift => shift.username === user?.username);
        if (!currentShift?.id) {
            setCurrentUserAppBalanceLogs([]);
            return;
        }
        try {
            const result = await fetchAppBalanceLogsAPI(currentShift.id);
            if (result.success) {
                const sortedLogs = (result.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setCurrentUserAppBalanceLogs(sortedLogs);
            } else {
                handleSupabaseError(result.error, "fetching app balance logs");
            }
        } catch (error) {
            handleSupabaseError(error, "Network or unexpected error in fetching app balance logs");
        }
    }, [user?.username, activeShifts]);


    // --- Efek untuk memuat semua data awal ---
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

    const stableFetchCallbacks = useRef({});

    // 3. Setiap kali fungsi fetch diperbarui (karena state berubah), simpan versi terbarunya ke dalam ref.
    useEffect(() => {
        stableFetchCallbacks.current = {
            fetchActiveShifts,
            fetchShiftArchives,
            fetchVouchers,
            fetchCurrentUserAppBalanceLogs,
            fetchProducts
        };
    }, [fetchActiveShifts, fetchShiftArchives, fetchVouchers, fetchCurrentUserAppBalanceLogs]);

    // --- [DIMODIFIKASI] LISTENER REAL-TIME ---
    useEffect(() => {
        if (!user) return;

        console.log("Setting up real-time listeners... (STABLE)");

        // Fungsi-fungsi callback di dalam listener akan memanggil versi terbaru dari ref.
        const handleActiveShiftChange = () => stableFetchCallbacks.current.fetchActiveShifts();
        const handleShiftArchiveChange = () => stableFetchCallbacks.current.fetchShiftArchives();
        const handleVoucherChange = () => stableFetchCallbacks.current.fetchVouchers();
        const handleProductChange = () => stableFetchCallbacks.current.fetchProducts();
        const handleBalanceLogChange = (payload) => {
        
            console.log('REAL-TIME: Perubahan terdeteksi di app_balance_logs!', payload);
            // Opsi 1: Panggil fungsi fetch lengkap (seperti sebelumnya, tapi lebih stabil)
            stableFetchCallbacks.current.fetchCurrentUserAppBalanceLogs();

            // Opsi 2 (Lebih Optimal): Update state secara langsung jika memungkinkan
            // Ini akan terasa lebih cepat karena tidak perlu request ke server lagi.
            // if (payload.new) {
            //    setCurrentUserAppBalanceLogs(currentLogs => 
            //        [payload.new, ...currentLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            //    );
            // }
        };

        const channels = [
            supabase.channel('public:active_shifts')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'active_shifts' }, handleActiveShiftChange)
                .subscribe(status => console.log('Status langganan active_shifts:', status)),

            supabase.channel('public:shift_archives')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_archives' }, handleShiftArchiveChange)
                .subscribe(status => console.log('Status langganan shift_archives:', status)),

            supabase.channel('public:products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleProductChange)
            .subscribe(status => console.log('Status langganan products:', status)),

            supabase.channel('public:vouchers')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, handleVoucherChange)
                .subscribe(status => console.log('Status langganan vouchers:', status)),
            
            supabase.channel('public:app_balance_logs')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_balance_logs' }, handleBalanceLogChange) // Lebih spesifik ke INSERT
                .subscribe((status) => {
                    if (status !== 'SUBSCRIBED') { console.error('Gagal subscribe ke app_balance_logs:', status); }
                    else { console.log('Status langganan app_balance_logs:', status); }
                })
        ];

        return () => {
            console.log("Removing real-time listeners. (STABLE)");
            // Gunakan removeAllChannels agar lebih pasti bersih saat user logout.
            supabase.removeAllChannels();
        };

    // 4. Array dependensi sekarang SANGAT STABIL, hanya bergantung pada `user`.
    // Listener hanya akan dibuat ulang saat user login atau logout.
    }, [user]);

    // --- [BARU] EFEK UNTUK MENGAMBIL DATA AWAL LOG SALDO ---
    useEffect(() => {
        fetchCurrentUserAppBalanceLogs();
    }, [fetchCurrentUserAppBalanceLogs]);


    // --- EKSPOR SEMUA STATE DAN FUNGSI MELALUI useMemo AGAR STABIL ---
    const value = useMemo(() => {
        // ... (sisa kode Anda dari useMemo tidak perlu diubah)
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
            const isSpecialAdmin = user?.id === 'admin_user';

            const result = await updateVoucherStockAPI({
                voucherId,
                quantityChanged,
                transactionType,
                description,
                userId: isSpecialAdmin ? null : user?.id,
                username: user?.name,
                shiftId: activeShift?.id
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
            
            getActiveShiftForCurrentUser,
            processTransactionTotals,
            recalculateAppBalances,
            updateActiveShift,
            sellVoucherAndUpdateShift,
            updateVoucherStock,
            fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchCurrentUserAppBalanceLogs, fetchVoucherLogsAPI,

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
        user, workers, activeShifts, shiftArchives, adminFeeRules, products, vouchers,
        loadingData, currentUserAppBalanceLogs,
        fetchAllInitialData, fetchWorkers, fetchActiveShifts, fetchShiftArchives,
        fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchCurrentUserAppBalanceLogs
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