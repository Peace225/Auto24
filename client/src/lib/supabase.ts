// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Erreur: Variables d'environnement Supabase manquantes");
}

export const supabase = createClient<Database>(
  supabaseUrl || "", 
  supabaseAnonKey || ""
);

// --- LOGIQUE DE RÔLES (Helper Functions) ---

/**
 * Récupère le profil complet de l'utilisateur connecté
 */
export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles') // Ta table profil dans Supabase
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error("Erreur profil:", error.message);
    return null;
  }
  return data;
};

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 * Roles possibles: 'customer', 'vendor', 'admin'
 */
export const checkRole = async (requiredRole: 'customer' | 'vendor' | 'admin') => {
  const profile = await getUserProfile();
  return profile?.role === requiredRole;
};