import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

// Mengambil semua data aksesoris
export const fetchAccessoriesAPI = async () => {
  const { data, error } = await supabase.from('accessories').select('*').order('name', { ascending: true });
  if (error) return { success: false, error: handleSupabaseError(error, "fetching accessories API") };
  return { success: true, data: data || [] };
};

// Menambah aksesoris baru
export const addAccessoryAPI = async (accessoryData) => {
  const { data, error } = await supabase.from('accessories').insert([accessoryData]).select();
  if (error) return { success: false, error: handleSupabaseError(error, "adding accessory API") };
  return { success: true, data: data ? data[0] : null };
};

// Memperbarui data aksesoris
export const updateAccessoryAPI = async (accessoryId, accessoryData) => {
  const { data, error } = await supabase.from('accessories').update(accessoryData).eq('id', accessoryId).select();
  if (error) return { success: false, error: handleSupabaseError(error, "updating accessory API") };
  return { success: true, data: data ? data[0] : null };
};

// Menghapus aksesoris
export const removeAccessoryAPI = async (accessoryId) => {
  const { error } = await supabase.from('accessories').delete().eq('id', accessoryId);
  if (error) return { success: false, error: handleSupabaseError(error, "removing accessory API") };
  return { success: true };
};

export const updateAccessoryStockAPI = async (params) => {
    const { accessoryId, quantityChanged, transactionType, description, userId, username, shiftId } = params;
    
    // Payload ini harus cocok dengan parameter fungsi RPC Anda di Supabase
    const payload = {
        p_accessory_id: accessoryId,
        p_quantity_changed: quantityChanged,
        p_transaction_type: transactionType,
        p_description: description,
        p_user_id: userId,
        p_username: username,
        // Ini adalah perbaikan penting untuk menghindari error ambiguitas
        p_shift_id: shiftId || null 
    };

    // Panggil fungsi RPC 'log_inventory_change' di Supabase
    const { data, error } = await supabase.rpc('log_inventory_change', payload);

    if (error) {
        // Log error lengkap untuk debugging
        console.error("Full RPC Error (Accessory):", JSON.stringify(error, null, 2));
        return { success: false, error: handleSupabaseError(error, "updating accessory stock RPC") };
    }
    return { success: true, data };
};