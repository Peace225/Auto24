import { supabase } from '../lib/supabase';
import type { Product } from '../types';

export const productService = {
  getProducts: async (filters?: { 
    category_id?: string; 
    category_name?: string;
    searchTerm?: string;
  }): Promise<Product[]> => {
    try {
      // Jointure standard (Left Join) pour inclure les produits sans catégorie
      let query = supabase
        .from('products')
        .select('*, categories(id, name)')
        .eq('status', 'approved');

      // Filtrage par ID
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      // Filtrage par nom de catégorie
      if (filters?.category_name) {
        query = query.eq('categories.name', filters.category_name);
      }

      // Recherche multi-colonnes robuste
      if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
        const term = `%${filters.searchTerm}%`;
        query = query.or(`name.ilike.${term},oem_reference.ilike.${term},brand.ilike.${term},vehicle_model.ilike.${term}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Product[];
    } catch (error) {
      console.error("Erreur critique dans productService:", error);
      return [];
    }
  }
};