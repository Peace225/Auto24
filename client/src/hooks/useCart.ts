// src/hooks/useCart.ts
import { useMemo } from 'react';
import { useCartStore } from '../store/useCartStore';

export function useCart() {
  const items = useCartStore((state) => state.items);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart); // 🟢 Utile après une commande
  const updateQuantity = useCartStore((state) => state.updateQuantity); // 🟢 Pour les boutons + / -

  // 🟢 Optimisation : On ne recalcule le prix que si les articles changent
  const totalPrice = useMemo(() => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [items]);

  // 🟢 Nombre total d'articles (ex: pour la bulle rouge sur l'icône du panier)
  const totalItemsCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  return { 
    items, 
    addToCart, 
    removeFromCart, 
    updateQuantity,
    clearCart,
    totalItemsCount, 
    totalPrice 
  };
}