// src/store/useCartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, CartItem } from '../types';

// 🟢 CONFIGURATION DE TA MARGE (0.01 = 1% de frais de service)
const SERVICE_FEE_RATE = 0.01;

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
  getTotalPrice: () => number;
  getServiceFee: () => number; // 👈 Fonction pour calculer ta marge
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // --- Gestion de l'affichage ---
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // --- Actions sur le panier ---
      addToCart: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          // Si l'article existe, on augmente juste la quantité
          set({
            items: items.map((item) =>
              item.id === product.id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            ),
            isOpen: true // On ouvre le panier pour confirmer l'ajout
          });
        } else {
          // Si c'est un nouvel article
          set({ 
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

      // --- Calculs (Getters) ---
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Le prix des pièces (Ce qui revient au vendeur)
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      // 🟢 Calcul automatique des frais de service (Ce qui revient à SpaceAuto24)
      getServiceFee: () => {
        return Math.round(get().getTotalPrice() * SERVICE_FEE_RATE);
      },
    }),
    {
      name: 'spaceauto24-cart-storage', // Nom unique dans le localStorage
      storage: createJSONStorage(() => localStorage),
      // On ne sauvegarde QUE les items, pas l'état "isOpen" 
      // pour éviter que le panier s'ouvre tout seul au rafraîchissement.
      partialize: (state) => ({ items: state.items }), 
    }
  )
);