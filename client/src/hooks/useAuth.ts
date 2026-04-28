import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const setUserStore = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    let mounted = true;

    // 🟢 NOUVEAU : Fonction pour récupérer le profil complet (rôle, plan, status...)
    const fetchFullProfile = async (authUser: any) => {
      if (!authUser) return null;
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) throw error;
        
        // On fusionne les données d'authentification Supabase avec les colonnes de la table profiles
        return { ...authUser, ...profile };
      } catch (error) {
        console.error("Erreur lors de la récupération du profil complet :", error);
        return authUser; // On retourne au moins l'utilisateur de base en cas d'échec
      }
    };

    // 1. Récupération initiale de la session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (mounted) {
        if (error) console.error("Auth Error:", error.message);
        setSession(session);
        
        if (session?.user) {
          const fullUser = await fetchFullProfile(session.user);
          setUserStore(fullUser);
        } else {
          setUserStore(null);
        }
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Écoute des changements d'état
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session);
        
        if (session?.user) {
          // On s'assure de récupérer le profil même quand l'utilisateur vient de se connecter
          const fullUser = await fetchFullProfile(session.user);
          setUserStore(fullUser);
        } else {
          setUserStore(null);
        }
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