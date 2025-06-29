import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

// Mengambil semua data permintaan
export const fetchStockRequestsAPI = async () => {
  const { data, error } = await supabase
    .from('stock_requests')
    .select(`
      *,
      accessories (
        name,
        item_code
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: handleSupabaseError(error, "fetching stock requests") };
  return { success: true, data: data || [] };
};

// Membuat permintaan baru
export const createStockRequestAPI = async (requestData) => {
  const { data, error } = await supabase
    .from('stock_requests')
    .insert([requestData])
    .select();

  if (error) return { success: false, error: handleSupabaseError(error, "creating stock request") };
  return { success: true, data: data ? data[0] : null };
};

// Memperbarui status permintaan (approve/reject)
export const updateStockRequestStatusAPI = async (requestId, status, handledBy) => {
  const { data, error } = await supabase
    .from('stock_requests')
    .update({ 
      status: status, 
      handled_by: handledBy,
      handled_at: new Date().toISOString() 
    })
    .eq('id', requestId)
    .select();

  if (error) return { success: false, error: handleSupabaseError(error, "updating stock request status") };
  return { success: true, data: data ? data[0] : null };
};