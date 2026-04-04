export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  condition: 'Neuf' | 'Occasion';
  oem_reference: string;
  category_id: string;
  vehicle_id?: string;
  vendor_id: string;
  image_url: string;
  is_boosted: boolean;
  // Champs optionnels pour la flexibilité du catalogue
  brand?: string;
  in_stock?: boolean;
  is_certified?: boolean;
  viscosity?: string; 
  capacity?: string;  
  dimensions?: string;
  spec?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year_start: number;
  year_end: number;
}

export interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  plan_type: 'freemium' | 'pro';
  verified_badge: boolean;
  vendor_status?: string;
}

export interface Garage {
  id: string;
  name: string;
  commune: string;
  specialty: string;
  is_certified: boolean;
  whatsapp_number: string;
}

export interface Category {
  id: string;
  name: string;
  sub_categories: string[];
}