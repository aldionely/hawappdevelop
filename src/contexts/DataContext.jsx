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
// --- MODIFIKASI: Impor semua layanan BANK HAW ---
import { fetchBankHawBalanceAPI, fetchBankHawLogsAPI, adminAddToBankHawAPI, transferFromBankToShiftAPI, transferFromShiftToBankAPI } from "@/lib/api/bankHawService";
import { handleSupabaseError } from "@/lib/errorHandler";
import { transformShiftData, ensureValidAppBalances, parseSafeNumber } from "@/lib/dataTransformation";
import { calculateProductAdminFee, updateAppBalancesFromTransaction } from "@/lib/productAndBalanceHelper";
import { fetchStockRequestsAPI, createStockRequestAPI, updateStockRequestStatusAPI } from "@/lib/api/requestService";
import { fetchAllowancesAPI, updateAllowanceAPI } from "@/lib/api/allowanceService";



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
    const [stockRequests, setStockRequests] = useState([]);
    const [dailyAllowances, setDailyAllowances] = useState([]);
    const [bankHawBalance, setBankHawBalance] = useState(null);
    // --- BARU: State untuk riwayat BANK HAW ---
    const [bankHawLogs, setBankHawLogs] = useState([]);

    const fetchBankHawBalance = useCallback(async () => {
        try {
            const result = await fetchBankHawBalanceAPI();
            if (result.success) setBankHawBalance(result.data);
        } catch (error) {
            console.error("Error fetching Bank HAW balance:", error);
        }
    }, []);

    // --- BARU: Fungsi untuk mengambil riwayat BANK HAW ---
    const fetchBankHawLogs = useCallback(async () => {
        try {
            const result = await fetchBankHawLogsAPI();
            if (result.success) setBankHawLogs(result.data);
        } catch (error) {
            console.error("Error fetching Bank HAW logs:", error);
        }
    }, []);

    const fetchAccessories = useCallback(async () => { try { const masterResult = await fetchAccessoriesAPI(); if (!masterResult.success) return; const inventoryResult = await fetchLocationInventoryAPI(); if (!inventoryResult.success) return; const combinedData = masterResult.data.map(masterItem => ({ ...masterItem, inventory: inventoryResult.data.filter(inv => inv.accessory_id === masterItem.id) })); setAccessories(combinedData); } catch (error) { console.error("Error fetching accessories:", error); } }, []);
    const fetchInventoryLogs = useCallback(async () => { try { const result = await fetchInventoryLogsAPI(); if (result.success) setInventoryLogs(result.data || []); } catch (error) { console.error("Error fetching inventory logs:", error); } }, []);
    const fetchWorkers = useCallback(async () => { try { const result = await fetchWorkersAPI(); if (result.success) setWorkers(result.data || []); } catch (e) { console.error(e); } }, []);
    const fetchActiveShifts = useCallback(async () => { try { const result = await fetchActiveShiftsAPI(); if (result.success) setActiveShifts((result.data || []).map(transformShiftData)); } catch (e) { console.error(e); } }, []);
    const fetchShiftArchives = useCallback(async () => { try { const result = await fetchShiftArchivesAPI(); if (result.success) setShiftArchives((result.data || []).map(transformShiftData)); } catch (e) { console.error(e); } }, []);
    const fetchAdminFeeRules = useCallback(async () => { try { const result = await fetchAdminFeeRulesAPI(); if (result.success) setAdminFeeRules(result.data || []); } catch (e) { console.error(e); } }, []);
    const fetchProducts = useCallback(async () => { try { const result = await fetchProductsAPI(); if (result.success) setProducts(result.data || []); } catch (e) { console.error(e); } }, []);
    const fetchVouchers = useCallback(async () => { try { const result = await fetchVouchersAPI(); if (result.success) setVouchers(result.data || []); } catch (e) { console.error(e); } }, []);
    const fetchCurrentUserAppBalanceLogs = useCallback(async () => { const currentShift = Array.isArray(activeShifts) ? activeShifts.find(shift => shift.username === user?.username) : null; if (!currentShift?.id) { setCurrentUserAppBalanceLogs([]); return; } try { const result = await fetchAppBalanceLogsAPI(currentShift.id); if (result.success) { setCurrentUserAppBalanceLogs((result.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))); } } catch (e) { console.error(e); } }, [user?.username, activeShifts]);
    const fetchStockRequests = useCallback(async () => {
        try {
            const result = await fetchStockRequestsAPI();
            if (result.success) setStockRequests(result.data || []);
        } catch (error) {
            console.error("Error fetching stock requests:", error);
        }
    }, []);

    const fetchAllowances = useCallback(async () => {
        const result = await fetchAllowancesAPI();
        if (result.success) {
            setDailyAllowances(result.data || []);
        } else {
            console.error("Gagal mengambil data uang harian dari API.");
        }
    }, []);

    

    const fetchAllInitialData = useCallback(async () => {
        if (!user) { setLoadingData(false); return; }
        setLoadingData(true);
        // --- MODIFIKASI: Tambahkan fetchBankHawLogs jika user adalah admin ---
        const adminPromises = user.role === 'admin' ? [fetchBankHawBalance(), fetchBankHawLogs()] : [];
        await Promise.all([ fetchWorkers(), fetchActiveShifts(), fetchShiftArchives(), fetchAdminFeeRules(), fetchProducts(), fetchVouchers(), fetchAccessories(), fetchInventoryLogs(), fetchStockRequests(), fetchAllowances(), ...adminPromises]);
        setLoadingData(false);
    }, [user, fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchAccessories, fetchInventoryLogs, fetchStockRequests, fetchAllowances, fetchBankHawBalance, fetchBankHawLogs ]);
    
    useEffect(() => { fetchAllInitialData(); }, [fetchAllInitialData]);

    const stableFetchCallbacks = useRef({});
    useEffect(() => {
        stableFetchCallbacks.current = { fetchActiveShifts, fetchShiftArchives, fetchVouchers, fetchCurrentUserAppBalanceLogs, fetchProducts, fetchAccessories, fetchInventoryLogs, fetchStockRequests, fetchBankHawBalance, fetchBankHawLogs };
    }, [fetchActiveShifts, fetchShiftArchives, fetchVouchers, fetchCurrentUserAppBalanceLogs, fetchProducts, fetchAccessories, fetchInventoryLogs, fetchStockRequests, fetchBankHawBalance, fetchBankHawLogs]);

    useEffect(() => {
        if (!user) return;
        const handleActiveShiftChange = () => stableFetchCallbacks.current.fetchActiveShifts();
        const handleShiftArchiveChange = () => stableFetchCallbacks.current.fetchShiftArchives();
        const handleVoucherChange = () => stableFetchCallbacks.current.fetchVouchers();
        const handleProductChange = () => stableFetchCallbacks.current.fetchProducts();
        const handleAccessoryChange = () => stableFetchCallbacks.current.fetchAccessories();
        const handleInventoryLogChange = () => stableFetchCallbacks.current.fetchInventoryLogs();
        const handleBalanceLogChange = (payload) => { stableFetchCallbacks.current.fetchCurrentUserAppBalanceLogs(); };
        const handleStockRequestChange = () => stableFetchCallbacks.current.fetchStockRequests();
        const handleAllowanceChange = () => stableFetchCallbacks.current.fetchAllowances();
        const handleBankHawChange = () => {
            stableFetchCallbacks.current.fetchBankHawBalance();
            stableFetchCallbacks.current.fetchBankHawLogs(); // Juga refresh log
        };

        const channels = [
            supabase.channel('public:active_shifts').on('postgres_changes', { event: '*', schema: 'public', table: 'active_shifts' }, handleActiveShiftChange).subscribe(status => console.log('Status langganan active_shifts:', status)),
            supabase.channel('public:shift_archives').on('postgres_changes', { event: '*', schema: 'public', table: 'shift_archives' }, handleShiftArchiveChange).subscribe(status => console.log('Status langganan shift_archives:', status)),
            supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, handleProductChange).subscribe(status => console.log('Status langganan products:', status)),
            supabase.channel('public:accessories').on('postgres_changes', { event: '*', schema: 'public', table: 'accessories' }, handleAccessoryChange).subscribe(status => console.log('Status langganan accessories:', status)),
            supabase.channel('public:location_inventory').on('postgres_changes', { event: '*', schema: 'public', table: 'location_inventory' }, handleAccessoryChange).subscribe(status => console.log('Status langganan location_inventory:', status)),
            supabase.channel('public:vouchers').on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, handleVoucherChange).subscribe(status => console.log('Status langganan vouchers:', status)),
            supabase.channel('public:inventory_logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inventory_logs' }, handleInventoryLogChange).subscribe(status => console.log('Status langganan inventory_logs:', status)),
            supabase.channel('public:app_balance_logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_balance_logs' }, handleBalanceLogChange).subscribe((status) => { if (status !== 'SUBSCRIBED') { console.error('Gagal subscribe ke app_balance_logs:', status); } else { console.log('Status langganan app_balance_logs:', status); } }),
            supabase.channel('public:stock_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'stock_requests' }, handleStockRequestChange).subscribe(status => console.log('Status langganan stock_requests:', status)),
            supabase.channel('public:daily_allowances').on('postgres_changes', { event: '*', schema: 'public', table: 'daily_allowances' }, handleAllowanceChange).subscribe(status => console.log('Status langganan daily_allowances:', status)),
            supabase.channel('public:bank_haw').on('postgres_changes', { event: '*', schema: 'public', table: 'bank_haw' }, handleBankHawChange).subscribe(status => console.log('Status langganan bank_haw:', status)),
            // --- BARU: Channel untuk tabel bank_haw_logs ---
            supabase.channel('public:bank_haw_logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bank_haw_logs' }, handleBankHawChange).subscribe(status => console.log('Status langganan bank_haw_logs:', status)),
        ];
        return () => { supabase.removeAllChannels(); };
    }, [user]);

    const value = useMemo(() => {

        // --- DEFINISI SEMUA FUNGSI ---
        const getActiveShiftForCurrentUser = () => { if (user && user.role === 'worker') { return (Array.isArray(activeShifts) && activeShifts.find(shift => shift.username === user.username)) || null; } return null; };
        const activeShift = getActiveShiftForCurrentUser();

        // --- BARU: Fungsi untuk admin menambah saldo ---
        const adminAddToBankHaw = async (amount, description) => {
            if (!user || user.role !== 'admin') return { success: false, error: "Hanya admin yang bisa melakukan aksi ini."};
            const result = await adminAddToBankHawAPI({
                amount: parseSafeNumber(amount),
                admin_name: user.name,
                description: description
            });
            if (result.success) {
                await fetchBankHawBalance();
                await fetchBankHawLogs();
            }
            return result;
        };
        
        const transferFromBankToShift = async (toAppKey, amount, description) => {
            if (!activeShift) return { success: false, error: "Tidak ada shift aktif." };

            const toName = appBalanceDefinitions.find(app => app.key === toAppKey)?.name || toAppKey;
            const numericAmount = parseSafeNumber(amount);
            const previousBalance = parseSafeNumber(activeShift.app_balances[toAppKey]);

            const result = await transferFromBankToShiftAPI({
                amount: numericAmount,
                shift_id: activeShift.id,
                user_id: user.id,
                username: user.name,
                app_key: toAppKey,
                app_name: toName,
                description: description || `Setoran dari BANK HAW`,
                previous_balance: previousBalance,
                new_balance: previousBalance + numericAmount
            });

            if (result.success) {
                await fetchActiveShifts();
                await fetchBankHawBalance();
            }
            return result;
        };
        
        const transferAppBalance = async (fromKey, toKey, amount, description) => {
            if (!activeShift) return { success: false, error: "Tidak ada shift aktif." };
            
            const numericAmount = parseSafeNumber(amount);

            if (toKey === 'BANK_HAW') {
                const fromName = appBalanceDefinitions.find(app => app.key === fromKey)?.name || fromKey;
                const previousBalance = parseSafeNumber(activeShift.app_balances[fromKey]);

                const result = await transferFromShiftToBankAPI({
                    amount: numericAmount,
                    shift_id: activeShift.id,
                    user_id: user.id,
                    username: user.name,
                    app_key: fromKey,
                    app_name: fromName,
                    description: description || `Transfer ke BANK HAW`,
                    previous_balance: previousBalance,
                    new_balance: previousBalance - numericAmount
                });

                if (result.success) {
                    await fetchActiveShifts();
                    await fetchBankHawBalance();
                }
                return result;
            }
            
            const fromName = appBalanceDefinitions.find(app => app.key === fromKey)?.name || fromKey;
            const toName = appBalanceDefinitions.find(app => app.key === toKey)?.name || toKey;
            const fromDesc = description ? `${description} (Oper ke ${toName})` : `Oper ke ${toName}`;
            const toDesc = description ? `${description} (Oper dari ${fromName})` : `Oper dari ${fromName}`;
            
            const fromLog = {
                shift_id: activeShift.id, user_id: user.id, username: user.name, 
                app_key: fromKey, app_name: fromName, type: 'PENGURANGAN', 
                amount: numericAmount, 
                description: fromDesc,
                previous_balance: parseSafeNumber(activeShift.app_balances[fromKey]),
                new_balance: parseSafeNumber(activeShift.app_balances[fromKey]) - numericAmount
            };
        
            const toLog = {
                shift_id: activeShift.id, user_id: user.id, username: user.name,
                app_key: toKey, app_name: toName, type: 'PENAMBAHAN', 
                amount: numericAmount, 
                description: toDesc,
                previous_balance: parseSafeNumber(activeShift.app_balances[toKey]),
                new_balance: parseSafeNumber(activeShift.app_balances[toKey]) + numericAmount
            };
            
            const [fromResult, toResult] = await Promise.all([
                logAppBalanceUpdateAPI(fromLog),
                logAppBalanceUpdateAPI(toLog)
            ]);
        
            if (!fromResult.success || !toResult.success) {
                return { success: false, error: "Gagal mencatat log transfer saldo." };
            }
            
            const newAppBalances = { 
                ...activeShift.app_balances, 
                [fromKey]: fromLog.new_balance,
                [toKey]: toLog.new_balance
            };
            
            return await updateActiveShift({ ...activeShift, app_balances: newAppBalances });
        };

        const updateAllowance = async (username, amount) => {
            const result = await updateAllowanceAPI(username, amount);
            return result;
        }

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
            
            const stockResult = await updateLocationStock(accessory.id, locationName, -1);
            if (!stockResult.success) {
                return { success: false, error: stockResult.error?.message || "Gagal memperbarui stok." };
            }

            await logInventoryChangeAPI({
                accessory_id: accessory.id,
                shift_id: activeShift.id,
                actor: user?.name || 'pekerja',
                location: locationName,
                activity_type: 'PENJUALAN',
                quantity_change: -1,
                notes: `Penjualan oleh ${user?.name}`
            });

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
            const payload = { ...data, actor: user?.name || 'ADMIN' };
            const result = await addAccessoryAPI(payload);
            if (result.success) {
                await fetchAccessories();
                await fetchInventoryLogs();
            }
            return result;
        };
        
        const updateAccessory = async (id, data) => await updateAccessoryAPI(id, data);
        const removeAccessory = async (id) => await removeAccessoryAPI(id);
        const transferStock = async (details) => await transferStockAPI(details);
        const addStockToWarehouse = async (details) => await addStockToWarehouseAPI(details);
        const createStockRequest = async (requestData) => {
            return await createStockRequestAPI(requestData);
        };
        const approveStockRequest = async (request) => {
            if (request.request_type === 'REQUEST_STOCK') {
                const transferResult = await transferStock({
                    accessory_id: request.product_id,
                    from_location: 'GUDANG',
                    to_location: request.location,
                    quantity: request.quantity,
                    transferred_by: user?.name || 'ADMIN'
                });
                if (!transferResult.success) return transferResult;
            } 
            else if (request.request_type === 'RETURN_ITEM') {
                const stockResult = await updateLocationStockAPI({
                    p_accessory_id: request.product_id,
                    p_location: request.location,
                    p_quantity_change: request.quantity
                });
                if (!stockResult.success) return stockResult;
                await logInventoryChangeAPI({
                    accessory_id: request.product_id,
                    shift_id: request.shift_id,
                    actor: user?.name || 'ADMIN',
                    location: request.location,
                    activity_type: 'RETUR DITERIMA',
                    quantity_change: request.quantity,
                    notes: `Retur dari shift ${request.worker_username}. Alasan: ${request.description}`
                });
            }
            const result = await updateStockRequestStatusAPI(request.id, 'APPROVED', user?.name || 'ADMIN');
            return result;
        };

        
        const rejectStockRequest = async (requestId) => {
            const result = await updateStockRequestStatusAPI(requestId, 'REJECTED', user?.name || 'ADMIN');
            if(result.success) fetchStockRequests();
            return result;
        };

        // --- BARU: Gabungkan semua fungsi dan state ke dalam nilai context ---
        return {
            user, workers, activeShifts, shiftArchives, adminFeeRules, products, vouchers, accessories, inventoryLogs, loadingData, currentUserAppBalanceLogs, appBalanceKeysAndNames: appBalanceDefinitions, initialAppBalances, activeShift, stockRequests, bankHawBalance, 
            bankHawLogs, // <-- Tambahkan state baru
            
            getActiveShiftForCurrentUser, processTransactionTotals, recalculateAppBalances, updateActiveShift, sellVoucherAndUpdateShift, sellProductAndUpdateShift, updateVoucherStock, fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchCurrentUserAppBalanceLogs, fetchVoucherLogsAPI, fetchAppBalanceLogsAPI, 
            fetchBankHawBalance, fetchBankHawLogs, // <-- Tambahkan fetcher baru
            
            addWorker, removeWorker, updateWorkerPassword, endShift, removeShiftArchive, addAdminFeeRule, updateAdminFeeRule, removeAdminFeeRule, addProduct, updateProduct, removeProduct, addVoucher, updateVoucher, deleteVoucher, updateManualAppBalance, 
            
            fetchAccessories, fetchInventoryLogs, addAccessory, updateAccessory, removeAccessory, transferStock, addStockToWarehouse, sellAccessoryAndUpdateShift, transferAppBalance, dailyAllowances, updateAllowance, createStockRequest, approveStockRequest, rejectStockRequest,
            
            transferFromBankToShift, adminAddToBankHaw, // <-- Tambahkan fungsi baru
        };
    }, [ user, workers, activeShifts, shiftArchives, adminFeeRules, products, vouchers, accessories, inventoryLogs, loadingData, currentUserAppBalanceLogs, accessories, inventoryLogs, stockRequests, dailyAllowances, bankHawBalance, bankHawLogs ])

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