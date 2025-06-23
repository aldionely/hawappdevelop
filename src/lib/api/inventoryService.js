import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

// Mengambil semua data dari tabel location_inventory
export const fetchLocationInventoryAPI = async () => {
  const { data, error } = await supabase.from('location_inventory').select('*');
  if (error) return { success: false, error: handleSupabaseError(error, "fetching location inventory API") };
  return { success: true, data: data || [] };
};

// Menambah data stok awal saat barang baru dibuat
export const addInitialInventoryAPI = async (accessoryId, location, stock) => {
  const { data, error } = await supabase.from('location_inventory').insert([
    { accessory_id: accessoryId, location: location, stock: stock }
  ]);
  if (error) return { success: false, error: handleSupabaseError(error, "adding initial inventory API") };
  return { success: true, data };
};

// Memanggil fungsi 'transfer_stock' di database untuk memindahkan stok
export const transferStockAPI = async (transferDetails) => {
  const { accessory_id, from_location, to_location, quantity, transferred_by } = transferDetails;

  const { data, error } = await supabase.rpc('transfer_stock', {
    p_accessory_id: accessory_id,
    p_from_location: from_location,
    p_to_location: to_location,
    p_quantity: quantity,
    p_transferred_by: transferred_by
  });

  if (error) {
    const errorMessage = error.message || "Gagal mentransfer stok.";
    return { success: false, error: handleSupabaseError({ message: errorMessage }, "transfer stock RPC") };
  }

  return { success: true, data };
};