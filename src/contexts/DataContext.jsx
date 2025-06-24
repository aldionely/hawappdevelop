import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { initialAppBalances, appBalanceKeysAndNames as appBalanceDefinitions } from "@/lib/shiftConstants";
import { fetchWorkersAPI, addWorkerAPI, removeWorkerAPI, updateWorkerPasswordAPI } from "@/lib/api/workerService";
import { fetchActiveShiftsAPI, updateActiveShiftAPI, endShiftAPI, fetchShiftArchivesAPI, removeShiftArchiveAPI } from "@/lib/api/shiftService";
import { fetchAdminFeeRulesAPI, addAdminFeeRuleAPI, updateAdminFeeRuleAPI, removeAdminFeeRuleAPI } from "@/lib/api/adminFeeRuleService";
import { fetchProductsAPI, addProductAPI, updateProductAPI, removeProductAPI } from "@/lib/api/productService";
import { fetchVouchersAPI, addVoucherAPI, updateVoucherAPI, deleteVoucherAPI, updateVoucherStockAPI, fetchVoucherLogsAPI } from "@/lib/api/voucherService";
import { fetchAccessoriesAPI, addAccessoryAPI, updateAccessoryAPI, removeAccessoryAPI } from "@/lib/api/accessoryService";
import { fetchLocationInventoryAPI, addInitialInventoryAPI, transferStockAPI, addStockToWarehouseAPI, updateLocationStockAPI } from "@/lib/api/inventoryService";
import { fetchInventoryLogsAPI, logInventoryChangeAPI } from "@/lib/api/logService";
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
    const [accessories, setAccessories] = useState([]);
    const [inventoryLogs, setInventoryLogs] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [currentUserAppBalanceLogs, setCurrentUserAppBalanceLogs] = useState([]);

    const fetchAccessories = useCallback(async () => { try { const masterResult = await fetchAccessoriesAPI(); if (!masterResult.success) return; const inventoryResult = await fetchLocationInventoryAPI(); if (!inventoryResult.success) return; const combinedData = masterResult.data.map(masterItem => ({ ...masterItem, inventory: inventoryResult.data.filter(inv => inv.accessory_id === masterItem.id) })); setAccessories(combinedData); } catch (error) { console.error("Error fetching accessories:", error); } }, []);
    const fetchInventoryLogs = useCallback(async () => { try { const result = await fetchInventoryLogsAPI(); if (result.success) setInventoryLogs(result.data || []); } catch (error) { console.error("Error fetching inventory logs:", error); } }, []);
    const fetchWorkers = useCallback(async () => { try { const result = await fetchWorkersAPI(); if (result.success) setWorkers(result.data || []); } catch (e) { console.error(e); } }, []);
    const fetchActiveShifts = useCallback(async () => { try { const result = await fetchActiveShiftsAPI(); if (result.success) setActiveShifts((result.data || []).map(transformShiftData)); } catch (e) { console.error(e); } }, []);
    const fetchShiftArchives = useCallback(async () => { try { const result = await fetchShiftArchivesAPI(); if (result.success) setShiftArchives((result.data || []).map(transformShiftData)); } catch (e) { console.error(e); } }, []);
    const fetchAdminFeeRules = useCallback(async () => { try { const result = await fetchAdminFeeRulesAPI(); if (result.success) setAdminFeeRules(result.data || []); } catch (e) { console.error(e); } }, []);
    const fetchProducts = useCallback(async () => { try { const result = await fetchProductsAPI(); if (result.success) setProducts(result.data || []); } catch (e) { console.error(e); } }, []);
    const fetchVouchers = useCallback(async () => { try { const result = await fetchVouchersAPI(); if (result.success) setVouchers(result.data || []); } catch (e) { console.error(e); } }, []);
    const fetchCurrentUserAppBalanceLogs = useCallback(async () => { const currentShift = Array.isArray(activeShifts) ? activeShifts.find(shift => shift.username === user?.username) : null; if (!currentShift?.id) { setCurrentUserAppBalanceLogs([]); return; } try { const result = await fetchAppBalanceLogsAPI(currentShift.id); if (result.success) { setCurrentUserAppBalanceLogs((result.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))); } } catch (e) { console.error(e); } }, [user?.username, activeShifts]);


    

    const fetchAllInitialData = useCallback(async () => {
        if (!user) { setLoadingData(false); return; }
        setLoadingData(true);
        await Promise.all([ fetchWorkers(), fetchActiveShifts(), fetchShiftArchives(), fetchAdminFeeRules(), fetchProducts(), fetchVouchers(), fetchAccessories(), fetchInventoryLogs() ]);
        setLoadingData(false);
    }, [user, fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchAccessories, fetchInventoryLogs]);
    
    useEffect(() => { fetchAllInitialData(); }, [fetchAllInitialData]);

    const stableFetchCallbacks = useRef({});
    useEffect(() => {
        stableFetchCallbacks.current = { fetchActiveShifts, fetchShiftArchives, fetchVouchers, fetchCurrentUserAppBalanceLogs, fetchProducts, fetchAccessories, fetchInventoryLogs };
    }, [fetchActiveShifts, fetchShiftArchives, fetchVouchers, fetchCurrentUserAppBalanceLogs, fetchProducts, fetchAccessories, fetchInventoryLogs]);

    useEffect(() => {
        if (!user) return;
        const handleActiveShiftChange = () => stableFetchCallbacks.current.fetchActiveShifts();
        const handleShiftArchiveChange = () => stableFetchCallbacks.current.fetchShiftArchives();
        const handleVoucherChange = () => stableFetchCallbacks.current.fetchVouchers();
        const handleProductChange = () => stableFetchCallbacks.current.fetchProducts();
        const handleAccessoryChange = () => stableFetchCallbacks.current.fetchAccessories();
        const handleInventoryLogChange = () => stableFetchCallbacks.current.fetchInventoryLogs();
        const handleBalanceLogChange = (payload) => { stableFetchCallbacks.current.fetchCurrentUserAppBalanceLogs(); };

        const channels = [
            supabase.channel('public:active_shifts').on('postgres_changes', { event: '*', schema: 'public', table: 'active_shifts' }, handleActiveShiftChange).subscribe(status => console.log('Status langganan active_shifts:', status)),
            supabase.channel('public:shift_archives').on('postgres_changes', { event: '*', schema: 'public', table: 'shift_archives' }, handleShiftArchiveChange).subscribe(status => console.log('Status langganan shift_archives:', status)),
            supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleProductChange).subscribe(status => console.log('Status langganan products:', status)),
            supabase.channel('public:accessories').on('postgres_changes', { event: '*', schema: 'public', table: 'accessories' }, handleAccessoryChange).subscribe(status => console.log('Status langganan accessories:', status)),
            supabase.channel('public:location_inventory').on('postgres_changes', { event: '*', schema: 'public', table: 'location_inventory' }, handleAccessoryChange).subscribe(status => console.log('Status langganan location_inventory:', status)),
            supabase.channel('public:vouchers').on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, handleVoucherChange).subscribe(status => console.log('Status langganan vouchers:', status)),
            supabase.channel('public:inventory_logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inventory_logs' }, handleInventoryLogChange).subscribe(status => console.log('Status langganan inventory_logs:', status)),
            supabase.channel('public:app_balance_logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_balance_logs' }, handleBalanceLogChange).subscribe((status) => { if (status !== 'SUBSCRIBED') { console.error('Gagal subscribe ke app_balance_logs:', status); } else { console.log('Status langganan app_balance_logs:', status); } })
        ];
        return () => { supabase.removeAllChannels(); };
    }, [user]);

    const value = useMemo(() => {

        // --- DEFINISI SEMUA FUNGSI ---

        const updateLocationStock = async (accessoryId, location, quantityChange) => {
            return await updateLocationStockAPI({
                p_accessory_id: accessoryId,
                p_location: location,
                p_quantity_change: quantityChange
            });
        };

        const sellAccessoryAndUpdateShift = async (accessory) => {
            const activeShift = getActiveShiftForCurrentUser();
            if (!activeShift) return { success: false, error: "Tidak ada shift aktif." };

            const locationName = activeShift.lokasi;
            
            // 1. Kurangi stok di lokasi saat ini (-1)
            const stockResult = await updateLocationStock(accessory.id, locationName, -1);
            if (!stockResult.success) {
                return { success: false, error: stockResult.error?.message || "Gagal memperbarui stok." };
            }

            // 2. Buat catatan log penjualan
            await logInventoryChangeAPI({
                accessory_id: accessory.id,
                shift_id: activeShift.id,
                actor: user?.name || 'pekerja',
                location: locationName,
                activity_type: 'PENJUALAN',
                quantity_change: -1,
                notes: `Penjualan oleh ${user?.name}`
            });

            // 3. Tambahkan transaksi keuangan ke data shift
            const profit = accessory.sell_price - accessory.cost_price;
            const newTransaction = {
                id: `tx_acc_${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: 'in',
                amount: accessory.sell_price,
                description: `Aksesoris: ${accessory.name}`,
                adminFee: 0,
                productAdminFee: profit >= 0 ? profit : 0,
            };

            const updatedTransactions = [...activeShift.transactions, newTransaction];
            const newTotals = processTransactionTotals(updatedTransactions);
            const updatedShiftDetails = { ...activeShift, ...newTotals, transactions: updatedTransactions };

            return await updateActiveShift(updatedShiftDetails);
        };

        const getActiveShiftForCurrentUser = () => { if (user && user.role === 'worker') { return (Array.isArray(activeShifts) && activeShifts.find(shift => shift.username === user.username)) || null; } return null; };
        const activeShift = getActiveShiftForCurrentUser();
        
        const processTransactionTotals = (transactions) => { let newTotalIn = 0, newTotalOut = 0, newTotalNominalAdminFee = 0, newTotalProductAdminFeeValue = 0; (transactions || []).forEach(tx => { if (tx.type === 'in') newTotalIn += tx.amount; else newTotalOut += tx.amount; newTotalNominalAdminFee += (tx.adminFee || 0); newTotalProductAdminFeeValue += (tx.productAdminFee || 0); }); return { totalIn: newTotalIn, totalOut: newTotalOut, uangTransaksi: newTotalIn - newTotalOut, totalAdminFee: newTotalNominalAdminFee + newTotalProductAdminFeeValue, }; };
        const recalculateAppBalances = async (shiftId, initialBalances, transactions) => { const logResult = await fetchAppBalanceLogsAPI(shiftId); const manualLogs = logResult.success ? logResult.data : []; let recalculatedBalances = ensureValidAppBalances(initialBalances); const chronologicalManualLogs = manualLogs.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); for (const log of chronologicalManualLogs) { const change = log.type === 'PENAMBAHAN' ? log.amount : -log.amount; recalculatedBalances[log.app_key] = (recalculatedBalances[log.app_key] || 0) + change; } let balancesAfterManualUpdates = { ...recalculatedBalances }; for (const tx of transactions) { const productDetails = calculateProductAdminFee(tx, products); balancesAfterManualUpdates = updateAppBalancesFromTransaction(balancesAfterManualUpdates, tx, appBalanceDefinitions, productDetails); } return balancesAfterManualUpdates; };
        const updateActiveShift = async (shiftData) => { const result = await updateActiveShiftAPI(shiftData, ensureValidAppBalances, transformShiftData); if (result.success) await fetchActiveShifts(); return result; };
        const updateVoucherStock = async (voucherId, quantityChanged, transactionType, description) => { const isSpecialAdmin = user?.id === 'admin_user'; const result = await updateVoucherStockAPI({ voucherId, quantityChanged, transactionType, description, userId: isSpecialAdmin ? null : user?.id, username: user?.name, shiftId: activeShift?.id }); if (result.success) await fetchVouchers(); return result; };
        const sellVoucherAndUpdateShift = async (voucher) => { if (!activeShift) return { success: false, error: "Tidak ada shift aktif." }; const stockResult = await updateVoucherStock(voucher.id, -1, 'PENJUALAN', `Penjualan ${voucher.name}`); if (!stockResult.success) return stockResult; const profit = voucher.sell_price - voucher.cost_price; const newTransaction = { id: `tx_vcr_${Date.now()}`, timestamp: new Date().toISOString(), type: 'in', amount: voucher.sell_price, description: voucher.name, adminFee: 0, productAdminFee: profit >= 0 ? profit : 0 }; const updatedTransactions = [...activeShift.transactions, newTransaction]; const newTotals = processTransactionTotals(updatedTransactions); const newAppBalances = await recalculateAppBalances(activeShift.id, activeShift.initial_app_balances, updatedTransactions); const updatedShiftDetails = { ...activeShift, ...newTotals, transactions: updatedTransactions, app_balances: newAppBalances }; return await updateActiveShift(updatedShiftDetails); };
        const sellProductAndUpdateShift = async (product) => { if (!activeShift) return { success: false, error: "Tidak ada shift aktif." }; const profit = product.sell_price - product.cost_price; const newTransaction = { id: `tx_prd_${Date.now()}`, timestamp: new Date().toISOString(), type: 'in', amount: product.sell_price, description: product.name, keyword: product.keyword, adminFee: 0, productAdminFee: profit >= 0 ? profit : 0, relatedAppKey: product.related_app_key, productCostPrice: product.cost_price }; const updatedTransactions = [...activeShift.transactions, newTransaction]; const newTotals = processTransactionTotals(updatedTransactions); const newAppBalances = await recalculateAppBalances(activeShift.id, activeShift.initial_app_balances, updatedTransactions); const updatedShiftDetails = { ...activeShift, ...newTotals, transactions: updatedTransactions, app_balances: newAppBalances }; return await updateActiveShift(updatedShiftDetails); };
        const updateManualAppBalance = async (appKey, appName, amount, type, description) => { if (!activeShift) return { success: false, error: "Tidak ada shift aktif." }; const previousBalance = parseSafeNumber(activeShift.app_balances[appKey]); const numericAmount = parseSafeNumber(amount); const changeAmount = type === 'PENAMBAHAN' ? numericAmount : -numericAmount; const newBalance = previousBalance + changeAmount; const logResult = await logAppBalanceUpdateAPI({ shift_id: activeShift.id, user_id: user.id, username: user.name, app_key: appKey, app_name: appName, type, amount: numericAmount, description, previous_balance: previousBalance, new_balance: newBalance }); if (!logResult.success) return { success: false, error: "Gagal mencatat log saldo." }; const newAppBalances = { ...activeShift.app_balances, [appKey]: newBalance }; return await updateActiveShift({ ...activeShift, app_balances: newAppBalances }); };
        const addWorker = async (data) => await addWorkerAPI(data);
        const removeWorker = async (id, username) => await removeWorkerAPI(id, username);
        const updateWorkerPassword = async (id, pw) => await updateWorkerPasswordAPI(id, pw);
        const endShift = async (data) => await endShiftAPI(data, ensureValidAppBalances, transformShiftData);
        const removeShiftArchive = async (id) => await removeShiftArchiveAPI(id);
        const addAdminFeeRule = async (data) => await addAdminFeeRuleAPI(data);
        const updateAdminFeeRule = async (id, data) => await updateAdminFeeRuleAPI(id, data);
        const removeAdminFeeRule = async (id) => await removeAdminFeeRuleAPI(id);
        const addProduct = async (data) => await addProductAPI(data);
        const updateProduct = async (id, data) => await updateProductAPI(id, data);
        const removeProduct = async (id) => await removeProductAPI(id);
        const addVoucher = async (data) => await addVoucherAPI(data);
        const updateVoucher = async (id, data) => await updateVoucherAPI(id, data);
        const deleteVoucher = async (id) => await deleteVoucherAPI(id);

        const addAccessory = async (data) => {
            const { warehouse_stock, ...masterData } = data;
            const result = await addAccessoryAPI(masterData);
            if (result.success && result.data && result.data.length > 0) {
                const newAccessoryId = result.data[0].id;
                await addInitialInventoryAPI(newAccessoryId, 'GUDANG', warehouse_stock);
                await logInventoryChangeAPI({ accessory_id: newAccessoryId, actor: user?.name || 'ADMIN', location: 'GUDANG', activity_type: 'PENAMBAHAN AWAL', quantity_change: warehouse_stock, notes: 'Stok awal saat barang dibuat' });
            }
            return result;
        };
        const updateAccessory = async (id, data) => await updateAccessoryAPI(id, data);
        const removeAccessory = async (id) => await removeAccessoryAPI(id);
        const transferStock = async (details) => await transferStockAPI(details);
        const addStockToWarehouse = async (details) => await addStockToWarehouseAPI(details);

        return {
            user, workers, activeShifts, shiftArchives, adminFeeRules, products, vouchers, accessories, inventoryLogs, loadingData, currentUserAppBalanceLogs, appBalanceKeysAndNames: appBalanceDefinitions, initialAppBalances, activeShift,
            
            getActiveShiftForCurrentUser, processTransactionTotals, recalculateAppBalances, updateActiveShift, sellVoucherAndUpdateShift, sellProductAndUpdateShift, updateVoucherStock, fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchCurrentUserAppBalanceLogs, fetchVoucherLogsAPI, fetchAppBalanceLogsAPI,
            
            addWorker, removeWorker, updateWorkerPassword, endShift, removeShiftArchive, addAdminFeeRule, updateAdminFeeRule, removeAdminFeeRule, addProduct, updateProduct, removeProduct, addVoucher, updateVoucher, deleteVoucher, updateManualAppBalance,
            
            fetchAccessories, fetchInventoryLogs, addAccessory, updateAccessory, removeAccessory, transferStock, addStockToWarehouse, sellAccessoryAndUpdateShift, sellAccessoryAndUpdateShift, 
        };
    }, [ user, workers, activeShifts, shiftArchives, adminFeeRules, products, vouchers, accessories, inventoryLogs, loadingData, currentUserAppBalanceLogs ]);

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