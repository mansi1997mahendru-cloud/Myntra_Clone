import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingCart, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  original_price: number;
  icon: string;
  images_list?: string;
  discount: string;
  brand: string;
  category: string;
  description: string;
  stock: number;
}

interface WishlistItem {
  id: number;
  product_id: number;
  product: Product;
}

export const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/wishlist/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        throw new Error("Failed to load wishlist");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while loading wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const handleRemove = async (productId: number) => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:8000/api/wishlist/${user.uid}/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setItems(items.filter(item => item.product_id !== productId));
      }
    } catch (err) {
      console.error("Failed to remove item from wishlist", err);
    }
  };

  const handleMoveToCart = (product: Product) => {
    addToCart(product);
    handleRemove(product.id);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col justify-center items-center text-center space-y-4 min-h-[calc(100vh-200px)]">
        <Heart className="h-12 w-12 text-rose-500" />
        <h3 className="font-extrabold text-neutral-800 text-lg">Access Denied</h3>
        <p className="text-xs text-neutral-500 font-semibold max-w-[280px]">
          Please sign in to view and configure your saved products wishlist.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="py-3 px-6 bg-yellow-400 text-neutral-900 font-extrabold rounded-xl shadow-md text-xs active:scale-95 transition-transform"
        >
          Login Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20 text-left">
      <div className="flex items-center space-x-2">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-neutral-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-neutral-600" />
        </button>
        <h1 className="text-xl md:text-2xl font-black text-neutral-900">Your Saved Wishlist</h1>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-48 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <span className="text-xs text-neutral-500 font-semibold">Loading Wishlist...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2 text-rose-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs font-semibold">{error}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <Heart className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-neutral-800 text-base">Wishlist is Empty</h3>
            <p className="text-xs text-neutral-500 font-semibold max-w-[280px]">
              Tap the heart icon on any product page to save your favorite items here!
            </p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="py-3 px-6 bg-yellow-400 text-neutral-900 font-extrabold rounded-xl shadow-md text-xs active:scale-95 transition-transform"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {items.map(({ product }) => (
            <div 
              key={product.id}
              className="bg-white rounded-2xl border border-neutral-150 p-3.5 flex flex-col justify-between shadow-sm hover:shadow transition-all text-left relative group"
            >
              {/* Delete Icon overlay */}
              <button 
                onClick={() => handleRemove(product.id)}
                className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-rose-50 hover:text-rose-600 text-neutral-400 p-1.5 rounded-lg border border-neutral-250 shadow-sm transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Clickable Image block */}
              <div 
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white rounded-xl h-36 flex items-center justify-center mb-2.5 relative cursor-pointer overflow-hidden p-2 group-hover:scale-105 transition-all duration-200"
              >
                <img 
                  src={product.icon} 
                  alt={product.name} 
                  className="h-[75%] w-[75%] object-contain mix-blend-multiply" 
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop";
                  }}
                />
                {product.discount && (
                  <span className="absolute top-0.5 left-0.5 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                    {product.discount}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <h4 
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="text-xs font-extrabold text-neutral-800 line-clamp-1 cursor-pointer hover:text-yellow-600 transition-colors"
                >
                  {product.name}
                </h4>
                <p className="text-[10px] text-neutral-500 font-semibold">{product.size}</p>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-neutral-900">₹{product.price}</span>
                    {product.original_price > product.price && (
                      <span className="text-[9px] text-neutral-400 line-through">₹{product.original_price}</span>
                    )}
                  </div>

                  <button 
                    onClick={() => handleMoveToCart(product)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-black text-[10px] px-2 py-1 rounded-lg active:scale-95 transition-transform flex items-center space-x-1"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    <span>ADD</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
