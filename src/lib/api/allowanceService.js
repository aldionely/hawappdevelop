import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

// DIUBAH: Mengambil data melalui fungsi RPC yang aman
export const fetchAllowancesAPI = async () => {
  const { data, error } = await supabase.rpc('get_all_daily_allowances');
  if (error) return { success: false, error: handleSupabaseError(error, "fetching allowances via rpc") };
  return { success: true, data: data || [] };
};

// Fungsi ini sudah benar menggunakan RPC, jadi tidak perlu diubah
export const updateAllowanceAPI = async (username, amount) => {
  const { error } = await supabase
    .rpc('update_daily_allowance', {
      p_username: username,
      p_amount: amount
    });

  if (error) return { success: false, error: handleSupabaseError(error, "updating allowance via rpc") };
  return { success: true };
};