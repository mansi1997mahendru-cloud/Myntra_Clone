import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

export interface CartItem {
  id: number | string;
  name: string;
  size: string;
  price: number;
  original_price?: number;
  icon: string;
  discount?: string;
  qty: number;
  stock: number;
}

interface CartContextType {
  cartItems: CartItem[];
  itemCount: number;
  cartTotal: number;
  addToCart: (product: any) => void;
  removeFromCart: (productId: number | string) => void;
  updateQty: (productId: number | string, qty: number) => void;
  clearCart: () => void;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const syncTimeoutRef = useRef<any>(null);
  const isInitialLoad = useRef(true);

  // 1. Load Cart on startup or Auth session changes
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      isInitialLoad.current = true;

      if (!user) {
        // --- LOAD ANONYMOUS LOCAL CART ---
        const saved = localStorage.getItem('blinkit_cart_anon');
        if (saved) {
          try {
            setCartItems(JSON.parse(saved));
          } catch (e) {
            console.error('Error parsing local storage cart', e);
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
        setLoading(false);
      } else {
        // --- LOAD USER CART FROM POSTGRESQL ---
        try {
          const token = localStorage.getItem('access_token');
          const headers: any = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          
          const res = await fetch(`http://localhost:8000/api/cart/${user.uid}`, { headers });
          if (res.ok) {
            const data = await res.json();
            // Transform backend shape { product_id, qty, product } to flat CartItem list
            const loadedItems: CartItem[] = data.map((item: any) => ({
              id: item.product.id,
              name: item.product.name,
              size: item.product.size,
              price: item.product.price,
              original_price: item.product.original_price,
              icon: item.product.icon,
              discount: item.product.discount,
              qty: item.qty,
              stock: item.product.stock
            }));
            setCartItems(loadedItems);
          }
        } catch (e) {
          console.error('Error loading cart from backend:', e);
          // Local storage fallback for logged-in users if backend is unreachable
          const saved = localStorage.getItem(`blinkit_cart_${user.uid}`);
          if (saved) {
            setCartItems(JSON.parse(saved));
          }
        } finally {
          setLoading(false);
        }
      }
      
      // Delay disabling initial load flag to prevent immediate trigger loop on startup
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 100);
    };

    loadCart();
  }, [user]);

  // 2. Debounced sync cart data to backend or local storage on cartItems changes
  useEffect(() => {
    if (isInitialLoad.current) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (!user) {
        // Save anonymous cart locally
        localStorage.setItem('blinkit_cart_anon', JSON.stringify(cartItems));
      } else {
        // Save logged-in user cart locally for speed
        localStorage.setItem(`blinkit_cart_${user.uid}`, JSON.stringify(cartItems));

        // Push cart update payload to PostgreSQL
        try {
          const payload = cartItems.map((item) => ({
            product_id: typeof item.id === 'string' ? parseInt(item.id.replace(/\D/g, '')) || 1 : item.id,
            qty: item.qty
          }));

          const token = localStorage.getItem('access_token');
          const headers: any = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await fetch(`http://localhost:8000/api/cart/${user.uid}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
        } catch (e) {
          console.error('Failed to sync cart updates to PostgreSQL backend:', e);
        }
      }
    }, 400); // 400ms debounce buffer

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cartItems, user]);

  // Derived Values
  const itemCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Cart Operations
  const addToCart = (product: any) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => String(item.id) === String(product.id));
      if (idx > -1) {
        const next = [...prev];
        const newQty = next[idx].qty + 1;
        // Limit increment to stock constraints
        if (newQty <= next[idx].stock) {
          next[idx].qty = newQty;
        }
        return next;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            size: product.size,
            price: product.price,
            original_price: product.original_price || product.originalPrice,
            icon: product.icon,
            discount: product.discount,
            qty: 1,
            stock: product.stock || 15
          }
        ];
      }
    });
  };

  const removeFromCart = (productId: number | string) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => String(item.id) === String(productId));
      if (idx === -1) return prev;
      const next = [...prev];
      if (next[idx].qty > 1) {
        next[idx].qty -= 1;
        return next;
      } else {
        return next.filter((item) => String(item.id) !== String(productId));
      }
    });
  };

  const updateQty = (productId: number | string, qty: number) => {
    setCartItems((prev) => {
      if (qty <= 0) {
        return prev.filter((item) => String(item.id) !== String(productId));
      }
      return prev.map((item) => {
        if (String(item.id) === String(productId)) {
          return { ...item, qty: Math.min(qty, item.stock) };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCartItems([]);
    if (!user) {
      localStorage.removeItem('blinkit_cart_anon');
    } else {
      localStorage.removeItem(`blinkit_cart_${user.uid}`);
      fetch(`http://localhost:8000/api/cart/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      }).catch(err => console.error('Error clearing database cart', err));
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
