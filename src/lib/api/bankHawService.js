import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

/**
 * Mengambil saldo BANK HAW saat ini.
 */
export const fetchBankHawBalanceAPI = async () => {
  const { data, error } = await supabase
    .from('bank_haw')
    .select('balance')
    .single();

  if (error) {
    return { success: false, error: handleSupabaseError(error, "fetching bank haw balance") };
  }
  return { success: true, data: data?.balance || 0 };
};

/**
 * FUNGSI BARU: Mengambil riwayat transaksi BANK HAW.
 */
export const fetchBankHawLogsAPI = async () => {
    const { data, error } = await supabase
        .from('bank_haw_logs')
        .select('*')
        .order('timestamp', { ascending: false }); // Urutkan dari yang terbaru

    if (error) {
        return { success: false, error: handleSupabaseError(error, "fetching bank haw logs") };
    }
    return { success: true, data: data || [] };
};


/**
 * FUNGSI BARU: Memanggil RPC untuk menambah saldo oleh admin.
 */
export const adminAddToBankHawAPI = async (details) => {
    const { amount, admin_name, description } = details;
    const { data, error } = await supabase.rpc('admin_add_to_bank_haw', {
        p_amount: amount,
        p_admin_name: admin_name,
        p_description: description
    });

    if (error) {
        return { success: false, error: handleSupabaseError(error, "admin add to bank haw RPC") };
    }
    return { success: true, data };
};


/**
 * Fungsi RPC untuk mentransfer dana dari BANK HAW ke shift pekerja.
 */
export const transferFromBankToShiftAPI = async (details) => {
    const {
        amount,
        shift_id,
        user_id,
        username,
        app_key,
        app_name,
        description,
        previous_balance,
        new_balance
    } = details;

    const { data, error } = await supabase.rpc('transfer_from_bank_to_shift', {
        p_amount: amount,
        p_shift_id: shift_id,
        p_user_id: user_id,
        p_username: username,
        p_app_key: app_key,
        p_app_name: app_name,
        p_description: description,
        p_previous_balance: previous_balance,
        p_new_balance: new_balance
    });

    if (error) {
        return { success: false, error: handleSupabaseError(error, "transferring from bank to shift RPC") };
    }
    return { success: true, data };
};

/**
 * Fungsi RPC untuk mentransfer dana dari shift pekerja KEMBALI ke BANK HAW.
 */
export const transferFromShiftToBankAPI = async (details) => {
    const {
        amount,
        shift_id,
        user_id,
        username,
        app_key,
        app_name,
        description,
        previous_balance,
        new_balance
    } = details;

    const { data, error } = await supabase.rpc('transfer_from_shift_to_bank', {
        p_amount: amount,
        p_shift_id: shift_id,
        p_user_id: user_id,
        p_username: username,
        p_app_key: app_key,
        p_app_name: app_name,
        p_description: description,
        p_previous_balance: previous_balance,
        p_new_balance: new_balance
    });

    if (error) {
        return { success: false, error: handleSupabaseError(error, "transferring from shift to bank RPC") };
    }
    return { success: true, data };
};