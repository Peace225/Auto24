// src/services/vendorService.ts
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Database } from '../types/database.types';

type ProductInsert = Database['public']['Tables']['products']['Insert'];

export const vendorService = {
  /**
   * Récupère les statistiques du vendeur (Nombre de produits, Total stock, etc.)
   */
  getDashboardStats: async (vendorId: string) => {
    try {
      // On récupère tous les produits de ce vendeur
      const { data, count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('vendor_id', vendorId);

      if (error) throw error;

      // Calcul simple des stats
      const totalProducts = count || 0;
      const totalStockValue = data?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
      const boostedItems = data?.filter(item => item.is_boosted).length || 0;

      return {
        totalProducts,
        totalStockValue,
        boostedItems,
        recentProducts: data?.slice(0, 5) // Les 5 derniers produits
      };
    } catch (error) {
      console.error("Erreur stats vendeur:", error);
      return null;
    }
  },

  /**
   * Ajoute un nouveau produit à la marketplace
   */
  addProduct: async (productData: ProductInsert) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erreur ajout produit:", error);
      throw error;
    }
  },

  /**
   * Supprime un produit (Gestion du stock)
   */
  deleteProduct: async (productId: string, vendorId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .match({ id: productId, vendor_id: vendorId }); // Sécurité: le vendeur ne supprime que ses pièces

    if (error) throw error;
    return true;
  }
};