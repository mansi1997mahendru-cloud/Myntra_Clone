import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, ArrowLeft, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';

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
  stock?: number;
}

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Data lists
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI Status
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popularSearches = [
    'Milk', 'Bread', 'Butter', 'Eggs', 'Tomatoes', 'Chips', 
    'Coffee', 'Coca-Cola', 'Noodles', 'Bananas'
  ];

  // 1. Debounce query input to reduce API load
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // 2. Fetch autocomplete suggestions & search results on query change
  useEffect(() => {
    const fetchSearchData = async () => {
      if (!debouncedQuery.trim()) {
        setSuggestions([]);
        setProducts([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch Autocomplete Suggestions
        const suggRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/products/autocomplete?q=${encodeURIComponent(debouncedQuery)}`);
        if (suggRes.ok) {
          const suggData = await suggRes.json();
          setSuggestions(suggData);
        }

        // Fetch Matching Products Grid
        const prodRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}/api/products/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        } else {
          throw new Error('Failed to retrieve search results');
        }
      } catch (err: any) {
        console.error('Search API error:', err);
        setError('Backend is currently offline or unreachable. Using offline mode.');
        
        // Offline Fallback Mock data search logic if API is blocked or unreachable
        const mockOfflineProducts: Product[] = [
          { id: 1, name: 'Fresh Toned Milk', size: '500 ml', price: 27, original_price: 30, icon: '🥛', discount: '10% OFF', brand: 'Amul', category: 'Dairy, Bread & Eggs', description: 'Fresh Toned Milk' },
          { id: 2, name: 'Britannia Brown Bread', size: '400 g', price: 42, original_price: 50, icon: '🍞', discount: '16% OFF', brand: 'Britannia', category: 'Dairy, Bread & Eggs', description: 'Fresh Brown Bread' },
          { id: 3, name: 'Amul Salted Butter', size: '100 g', price: 56, original_price: 60, icon: '🧈', discount: '6% OFF', brand: 'Amul', category: 'Dairy, Bread & Eggs', description: 'Creamy butter' },
          { id: 4, name: 'Lay\'s Classic Salted', size: '50 g', price: 20, original_price: 20, icon: '🍟', discount: 'Best Price', brand: 'Lays', category: 'Snacks & Munchies', description: 'Classic chips' },
          { id: 5, name: 'Fresh Country Tomatoes', size: '500 g', price: 34, original_price: 45, icon: '🍅', discount: '24% OFF', brand: 'Local Farm', category: 'Fruits & Vegetables', description: 'Organic tomatoes' },
          { id: 6, name: 'Coca-Cola Zero Sugar', size: '750 ml', price: 40, original_price: 40, icon: '🥤', discount: 'Popular', brand: 'Coca-Cola', category: 'Cold Drinks & Juices', description: 'Coke zero' },
          { id: 7, name: 'Oreo Chocolate Biscuits', size: '120 g', price: 30, original_price: 35, icon: '🍪', discount: '14% OFF', brand: 'Oreo', category: 'Snacks & Munchies', description: 'Oreo cookies' },
          { id: 8, name: 'Farm Fresh White Eggs', size: '6 pcs', price: 48, original_price: 55, icon: '🥚', discount: '12% OFF', brand: 'Eggo', category: 'Dairy, Bread & Eggs', description: 'White eggs' },
          { id: 9, name: 'Maggi 2-Minute Noodles', size: '70 g', price: 14, original_price: 14, icon: '🍜', discount: 'Best Price', brand: 'Nestle', category: 'Instant & Frozen', description: 'Spicy noodles' },
          { id: 10, name: 'Bru Instant Coffee', size: '100 g', price: 185, original_price: 200, icon: '☕', discount: '7% OFF', brand: 'Bru', category: 'Tea & Coffee', description: 'Instant coffee' }
        ];
        
        const term = debouncedQuery.toLowerCase();
        const filtered = mockOfflineProducts.filter(p => 
          p.name.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
        );
        setProducts(filtered);
        
        // Mock Autocomplete
        const uniqueSuggestions = Array.from(new Set(
          filtered.map(p => p.name).concat(filtered.map(p => p.brand))
        )).slice(0, 5);
        setSuggestions(uniqueSuggestions);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchData();
  }, [debouncedQuery]);



  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    setShowSuggestions(false);
  };

  return (
    <div className="max-w-7xl mx-auto w-full bg-white min-h-[calc(100vh-140px)] md:min-h-[600px] p-6 rounded-2xl border border-neutral-200 flex flex-col space-y-6 shadow-sm text-left">
      
      {/* Search Header Container */}
      <div className="flex items-center space-x-3 pb-3 border-b border-neutral-100 relative">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <SearchIcon className="h-4.5 w-4.5 text-neutral-400" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for products, brands, or categories..."
            autoFocus
            className="w-full bg-neutral-100 text-neutral-800 text-sm pl-10 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-yellow-500 font-semibold transition-shadow"
          />
          {query && (
            <button 
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setProducts([]);
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Autocomplete suggestions dropdown panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-14 left-10 right-0 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden mt-1">
            {suggestions.map((term, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(term)}
                className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 text-xs font-bold text-neutral-700 flex items-center space-x-2 border-b border-neutral-50 last:border-0 transition-colors"
              >
                <SearchIcon className="h-3.5 w-3.5 text-neutral-400" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backend Alert status (Optional warning indicator) */}
      {error && (
        <div className="text-[10px] bg-neutral-50 text-neutral-500 py-1.5 px-3 rounded-lg border border-neutral-200 flex items-center space-x-1.5 self-start">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
          <span>{error}</span>
        </div>
      )}

      {/* Initial state: Popular Searches */}
      {!query && (
        <div className="space-y-3.5">
          <h4 className="text-xs font-black text-neutral-450 uppercase tracking-widest">
            Popular Searches
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {popularSearches.map((term, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(term)}
                className="bg-neutral-50 hover:bg-yellow-50 text-neutral-700 hover:text-yellow-800 border border-neutral-200 hover:border-yellow-350 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>

          <div className="flex-grow flex flex-col justify-center items-center text-neutral-400 pt-20">
            <span className="text-6xl mb-4">🔍</span>
            <p className="text-xs font-black text-neutral-500 tracking-wide">Search for daily essentials instantly</p>
          </div>
        </div>
      )}

      {/* Results Rendering */}
      {query && (
        <div className="flex-grow flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-neutral-450 uppercase tracking-widest">
              Search Results
            </h3>
            {loading && (
              <div className="flex items-center space-x-1 text-neutral-400 text-xs font-bold">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>

          {/* Result Products Grid */}
          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {products.map((product) => {
                const formatted = {
                  ...product,
                  originalPrice: product.original_price || product.price
                };
                return <ProductCard key={product.id} product={formatted} />;
              })}
            </div>
          )}

          {/* No products found state */}
          {!loading && products.length === 0 && (
            <div className="flex-grow flex flex-col justify-center items-center text-neutral-400 pt-20 space-y-3.5 text-center">
              <span className="text-6xl">🥦📦</span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-neutral-800 text-sm">No Products Found</h4>
                <p className="text-xs text-neutral-500 font-semibold max-w-[280px]">
                  We couldn't find any products matching "{query}". Try checking the spelling or searching for another term.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
