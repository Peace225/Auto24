import { supabase } from '../lib/supabase';

// 1. On définit l'interface pour qu'elle soit cohérente avec l'usage dans les composants
export interface Garage {
  id: string;
  name: string;
  commune: string;
  address?: string; // Optionnel pour éviter les erreurs si vide en DB
  rating: number;
  reviews_count?: number;
  specialties: string[]; // Doit être un tableau pour correspondre au composant
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
      // 2. Utilisation de .select('*') avec un retour typé explicitement pour Supabase
      let query = supabase
        .from('garages')
        .select('*');

      // Filtre par commune (Zone)
      if (filters?.commune && filters.commune !== 'Toutes les zones') {
        query = query.eq('commune', filters.commune);
      }

      // Filtre par spécialité
      // Note: On utilise .contains car 'specialties' est une colonne de type text[] ou jsonb en DB
      if (filters?.specialty && filters.specialty !== 'Toutes') {
        query = query.contains('specialties', [filters.specialty]);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erreur Query Supabase:", error.message);
        throw error;
      }

      // 3. Mapping de sécurité pour s'assurer que specialties est toujours un tableau
      // Cela évite l'erreur "Property specialties does not exist" au build
      const formattedData = (data || []).map(item => ({
        ...item,
        specialties: Array.isArray(item.specialties) ? item.specialties : []
      }));

      return formattedData as Garage[];
    } catch (error) {
      console.error("Erreur service garage SpaceAuto24:", error);
      return [];
    }
  }
};