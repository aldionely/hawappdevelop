import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

export const fetchInventoryLogsAPI = async () => {
  const { data, error } = await supabase
    .from('inventory_logs')
    .select(`*, accessories (name, item_code)`)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: handleSupabaseError(error, "fetching inventory logs") };
  return { success: true, data: data || [] };
};

export const logInventoryChangeAPI = async (logDetails) => {
    const { data, error } = await supabase.rpc('log_inventory_change', {
        p_accessory_id: logDetails.accessory_id,
        p_shift_id: logDetails.shift_id,
        p_actor: logDetails.actor,
        p_location: logDetails.location,
        p_activity_type: logDetails.activity_type,
        p_quantity_change: logDetails.quantity_change,
        p_from_location: logDetails.from_location,
        p_to_location: logDetails.to_location,
        p_notes: logDetails.notes
    });

    if (error) return { success: false, error: handleSupabaseError(error, "logging inventory change") };
    return { success: true, data };
};