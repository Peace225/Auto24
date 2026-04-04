import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 1. Définition d'une interface locale si tes types globaux ne sont pas chargés
interface VehicleRow {
  make: string;
}

export function useVehicles() {
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBrands = async () => {
      setLoading(true);
      try {
        // 2. On précise le type attendu <VehicleRow[]> pour éviter l'erreur 'never'
        const { data, error } = await supabase
          .from('vehicles')
          .select('make');

        if (error) throw error;

        if (data && isMounted) {
          // 3. Cast explicite pour garantir que 'v' possède la propriété 'make'
          const uniqueBrands = Array.from(
            new Set((data as VehicleRow[]).map(v => v.make))
          ).sort();
          
          setBrands(uniqueBrands);
        }
      } catch (error: any) {
        console.error('Erreur lors de la récupération des marques:', error.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  return { brands, loading };
}