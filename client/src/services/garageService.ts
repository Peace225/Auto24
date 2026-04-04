// src/services/garageService.ts
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

// On définit une interface locale pour le Garage si elle n'est pas encore globale
export interface Garage {
  id: string;
  name: string;
  commune: string;
  address: string;
  rating: number;
  reviews_count: number;
  specialties: string[];
  is_certified: boolean;
  image_url: string;
  whatsapp_number: string;
}

export const garageService = {
  /**
   * Récupère les garages avec filtres depuis Supabase
   */
  getGarages: async (filters?: { commune?: string; specialty?: string }): Promise<Garage[]> => {
    try {
      let query = supabase.from('garages').select('*');

      // Filtre par commune (Zone)
      if (filters?.commune && filters.commune !== 'Toutes les zones') {
        query = query.eq('commune', filters.commune);
      }

      // Filtre par spécialité (recherche dans le tableau Postgres)
      if (filters?.specialty && filters.specialty !== 'Toutes') {
        query = query.contains('specialties', [filters.specialty]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Garage[];
    } catch (error) {
      console.error("Erreur getGarages:", error);
      return [];
    }
  }
};