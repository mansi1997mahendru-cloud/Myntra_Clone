import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Minus, Plus, Clock } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  originalPrice: number;
  icon: string;
  discount: string;
  brand?: string;
  category?: string;
  stock?: number;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { cartItems, addToCart, removeFromCart } = useCart();

  const cartItem = cartItems.find((item) => String(item.id) === String(product.id));
  const qty = cartItem ? cartItem.qty : 0;

  return (
    <div className="w-44 flex-shrink-0 bg-white rounded-2xl border border-neutral-150 p-3.5 flex flex-col justify-between shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-left relative group">
      
      {/* 1. Image Container (centered, white bg, high visibility sizing) */}
      <div 
        onClick={() => navigate(`/product/${product.id}`)}
        className="bg-white rounded-xl h-40 w-full flex items-center justify-center mb-2.5 relative cursor-pointer overflow-hidden p-1 group-hover:scale-105 transition-transform duration-200"
      >
        <img 
          src={product.icon} 
          alt={product.name} 
          loading="lazy" 
          className="h-[90%] w-[90%] object-contain select-none mix-blend-multiply"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop";
          }}
        />
        
        {/* Discount Badge */}
        {product.discount && (
          <span className="absolute top-0.5 left-0.5 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
            {product.discount}
          </span>
        )}
      </div>

      {/* 2. Info Block */}
      <div className="flex-grow flex flex-col justify-between space-y-1">
        <div>
          {/* Delivery ETA */}
          <div className="flex items-center space-x-1 text-[8.5px] text-neutral-450 font-black uppercase tracking-wider mb-1">
            <Clock className="h-3 w-3 text-neutral-400" />
            <span>10 MINS</span>
          </div>

          {/* Product Name */}
          <h4 
            onClick={() => navigate(`/product/${product.id}`)}
            className="text-xs font-extrabold text-neutral-800 line-clamp-2 h-8 leading-snug cursor-pointer hover:text-yellow-600 transition-colors"
          >
            {product.name}
          </h4>
          
          {/* Weight / Pack size */}
          <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">{product.size}</p>
        </div>

        {/* 3. Pricing & ADD CTA Row */}
        <div className="flex justify-between items-center pt-2.5 mt-auto">
          <div className="flex flex-col">
            <span className="text-xs font-black text-neutral-900">₹{product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-[9px] text-neutral-400 line-through">₹{product.originalPrice}</span>
            )}
          </div>

          {qty > 0 ? (
            <div className="bg-emerald-600 text-white rounded-lg flex items-center overflow-hidden shadow-sm border border-emerald-700">
              <button 
                onClick={() => removeFromCart(product.id)}
                className="px-2 py-1 text-xs font-black hover:bg-emerald-700 transition-colors"
              >
                <Minus className="h-3 w-3 stroke-[3]" />
              </button>
              <span className="px-1.5 py-1 text-xs font-black min-w-[12px] text-center select-none">{qty}</span>
              <button 
                onClick={() => addToCart(product)}
                className="px-2 py-1 text-xs font-black hover:bg-emerald-700 transition-colors"
                disabled={qty >= (product.stock || 15)}
              >
                <Plus className="h-3 w-3 stroke-[3]" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => addToCart(product)}
              className="bg-[#f7fdf7] hover:bg-[#318625] text-[#318625] hover:text-white border border-[#318625] font-black text-[11px] px-3.5 py-1 rounded-lg active:scale-95 transition-all flex items-center space-x-1 shadow-sm cursor-pointer"
            >
              <span>ADD</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
