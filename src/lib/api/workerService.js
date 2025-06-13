import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

export const fetchWorkersAPI = async () => {
  const { data, error } = await supabase.from('workers').select('*');
  if (error) return { success: false, error: handleSupabaseError(error, "fetching workers API") };
  return { success: true, data: data || [] };
};

export const addWorkerAPI = async (workerData) => {
  const { data, error } = await supabase.from('workers').insert([workerData]).select();
  if (error) return { success: false, error: handleSupabaseError(error, "adding worker API") };
  return { success: true, data: data ? data[0] : null };
};

export const removeWorkerAPI = async (workerId, username) => {
  const { error: workerDeleteError } = await supabase.from('workers').delete().eq('id', workerId);
  if (workerDeleteError) return { success: false, error: handleSupabaseError(workerDeleteError, "deleting worker from workers table") };
  
  await supabase.from('active_shifts').delete().eq('username', username);
  await supabase.from('shift_archives').delete().eq('username', username);
  localStorage.removeItem(`shift_inprogress_${username}`);
  
  return { success: true };
};

export const updateWorkerPasswordAPI = async (workerId, newPassword) => {
  const { data, error } = await supabase
    .from('workers')
    .update({ password: newPassword })
    .eq('id', workerId)
    .select();
  if (error) return { success: false, error: handleSupabaseError(error, "updating worker password API") };
  return { success: true, data: data ? data[0] : null };
};