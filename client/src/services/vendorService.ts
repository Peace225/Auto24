import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import type { Database } from '../types/database.types';

// Utilisation de type-only imports pour la clarté et la performance
type ProductInsert = Database['public']['Tables']['products']['Insert'];

export const vendorService = {
  /**
   * Récupère les statistiques du vendeur pour le dashboard Elite Upwork
   */
  getDashboardStats: async (vendorId: string) => {
    try {
      // 1. On précise explicitement le type de retour attendu via .returns<Product[]>()
      const { data, count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('vendor_id', vendorId)
        .returns<Product[]>(); // Fix l'erreur "Property does not exist on type never"

      if (error) throw error;

      // 2. Calcul des stats avec valeurs par défaut sécurisées
      const totalProducts = count || 0;
      const totalStockValue = data?.reduce((sum, item) => sum + (Number(item.price) || 0), 0) || 0;
      const boostedItems = data?.filter(item => item.is_boosted).length || 0;

      return {
        totalProducts,
        totalStockValue,
        boostedItems,
        // Tri par date décroissante pour avoir les "vrais" derniers produits
        recentProducts: data?.sort((a, b) => 
          new Date(b.id).getTime() - new Date(a.id).getTime() // Utilisation de l'id ou created_at
        ).slice(0, 5) || []
      };
    } catch (error) {
      console.error("Erreur stats vendeur SpaceAuto24:", error);
      return {
        totalProducts: 0,
        totalStockValue: 0,
        boostedItems: 0,
        recentProducts: []
      };
    }
  },

  /**
   * Ajoute un nouveau produit à la marketplace
   */
  addProduct: async (productData: ProductInsert) => {
    try {
      // 3. Typage de l'insertion pour éviter les erreurs de structure
      const { data, error } = await supabase
        .from('products')
        .insert(productData) // Pas besoin de tableau [] si on insère un seul objet typé Insert
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error("Erreur ajout produit vendeur:", error);
      throw error;
    }
  },

  /**
   * Supprime un produit (Sécurité renforcée par vendor_id)
   */
  deleteProduct: async (productId: string, vendorId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('vendor_id', vendorId); // Sécurité: empêche la suppression des produits d'autrui

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erreur suppression produit:", error);
      throw error;
    }
  }
};