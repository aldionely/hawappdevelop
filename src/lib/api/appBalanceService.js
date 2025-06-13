import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

export const fetchAppBalanceLogsAPI = async (shiftId) => {
  if (!shiftId) return { success: false, error: "Shift ID is required." };
  
  const { data, error } = await supabase
    .from('app_balance_logs')
    .select('*')
    .eq('shift_id', shiftId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: handleSupabaseError(error, "fetching app balance logs") };
  }
  return { success: true, data: data || [] };
};

export const logAppBalanceUpdateAPI = async (logData) => {
  const { data, error } = await supabase
    .from('app_balance_logs')
    .insert([logData])
    .select()
    .single();
  
  if (error) {
    return { success: false, error: handleSupabaseError(error, "logging app balance update") };
  }
  return { success: true, data: data };
};