import React, { useState } from 'react';

export const Categories: React.FC = () => {
  const mainCategories = [
    { id: 1, name: 'Fruits & Vegetables', icon: '🥑' },
    { id: 2, name: 'Dairy, Bread & Eggs', icon: '🥛' },
    { id: 3, name: 'Snacks & Munchies', icon: '🍿' },
    { id: 4, name: 'Cold Drinks & Juices', icon: '🥤' },
    { id: 5, name: 'Bakery & Sweets', icon: '🍰' },
    { id: 6, name: 'Instant & Frozen', icon: '🍜' },
    { id: 7, name: 'Meat, Fish & Eggs', icon: '🍗' },
    { id: 8, name: 'Baby Care Products', icon: '👶' }
  ];

  const subCategories: Record<number, string[]> = {
    1: ['Fresh Vegetables', 'Fresh Fruits', 'Herbs & Seasonings', 'Exotic Fruits', 'Organic Products'],
    2: ['Milk', 'Butter & Ghee', 'Cheese & Paneer', 'Curd & Yogurt', 'Bread & Eggs'],
    3: ['Chips & Crisps', 'Namkeen & Mixtures', 'Biscuits & Cookies', 'Popcorn & Puffs', 'Nachos'],
    4: ['Soft Drinks', 'Energy Drinks', 'Fruit Juices', 'Coconut Water & Shakes', 'Soda & Mixers'],
    5: ['Cakes & Muffins', 'Traditional Sweets', 'Chocolates & Candies', 'Donuts & Pastries'],
    6: ['Noodles & Pasta', 'Frozen Veg Snacks', 'Frozen Non-Veg Snacks', 'Ready to Eat Meals'],
    7: ['Chicken', 'Mutton', 'Fish & Seafood', 'Eggs'],
    8: ['Diapers & Wipes', 'Baby Food & Formula', 'Baby Bath & Skin', 'Baby Toys & Accessories']
  };

  const [activeId, setActiveId] = useState(1);

  return (
    <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-170px)] bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Sidebar List */}
      <aside className="w-1/3 md:w-1/4 bg-neutral-55 border-r border-neutral-200 overflow-y-auto">
        {mainCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveId(cat.id)}
            className={`w-full py-4 px-3 flex flex-col md:flex-row md:space-x-3.5 md:space-y-0 md:justify-start md:px-5 items-center space-y-1 transition-all border-l-4 text-center md:text-left ${
              activeId === cat.id
                ? 'bg-white border-yellow-500 text-neutral-900 font-black shadow-inner'
                : 'border-transparent text-neutral-600 font-bold hover:bg-neutral-100/50'
            }`}
          >
            <span className="text-2xl md:text-xl shrink-0">{cat.icon}</span>
            <span className="text-[10px] md:text-xs font-extrabold tracking-tight leading-tight break-words max-w-[85px] md:max-w-none">
              {cat.name}
            </span>
          </button>
        ))}
      </aside>

      {/* Grid Panel */}
      <section className="w-2/3 md:w-3/4 bg-white overflow-y-auto p-4 md:p-6">
        <h3 className="text-xs md:text-sm font-black text-neutral-450 uppercase tracking-wider mb-5 text-left">
          {mainCategories.find(c => c.id === activeId)?.name}
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {subCategories[activeId]?.map((sub, idx) => (
            <div
              key={idx}
              className="bg-neutral-50 hover:bg-yellow-50/50 rounded-2xl p-4 border border-neutral-200 hover:border-yellow-250 transition-all flex flex-col justify-center items-center text-center cursor-pointer min-h-[100px] shadow-sm hover:shadow"
            >
              <div className="text-2xl mb-1.5">📦</div>
              <span className="text-[11px] md:text-xs font-black text-neutral-700 leading-tight">
                {sub}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
