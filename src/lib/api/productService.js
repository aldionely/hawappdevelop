import { supabase } from "@/lib/supabaseClient";
import { handleSupabaseError } from "@/lib/errorHandler";

export const fetchProductsAPI = async () => {
  const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
  if (error) return { success: false, error: handleSupabaseError(error, "fetching products API") };
  return { success: true, data: data || [] };
};

export const addProductAPI = async (productData) => {
  const { data, error } = await supabase.from('products').insert([productData]).select();
  if (error) return { success: false, error: handleSupabaseError(error, "adding product API") };
  return { success: true, data: data ? data[0] : null };
};

export const updateProductAPI = async (productId, productData) => {
  const { data, error } = await supabase.from('products').update(productData).eq('id', productId).select();
  if (error) return { success: false, error: handleSupabaseError(error, "updating product API") };
  return { success: true, data: data ? data[0] : null };
};

export const removeProductAPI = async (productId) => {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) return { success: false, error: handleSupabaseError(error, "removing product API") };
  return { success: true };
};