// src/types/index.ts

/**
 * Interface Produit (Le cœur technique de SpaceAuto24)
 * Basée sur le modèle Oscaro pour garantir la compatibilité [cite: 5, 7]
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  condition: 'Neuf' | 'Occasion'; // Requis pour le marché ivoirien [cite: 25]
  oem_reference: string; // Référence OEM indispensable pour la précision [cite: 25]
  category_id: string;
  vehicle_id: string;
  vendor_id: string;
  image_url: string;
  is_boosted: boolean; // Gère les options "À la Une" via Mobile Money [cite: 43]
}

/**
 * Interface Véhicule (Segmentation Marché Ivoirien)
 * Focus sur le Top 10 des marques leaders en Côte d'Ivoire 
 */
export interface Vehicle {
  id: string;
  brand: 'Toyota' | 'Suzuki' | 'Hyundai' | 'Mercedes-Benz' | 'Kia' | 'Mitsubishi' | 'Nissan' | 'Mazda' | 'Ford' | 'Renault'; // 
  model: string; // Ex: Hilux, Land Cruiser Prado/V8, Ford Ranger T6/T8 [cite: 11]
  year_start: number;
  year_end: number;
}

/**
 * Interface Vendeur (Gestion Freemium/Pro)
 * Pour les boutiques de la Casse d'Adjamé ou de Marcory [cite: 39, 40]
 */
export interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  plan_type: 'freemium' | 'pro'; // [cite: 38, 40]
  verified_badge: boolean; // Indice de confiance SpaceAuto24 [cite: 20]
}

/**
 * Interface Garage Partenaire (Le Pack Confiance)
 * Permet le filtrage par commune d'Abidjan 
 */
export interface Garage {
  id: string;
  name: string;
  commune: 'Marcory' | 'Cocody' | 'Yopougon' | 'Treichville' | 'Plateau' | 'Adjamé' | string; // [cite: 19, 34]
  specialty: 'Électricité' | 'Mécanique lourde' | 'Tôlerie' | 'Pneumatiques'; // 
  is_certified: boolean; // Badge "Garages Certifiés SpaceAuto24" [cite: 20]
  whatsapp_number: string; // Levier n°1 de réassurance locale [cite: 21]
}

/**
 * Taxonomie des Pièces
 * Classification par familles fonctionnelles [cite: 13, 14, 15]
 */
export interface Category {
  id: string;
  name: 'Liaison au sol' | 'Organes Moteurs' | 'Électronique' | 'Carrosserie & Optiques'; // [cite: 14, 15, 16]
  sub_categories: string[]; // ex: ['Freinage', 'Suspension'] [cite: 14]
}