import { createClient } from "@supabase/supabase-js";
// On garde l'import type, mais on va ajouter une sécurité au cas où l'interface est incomplète
import type { Database } from "../types/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Erreur: Variables d'environnement Supabase manquantes");
}

// Initialisation du client avec le type Database
export const supabase = createClient<Database>(
  supabaseUrl || "", 
  supabaseAnonKey || ""
);

/**
 * Interface locale de secours pour le profil utilisateur
 * Cela garantit que TS connaît la propriété 'role' même si Database échoue
 */
export interface UserProfile {
  id: string;
  role: 'customer' | 'vendor' | 'admin';
  full_name?: string;
  avatar_url?: string;
  // Ajoute ici les autres champs de ta table 'profiles'
}

/**
 * Récupère le profil complet de l'utilisateur connecté
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Erreur récupération profil:", error.message);
      return null;
    }

    // On cast le résultat vers notre interface UserProfile pour garantir l'accès à .role
    return data as unknown as UserProfile;
  } catch (err) {
    console.error("Erreur inattendue getUserProfile:", err);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export const checkRole = async (requiredRole: 'customer' | 'vendor' | 'admin'): Promise<boolean> => {
  const profile = await getUserProfile();
  return profile?.role === requiredRole;
};