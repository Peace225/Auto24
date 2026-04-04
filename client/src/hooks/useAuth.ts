import { useState, useEffect } from 'react';
// Correction TS6196 & TS1484 : Utilisation de "import type" 
// et suppression des types inutilisés si nécessaire
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Utilisation directe du store pour la source de vérité
  const setUserStore = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    let mounted = true;

    // 1. Récupération initiale de la session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (mounted) {
        if (error) console.error("Auth Error:", error.message);
        setSession(session);
        setUserStore(session?.user ?? null);
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Écoute des changements d'état (Login, Logout, Token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUserStore(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUserStore]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Le store est déjà nettoyé par onAuthStateChange, 
      // mais on peut forcer ici par précaution
      setUserStore(null); 
    } catch (error: any) {
      console.error("Logout failed:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    session, 
    user, 
    loading, 
    signOut,
    isAuthenticated: !!user 
  };
}