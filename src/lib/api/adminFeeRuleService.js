import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

export const fetchAdminFeeRulesAPI = async () => {
  const { data, error } = await supabase.from('admin_fee_rules').select('*').order('min_amount', { ascending: true });
  if (error) return { success: false, error: handleSupabaseError(error, "fetching admin fee rules API") };
  return { success: true, data: data || [] };
};

export const addAdminFeeRuleAPI = async (ruleData) => {
  const { data, error } = await supabase.from('admin_fee_rules').insert([ruleData]).select();
  if (error) return { success: false, error: handleSupabaseError(error, "adding admin fee rule API") };
  return { success: true, data: data ? data[0] : null };
};

export const updateAdminFeeRuleAPI = async (ruleId, ruleData) => {
  const { data, error } = await supabase.from('admin_fee_rules').update(ruleData).eq('id', ruleId).select();
  if (error) return { success: false, error: handleSupabaseError(error, "updating admin fee rule API") };
  return { success: true, data: data ? data[0] : null };
};

export const removeAdminFeeRuleAPI = async (ruleId) => {
  const { error } = await supabase.from('admin_fee_rules').delete().eq('id', ruleId);
  if (error) return { success: false, error: handleSupabaseError(error, "removing admin fee rule API") };
  return { success: true };
};