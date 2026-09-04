'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  cursoId: string;
  titulo: string;
  precio: number;
  imagenUrl?: string;
  slug: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (cursoId: string) => void;
  clear: () => void;
  isInCart: (cursoId: string) => boolean;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'suenos-cart';

// El carrito es puramente client-side (localStorage) — a diferencia de
// favoritos, no hace falta persistirlo en el servidor: es un estado
// transitorio hasta el checkout, y así funciona sin login también (recién
// se exige estar logueado al pagar, no al agregar al carrito).
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage inaccesible (modo privado, etc.) — arranca vacío.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // no pisar localStorage con [] antes de leerlo
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Idem — best-effort.
    }
  }, [items, hydrated]);

  const addItem = (item: CartItem) => {
    setItems((prev) => (prev.some((i) => i.cursoId === item.cursoId) ? prev : [...prev, item]));
  };

  const removeItem = (cursoId: string) => {
    setItems((prev) => prev.filter((i) => i.cursoId !== cursoId));
  };

  const clear = () => setItems([]);

  const isInCart = (cursoId: string) => items.some((i) => i.cursoId === cursoId);

  const total = items.reduce((sum, i) => sum + i.precio, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clear, isInCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
