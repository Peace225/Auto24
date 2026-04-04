export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  condition: 'Neuf' | 'Occasion';
  oem_reference: string;
  category_id: string;
  vehicle_id?: string | null;
  vendor_id: string;
  image_url: string;
  is_boosted: boolean;
  // Champs optionnels synchronisés avec les filtres du catalogue
  brand: string; // Mis en requis car essentiel pour le filtrage SpaceAuto24
  in_stock: boolean; // Mis en requis pour la gestion du bouton panier
  is_certified?: boolean;
  // Spécificités huiles (MotorOil)
  viscosity?: string | null; 
  capacity?: string | number | null;  
  // Spécificités pneus et accessoires
  dimensions?: string | null;
  spec?: string | null;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year_start: number;
  year_end: number | string; // Parfois "Présent" ou "2026"
}

export interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  plan_type: 'freemium' | 'pro';
  verified_badge: boolean;
  vendor_status?: 'pending' | 'approved' | 'rejected';
  commune?: string;
}

export interface Garage {
  id: string;
  name: string;
  commune: string;
  address?: string;
  rating: number; // Requis pour le rendu des étoiles
  reviews_count?: number;
  // Correction CRITIQUE : synchronisation avec 'specialties' (tableau) du service
  specialties: string[]; 
  is_certified: boolean;
  whatsapp_number: string;
  image_url: string; // Requis pour l'affichage des cartes garages
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  sub_categories: string[];
}