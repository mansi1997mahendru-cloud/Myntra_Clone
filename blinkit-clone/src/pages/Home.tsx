import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Flame, Heart, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';



interface Category {
  name: string;
  color: string;
  icon: string;
  order: number;
}

interface Product {
  id: number;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  
  const [dailyDairy, setDailyDairy] = useState<Product[]>([]);
  const [dailyFruits, setDailyFruits] = useState<Product[]>([]);
  const [dailySnacks, setDailySnacks] = useState<Product[]>([]);
  const [dailyDrinks, setDailyDrinks] = useState<Product[]>([]);
  const [dailyPersonal, setDailyPersonal] = useState<Product[]>([]);
  const [dailyCleaning, setDailyCleaning] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [buyAgain, setBuyAgain] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  
  // UI Status States
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);




  const mockCategories: Category[] = [
    { name: 'Fruits & Vegetables', color: 'bg-emerald-50 text-emerald-700', icon: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300&auto=format&fit=crop', order: 1 },
    { name: 'Dairy, Bread & Eggs', color: 'bg-blue-50 text-blue-700', icon: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop', order: 2 },
    { name: 'Munchies', color: 'bg-amber-50 text-amber-700', icon: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop', order: 3 },
    { name: 'Cold Drinks & Juices', color: 'bg-red-50 text-red-700', icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop', order: 4 },
    { name: 'Breakfast', color: 'bg-pink-50 text-pink-700', icon: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300&auto=format&fit=crop', order: 5 },
    { name: 'Tea & Coffee', color: 'bg-orange-50 text-orange-700', icon: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop', order: 6 },
    { name: 'Atta, Rice & Dal', color: 'bg-purple-50 text-purple-700', icon: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop', order: 7 },
    { name: 'Oil & Ghee', color: 'bg-yellow-50 text-yellow-700', icon: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop', order: 8 },
    { name: 'Masala', color: 'bg-rose-50 text-rose-700', icon: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=300&auto=format&fit=crop', order: 9 },
    { name: 'Frozen Food', color: 'bg-cyan-50 text-cyan-700', icon: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop', order: 10 },
    { name: 'Ice Cream', color: 'bg-teal-50 text-teal-700', icon: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=300&auto=format&fit=crop', order: 11 },
    { name: 'Biscuits', color: 'bg-indigo-50 text-indigo-700', icon: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=300&auto=format&fit=crop', order: 12 },
    { name: 'Chocolates', color: 'bg-violet-50 text-violet-700', icon: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&auto=format&fit=crop', order: 13 },
    { name: 'Cleaning Essentials', color: 'bg-sky-50 text-sky-700', icon: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop', order: 14 },
    { name: 'Personal Care', color: 'bg-emerald-50 text-emerald-800', icon: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&auto=format&fit=crop', order: 15 },
    { name: 'Beauty', color: 'bg-pink-50 text-pink-850', icon: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300&auto=format&fit=crop', order: 16 },
    { name: 'Baby Care', color: 'bg-amber-50 text-amber-800', icon: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&auto=format&fit=crop', order: 17 },
    { name: 'Pet Care', color: 'bg-rose-50 text-rose-800', icon: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&auto=format&fit=crop', order: 18 },
    { name: 'Pharmacy', color: 'bg-emerald-50 text-emerald-700', icon: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop', order: 19 },
    { name: 'Electronics', color: 'bg-zinc-50 text-zinc-700', icon: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&auto=format&fit=crop', order: 20 }
  ];

  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Fresh Toned Milk',
      size: '500 ml',
      price: 27,
      originalPrice: 30,
      icon: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop',
      discount: '10% OFF',
      isBestSeller: true,
      isRecommended: false
    },
    {
      id: 2,
      name: 'Britannia Brown Bread',
      size: '400 g',
      price: 42,
      originalPrice: 50,
      icon: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop',
      discount: '16% OFF',
      isBestSeller: true,
      isRecommended: false
    },
    {
      id: 3,
      name: 'Amul Salted Butter',
      size: '100 g',
      price: 56,
      originalPrice: 60,
      icon: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop',
      discount: '6% OFF',
      isBestSeller: true,
      isRecommended: false
    },
    {
      id: 4,
      name: 'Lay\'s Classic Salted',
      size: '50 g',
      price: 20,
      originalPrice: 20,
      icon: 'https://images.unsplash.com/photo-1599490659213-e2b9527b0876?w=500&auto=format&fit=crop',
      discount: 'Best Price',
      isBestSeller: true,
      isRecommended: true
    },
    {
      id: 5,
      name: 'Fresh Country Tomatoes',
      size: '500 g',
      price: 34,
      originalPrice: 45,
      icon: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=500&auto=format&fit=crop',
      discount: '24% OFF',
      isBestSeller: false,
      isRecommended: true
    },
    {
      id: 6,
      name: 'Coca-Cola Zero Sugar',
      size: '750 ml',
      price: 40,
      originalPrice: 40,
      icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop',
      discount: 'Popular',
      isBestSeller: false,
      isRecommended: true
    },
    {
      id: 7,
      name: 'Oreo Chocolate Biscuits',
      size: '120 g',
      price: 30,
      originalPrice: 35,
      icon: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop',
      discount: '14% OFF',
      isBestSeller: false,
      isRecommended: true
    },
    {
      id: 8,
      name: 'Farm Fresh White Eggs',
      size: '6 pcs',
      price: 48,
      originalPrice: 55,
      icon: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&auto=format&fit=crop',
      discount: '12% OFF',
      isBestSeller: false,
      isRecommended: true
    }
  ];

  const fetchData = async () => {
    setError(null);
    setLoading(true);

    try {
      // Connect directly to the local backend SQL database search endpoint
      const res = await fetch('http://localhost:8000/api/products/search?q=');
      if (res.ok) {
        const data = await res.json();
        const mappedProducts = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          size: p.size,
          price: p.price,
          originalPrice: p.original_price || p.price,
          icon: p.icon,
          discount: p.discount,
          isBestSeller: p.is_best_seller,
          isRecommended: p.is_recommended,
          stock: p.stock
        }));

        setCategories(mockCategories);
        setBestSellers(mappedProducts.filter((p: any) => p.isBestSeller));
        setRecommended(mappedProducts.filter((p: any) => p.isRecommended));

        // Group into Blinkit sections
        const dairy = mappedProducts.filter((p: any) => p.name.includes("Milk") || p.name.includes("Butter") || p.name.includes("Paneer") || p.name.includes("Cheese") || p.name.includes("Bread") || p.name.includes("Eggs"));
        const fruits = mappedProducts.filter((p: any) => p.name.includes("Apple") || p.name.includes("Banana") || p.name.includes("Orange") || p.name.includes("Tomato") || p.name.includes("Potato") || p.name.includes("Onion") || p.name.includes("Cucumber") || p.name.includes("Spinach"));
        const snacks = mappedProducts.filter((p: any) => p.name.includes("Chips") || p.name.includes("Kurkure") || p.name.includes("Bingo") || p.name.includes("Bhujia") || p.name.includes("Cookies") || p.name.includes("Chocolate") || p.name.includes("Biscuit"));
        const drinks = mappedProducts.filter((p: any) => p.name.includes("Coke") || p.name.includes("Coca-Cola") || p.name.includes("Sprite") || p.name.includes("Pepsi") || p.name.includes("Red Bull") || p.name.includes("Juice"));
        const personal = mappedProducts.filter((p: any) => p.name.includes("Handwash") || p.name.includes("Soap") || p.name.includes("Shampoo") || p.name.includes("Cream") || p.name.includes("Lotion"));
        const cleaning = mappedProducts.filter((p: any) => p.name.includes("Surf") || p.name.includes("Tide") || p.name.includes("Cleaner") || p.name.includes("Lizol"));

        setDailyDairy(dairy.slice(0, 8));
        setDailyFruits(fruits.slice(0, 8));
        setDailySnacks(snacks.slice(0, 8));
        setDailyDrinks(drinks.slice(0, 8));
        setDailyPersonal(personal.slice(0, 8));
        setDailyCleaning(cleaning.slice(0, 8));

        setTrending(mappedProducts.filter((p: any) => p.discount !== "").slice(0, 8));
        setBuyAgain(mappedProducts.slice(0, 8));
        setRecentlyViewed(mappedProducts.slice(8, 16));
      } else {
        throw new Error('API server unreachable');
      }
    } catch (err: any) {
      console.warn('API error, falling back to photography mock dataset:', err);
      // Fallback local mock data with photography URLs
      setCategories(mockCategories);
      setBestSellers(mockProducts.filter(p => p.isBestSeller));
      setRecommended(mockProducts.filter(p => p.isRecommended));
      
      setDailyDairy(mockProducts.slice(0, 4));
      setDailyFruits(mockProducts.slice(2, 6));
      setDailySnacks(mockProducts.slice(4, 8));
      setDailyDrinks(mockProducts.slice(0, 3));
      setDailyPersonal(mockProducts.slice(1, 4));
      setDailyCleaning(mockProducts.slice(3, 6));
      
      setTrending(mockProducts.slice(1, 6));
      setBuyAgain(mockProducts.slice(0, 4));
      setRecentlyViewed(mockProducts.slice(2, 6));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isMock]);



  // --- RENDER LOADING SKELETON ---
  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="w-full h-36 bg-neutral-200 animate-pulse rounded-2xl"></div>
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
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      
      {/* Real Blinkit Style Wide Banner & Promo Columns */}
      <div className="space-y-4">
        {/* Main Wide Banner */}
        <div 
          onClick={() => navigate('/categories', { state: { categoryId: 1 } })}
          className="relative bg-[#15803d] rounded-3xl overflow-hidden h-[180px] md:h-[240px] flex items-center justify-between px-6 md:px-12 text-white shadow-sm select-none cursor-pointer group hover:opacity-95 transition-opacity"
        >
          <div className="space-y-2.5 md:space-y-4 text-left z-10 max-w-lg md:max-w-xl">
            <h1 className="text-xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Stock up on daily essentials
            </h1>
            <p className="text-[11px] md:text-sm text-neutral-100 font-medium">
              Get farm-fresh goodness & a range of exotic fruits, vegetables, eggs & more
            </p>
            <button className="bg-white text-emerald-800 hover:bg-neutral-50 px-5 py-2 rounded-2xl font-extrabold text-xs md:text-sm shadow-sm active:scale-95 transition-all">
              Shop Now
            </button>
          </div>
          {/* Real Photography overlay */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden md:block">
            <div className="h-full w-full relative">
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#15803d] to-transparent z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&auto=format&fit=crop" 
                alt="Fresh Daily Essentials" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 3-column promo cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Pharmacy */}
          <div 
            onClick={() => navigate('/categories', { state: { categoryId: 19 } })}
            className="bg-gradient-to-br from-cyan-600 to-teal-700 rounded-3xl p-5 text-white flex justify-between items-center relative overflow-hidden h-36 shadow-sm group hover:shadow-md transition-all cursor-pointer hover:opacity-95"
          >
            <div className="space-y-2 text-left z-10 max-w-[65%]">
              <h3 className="font-extrabold text-sm leading-tight">Pharmacy at your doorstep!</h3>
              <p className="text-[10px] text-neutral-100/90 leading-tight">Cough syrups, pain relief sprays & more</p>
              <button className="bg-neutral-900 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg mt-1 hover:bg-black transition-colors">
                Order Now
              </button>
            </div>
            <div className="w-[30%] h-24 relative select-none shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop" 
                alt="Medicines" 
                className="h-full w-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
              />
            </div>
          </div>

          {/* Card 2: Pet Supplies */}
          <div 
            onClick={() => navigate('/categories', { state: { categoryId: 18 } })}
            className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl p-5 text-neutral-900 flex justify-between items-center relative overflow-hidden h-36 shadow-sm group hover:shadow-md transition-all cursor-pointer hover:opacity-95"
          >
            <div className="space-y-2 text-left z-10 max-w-[65%]">
              <h3 className="font-extrabold text-sm leading-tight">Pet care supplies at your door</h3>
              <p className="text-[10px] text-neutral-800/90 leading-tight">Food, treats, toys & more</p>
              <button className="bg-neutral-900 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg mt-1 hover:bg-black transition-colors">
                Order Now
              </button>
            </div>
            <div className="w-[30%] h-24 relative select-none shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&auto=format&fit=crop" 
                alt="Pet care" 
                className="h-full w-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
              />
            </div>
          </div>

          {/* Card 3: Baby Care */}
          <div 
            onClick={() => navigate('/categories', { state: { categoryId: 17 } })}
            className="bg-gradient-to-br from-blue-500 to-sky-600 rounded-3xl p-5 text-white flex justify-between items-center relative overflow-hidden h-36 shadow-sm group hover:shadow-md transition-all cursor-pointer hover:opacity-95"
          >
            <div className="space-y-2 text-left z-10 max-w-[65%]">
              <h3 className="font-extrabold text-sm leading-tight">No time for a diaper run?</h3>
              <p className="text-[10px] text-neutral-100/90 leading-tight">Get baby care essentials</p>
              <button className="bg-neutral-900 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg mt-1 hover:bg-black transition-colors">
                Order Now
              </button>
            </div>
            <div className="w-[30%] h-24 relative select-none shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&auto=format&fit=crop" 
                alt="Baby care" 
                className="h-full w-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
              />
            </div>
          </div>

        </div>
      </div>

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
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-4">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate('/categories', { state: { categoryId: cat.order } })}
                className="flex flex-col items-center text-center space-y-2 cursor-pointer group active:scale-95 transition-all duration-200"
              >
                <div className="w-24 h-24 rounded-3xl bg-neutral-50 border border-neutral-150 flex items-center justify-center shadow-sm group-hover:shadow group-hover:border-yellow-350 transition-all overflow-hidden p-2 relative">
                  <img 
                    src={cat.icon} 
                    alt={cat.name} 
                    className="h-[88%] w-[88%] object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200" 
                  />
                </div>
                <span className="text-[10px] font-black text-neutral-800 leading-tight line-clamp-2 max-w-[76px] tracking-tight">
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
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Daily Essentials: Dairy, Bread & Eggs */}
      {dailyDairy.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Daily Essentials: Dairy, Bread & Eggs
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {dailyDairy.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Daily Essentials: Fruits & Vegetables */}
      {dailyFruits.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Daily Essentials: Fruits & Vegetables
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {dailyFruits.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Daily Essentials: Snacks & Munchies */}
      {dailySnacks.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Daily Essentials: Snacks & Munchies
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {dailySnacks.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Daily Essentials: Cold Drinks & Juices */}
      {dailyDrinks.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Daily Essentials: Cold Drinks & Juices
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {dailyDrinks.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Daily Essentials: Personal Care */}
      {dailyPersonal.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Daily Essentials: Personal Care
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {dailyPersonal.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Daily Essentials: Cleaning Essentials */}
      {dailyCleaning.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Daily Essentials: Cleaning Essentials
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {dailyCleaning.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Buy Again */}
      {buyAgain.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Buy It Again
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {buyAgain.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Recently Viewed Products
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {recentlyViewed.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Trending Products */}
      {trending.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest text-left">
              Trending Products
            </h3>
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {trending.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
          </div>
          <div className="flex overflow-x-auto pb-2 space-x-3.5 scrollbar-thin scrollbar-thumb-neutral-250">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
