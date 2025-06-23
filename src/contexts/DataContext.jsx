// FILE: src/contexts/DataContext.jsx

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
import { fetchAccessoriesAPI, addAccessoryAPI, updateAccessoryAPI, removeAccessoryAPI } from "@/lib/api/accessoryService";
import { fetchLocationInventoryAPI, addInitialInventoryAPI, transferStockAPI } from "@/lib/api/inventoryService";
import { fetchInventoryLogsAPI } from "@/lib/api/logService";


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
    const [accessories, setAccessories] = useState([]);
    const [inventoryLogs, setInventoryLogs] = useState([]);

    // --- FUNGSI-FUNGSI FETCH DATA YANG STABIL ---
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

    const fetchInventoryLogs = useCallback(async () => { // Tambahkan fungsi ini
        try {
            const result = await fetchInventoryLogsAPI();
            if (result.success) setInventoryLogs(result.data);
            else handleSupabaseError(result.error, "fetching inventory logs");
        } catch (error) {
            handleSupabaseError(error, "Network or unexpected error in fetching inventory logs");
        }
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

    const fetchAccessories = useCallback(async () => {
        try {
            const masterResult = await fetchAccessoriesAPI();
            if (!masterResult.success) { return handleSupabaseError(masterResult.error, "fetching master accessories"); }
            
            const inventoryResult = await fetchLocationInventoryAPI();
            if (!inventoryResult.success) { return handleSupabaseError(inventoryResult.error, "fetching location inventory"); }

            const combinedData = masterResult.data.map(masterItem => {
                const inventory = inventoryResult.data.filter(inv => inv.accessory_id === masterItem.id);
                return { ...masterItem, inventory: inventory };
            });
            setAccessories(combinedData);
        } catch (error) { 
            handleSupabaseError(error, "Network or unexpected error in fetching accessories"); 
        }
    }, []);

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
            fetchAdminFeeRules(), fetchProducts(), fetchVouchers(), fetchAccessories(),
        ]);
        setLoadingData(false);
    }, [user, fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchAccessories, fetchInventoryLogs]);

    useEffect(() => { fetchAllInitialData(); }, [fetchAllInitialData]);

    const stableFetchCallbacks = useRef({});

    useEffect(() => {
        stableFetchCallbacks.current = {
            fetchActiveShifts,
            fetchShiftArchives,
            fetchVouchers,
            fetchCurrentUserAppBalanceLogs,
            fetchProducts,
            fetchAccessories
        };
    }, [fetchActiveShifts, fetchShiftArchives, fetchVouchers, fetchCurrentUserAppBalanceLogs, fetchProducts, fetchAccessories]);

    // BAGIAN LISTENER INI TIDAK DIUBAH, SESUAI DENGAN KODE ANDA
    useEffect(() => {
        if (!user) return;

        console.log("Setting up real-time listeners... (STABLE)");

        const handleActiveShiftChange = () => stableFetchCallbacks.current.fetchActiveShifts();
        const handleShiftArchiveChange = () => stableFetchCallbacks.current.fetchShiftArchives();
        const handleVoucherChange = () => stableFetchCallbacks.current.fetchVouchers();
        const handleProductChange = () => stableFetchCallbacks.current.fetchProducts();
        const handleAccessoryChange = () => stableFetchCallbacks.current.fetchAccessories();
        const handleBalanceLogChange = (payload) => {
        
            console.log('REAL-TIME: Perubahan terdeteksi di app_balance_logs!', payload);
            stableFetchCallbacks.current.fetchCurrentUserAppBalanceLogs();
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
            
            supabase.channel('public:accessories')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'accessories' }, handleAccessoryChange)
                .subscribe(status => console.log('Status langganan accessories:', status)),

            supabase.channel('public:vouchers')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, handleVoucherChange)
                .subscribe(status => console.log('Status langganan vouchers:', status)),
            
            supabase.channel('public:app_balance_logs')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_balance_logs' }, handleBalanceLogChange)
                .subscribe((status) => {
                    if (status !== 'SUBSCRIBED') { console.error('Gagal subscribe ke app_balance_logs:', status); }
                    else { console.log('Status langganan app_balance_logs:', status); }
                })
        ];

        return () => {
            console.log("Removing real-time listeners. (STABLE)");
            supabase.removeAllChannels();
        };
    }, [user]);

    useEffect(() => {
        fetchCurrentUserAppBalanceLogs();
    }, [fetchCurrentUserAppBalanceLogs]);


    const value = useMemo(() => {
        const getActiveShiftForCurrentUser = () => {
            if (user && user.role === 'worker') {
                return activeShifts.find(shift => shift.username === user.username) || null;
            }
            return null;
        };
        const activeShift = getActiveShiftForCurrentUser();

        

        const processTransactionTotals = (transactions) => { 
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

        const recalculateAppBalances = async (shiftId, initialBalances, transactions) => { 
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
                const productDetails = calculateProductAdminFee(tx, products); 
                balancesAfterManualUpdates = updateAppBalancesFromTransaction(balancesAfterManualUpdates, tx, appBalanceDefinitions, productDetails);
            }
            return balancesAfterManualUpdates;
        };
        
        const updateActiveShift = async (shiftData) => {
            const result = await updateActiveShiftAPI(shiftData, ensureValidAppBalances, transformShiftData);
            if (result.success) await fetchActiveShifts();
            return result;
         };
        
        const updateVoucherStock = async (voucherId, quantityChanged, transactionType, description) => {
            const isSpecialAdmin = user?.id === 'admin_user';
            const result = await updateVoucherStockAPI({
                voucherId, quantityChanged, transactionType, description,
                userId: isSpecialAdmin ? null : user?.id,
                username: user?.name, shiftId: activeShift?.id
            });
            if (result.success) await fetchVouchers();
            return result;
        };

        const sellVoucherAndUpdateShift = async (voucher) => {
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

        const sellProductAndUpdateShift = async (product) => {
            if (!activeShift) return { success: false, error: "Tidak ada shift aktif." };

            const profit = product.sell_price - product.cost_price;

            const newTransaction = {
                id: `tx_prd_${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: 'in',
                amount: product.sell_price,
                description: product.name, 
                keyword: product.keyword, 
                adminFee: 0,
                productAdminFee: profit >= 0 ? profit : 0,
                relatedAppKey: product.related_app_key, 
                productCostPrice: product.cost_price 
            };

            
            
            // FUNGSI INI KITA BIARKAN SEPERTI ASLINYA, TIDAK DIUBAH
            const sellAccessoryAndUpdateShift = async (accessory) => {
                if (!activeShift) return { success: false, error: "Tidak ada shift aktif." };

                const profit = accessory.sell_price - accessory.cost_price;

                const newTransaction = {
                    id: `tx_acc_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    type: 'in',
                    amount: accessory.sell_price,
                    description: accessory.name,
                    adminFee: 0, 
                    productAdminFee: profit >= 0 ? profit : 0,
                };
                
                const updatedTransactions = [...activeShift.transactions, newTransaction];
                const newTotals = processTransactionTotals(updatedTransactions);
                const updatedShiftDetails = { ...activeShift, ...newTotals, transactions: updatedTransactions };

                return await updateActiveShift(updatedShiftDetails);
            };
            
            const updatedTransactions = [...activeShift.transactions, newTransaction];
            const newTotals = processTransactionTotals(updatedTransactions);
            const newAppBalances = await recalculateAppBalances(activeShift.id, activeShift.initial_app_balances, updatedTransactions);
            const updatedShiftDetails = { ...activeShift, ...newTotals, transactions: updatedTransactions, app_balances: newAppBalances };

            return await updateActiveShift(updatedShiftDetails);
        };
        
        // =========================================================================================
        // ===== PENAMBAHAN: FUNGSI BARU DIDEKLARASIKAN DI SINI DENGAN LOKASI YANG BENAR ==========
        // =========================================================================================
        const sellAccessoryAndUpdateShift = async (accessory) => {
            if (!activeShift) return { success: false, error: "Tidak ada shift aktif." };
            const profit = accessory.sell_price - accessory.cost_price;
            const newTransaction = {
                id: `tx_acc_${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: 'in',
                amount: accessory.sell_price,
                description: accessory.name,
                adminFee: 0, 
                productAdminFee: profit >= 0 ? profit : 0,
            };
            const updatedTransactions = [...activeShift.transactions, newTransaction];
            const newTotals = processTransactionTotals(updatedTransactions);
            const updatedShiftDetails = { ...activeShift, ...newTotals, transactions: updatedTransactions };
            return await updateActiveShift(updatedShiftDetails);
        };

        
        return {
            workers, activeShifts, shiftArchives, adminFeeRules, products, vouchers, accessories,
            loadingData, activeShift, currentUserAppBalanceLogs,
            appBalanceKeysAndNames: appBalanceDefinitions,
            initialAppBalances, 
            
            inventoryLogs,
            fetchInventoryLogs,
            getActiveShiftForCurrentUser,
            processTransactionTotals,
            recalculateAppBalances,
            updateActiveShift,
            sellVoucherAndUpdateShift,
            sellProductAndUpdateShift,
            sellAccessoryAndUpdateShift,
            updateVoucherStock,
            fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchCurrentUserAppBalanceLogs, fetchVoucherLogsAPI, fetchAppBalanceLogsAPI, fetchAccessories,

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
            addAccessory: async (data) => {
            // 'data' dari form sekarang berisi semua info termasuk stok awal
            const { warehouse_stock, ...masterData } = data;

            // 1. Simpan data master (tanpa info stok) ke tabel 'accessories'
            const result = await addAccessoryAPI(masterData);

            // 2. Jika berhasil, simpan stok awal HANYA ke 'location_inventory'
            if (result.success && result.data && result.data.length > 0) {
                const newAccessoryId = result.data[0].id;
                await addInitialInventoryAPI(newAccessoryId, 'GUDANG', warehouse_stock);
                fetchAccessories(); // Refresh UI
            }
            return result;
        },
            updateAccessory: async (id, data) => {
                const result = await updateAccessoryAPI(id, data);
                if (result.success) fetchAccessories();
                return result;
            },
            removeAccessory: async (id) => { 
                const res = await removeAccessoryAPI(id); 
                if (res.success) fetchAccessories(); 
                return res; 
            },
            transferStock: async (details) => {
                const result = await transferStockAPI(details);
                if (result.success) {
                    // DIUBAH: Panggil kedua fetcher untuk refresh data stok dan data log
                    fetchAccessories();
                    fetchInventoryLogs();
                }
                return result;
            },
            sellAccessoryAndUpdateShift: null,
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
        user, workers, activeShifts, shiftArchives, adminFeeRules, products, vouchers, accessories,
        loadingData, currentUserAppBalanceLogs, fetchAllInitialData,
        fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules,
        fetchProducts, fetchVouchers, fetchAccessories, fetchCurrentUserAppBalanceLogs, inventoryLogs, fetchInventoryLogs
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