import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { ShoppingBag, Plus, Minus, ArrowLeft, AlertCircle, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  original_price: number;
  icon: string;
  images_list?: string; // Comma-separated list of image URLs
  discount: string;
  brand: string;
  category: string;
  description: string;
  stock: number;
}

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data states
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { cartItems, addToCart, removeFromCart } = useCart();

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Product Info
      const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/products/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Product not found');
        throw new Error('Server returned an error');
      }
      const data: Product = await res.json();
      setProduct(data);
      
      // Set active image
      if (data.images_list) {
        const list = data.images_list.split(',');
        setActiveImage(list[0]);
      } else {
        setActiveImage(data.icon);
      }

      // 2. Fetch Similar items
      const similarRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/products/${data.id}/similar`);
      if (similarRes.ok) {
        const similarData: Product[] = await similarRes.json();
        setSimilarProducts(similarData);
      }

      // 3. Check if wishlisted
      if (user) {
        const wishRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/wishlist/${user.uid}`);
        if (wishRes.ok) {
          const wishData = await wishRes.json();
          const found = wishData.some((item: any) => String(item.product_id) === String(id));
          setIsWishlisted(found);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve product details.');
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (isWishlisted) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/wishlist/${user.uid}/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) setIsWishlisted(false);
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/wishlist/${user.uid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: Number(id) })
        });
        if (res.ok) setIsWishlisted(true);
      }
    } catch (err) {
      console.error("Failed to toggle wishlist", err);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id, user]);

  // Sync quantities with shopping cart
  const cartItem = product ? cartItems.find((item) => String(item.id) === String(product.id)) : null;
  const quantity = cartItem ? cartItem.qty : 0;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Fetching details...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col justify-center items-center text-center space-y-4 min-h-[calc(100vh-200px)]">
        <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <AlertCircle className="h-9 w-9" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-neutral-800 text-lg">Product Unreachable</h3>
          <p className="text-xs text-neutral-500 font-semibold max-w-[280px] leading-relaxed">
            {error || 'The requested product detail is unavailable.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="mt-2 py-3 px-6 bg-yellow-400 text-neutral-900 font-extrabold rounded-xl shadow-md text-xs flex items-center space-x-1.5 active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }

  const discountPercentage = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20 text-left">
      
      {/* Back CTA Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-1.5 text-xs font-black text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Go Back</span>
      </button>

      {/* Main product columns split */}
      <div className="flex flex-col md:grid md:grid-cols-2 md:gap-8 items-start w-full">
        
        {/* Left Column: Product Visuals */}
        <div className="w-full space-y-4">
          <div className="w-full bg-white rounded-3xl border border-neutral-200 p-8 flex items-center justify-center min-h-[300px] md:min-h-[350px] shadow-sm relative overflow-hidden select-none">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="object-contain h-64 w-64 mix-blend-multiply" 
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop";
              }}
            />
            
            {/* Discount Overlay Tag */}
            {product.discount && (
              <span className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center space-x-1">
                <Sparkles className="h-3 w-3 fill-current" />
                <span>{product.discount}</span>
              </span>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.images_list && product.images_list.split(',').length > 1 && (
            <div className="flex space-x-2.5 justify-center">
              {product.images_list.split(',').map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`h-16 w-16 p-1 border rounded-xl bg-white overflow-hidden transition-all cursor-pointer ${
                    activeImage === imgUrl 
                      ? 'border-yellow-500 ring-2 ring-yellow-400/50' 
                      : 'border-neutral-200 hover:border-neutral-350'
                  }`}
                >
                  <img 
                    src={imgUrl} 
                    alt={`${product.name} view ${idx + 1}`} 
                    className="h-full w-full object-contain mix-blend-multiply"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop";
                    }}
                  />
                </button>
              ))}
            </div>
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
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-neutral-500 font-bold">{product.size}</p>
          </div>

          {/* Pricing Box */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-neutral-900">₹{product.price}</span>
              {product.original_price > product.price && (
                <>
                  <span className="text-xs text-neutral-450 line-through">₹{product.original_price}</span>
                  <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    Save {discountPercentage}%
                  </span>
                </>
              )}
            </div>
            
            <p className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">
              Inclusive of all taxes
            </p>
          </div>

          {/* Delivery & Security badges */}
          <div className="bg-white rounded-2xl border border-neutral-150 p-4 space-y-3">
            <div className="flex items-center space-x-2.5 text-xs font-semibold text-neutral-600">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>Delivered in <span className="font-extrabold text-neutral-800">10-12 Mins</span></span>
            </div>
            <div className="flex items-center space-x-2.5 text-xs font-semibold text-neutral-600">
              <Heart className="h-5 w-5 text-rose-500 shrink-0" />
              <span>100% Fresh & Authentic Quality Guarantee</span>
            </div>
          </div>

          {/* Add to Cart CTA Row */}
          <div className="flex items-center space-x-3 pt-1">
            {quantity > 0 ? (
              <div className="bg-emerald-600 text-white rounded-2xl flex items-center overflow-hidden shadow-md">
                <button 
                  onClick={() => removeFromCart(product.id)}
                  className="px-4.5 py-3 hover:bg-emerald-700 font-black text-sm transition-colors cursor-pointer"
                >
                  <Minus className="h-4 w-4 stroke-[3]" />
                </button>
                <span className="px-3 py-3 font-black text-base min-w-[24px] text-center select-none">
                  {quantity}
                </span>
                <button 
                  onClick={() => addToCart(product)}
                  className="px-4.5 py-3 hover:bg-emerald-700 font-black text-sm transition-colors cursor-pointer"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => addToCart(product)}
                className="flex-grow py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add to Basket</span>
              </button>
            )}

            <button 
              onClick={toggleWishlist}
              className={`p-3.5 border rounded-2xl shadow-sm active:scale-95 transition-transform cursor-pointer shrink-0 ${
                isWishlisted 
                  ? 'border-rose-300 bg-rose-50 text-rose-600' 
                  : 'border-neutral-200 hover:bg-neutral-50 text-neutral-500'
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Product Description Details */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <h3 className="text-xs font-black text-neutral-450 uppercase tracking-widest">
              Product Specifications
            </h3>
            <p className="text-xs leading-relaxed text-neutral-600 font-semibold">
              {product.description}
            </p>
          </div>

        </div>
      </div>

      {/* Similar products carousel */}
      {similarProducts.length > 0 && (
        <div className="space-y-4 pt-10">
          <h3 className="text-xs font-black text-neutral-450 uppercase tracking-widest">
            Similar Products You May Like
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {similarProducts.map((simProd) => {
              const formatted = {
                ...simProd,
                originalPrice: simProd.original_price || simProd.price
              };
              return <ProductCard key={simProd.id} product={formatted} />;
            })}
          </div>
        </div>
      )}

    </div>
  );
};
