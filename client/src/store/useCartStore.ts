// src/store/useCartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '../types';

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  // Getters transformés en fonctions pures pour le store
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      
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

      // Fonctions de calcul (Zustand recommande de les garder simples)
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'spaceauto24-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // On ne persiste QUE les items. isOpen reviendra à false par défaut au reload.
      partialize: (state) => ({ items: state.items }), 
    }
  )
);