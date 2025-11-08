import React, { createContext, useContext, useState } from 'react';
import { CartItem, MenuItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (menuItem: MenuItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const total = items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  const addToCart = (menuItem: MenuItem) => {
    setItems(prev => {
      const existingItem = prev.find(item => item._id === menuItem._id);
      if (existingItem) {
        return prev.map(item =>
          item._id === menuItem._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { _id: menuItem._id, quantity: 1, menuItem }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item._id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item._id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
};