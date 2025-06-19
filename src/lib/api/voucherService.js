import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

export const fetchVouchersAPI = async () => {
  const { data, error } = await supabase.from('vouchers').select('*').order('category').order('name');
  if (error) return { success: false, error: handleSupabaseError(error, "fetching vouchers API") };
  return { success: true, data: data || [] };
};

export const addVoucherAPI = async (voucherData) => {
  const { data, error } = await supabase.from('vouchers').insert([voucherData]).select();
  if (error) return { success: false, error: handleSupabaseError(error, "adding voucher API") };
  return { success: true, data: data ? data[0] : null };
};

export const updateVoucherAPI = async (voucherId, voucherData) => {
    const { data, error } = await supabase.from('vouchers').update(voucherData).eq('id', voucherId).select();
    if (error) return { success: false, error: handleSupabaseError(error, "updating voucher API") };
    return { success: true, data: data ? data[0] : null };
};

export const deleteVoucherAPI = async (voucherId) => {
    const { error } = await supabase.from('vouchers').delete().eq('id', voucherId);
    if (error) return { success: false, error: handleSupabaseError(error, "deleting voucher API") };
    return { success: true };
};

export const updateVoucherStockAPI = async (params) => {
    const { voucherId, quantityChanged, transactionType, description, userId, username, shiftId } = params;
    
    // Perubahan di sini: Pastikan p_shift_id selalu ada di payload
    const payload = {
        p_voucher_id: voucherId,
        p_quantity_changed: quantityChanged,
        p_transaction_type: transactionType,
        p_description: description,
        p_user_id: userId,
        p_username: username,
        p_shift_id: shiftId || null // Kirim null jika shiftId undefined
    };

    const { data, error } = await supabase.rpc('update_voucher_stock_and_log', payload);

    if (error) {
        // Log error lengkap untuk debugging jika terjadi lagi
        console.error("Full RPC Error:", JSON.stringify(error, null, 2));
        return { success: false, error: handleSupabaseError(error, "updating voucher stock RPC") };
    }
    return { success: true, data };
};

export const fetchVoucherLogsAPI = async (voucherId) => {
    const { data, error } = await supabase
        .from('voucher_transaction_logs')
        .select('*')
        .eq('voucher_id', voucherId)
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: handleSupabaseError(error, "fetching voucher logs API") };
    return { success: true, data: data || [] };
};