// src/hooks/useVehicles.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useVehicles() {
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        // 🟢 On récupère les marques uniques depuis la table 'vehicles'
        // .select('make') récupère uniquement la colonne des marques
        const { data, error } = await supabase
          .from('vehicles')
          .select('make');

        if (error) throw error;

        if (data) {
          // 🟢 Astuce : On utilise Set pour supprimer les doublons (ex: plusieurs "Toyota")
          const uniqueBrands = Array.from(new Set(data.map(v => v.make))).sort();
          setBrands(uniqueBrands);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des marques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  return { brands, loading };
}