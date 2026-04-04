// src/types/database.types.ts

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          price: number;
          condition: 'Neuf' | 'Occasion';
          oem_reference: string;
          category_id: string | null;
          vehicle_id: string | null;
          vendor_id: string | null;
          image_url: string | null;
          is_boosted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string; // Optionnel car auto-généré
          name: string;
          price: number;
          condition: 'Neuf' | 'Occasion';
          oem_reference: string;
          category_id?: string | null;
          vehicle_id?: string | null;
          vendor_id?: string | null;
          image_url?: string | null;
          is_boosted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          condition?: 'Neuf' | 'Occasion';
          oem_reference?: string;
          category_id?: string | null;
          vehicle_id?: string | null;
          vendor_id?: string | null;
          image_url?: string | null;
          is_boosted?: boolean;
          created_at?: string;
        };
      };
    };
  };
}