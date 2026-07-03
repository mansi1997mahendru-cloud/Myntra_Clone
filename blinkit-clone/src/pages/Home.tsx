import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Plus, Minus, Flame, Heart, Sparkles, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { seedDatabase } from '../utils/seedData';

interface Banner {
  title: string;
  sub: string;
  icon: string;
  bg: string;
  tag: string;
  order: number;
}

interface Category {
  name: string;
  color: string;
  icon: string;
  order: number;
}

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  originalPrice: number;
  icon: string;
  discount: string;
  isBestSeller: boolean;
  isRecommended: boolean;
  stock?: number;
}

export const Home: React.FC = () => {
  const { isMock } = useAuth();
  const navigate = useNavigate();
  
  // Data States
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  
  // UI Status States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const { cartItems, addToCart, removeFromCart } = useCart();

  // Fetch Firestore Data
  const fetchData = async () => {
    setError(null);
    setLoading(true);

    if (isMock) {
      // --- DEMO MODE MOCK FETCH ---
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulated delay

        // High fidelity mock data
        const mockBanners: Banner[] = [
          { title: "Super Saver Grocery Deals!", sub: "Flat 50% Off on Fresh Fruits & Dairy Products", icon: "🥑", bg: "from-emerald-500 to-teal-650", tag: "Monsoon Sale", order: 1 },
          { title: "Ice Creams & Cold Drinks", sub: "Beating the heat? Delivered in 10 minutes", icon: "🍦", bg: "from-blue-500 to-indigo-650", tag: "Summer Special", order: 2 },
          { title: "Munchies & Snack Fest", sub: "Buy 2 Get 1 Free on Select Brand Crisps", icon: "🍿", bg: "from-amber-500 to-rose-600", tag: "Snack Time", order: 3 }
        ];

        const mockCategories: Category[] = [
          { name: 'Fruits & Veggies', color: 'bg-emerald-50 text-emerald-700', icon: '🥦', order: 1 },
          { name: 'Dairy & Bread', color: 'bg-blue-50 text-blue-700', icon: '🥛', order: 2 },
          { name: 'Snacks & Crisps', color: 'bg-amber-50 text-amber-700', icon: '🍟', order: 3 },
          { name: 'Cold Drinks', color: 'bg-red-50 text-red-700', icon: '🥤', order: 4 },
          { name: 'Bakery Items', color: 'bg-pink-50 text-pink-700', icon: '🍞', order: 5 },
          { name: 'Instant Foods', color: 'bg-purple-50 text-purple-700', icon: '🍜', order: 6 },
          { name: 'Tea & Coffee', color: 'bg-orange-50 text-orange-700', icon: '☕', order: 7 },
          { name: 'Home Utilities', color: 'bg-cyan-50 text-cyan-700', icon: '🧼', order: 8 }
        ];

        const mockProducts: Product[] = [
          { id: 'prod-bs-1', name: 'Fresh Toned Milk', size: '500 ml', price: 27, originalPrice: 30, icon: '🥛', discount: '10% OFF', isBestSeller: true, isRecommended: false },
          { id: 'prod-bs-2', name: 'Britannia Brown Bread', size: '400 g', price: 42, originalPrice: 50, icon: '🍞', discount: '16% OFF', isBestSeller: true, isRecommended: false },
          { id: 'prod-bs-3', name: 'Amul Salted Butter', size: '100 g', price: 56, originalPrice: 60, icon: '🧈', discount: '6% OFF', isBestSeller: true, isRecommended: false },
          { id: 'prod-bs-4', name: 'Lay\'s Classic Salted', size: '50 g', price: 20, originalPrice: 20, icon: '🍟', discount: 'Best Price', isBestSeller: true, isRecommended: true },
          { id: 'prod-rec-1', name: 'Fresh Country Tomatoes', size: '500 g', price: 34, originalPrice: 45, icon: '🍅', discount: '24% OFF', isBestSeller: false, isRecommended: true },
          { id: 'prod-rec-2', name: 'Coca-Cola Zero Sugar', size: '750 ml', price: 40, originalPrice: 40, icon: '🥤', discount: 'Popular', isBestSeller: false, isRecommended: true },
          { id: 'prod-rec-3', name: 'Oreo Chocolate Biscuits', size: '120 g', price: 30, originalPrice: 35, icon: '🍪', discount: '14% OFF', isBestSeller: false, isRecommended: true },
          { id: 'prod-rec-4', name: 'Farm Fresh White Eggs', size: '6 pcs', price: 48, originalPrice: 55, icon: '🥚', discount: '12% OFF', isBestSeller: false, isRecommended: true }
        ];

        setBanners(mockBanners);
        setCategories(mockCategories);
        setBestSellers(mockProducts.filter(p => p.isBestSeller));
        setRecommended(mockProducts.filter(p => p.isRecommended));
      } catch (err: any) {
        setError('Failed to load mock data.');
      } finally {
        setLoading(false);
      }
    } else {
      // --- REAL FIRESTORE FETCH ---
      try {
        // Query banners
        const bannersQuery = query(collection(db, 'banners'), orderBy('order', 'asc'));
        let bannersSnap = await getDocs(bannersQuery);

        // Query categories
        const categoriesQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
        let categoriesSnap = await getDocs(categoriesQuery);

        // Query products
        const productsSnap = await getDocs(collection(db, 'products'));

        // If Firestore is empty, auto seed database once and re-fetch
        if (bannersSnap.empty && categoriesSnap.empty && productsSnap.empty) {
          console.log('Database empty. Seeding data...');
          await seedDatabase(db);
          
          // Re-fetch snaps after seeding
          bannersSnap = await getDocs(bannersQuery);
          categoriesSnap = await getDocs(categoriesQuery);
        }

        // Parse banners
        const loadedBanners: Banner[] = [];
        bannersSnap.forEach((doc) => {
          loadedBanners.push(doc.data() as Banner);
        });
        setBanners(loadedBanners);

        // Parse categories
        const loadedCategories: Category[] = [];
        categoriesSnap.forEach((doc) => {
          loadedCategories.push(doc.data() as Category);
        });
        setCategories(loadedCategories);

        // Parse products
        const loadedBestSellers: Product[] = [];
        const loadedRecommended: Product[] = [];
        
        productsSnap.forEach((docSnap) => {
          const prod = { id: docSnap.id, ...docSnap.data() } as Product;
          if (prod.isBestSeller) loadedBestSellers.push(prod);
          if (prod.isRecommended) loadedRecommended.push(prod);
        });

        setBestSellers(loadedBestSellers);
        setRecommended(loadedRecommended);

      } catch (err: any) {
        console.error('Firestore Error:', err);
        setError(err.message || 'Unable to connect to Firestore Database.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [isMock]);

  // Auto rotate banners
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners]);



  // --- RENDER LOADING SKELETON ---
  if (loading) {
    return (
      <div className="p-4 space-y-6">
        {/* Banner Skeleton */}
        <div className="w-full h-36 bg-neutral-200 animate-pulse rounded-2xl"></div>

        {/* Categories Grid Skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="w-32 h-4.5 bg-neutral-200 animate-pulse rounded"></div>
            <div className="w-12 h-3.5 bg-neutral-200 animate-pulse rounded"></div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {Array(8).fill(null).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-2">
                <div className="w-14 h-14 bg-neutral-200 animate-pulse rounded-2xl"></div>
                <div className="w-12 h-3 bg-neutral-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Sellers Row Skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="w-28 h-4.5 bg-neutral-200 animate-pulse rounded"></div>
            <div className="w-12 h-3.5 bg-neutral-200 animate-pulse rounded"></div>
          </div>
          <div className="flex space-x-3.5 overflow-x-hidden">
            {Array(3).fill(null).map((_, idx) => (
              <div key={idx} className="w-36 h-40 bg-neutral-200 animate-pulse rounded-2xl flex-shrink-0"></div>
            ))}
          </div>
        </div>

        {/* Recommended Grid Skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="w-36 h-4.5 bg-neutral-200 animate-pulse rounded"></div>
            <div className="w-12 h-3.5 bg-neutral-200 animate-pulse rounded"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array(5).fill(null).map((_, idx) => (
              <div key={idx} className="w-full h-44 bg-neutral-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER ERROR STATE ---
  if (error) {
    return (
      <div className="p-8 flex flex-col justify-center items-center text-center space-y-4 min-h-[calc(100vh-200px)]">
        <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <AlertCircle className="h-9 w-9" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-neutral-800 text-lg">Failed to Load Content</h3>
          <p className="text-xs text-neutral-500 font-semibold max-w-[280px] leading-relaxed">
            {error}. Make sure Firestore is enabled, or toggle local Demo Mode.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="mt-2 py-3 px-6 bg-yellow-400 text-neutral-900 font-extrabold rounded-xl shadow-md text-xs flex items-center space-x-1.5 active:scale-95 transition-transform"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // --- RENDER LOADED PAGE SUCCESS ---
  return (
    <div className="p-4 space-y-6">
      
      {/* Demo Reset Banner */}
      {isMock && (
        <div className="bg-yellow-50 text-yellow-800 border border-yellow-250 p-3.5 rounded-2xl text-left text-xs font-semibold flex justify-between items-center shadow-sm">
          <div className="pr-2 leading-relaxed">
            <span className="text-[9px] uppercase font-black tracking-wider bg-yellow-400 text-black px-1.5 py-0.5 rounded-md mr-1.5">
              Demo Active
            </span>
            Want to test Onboarding, Login & Profile setup from scratch?
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="bg-yellow-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-xl hover:bg-yellow-600 transition-colors shrink-0 shadow-sm active:scale-95"
          >
            Reset Flow
          </button>
        </div>
      )}

      {/* Promotional Carousel Banner */}
      {banners.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl shadow-md h-36">
          {banners.map((banner, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-gradient-to-r ${banner.bg} text-white p-5 flex flex-col justify-between transition-all duration-700 ease-in-out transform ${
                index === activeBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div className="absolute right-0 bottom-[-10px] text-8xl opacity-15 pointer-events-none select-none">
                {banner.icon}
              </div>
              
              <div className="space-y-1 z-10 text-left">
                <div className="inline-flex items-center space-x-1 bg-white/20 backdrop-blur-md text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>{banner.tag}</span>
                </div>
                <h2 className="text-lg font-black tracking-tight leading-tight max-w-[220px]">
                  {banner.title}
                </h2>
                <p className="text-[10px] text-white/90 font-bold">{banner.sub}</p>
              </div>

              {/* Slider Dots */}
              <div className="flex space-x-1.5 z-10">
                {banners.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setActiveBanner(dotIdx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      dotIdx === activeBanner ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories Grid Section */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Shop by Category
            </h3>
            <button className="text-[11px] font-black text-yellow-600 hover:text-yellow-700 flex items-center">
              <span>See All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center text-center space-y-1.5 cursor-pointer group active:scale-95 transition-all duration-150"
              >
                <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-shadow`}>
                  {cat.icon}
                </div>
                <span className="text-[10px] font-black text-neutral-700 leading-tight line-clamp-2 max-w-[70px]">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left flex items-center space-x-1">
              <Flame className="h-4.5 w-4.5 text-amber-500 fill-current" />
              <span>Best Sellers</span>
            </h3>
            <button className="text-[11px] font-black text-yellow-600 hover:text-yellow-700 flex items-center">
              <span>See All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {bestSellers.map((product) => {
              const cartItem = cartItems.find((item) => String(item.id) === String(product.id));
              const qty = cartItem ? cartItem.qty : 0;
              return (
                <div 
                  key={product.id}
                  className="w-36 flex-shrink-0 bg-white rounded-2xl border border-neutral-150 p-3 flex flex-col justify-between shadow-sm hover:shadow transition-shadow text-left"
                >
                  <div 
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="bg-neutral-50 rounded-xl h-24 flex items-center justify-center text-4xl mb-2 relative cursor-pointer hover:bg-neutral-100 transition-colors select-none"
                  >
                    {product.icon}
                    <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      {product.discount}
                    </span>
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
                        {product.originalPrice > product.price && (
                          <span className="text-[9px] text-neutral-400 line-through">₹{product.originalPrice}</span>
                        )}
                      </div>

                      {qty > 0 ? (
                        <div className="bg-emerald-600 text-white rounded-lg flex items-center overflow-hidden shadow-sm">
                          <button 
                            onClick={() => removeFromCart(product.id)}
                            className="px-1.5 py-1 text-xs font-black hover:bg-emerald-700"
                          >
                            <Minus className="h-3 w-3 stroke-[3]" />
                          </button>
                          <span className="px-1.5 py-1 text-xs font-black min-w-[12px] text-center">{qty}</span>
                          <button 
                            onClick={() => addToCart(product)}
                            className="px-1.5 py-1 text-xs font-black hover:bg-emerald-700"
                            disabled={qty >= (product.stock || 15)}
                          >
                            <Plus className="h-3 w-3 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-emerald-55 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-black text-xs px-3 py-1 rounded-lg active:scale-95 transition-transform flex items-center space-x-0.5 shadow-sm"
                        >
                          <ShoppingBag className="h-3 w-3" />
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

      {/* Recommended Products Section */}
      {recommended.length > 0 && (
        <div className="space-y-3 pb-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left flex items-center space-x-1">
              <Heart className="h-4.5 w-4.5 text-rose-500 fill-current" />
              <span>Recommended for You</span>
            </h3>
            <button className="text-[11px] font-black text-yellow-600 hover:text-yellow-700 flex items-center">
              <span>See All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {recommended.map((product) => {
              const cartItem = cartItems.find((item) => String(item.id) === String(product.id));
              const qty = cartItem ? cartItem.qty : 0;
              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl border border-neutral-150 p-3 flex flex-col justify-between shadow-sm hover:shadow transition-shadow text-left"
                >
                  <div 
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="bg-neutral-50 rounded-xl h-28 flex items-center justify-center text-5xl mb-2 relative cursor-pointer hover:bg-neutral-100 transition-colors select-none"
                  >
                    {product.icon}
                    <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      {product.discount}
                    </span>
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
                        {product.originalPrice > product.price && (
                          <span className="text-[9px] text-neutral-400 line-through">₹{product.originalPrice}</span>
                        )}
                      </div>

                      {qty > 0 ? (
                        <div className="bg-emerald-600 text-white rounded-lg flex items-center overflow-hidden shadow-sm">
                          <button 
                            onClick={() => removeFromCart(product.id)}
                            className="px-2 py-1 text-xs font-black hover:bg-emerald-700"
                          >
                            <Minus className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                          <span className="px-2 py-1 text-xs font-black min-w-[12px] text-center">{qty}</span>
                          <button 
                            onClick={() => addToCart(product)}
                            className="px-2 py-1 text-xs font-black hover:bg-emerald-700"
                            disabled={qty >= (product.stock || 15)}
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-black text-xs px-3.5 py-1.5 rounded-lg active:scale-95 transition-transform flex items-center space-x-0.5 shadow-sm"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
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
