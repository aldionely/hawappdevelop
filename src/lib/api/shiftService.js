import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

export const fetchActiveShiftsAPI = async () => {
  const { data, error } = await supabase.from('active_shifts').select('*');
  if (error) return { success: false, error: handleSupabaseError(error, "fetching active shifts API") };
  return { success: true, data: data || [] };
};

export const updateActiveShiftAPI = async (shiftData, ensureValidAppBalancesFn, transformShiftDataFn) => {
  const payload = { 
    id: shiftData.id || `shift_${Date.now()}_${shiftData.username}`,
    username: shiftData.username,
    workername: shiftData.workerName,
    starttime: shiftData.startTime,
    kasawal: typeof shiftData.kasAwal === 'number' ? shiftData.kasAwal : 0,
    lokasi: shiftData.lokasi,
    transactions: Array.isArray(shiftData.transactions) ? shiftData.transactions : [],
    totalin: typeof shiftData.totalIn === 'number' ? shiftData.totalIn : 0,
    totalout: typeof shiftData.totalOut === 'number' ? shiftData.totalOut : 0,
    uangtransaksi: typeof shiftData.uangTransaksi === 'number' ? shiftData.uangTransaksi : 0,
    totaladminfee: typeof shiftData.totalAdminFee === 'number' ? shiftData.totalAdminFee : 0,
    notes: shiftData.notes || null,
    app_balances: ensureValidAppBalancesFn(shiftData.app_balances),
    initial_app_balances: ensureValidAppBalancesFn(shiftData.initial_app_balances),
    initial_voucher_stock: shiftData.initial_voucher_stock || null,
  };
  
  const { data, error } = await supabase
    .from('active_shifts')
    .upsert(payload , { onConflict: 'id' })
    .select();

  if (error) return { success: false, error: handleSupabaseError(error, `updating active shift API for ${payload.id}`) };
  if (data && data.length > 0) {
    const updatedShift = transformShiftDataFn(data[0]);
    return { success: true, data: updatedShift };
  }
  return { success: false, error: handleSupabaseError({ message: "No data returned after upsert" }, "updating active shift API")};
};

export const endShiftAPI = async (shiftData, ensureValidAppBalancesFn, transformShiftDataFn) => {
  const { error: deleteError } = await supabase.from('active_shifts').delete().eq('id', shiftData.id);
  if (deleteError) {
    handleSupabaseError(deleteError, "deleting active shift during endShift API");
  }

  const archivePayload = {
      id: shiftData.id,
      username: shiftData.username,
      workername: shiftData.workerName,
      starttime: shiftData.startTime,
      endtime: shiftData.endTime,
      kasawal: typeof shiftData.kasAwal === 'number' ? shiftData.kasAwal : 0,
      kasakhir: typeof shiftData.kasAkhir === 'number' ? shiftData.kasAkhir : 0,
      lokasi: shiftData.lokasi,
      transactions: Array.isArray(shiftData.transactions) ? shiftData.transactions : [],
      totalin: typeof shiftData.totalIn === 'number' ? shiftData.totalIn : 0,
      totalout: typeof shiftData.totalOut === 'number' ? shiftData.totalOut : 0,
      uangtransaksi: typeof shiftData.uangTransaksi === 'number' ? shiftData.uangTransaksi : 0,
      expectedbalance: typeof shiftData.expectedBalance === 'number' ? shiftData.expectedBalance : 0,
      selisih: typeof shiftData.selisih === 'number' ? shiftData.selisih : 0,
      notes: shiftData.notes,

      // --- PERUBAHAN DI SINI ---
      // Menyimpan hasil kalkulasi (Total Admin - Uang Makan) ke kolom 'totaladminfee'
      totaladminfee: typeof shiftData.totalAdminFee === 'number' ? shiftData.totalAdminFee : 0, 
    // Uang makan tetap disimpan sebagai kolom terpisah untuk kalkulasi
      uang_makan: typeof shiftData.uang_makan === 'number' ? shiftData.uang_makan : 0,
      // --- AKHIR PERUBAHAN ---
      app_balances: ensureValidAppBalancesFn(shiftData.app_balances),
      initial_app_balances: ensureValidAppBalancesFn(shiftData.initial_app_balances),
      initial_voucher_stock: shiftData.initial_voucher_stock || null,
      final_voucher_stock: shiftData.final_voucher_stock || null,
      physical_cash_details: shiftData.physical_cash_details || null,

  };

  const { data, error: insertError } = await supabase.from('shift_archives').insert([archivePayload]).select();
  if (insertError) return { success: false, error: handleSupabaseError(insertError, "archiving shift API") };
  
  if (data && data.length > 0) {
    const archivedShift = transformShiftDataFn(data[0]);
    return { success: true, data: archivedShift };
  }
  return { success: false, error: handleSupabaseError({ message: "No data returned after archive insert"}, "archiving shift API")};
};

export const fetchShiftArchivesAPI = async () => {
  const { data, error } = await supabase.from('shift_archives').select('*').order('endtime', { ascending: false });
  if (error) return { success: false, error: handleSupabaseError(error, "fetching shift archives API") };
  return { success: true, data: data || [] };
};

export const removeShiftArchiveAPI = async (shiftId) => {
  const { error } = await supabase.from('shift_archives').delete().eq('id', shiftId);
  if (error) return { success: false, error: handleSupabaseError(error, "removing shift archive API") };
  return { success: true };
};

export const adminEditShiftCashAPI = async (shiftId, newCashDetails) => {
  const { error } = await supabase.rpc('admin_edit_shift_cash', {
      p_shift_id: shiftId,
      p_new_cash_details: newCashDetails
  });
  if (error) return { success: false, error: handleSupabaseError(error, "editing shift cash") };
  return { success: true };
};

export const adminDepositShiftCashAPI = async (shiftId, depositDetails, adminName) => {
  const { error } = await supabase.rpc('admin_deposit_shift_cash', {
      p_shift_id: shiftId,
      p_deposit_details: depositDetails,
      p_admin_name: adminName
  });
  if (error) return { success: false, error: handleSupabaseError(error, "depositing shift cash") };
  return { success: true };
};