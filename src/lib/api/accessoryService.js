// File: src/lib/api/accessoryService.js

import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

// Fungsi ini TIDAK BERUBAH
export const fetchAccessoriesAPI = async () => {
  const { data, error } = await supabase.from('accessories').select('*').order('name', { ascending: true });
  if (error) return { success: false, error: handleSupabaseError(error, "fetching accessories API") };
  return { success: true, data: data || [] };
};

// --- GANTI FUNGSI addAccessoryAPI DENGAN INI ---
// Memanggil fungsi RPC baru yang kita buat
export const addAccessoryAPI = async (accessoryData) => {
  const payload = {
    p_item_code: accessoryData.item_code,
    p_name: accessoryData.name,
    p_category: accessoryData.category,
    p_brand: accessoryData.brand,
    p_model: accessoryData.model,
    p_cost_price: accessoryData.cost_price,
    p_sell_price: accessoryData.sell_price,
    p_warehouse_stock: accessoryData.warehouse_stock,
    p_actor: accessoryData.actor
  };

  const { data, error } = await supabase.rpc('create_accessory_with_initial_stock', payload);

  if (error) {
    // Jika kode barang sudah ada, database akan mengembalikan error. Kita tangkap di sini.
    if (error.message.includes('duplicate key value violates unique constraint "accessories_item_code_key"')) {
        return { success: false, error: { message: "Gagal: Kode Barang sudah ada dan harus unik." } };
    }
    return { success: false, error: handleSupabaseError(error, "creating accessory with RPC") };
  }
  return { success: true, data: data };
};


// Fungsi ini TIDAK BERUBAH
export const updateAccessoryAPI = async (accessoryId, accessoryData) => {
  const { data, error } = await supabase.from('accessories').update(accessoryData).eq('id', accessoryId).select();
  if (error) return { success: false, error: handleSupabaseError(error, "updating accessory API") };
  return { success: true, data: data ? data[0] : null };
};

// Fungsi ini TIDAK BERUBAH
export const removeAccessoryAPI = async (accessoryId) => {
  const { error } = await supabase.from('accessories').delete().eq('id', accessoryId);
  if (error) return { success: false, error: handleSupabaseError(error, "removing accessory API") };
  return { success: true };
};

// Fungsi ini TIDAK BERUBAH
export const updateAccessoryStockAPI = async (params) => {
    const { accessoryId, quantityChanged, transactionType, description, userId, username, shiftId } = params;
    
    const payload = {
        p_accessory_id: accessoryId,
        p_quantity_changed: quantityChanged,
        p_transaction_type: transactionType,
        p_description: description,
        p_user_id: userId,
        p_username: username,
        p_shift_id: shiftId || null 
    };

    const { data, error } = await supabase.rpc('log_inventory_change', payload);

    if (error) {
        console.error("Full RPC Error (Accessory):", JSON.stringify(error, null, 2));
        return { success: false, error: handleSupabaseError(error, "updating accessory stock RPC") };
    }
    return { success: true, data };
};