// src/services/productService.ts
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types'; 
import type { Product } from '../types';

type ProductRow = Database['public']['Tables']['products']['Row'];

export const productService = {
  /**
   * Récupère les produits avec filtres avancés
   */
  getProducts: async (filters?: { 
    category_id?: string; 
    category_name?: string; // 🟢 NOUVEAU : Permet de cibler un rayon spécifique
    searchTerm?: string;
    is_boosted?: boolean;
  }): Promise<Product[]> => {
    try {
      // 🟢 CORRECTION CRUCIALE : Ajout de "!inner"
      // Cela dit à Supabase : "Ramène le produit UNIQUEMENT si la catégorie correspond à mon filtre"
      let query = supabase
        .from('products')
        .select('*, categories!inner(id, name)');

      // 1. Filtre par ID de catégorie
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      // 2. 🟢 Filtre hyper précis par NOM de catégorie
      if (filters?.category_name) {
        query = query.eq('categories.name', filters.category_name);
      }

      // 3. Filtre "À la Une"
      if (filters?.is_boosted) {
        query = query.eq('is_boosted', true);
      }

      // 4. Recherche texte (Le cœur de ta précision)
      if (filters?.searchTerm) {
        const term = `%${filters.searchTerm}%`;
        // Cherche le mot exact dans le nom du produit, sa référence OEM, OU sa marque
        query = query.or(`name.ilike.${term},oem_reference.ilike.${term},brand.ilike.${term}`);
      }

      // On trie par date de création pour avoir les nouveautés en premier
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Product[];
    } catch (error) {
      console.error("Erreur getProducts:", error);
      return [];
    }
  },

  /**
   * Récupère un produit détaillé
   */
  getProductById: async (id: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error(`Erreur getProductById (${id}):`, error);
      return null;
    }
  },

  /**
   * Pour le VendorDashboard : Créer une annonce
   */
  createProduct: async (product: Database['public']['Tables']['products']['Insert']): Promise<ProductRow | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erreur création produit:", error);
      return null;
    }
  }
};