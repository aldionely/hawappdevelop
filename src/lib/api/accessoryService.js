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