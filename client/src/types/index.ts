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
  
  // 🟢 CORRECTION : Support d'une ou plusieurs images pour correspondre à Supabase
  image_url?: string; 
  images?: string[]; 
  
  is_boosted: boolean;
  // Champs optionnels synchronisés avec les filtres du catalogue
  brand: string; 
  in_stock: boolean; 
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
  
  // 🟢 CORRECTION : Alignement avec nos 3 packages vendeurs
  plan_type: 'free' | 'pro' | 'premium'; 
  
  verified_badge: boolean;
  vendor_status?: 'unverified' | 'pending' | 'approved' | 'rejected'; // Ajout de 'unverified'
  commune?: string;
}

export interface Garage {
  id: string;
  name: string;
  commune: string;
  address?: string;
  rating: number; 
  reviews_count?: number;
  specialties: string[]; 
  is_certified: boolean;
  whatsapp_number: string;
  image_url: string; 
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  sub_categories: string[];
}