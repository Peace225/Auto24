// src/store/useCartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getPublicPrice } from '../utils/pricing'; // 🟢 Utilise les paliers (5%, 8%, 10%, 12%)
import type { Product, CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  
  // 🟢 Getters sécurisés pour la facturation
  getBaseTotal: () => number;   // Somme des prix de base (Vendeurs)
  getTotalPrice: () => number;  // Somme des prix publics TTC (Client)
  getServiceFee: () => number;  // Marge totale générée (SpaceAuto24)
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // --- Gestion de l'interface ---
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // --- Actions sur les articles ---
      addToCart: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            ),
            isOpen: true
          });
        } else {
          set({ 
            // On conserve l'original_price pour recalculer les paliers à tout moment
            items: [...items, { ...product, quantity: 1 }], 
            isOpen: true 
          });
        }
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: quantity <= 0 
            ? state.items.filter((item) => item.id !== productId)
            : state.items.map((item) => 
                item.id === productId ? { ...item, quantity } : item
              )
        }));
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      clearCart: () => set({ items: [], isOpen: false }),

      // --- Logique de calcul (Getters) ---
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      /**
       * 🟢 1. Le prix de base total
       * Représente ce que les vendeurs attendent (sans la commission plateforme)
       */
      getBaseTotal: () => {
        return get().items.reduce((total, item: any) => {
          const basePrice = item.original_price || item.price || 0;
          return total + (basePrice * item.quantity);
        }, 0);
      },

      /**
       * 🟢 2. Le prix public total TTC
       * C'est le prix final payé par le client. 
       * Il applique la fonction de paliers sur chaque article individuellement.
       */
      getTotalPrice: () => {
        return get().items.reduce((total, item: any) => {
          const basePrice = item.original_price || item.price || 0;
          
          // La fonction de paliers est appliquée ici pour garantir la cohérence
          const finalPrice = getPublicPrice(basePrice);
          
          return total + (finalPrice * item.quantity);
        }, 0);
      },

      /**
       * 🟢 3. Calcul de la marge (Frais de service)
       * Différence exacte entre le TTC payé par le client et le prix brut des vendeurs.
       */
      getServiceFee: () => {
        const publicTotal = get().getTotalPrice();
        const baseTotal = get().getBaseTotal();
        return publicTotal - baseTotal;
      },
    }),
    {
      name: 'spaceauto24-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Persistance uniquement des articles pour éviter les bugs d'UI au refresh
      partialize: (state) => ({ items: state.items }), 
    }
  )
);