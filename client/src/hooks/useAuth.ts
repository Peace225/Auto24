// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
// 🟢 CORRECTION : Utilisation de "import type" pour éviter les erreurs de module Vite
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore'; // On importe ton store global

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // On récupère la fonction pour mettre à jour le store global
  const setUserStore = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // 1. Récupérer la session active au chargement initial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserStore(session?.user ?? null); // Mise à jour du store global
      setLoading(false);
    });

    // 2. Écouter les changements en temps réel (Login, Logout, Refresh Token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserStore(session?.user ?? null); // Synchronisation automatique du store
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUserStore]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUserStore(null); // On nettoie le store manuellement par sécurité
    setLoading(false);
  };

  return { 
    session, 
    user, // Vient maintenant du store global (Source de vérité unique)
    loading, 
    signOut,
    isAuthenticated: !!user 
  };
}