import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Plus, Minus, ArrowLeft, AlertCircle, Sparkles, ShieldCheck, Heart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  original_price: number;
  icon: string;
  discount: string;
  brand: string;
  category: string;
  description: string;
  stock: number;
}

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data states
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { cartItems, addToCart, removeFromCart } = useCart();

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Product Info
      const res = await fetch(`http://localhost:8000/api/products/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Product not found');
        throw new Error('Server returned an error');
      }
      const data: Product = await res.json();
      setProduct(data);

      // 2. Fetch Similar items
      const similarRes = await fetch(`http://localhost:8000/api/products/${data.id}/similar`);
      if (similarRes.ok) {
        const similarData: Product[] = await similarRes.json();
        setSimilarProducts(similarData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to connect to the backend server.');
      
      // Fallback offline mock data details if API fails or is unreachable
      const mockOfflineProducts: Product[] = [
        { id: 1, name: 'Fresh Toned Milk', size: '500 ml', price: 27, original_price: 30, icon: '🥛', discount: '10% OFF', brand: 'Amul', category: 'Dairy, Bread & Eggs', description: 'Fresh and pasteurized toned milk from Amul. High quality and nutritious for daily household consumption.', stock: 25 },
        { id: 2, name: 'Britannia Brown Bread', size: '400 g', price: 42, original_price: 50, icon: '🍞', discount: '16% OFF', brand: 'Britannia', category: 'Dairy, Bread & Eggs', description: 'Healthy whole wheat brown bread, baked fresh and soft. Perfect source of daily dietary fiber.', stock: 14 },
        { id: 3, name: 'Amul Salted Butter', size: '100 g', price: 56, original_price: 60, icon: '🧈', discount: '6% OFF', brand: 'Amul', category: 'Dairy, Bread & Eggs', description: 'Classic salted butter from Amul. Rich, creamy, and spreadable.', stock: 18 },
        { id: 4, name: 'Lay\'s Classic Salted', size: '50 g', price: 20, original_price: 20, icon: '🍟', discount: 'Best Price', brand: 'Lays', category: 'Snacks & Munchies', description: 'Crispy salted potato chips. Classic flavor, perfect snack for tea time or parties.', stock: 40 },
        { id: 5, name: 'Fresh Country Tomatoes', size: '500 g', price: 34, original_price: 45, icon: '🍅', discount: '24% OFF', brand: 'Local Farm', category: 'Fruits & Vegetables', description: 'Fresh red farm-picked tomatoes. Juiced with vitamins and organic sweetness.', stock: 30 },
        { id: 6, name: 'Coca-Cola Zero Sugar', size: '750 ml', price: 40, original_price: 40, icon: '🥤', discount: 'Popular', brand: 'Coca-Cola', category: 'Cold Drinks & Juices', description: 'Crisp and refreshing Coca-Cola flavor with zero calories and zero sugar.', stock: 20 },
        { id: 7, name: 'Oreo Chocolate Biscuits', size: '120 g', price: 30, original_price: 35, icon: '🍪', discount: '14% OFF', brand: 'Oreo', category: 'Snacks & Munchies', description: 'Double chocolate cookies with a rich sweet vanilla cream center.', stock: 5 },
        { id: 8, name: 'Farm Fresh White Eggs', size: '6 pcs', price: 48, original_price: 55, icon: '🥚', discount: '12% OFF', brand: 'Eggo', category: 'Dairy, Bread & Eggs', description: 'High protein farm fresh white eggs. Cleaned, sorted, and securely packaged.', stock: 15 },
        { id: 9, name: 'Maggi 2-Minute Noodles', size: '70 g', price: 14, original_price: 14, icon: '🍜', discount: 'Best Price', brand: 'Nestle', category: 'Instant & Frozen', description: 'The beloved instant noodles with magic tastemaker masala spices. Cooks in 2 minutes.', stock: 50 },
        { id: 10, name: 'Bru Instant Coffee', size: '100 g', price: 185, original_price: 200, icon: '☕', discount: '7% OFF', brand: 'Bru', category: 'Tea & Coffee', description: 'Rich aroma premium quality instant coffee blend made from fine roasted coffee beans.', stock: 8 }
      ];

      // Parse ID from string
      const matched = mockOfflineProducts.find(p => String(p.id) === String(id));
      if (matched) {
        setProduct(matched);
        const similar = mockOfflineProducts.filter(p => p.category === matched.category && String(p.id) !== String(id));
        setSimilarProducts(similar);
      } else {
        setError('Product not found in offline database.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const mainCartItem = cartItems.find((item) => String(item.id) === String(product?.id));
  const cartQuantity = mainCartItem ? mainCartItem.qty : 0;

  // --- RENDER LOADING SKELETON ---
  if (loading) {
    return (
      <div className="p-4 space-y-8 max-w-6xl mx-auto text-left">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-20 bg-neutral-200 animate-pulse rounded"></div>
        </div>
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-8 items-start w-full">
          {/* Left Block */}
          <div className="w-full h-80 bg-neutral-200 animate-pulse rounded-3xl"></div>
          {/* Right Block */}
          <div className="w-full space-y-4 mt-6 md:mt-0">
            <div className="w-1/4 h-3 bg-neutral-200 animate-pulse rounded"></div>
            <div className="w-3/4 h-8 bg-neutral-200 animate-pulse rounded"></div>
            <div className="w-1/5 h-4 bg-neutral-200 animate-pulse rounded"></div>
            <div className="w-1/3 h-10 bg-neutral-200 animate-pulse rounded-xl"></div>
            <div className="w-full h-24 bg-neutral-200 animate-pulse rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER ERROR STATE ---
  if (error || !product) {
    return (
      <div className="p-8 flex flex-col justify-center items-center text-center space-y-4 min-h-[calc(100vh-200px)]">
        <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <AlertCircle className="h-9 w-9" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-neutral-800 text-lg">Product Details Unreachable</h3>
          <p className="text-xs text-neutral-500 font-semibold max-w-[280px]">
            {error || "We couldn't retrieve the selected product details."}
          </p>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="mt-2 py-3 px-6 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-extrabold rounded-xl shadow-md text-xs active:scale-95 transition-transform"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // --- RENDER MAIN PAGE ---
  return (
    <div className="max-w-6xl mx-auto w-full p-4 space-y-8 text-left pb-16">
      
      {/* Navigation Breadcrumb link */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1.5 text-xs font-black text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Go Back</span>
      </button>

      {/* Main product columns split */}
      <div className="flex flex-col md:grid md:grid-cols-2 md:gap-8 items-start w-full">
        
        {/* Left Column: Product Visuals */}
        <div className="w-full bg-white rounded-3xl border border-neutral-200 p-8 flex items-center justify-center text-8xl min-h-[300px] md:min-h-[350px] shadow-sm relative overflow-hidden select-none">
          {product.icon}
          
          {/* Discount Overlay Tag */}
          {product.discount && (
            <span className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center space-x-1">
              <Sparkles className="h-3 w-3 fill-current" />
              <span>{product.discount}</span>
            </span>
          )}
        </div>

        {/* Right Column: Descriptions & Details */}
        <div className="w-full space-y-6 mt-6 md:mt-0">
          
          {/* Categories & Brand info */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-50 px-2 py-1 rounded-md">
              {product.category}
            </span>
            <p className="text-xs font-black text-neutral-400 uppercase tracking-wider pt-2">
              Brand: {product.brand}
            </p>
            <h1 className="text-xl md:text-2xl font-black text-neutral-800 tracking-tight leading-snug">
              {product.name}
            </h1>
            <p className="text-xs font-bold text-neutral-500">{product.size}</p>
          </div>

          {/* Stock state */}
          <div className="flex items-center space-x-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${
              product.stock > 5 ? 'bg-emerald-500 animate-pulse' : product.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'
            }`}></span>
            <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
              {product.stock > 5 ? `In Stock (${product.stock} available)` : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
            </span>
          </div>

          {/* Pricing Row */}
          <div className="flex items-end space-x-3 border-y border-neutral-100 py-4">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-neutral-900">₹{product.price}</span>
              {product.original_price > product.price && (
                <span className="text-xs text-neutral-400 line-through font-semibold">
                  Original Price: ₹{product.original_price}
                </span>
              )}
            </div>
            {product.original_price > product.price && (
              <span className="bg-emerald-55 text-emerald-800 text-[10px] font-black px-2 py-1 rounded-md mb-0.5">
                Save ₹{product.original_price - product.price}
              </span>
            )}
          </div>

          {/* Interactive Qty Action selector */}
          <div className="space-y-2">
            {cartQuantity > 0 ? (
              <div className="bg-emerald-600 text-white rounded-2xl flex items-center overflow-hidden shadow-lg inline-flex">
                <button 
                  onClick={() => removeFromCart(product.id)}
                  className="px-4 py-2.5 hover:bg-emerald-700 transition-colors"
                >
                  <Minus className="h-4.5 w-4.5 stroke-[3]" />
                </button>
                <span className="px-4 py-2.5 font-black text-sm min-w-[32px] text-center">{cartQuantity}</span>
                <button 
                  onClick={() => addToCart(product)}
                  className="px-4 py-2.5 hover:bg-emerald-700 transition-colors"
                  disabled={cartQuantity >= product.stock}
                >
                  <Plus className="h-4.5 w-4.5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className={`py-3.5 px-6 font-black text-xs rounded-2xl flex items-center space-x-1.5 shadow-md transition-all ${
                  product.stock === 0 
                    ? 'bg-neutral-150 text-neutral-400 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                }`}
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                <span>{product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}</span>
              </button>
            )}
          </div>

          {/* Product Description */}
          <div className="space-y-2 text-neutral-700">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">
              Product Details
            </h3>
            <p className="text-xs font-semibold leading-relaxed text-neutral-600">
              {product.description}
            </p>
          </div>

          {/* Secure Packing Trust Badge */}
          <div className="flex items-center space-x-3 bg-neutral-100/80 p-4 rounded-2xl border border-neutral-200">
            <ShieldCheck className="h-6 w-6 text-neutral-500 flex-shrink-0" />
            <p className="text-[10px] text-neutral-500 font-bold leading-normal">
              We ensure contactless delivery. All orders are carefully packed with strict safety protocols.
            </p>
          </div>

        </div>

      </div>

      {/* Bottom Row: Similar Products */}
      {similarProducts.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-neutral-200">
          <div className="flex items-center space-x-1">
            <Heart className="h-4.5 w-4.5 text-rose-500 fill-current" />
            <h3 className="text-xs font-black text-neutral-450 uppercase tracking-widest">
              Similar Products
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {similarProducts.map((simProd) => {
              const cartItem = cartItems.find((item) => String(item.id) === String(simProd.id));
              const qty = cartItem ? cartItem.qty : 0;
              return (
                <div 
                  key={simProd.id}
                  className="bg-white rounded-2xl border border-neutral-200 p-3 flex flex-col justify-between shadow-sm hover:shadow transition-shadow text-left"
                >
                  {/* Clickable Image block */}
                  <div 
                    onClick={() => navigate(`/product/${simProd.id}`)}
                    className="bg-neutral-50 rounded-xl h-28 flex items-center justify-center text-5xl mb-2 relative cursor-pointer hover:bg-neutral-100 transition-colors"
                  >
                    {simProd.icon}
                    {simProd.discount && (
                      <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                        {simProd.discount}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h4 
                      onClick={() => navigate(`/product/${simProd.id}`)}
                      className="text-xs font-extrabold text-neutral-800 line-clamp-1 cursor-pointer hover:text-yellow-600 transition-colors"
                    >
                      {simProd.name}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold">{simProd.size}</p>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-neutral-900">₹{simProd.price}</span>
                        {simProd.original_price > simProd.price && (
                          <span className="text-[9px] text-neutral-400 line-through">₹{simProd.original_price}</span>
                        )}
                      </div>

                      {qty > 0 ? (
                        <div className="bg-emerald-600 text-white rounded-lg flex items-center overflow-hidden shadow-sm">
                          <button 
                            onClick={() => removeFromCart(simProd.id)}
                            className="px-2 py-1 text-xs font-black hover:bg-emerald-700"
                          >
                            <Minus className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                          <span className="px-2 py-1 text-xs font-black min-w-[12px] text-center">{qty}</span>
                          <button 
                            onClick={() => addToCart(simProd)}
                            className="px-2 py-1 text-xs font-black hover:bg-emerald-700"
                            disabled={qty >= simProd.stock}
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(simProd)}
                          disabled={simProd.stock === 0}
                          className={`bg-emerald-50 text-emerald-700 border border-emerald-300 font-black text-xs px-3.5 py-1.5 rounded-lg active:scale-95 transition-transform flex items-center space-x-0.5 shadow-sm ${
                            simProd.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-100'
                          }`}
                        >
                          <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                          <span>ADD</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
