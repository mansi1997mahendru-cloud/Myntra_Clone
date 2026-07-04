import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';

interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  originalPrice: number;
  icon: string;
  discount: string;
  brand: string;
  category: string;
  description: string;
  stock: number;
}

export const Categories: React.FC = () => {
  const location = useLocation();
  
  const mainCategories = [
    { id: 1, name: 'Fruits & Vegetables', icon: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=100&auto=format&fit=crop' },
    { id: 2, name: 'Dairy, Bread & Eggs', icon: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&auto=format&fit=crop' },
    { id: 3, name: 'Munchies', icon: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100&auto=format&fit=crop' },
    { id: 4, name: 'Cold Drinks & Juices', icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&auto=format&fit=crop' },
    { id: 5, name: 'Breakfast', icon: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=100&auto=format&fit=crop' },
    { id: 6, name: 'Tea & Coffee', icon: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100&auto=format&fit=crop' },
    { id: 7, name: 'Atta, Rice & Dal', icon: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&auto=format&fit=crop' },
    { id: 8, name: 'Oil & Ghee', icon: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=100&auto=format&fit=crop' },
    { id: 9, name: 'Masala', icon: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=100&auto=format&fit=crop' },
    { id: 10, name: 'Frozen Food', icon: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=100&auto=format&fit=crop' },
    { id: 11, name: 'Ice Cream', icon: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=100&auto=format&fit=crop' },
    { id: 12, name: 'Biscuits', icon: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=100&auto=format&fit=crop' },
    { id: 13, name: 'Chocolates', icon: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=100&auto=format&fit=crop' },
    { id: 14, name: 'Cleaning Essentials', icon: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&auto=format&fit=crop' },
    { id: 15, name: 'Personal Care', icon: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=100&auto=format&fit=crop' },
    { id: 16, name: 'Beauty', icon: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=100&auto=format&fit=crop' },
    { id: 17, name: 'Baby Care', icon: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=100&auto=format&fit=crop' },
    { id: 18, name: 'Pet Care', icon: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&auto=format&fit=crop' },
    { id: 19, name: 'Pharmacy', icon: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=100&auto=format&fit=crop' },
    { id: 20, name: 'Electronics', icon: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=100&auto=format&fit=crop' }
  ];

  const subCategories: Record<number, string[]> = {
    1: ['All', 'Apples', 'Bananas', 'Tomatoes', 'Potatoes', 'Onions', 'Coriander', 'Spinach', 'Ginger'],
    2: ['All', 'Milk', 'Butter', 'Paneer', 'Bread', 'Cheese', 'Yogurt'],
    3: ['All', 'Chips', 'Kurkure', 'Bhujia', 'Almonds'],
    4: ['All', 'Coca-Cola', 'Pepsi', 'Red Bull', 'Juices'],
    5: ['All', 'Corn Flakes', 'Oats', 'Honey', 'Peanut Butter'],
    6: ['All', 'Coffee', 'Tea'],
    7: ['All', 'Atta', 'Rice', 'Dal'],
    8: ['All', 'Oil', 'Ghee'],
    9: ['All', 'Masala', 'Chilli Powder'],
    10: ['All', 'McCain', 'French Fries'],
    11: ['All', 'Vanilla', 'Chocolate', 'Strawberry'],
    12: ['All', 'Good Day', 'Cookies', 'Bourbon'],
    13: ['All', 'Silk', 'KitKat', 'Snickers'],
    14: ['All', 'Surf Excel', 'Lizol', 'Toilet Cleaner'],
    15: ['All', 'Handwash', 'Soap', 'Shampoo'],
    16: ['All', 'Cream', 'Lotion', 'Gel'],
    17: ['All', 'Diapers', 'Baby Soap', 'Wipes'],
    18: ['All', 'Dog Food', 'Cat Food', 'Biscuits'],
    19: ['All', 'Dolo', 'Saridon', 'Band-Aid'],
    20: ['All', 'Batteries', 'Bulb', 'Charger']
  };

  const [activeId, setActiveId] = useState<number>(() => {
    return location.state?.categoryId || 1;
  });

  const [activeSub, setActiveSub] = useState<string>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch category products from backend
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      const catObj = mainCategories.find(c => c.id === activeId);
      if (!catObj) return;

      try {
        const res = await fetch(`http://localhost:8000/api/products/search?q=${encodeURIComponent(catObj.name)}`);
        if (res.ok) {
          const data = await res.json();
          // Transform response
          const formatted = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            size: p.size,
            price: p.price,
            originalPrice: p.original_price || p.price,
            icon: p.icon,
            discount: p.discount,
            brand: p.brand,
            category: p.category,
            stock: p.stock
          }));
          setProducts(formatted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
    setActiveSub('All');
  }, [activeId]);

  // Filter products by subcategory keyword
  const filteredProducts = products.filter(p => {
    if (activeSub === 'All') return true;
    return p.name.toLowerCase().includes(activeSub.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-170px)] bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      
      {/* Sidebar List */}
      <aside className="w-1/3 md:w-1/4 bg-neutral-50 border-r border-neutral-200 overflow-y-auto">
        {mainCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveId(cat.id)}
            className={`w-full py-4 px-3 flex flex-col md:flex-row md:space-x-3 md:space-y-0 md:justify-start md:px-5 items-center space-y-1 transition-all border-l-4 text-center md:text-left cursor-pointer ${
              activeId === cat.id
                ? 'bg-white border-yellow-500 text-neutral-900 font-black shadow-inner'
                : 'border-transparent text-neutral-600 font-bold hover:bg-neutral-100/50'
            }`}
          >
            <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 p-0.5 bg-white border border-neutral-100 flex items-center justify-center">
              <img src={cat.icon} alt="" className="h-full w-full object-contain" />
            </div>
            <span className="text-[10px] md:text-xs font-extrabold tracking-tight leading-tight break-words max-w-[85px] md:max-w-none">
              {cat.name}
            </span>
          </button>
        ))}
      </aside>

      {/* Grid & Filter Panel */}
      <section className="w-2/3 md:w-3/4 bg-white overflow-y-auto p-4 md:p-6 flex flex-col">
        {/* Category Header */}
        <h3 className="text-xs md:text-sm font-black text-neutral-800 uppercase tracking-wider text-left mb-3">
          {mainCategories.find(c => c.id === activeId)?.name}
        </h3>

        {/* Sub-category pills list */}
        <div className="flex space-x-2 pb-4 overflow-x-auto scrollbar-none mb-4 border-b border-neutral-100">
          {subCategories[activeId]?.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSub(sub)}
              className={`py-1.5 px-4 rounded-full text-[11px] font-black tracking-wide border transition-all shrink-0 cursor-pointer ${
                activeSub === sub
                  ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                  : 'bg-white border-neutral-200 text-neutral-650 hover:bg-neutral-50'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            <span className="text-xs text-neutral-500 font-semibold">Loading Catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 font-semibold text-neutral-450 text-xs">
            No products available matching this subcategory.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12 justify-items-start">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
