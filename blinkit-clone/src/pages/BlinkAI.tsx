import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Sparkles, Utensils, Calendar, ShieldAlert, Award, ArrowRight, Check, ShoppingCart, RefreshCw, Loader2, Sparkle } from 'lucide-react';

interface ShoppingListItem {
  product_id: number;
  qty: number;
  reason: string;
  product?: {
    id: number;
    name: string;
    brand: string;
    size: string;
    price: number;
    original_price?: number;
    icon: string;
    discount?: string;
    stock: number;
  };
}

interface HealthyAlternative {
  original_id: number;
  healthy_id: number;
  explanation: string;
  original_product?: any;
  healthy_product?: any;
}

interface AgentLog {
  agent: string;
  status: string;
  output: string;
}

interface AIPlanResult {
  recipe_name: string;
  cooking_time: string;
  difficulty: string;
  healthy_score: number;
  original_total: number;
  savings: number;
  grand_total: number;
  shopping_list: ShoppingListItem[];
  healthy_alternatives: HealthyAlternative[];
  weekly_plan?: Record<string, { breakfast: string; lunch: string; dinner: string }>;
  agent_logs?: AgentLog[];
}

export const BlinkAI: React.FC = () => {
  const { addToCart } = useCart();

  // Tab selections
  const [plannerType, setPlannerType] = useState<'recipe' | 'weekly' | 'budget' | 'healthy'>('recipe');

  // Input states
  const [promptInput, setPromptInput] = useState('');
  const [familySize, setFamilySize] = useState(4);
  const [budgetLimit, setBudgetLimit] = useState(1000);
  const [foodPreference, setFoodPreference] = useState<'Vegetarian' | 'Non Vegetarian' | 'Vegan' | 'High Protein' | 'Diabetic Friendly'>('Vegetarian');

  // Loading and Agents logs state
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [result, setResult] = useState<AIPlanResult | null>(null);

  // Healthy alternative swappers (keep track of swapped item IDs)
  const [swappedItems, setSwappedItems] = useState<Record<number, boolean>>({});

  const handleQuickAction = (type: 'recipe' | 'weekly' | 'budget' | 'healthy') => {
    setPlannerType(type);
    if (type === 'recipe') {
      setPromptInput('Paneer Butter Masala');
    } else if (type === 'weekly') {
      setPromptInput('Weekly meal planner for 4 people');
    } else if (type === 'budget') {
      setPromptInput('Optimize my weekly groceries under ₹800');
    } else if (type === 'healthy') {
      setPromptInput('Find healthy swaps for snacks and cold drinks');
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResult(null);
    setLogs([]);
    setCurrentStepIdx(-1);

    // Initial parsing
    const stepLogs: AgentLog[] = [
      { agent: 'Intent Agent', status: 'success', output: `Classified user request as '${plannerType.toUpperCase()}' mode.` },
      { agent: 'Meal Planning Agent', status: 'success', output: 'Synthesizing ingredient checklist & portion scaling.' },
      { agent: 'Product Search Agent', status: 'success', output: 'Scanning active PostgreSQL products table...' },
      { agent: 'Recommendation Agent', status: 'success', output: 'Evaluating rating metrics, brands & catalog discounts.' },
      { agent: 'Budget Optimization Agent', status: 'success', output: 'Calculating brand alternatives & budget guardrails.' },
      { agent: 'Offer & Coupon Agent', status: 'success', output: 'Checking eligible bundle offers and cart coupons.' },
      { agent: 'Cart Generation Agent', status: 'success', output: 'Bundling item payloads for checkout synchronization.' }
    ];

    // Simulate thinking steps animation
    for (let i = 0; i < stepLogs.length; i++) {
      setCurrentStepIdx(i);
      setLogs((prev) => [...prev, stepLogs[i]]);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2 seconds timeout limit!

    try {
      const res = await fetch('http://localhost:8000/api/blinkai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: plannerType,
          prompt: promptInput || (plannerType === 'recipe' ? 'Paneer Butter Masala' : 'Healthy breakfast planning'),
          family_size: familySize,
          budget: budgetLimit,
          preference: foodPreference,
          items: []
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setLogs(data.agent_logs || stepLogs);
        setLoading(false);
        setCurrentStepIdx(-1);
        setTimeout(() => window.scrollTo({ top: 350, behavior: 'smooth' }), 100);
        return;
      }
    } catch (err) {
      console.error("FastAPI BlinkAI endpoint failed. Initiating client-side search matching engine...", err);
    }

    // Client-side self-healing fallback matching actual database products
    try {
      let products: any[] = [];
      try {
        const searchRes = await fetch('http://localhost:8000/api/products/search?q=');
        if (searchRes.ok) {
          products = await searchRes.json();
        }
      } catch (searchErr) {
        console.error("Local search endpoint failed, using static fallback assets:", searchErr);
      }
      
      // If searchRes failed or returned empty list, use high-fidelity hardcoded inventory matching database seeds
      if (products.length === 0) {
        products = [
          { id: 1, name: "Amul Fresh Paneer", brand: "Amul", size: "200g", price: 90, original_price: 100, icon: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300", stock: 12 },
          { id: 2, name: "Amul Butter salted", brand: "Amul", size: "100g", price: 58, original_price: 60, icon: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300", stock: 15 },
          { id: 3, name: "Everest Shahi Paneer Masala", brand: "Everest", size: "50g", price: 42, original_price: 45, icon: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=300", stock: 20 },
          { id: 4, name: "Fresh Red Onion", brand: "Farm Fresh", size: "1kg", price: 35, original_price: 40, icon: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300", stock: 25 },
          { id: 5, name: "Fresh Hybrid Tomato", brand: "Farm Fresh", size: "500g", price: 28, original_price: 30, icon: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=300", stock: 30 },
          { id: 6, name: "Fortune Rozana Basmati Rice", brand: "Fortune", size: "1kg", price: 95, original_price: 110, icon: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300", stock: 18 },
          { id: 7, name: "Amul Taaza Toned Milk", brand: "Amul", size: "1L", price: 66, original_price: 66, icon: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300", stock: 24 },
          { id: 8, name: "Britannia Brown Bread", brand: "Britannia", size: "400g", price: 45, original_price: 50, icon: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300", stock: 10 },
          { id: 9, name: "Lays Classic Salted Chips", brand: "Lays", size: "50g", price: 20, original_price: 20, icon: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300", stock: 40 },
          { id: 10, name: "Real Fruit Juice Mixed Fruit", brand: "Real", size: "1L", price: 115, original_price: 130, icon: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300", stock: 15 },
          { id: 11, name: "Mother Dairy Diet Eggs", brand: "Mother Dairy", size: "6 pcs", price: 55, original_price: 60, icon: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300", stock: 12 },
          { id: 12, name: "Fresh Fuji Apple", brand: "Organic", size: "4 pcs", price: 140, original_price: 160, icon: "https://images.unsplash.com/photo-1610832958506-ee5633619141?w=300", stock: 20 }
        ];
      }

      // Execute semantic query matcher
      const text = (promptInput || "").toLowerCase();
      let recipeName = "Custom AI Grocery Checklist";
      let cookTime = "20 mins";
      let difficultyLevel = "Easy";
      let healthScore = 86;
      let matchedItems: any[] = [];
      let alternatives: any[] = [];

      // 1. Recipe Match
      if (plannerType === "recipe") {
        if (text.includes("paneer")) {
          recipeName = "Paneer Butter Masala";
          cookTime = "25 mins";
          difficultyLevel = "Medium";
          healthScore = 80;
          const paneer = products.find(p => p.name.toLowerCase().includes("paneer")) || products[0];
          const butter = products.find(p => p.name.toLowerCase().includes("butter")) || products[1];
          const masala = products.find(p => p.name.toLowerCase().includes("masala")) || products[2];
          const onion = products.find(p => p.name.toLowerCase().includes("onion")) || products[3];
          const tomato = products.find(p => p.name.toLowerCase().includes("tomato")) || products[4];
          matchedItems = [
            { product: paneer, qty: 1 + Math.floor(familySize / 4), reason: "High-protein fresh cottage paneer chunks" },
            { product: butter, qty: 1, reason: "Rich salted butter for roasting gravy" },
            { product: masala, qty: 1, reason: "Shahi paneer spice powder spice mix" },
            { product: onion, qty: 1 + Math.floor(familySize / 5), reason: "Gravy base and aromatic element" },
            { product: tomato, qty: 1 + Math.floor(familySize / 4), reason: "Tangy tomato paste base for curry cream" }
          ];
        } else if (text.includes("biryani") || text.includes("rice") || text.includes("pulao")) {
          recipeName = "Hyderabadi Veg Biryani";
          cookTime = "40 mins";
          difficultyLevel = "Hard";
          healthScore = 75;
          const rice = products.find(p => p.name.toLowerCase().includes("rice")) || products[5] || products[0];
          const masala = products.find(p => p.name.toLowerCase().includes("masala")) || products[2];
          const onion = products.find(p => p.name.toLowerCase().includes("onion")) || products[3];
          const tomato = products.find(p => p.name.toLowerCase().includes("tomato")) || products[4];
          matchedItems = [
            { product: rice, qty: 1 + Math.floor(familySize / 3), reason: "Long-grain fragrant basmati rice layer" },
            { product: masala, qty: 1, reason: "Aromatic biryani garam masala mix" },
            { product: onion, qty: 1, reason: "Crispy fried caramelized onion garnish" },
            { product: tomato, qty: 1, reason: "Tangy flavoring agent for rice marinade" }
          ];
        } else if (text.includes("rajma") || text.includes("dal") || text.includes("naan") || text.includes("roti") || text.includes("chapati")) {
          recipeName = "Punjabi Rajma Masala & Basmati Rice";
          cookTime = "30 mins";
          difficultyLevel = "Medium";
          healthScore = 85;
          const rice = products.find(p => p.name.toLowerCase().includes("rice")) || products[5] || products[0];
          const masala = products.find(p => p.name.toLowerCase().includes("masala")) || products[2];
          const onion = products.find(p => p.name.toLowerCase().includes("onion")) || products[3];
          const tomato = products.find(p => p.name.toLowerCase().includes("tomato")) || products[4];
          matchedItems = [
            { product: rice, qty: 1 + Math.floor(familySize / 3), reason: "Fortune rozana long grain basmati rice portion" },
            { product: masala, qty: 1, reason: "Everest shahi garam spices powder" },
            { product: onion, qty: 1, reason: "Aromatic vegetable base elements" },
            { product: tomato, qty: 1, reason: "Red tomato paste ingredient base" }
          ];
        } else if (text.includes("tea") || text.includes("chai") || text.includes("coffee")) {
          recipeName = "Special Adrak Chai";
          cookTime = "10 mins";
          difficultyLevel = "Easy";
          healthScore = 90;
          const milk = products.find(p => p.name.toLowerCase().includes("milk")) || products[6] || products[0];
          const tea = products.find(p => p.name.toLowerCase().includes("tea")) || products.find(p => p.name.toLowerCase().includes("coffee")) || products[0];
          const sugar = products.find(p => p.name.toLowerCase().includes("sugar") || p.name.toLowerCase().includes("honey")) || products[0];
          matchedItems = [
            { product: milk, qty: 1 + Math.floor(familySize / 4), reason: "Fresh toned milk for boiling tea" },
            { product: tea, qty: 1, reason: "Strong CTC tea granules for rich flavor" },
            { product: sugar, qty: 1, reason: "Sugar sweetener option" }
          ];
        } else {
          // Dynamic keyword matcher for ANY dish search!
          const words = text.split(/\s+/).filter(w => w.length > 2 && w !== "want" && w !== "cook" && w !== "make" && w !== "with" && w !== "dinner" && w !== "lunch" && w !== "meal");
          let matches = products.filter(p => {
            const nameLower = p.name.toLowerCase();
            return words.some(w => nameLower.includes(w));
          });
          if (matches.length === 0) {
            const keywords = ["paneer", "butter", "rice", "dal", "milk", "bread", "tomato", "onion", "masala", "oil", "ghee", "potato"];
            matches = products.filter(p => {
              const nameLower = p.name.toLowerCase();
              return keywords.some(k => nameLower.includes(k) && text.includes(k));
            });
          }
          if (matches.length > 0) {
            recipeName = promptInput ? promptInput.replace(/i want to cook|i want to make|cook|make|in dinner|in lunch/gi, "").trim() : "Custom AI Recipe";
            recipeName = recipeName.charAt(0).toUpperCase() + recipeName.slice(1);
            cookTime = "20 mins";
            difficultyLevel = "Medium";
            healthScore = 85;
            matchedItems = matches.slice(0, 5).map((p, idx) => ({
              product: p,
              qty: idx === 0 ? 1 + Math.floor(familySize / 3) : 1,
              reason: idx === 0 ? "Core recipe ingredient base" : "Recipe seasoning and flavoring accompaniment"
            }));
          } else {
            // General Grocery Basket Fallback (Atta, Rice, Milk, Tea, Butter)
            recipeName = "Daily Essentials Grocery Basket";
            cookTime = "5 mins";
            difficultyLevel = "Easy";
            healthScore = 95;
            const milk = products.find(p => p.name.toLowerCase().includes("milk")) || products[6] || products[0];
            const bread = products.find(p => p.name.toLowerCase().includes("bread")) || products[7] || products[0];
            const butter = products.find(p => p.name.toLowerCase().includes("butter")) || products[1] || products[0];
            const eggs = products.find(p => p.name.toLowerCase().includes("egg")) || products[10] || products[0];
            matchedItems = [
              { product: milk, qty: 1 + Math.floor(familySize / 4), reason: "Fresh toned milk for daily calcium" },
              { product: bread, qty: 1, reason: "Whole wheat high-fiber bread" },
              { product: butter, qty: 1, reason: "Rich salted table butter spread" },
              { product: eggs, qty: 1, reason: "Fresh farm protein source eggs" }
            ];
          }
        }
      } 
      // 2. Weekly Meal Plan
      else if (plannerType === "weekly") {
        recipeName = `7-Day ${foodPreference} Meal Plan`;
        cookTime = "Variable";
        difficultyLevel = "Easy";
        healthScore = 92;
        const milk = products.find(p => p.name.toLowerCase().includes("milk")) || products[0];
        const bread = products.find(p => p.name.toLowerCase().includes("bread")) || products[0];
        const eggs = products.find(p => p.name.toLowerCase().includes("egg")) || products[0];
        const apple = products.find(p => p.name.toLowerCase().includes("apple")) || products[0];
        const chips = products.find(p => p.name.toLowerCase().includes("chips")) || products[0];
        const juice = products.find(p => p.name.toLowerCase().includes("juice")) || products[0];
        
        matchedItems = [
          { product: milk, qty: 2, reason: "Daily high-calcium dairy supply" },
          { product: bread, qty: 1, reason: "High-fiber brown bread breakfast base" },
          { product: eggs, qty: 1, reason: "Essential morning protein portion" },
          { product: apple, qty: 1, reason: "Dietary fiber fresh apple snacking" },
          { product: chips, qty: 1, reason: "Quick evening munchies pack" },
          { product: juice, qty: 1, reason: "Fresh beverage alternative to sodas" }
        ];
      } 
      // 3. Budget / Healthy / Fallback
      else {
        recipeName = "AI Optimized Basket";
        cookTime = "10 mins";
        difficultyLevel = "Easy";
        healthScore = 90;
        matchedItems = products.slice(0, 5).map(p => ({
          product: p,
          qty: 1,
          reason: "Highly rated pantry essentials matching budget constraints"
        }));
      }

      // Add Healthy alternatives swap recommendation side-by-side
      matchedItems.forEach(item => {
        const nameLower = item.product.name.toLowerCase();
        if (nameLower.includes("chips")) {
          const healthySwap = products.find(p => p.name.toLowerCase().includes("apple") || p.name.toLowerCase().includes("fruit")) || products[0];
          alternatives.push({
            original_id: item.product.id,
            healthy_id: healthySwap.id,
            explanation: "Baked fresh apples provide dietary fiber and vitamins with 0g saturated fat.",
            original_product: item.product,
            healthy_product: healthySwap
          });
        }
      });

      // Compute pricing
      let subtotal = 0;
      const shoppingListPayload = matchedItems.map(item => {
        subtotal += item.product.price * item.qty;
        return {
          product_id: item.product.id,
          qty: item.qty,
          reason: item.reason,
          product: item.product
        };
      });

      let savings = 0;
      if (plannerType === "budget" || subtotal > budgetLimit) {
        savings = Math.round(subtotal * 0.15); // Apply 15% optimization savings coupon
      }

      const finalResult: AIPlanResult = {
        recipe_name: recipeName,
        cooking_time: cookTime,
        difficulty: difficultyLevel,
        healthy_score: healthScore,
        original_total: subtotal,
        savings: savings,
        grand_total: subtotal - savings,
        shopping_list: shoppingListPayload,
        healthy_alternatives: alternatives,
        weekly_plan: plannerType === "weekly" ? {
          "Monday": { breakfast: "Milk & Toast", lunch: "Dal Tadka with Jeera Rice", dinner: "Wheat Chapati with Salad" },
          "Tuesday": { breakfast: "Eggs on Toast", lunch: "Paneer Curry with Veg Rice", dinner: "Fresh tomato soup with bread" },
          "Wednesday": { breakfast: "Apple Fruit Platter", lunch: "Noodles with stir fry greens", dinner: "Wheat Chapati with Dal" },
          "Thursday": { breakfast: "Milk & Toast", lunch: "Paneer Curry with Veg Rice", dinner: "Tomato soup and bread" },
          "Friday": { breakfast: "Eggs on Toast", lunch: "Dal Tadka with Jeera Rice", dinner: "Wheat Chapati with Salad" },
          "Saturday": { breakfast: "Apple Fruit Platter", lunch: "Vegetable Pulao with curd", dinner: "Stir fry mixed greens" },
          "Sunday": { breakfast: "Milk & Toast", lunch: "Hyderabadi Veg Biryani", dinner: "Wheat Chapati with paneer" }
        } : undefined
      };

      setResult(finalResult);
    } catch (err2) {
      console.error("Critical client-side fallback parsing error:", err2);
    } finally {
      setLoading(false);
      setCurrentStepIdx(-1);
    }
  };

  // Switch an item to a healthier alternative
  const handleSwap = (originalId: number, healthyId: number) => {
    if (!result) return;
    
    // Find healthy alternative
    const swapMatch = result.healthy_alternatives.find(
      (alt) => alt.original_id === originalId && alt.healthy_id === healthyId
    );
    if (!swapMatch || !swapMatch.healthy_product) return;

    // Replace the product in result.shopping_list
    const updatedList = result.shopping_list.map((item) => {
      if (item.product_id === originalId) {
        return {
          ...item,
          product_id: healthyId,
          product: swapMatch.healthy_product,
          reason: `💡 Swapped for healthier alternative: ${swapMatch.explanation}`
        };
      }
      return item;
    });

    // Recompute price
    let subtotal = 0;
    updatedList.forEach((item) => {
      if (item.product) subtotal += item.product.price * item.qty;
    });

    const newSavings = Math.round(subtotal * 0.15);

    setResult({
      ...result,
      shopping_list: updatedList,
      original_total: subtotal,
      savings: newSavings,
      grand_total: subtotal - newSavings
    });

    // Set swapped state to disable button
    setSwappedItems((prev) => ({ ...prev, [originalId]: true }));
  };

  // Add all ingredients in the shopping list to the cart
  const handleAddAllToCart = () => {
    if (!result || result.shopping_list.length === 0) return;
    
    let addedCount = 0;
    result.shopping_list.forEach((item) => {
      if (item.product) {
        // Add matching product qty times
        for (let i = 0; i < item.qty; i++) {
          addToCart(item.product);
        }
        addedCount += item.qty;
      }
    });

    alert(`Success! Added ${addedCount} planner ingredients directly to your Blinkit cart!`);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-20 text-left">
      
      {/* Page Title & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-150 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 bg-yellow-100 rounded-lg text-yellow-750">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
              BlinkAI – Smart Grocery Planner
            </h1>
          </div>
          <p className="text-xs text-neutral-500 font-semibold leading-none mt-1">
            Agentic AI Recipe Creator, Weekly Meal Planner, and Smart Budget Optimizer
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-neutral-50 px-3.5 py-1.5 rounded-full border border-neutral-200 text-[10px] font-black text-neutral-500 select-none">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>AGENTIC AI CORE V2 ACTIVE</span>
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Results/Logs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Inputs */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Quick Action Selector Cards */}
          <div className="bg-white rounded-3xl border border-neutral-200/70 p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-black text-neutral-450 uppercase tracking-wider">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleQuickAction('recipe')}
                className={`p-3.5 rounded-2xl border text-left space-y-1.5 transition-all duration-200 active:scale-95 flex flex-col justify-between h-24 ${
                  plannerType === 'recipe' 
                    ? 'border-yellow-400 bg-yellow-50/20 shadow-sm' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Utensils className={`h-4.5 w-4.5 ${plannerType === 'recipe' ? 'text-yellow-600' : 'text-neutral-500'}`} />
                <div>
                  <h4 className="text-[11px] font-black text-neutral-800 leading-tight">Plan a Recipe</h4>
                  <p className="text-[9px] text-neutral-400 font-semibold leading-tight mt-0.5">Ingredients & difficulty</p>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('weekly')}
                className={`p-3.5 rounded-2xl border text-left space-y-1.5 transition-all duration-200 active:scale-95 flex flex-col justify-between h-24 ${
                  plannerType === 'weekly' 
                    ? 'border-yellow-400 bg-yellow-50/20 shadow-sm' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Calendar className={`h-4.5 w-4.5 ${plannerType === 'weekly' ? 'text-yellow-600' : 'text-neutral-500'}`} />
                <div>
                  <h4 className="text-[11px] font-black text-neutral-800 leading-tight">Weekly Planner</h4>
                  <p className="text-[9px] text-neutral-400 font-semibold leading-tight mt-0.5">7-day meal schedules</p>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('budget')}
                className={`p-3.5 rounded-2xl border text-left space-y-1.5 transition-all duration-200 active:scale-95 flex flex-col justify-between h-24 ${
                  plannerType === 'budget' 
                    ? 'border-yellow-400 bg-yellow-50/20 shadow-sm' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Award className={`h-4.5 w-4.5 ${plannerType === 'budget' ? 'text-yellow-600' : 'text-neutral-500'}`} />
                <div>
                  <h4 className="text-[11px] font-black text-neutral-800 leading-tight">Budget Optimizer</h4>
                  <p className="text-[9px] text-neutral-400 font-semibold leading-tight mt-0.5">Find cheapest alternatives</p>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('healthy')}
                className={`p-3.5 rounded-2xl border text-left space-y-1.5 transition-all duration-200 active:scale-95 flex flex-col justify-between h-24 ${
                  plannerType === 'healthy' 
                    ? 'border-yellow-400 bg-yellow-50/20 shadow-sm' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <ShieldAlert className={`h-4.5 w-4.5 ${plannerType === 'healthy' ? 'text-yellow-600' : 'text-neutral-500'}`} />
                <div>
                  <h4 className="text-[11px] font-black text-neutral-800 leading-tight">Healthy Swaps</h4>
                  <p className="text-[9px] text-neutral-400 font-semibold leading-tight mt-0.5">Swap high-carb/sugary items</p>
                </div>
              </button>
            </div>
          </div>

          {/* Form Parameters Card */}
          <form onSubmit={handleGenerate} className="bg-white rounded-3xl border border-neutral-200/70 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-neutral-450 uppercase tracking-wider">Planner Settings</h3>
            
            {/* Natural language query prompt */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wide">Natural Prompt Query</label>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={
                  plannerType === 'recipe' ? 'e.g. "I want to cook Paneer Butter Masala for dinner"' :
                  plannerType === 'weekly' ? 'e.g. "Weekly groceries for a vegetarian family of 4"' :
                  plannerType === 'budget' ? 'e.g. "Optimize catalog items under ₹800"' :
                  'e.g. "Recommend organic healthy alternative food items"'
                }
                rows={3}
                className="w-full text-xs font-semibold p-3.5 border border-neutral-200 rounded-2xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none resize-none placeholder:text-neutral-400"
              />
            </div>

            {/* Family size portion scaling */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wide">Family Size (Portions)</label>
                <span className="text-[10px] font-black text-yellow-750">{familySize} People</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={10} 
                value={familySize}
                onChange={(e) => setFamilySize(Number(e.target.value))}
                className="w-full accent-yellow-400"
              />
            </div>

            {/* Budget limit limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wide">Target Budget</label>
                <span className="text-[10px] font-black text-emerald-700">₹{budgetLimit} Max</span>
              </div>
              <input 
                type="range" 
                min={200} 
                max={3000} 
                step={50}
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Preference selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-550 uppercase tracking-wide">Food Preference</label>
              <select
                value={foodPreference}
                onChange={(e: any) => setFoodPreference(e.target.value)}
                className="w-full text-xs font-semibold p-3 border border-neutral-200 rounded-2xl outline-none bg-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              >
                <option value="Vegetarian">Veg Only</option>
                <option value="Non Vegetarian">Non-Veg Allowed</option>
                <option value="Vegan">Vegan Only</option>
                <option value="High Protein">High Protein</option>
                <option value="Diabetic Friendly">Diabetic Friendly</option>
              </select>
            </div>

            {/* Submit generate button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#318625] hover:bg-[#25661b] text-white font-black rounded-2xl text-xs flex justify-center items-center space-x-1.5 shadow active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>AI Agent Executing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5 fill-current" />
                  <span>Generate AI Grocery Plan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Execution Logs / Result Display */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Agent execution logs (shows steps while running or after finish) */}
          {(loading || logs.length > 0) && (
            <div className="bg-neutral-900 text-neutral-100 rounded-3xl p-5 shadow-inner border border-neutral-800 space-y-4 max-h-[360px] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center space-x-1.5">
                  <Sparkle className="h-4 w-4 text-yellow-400 animate-spin" />
                  <span>Agentic AI Chain Process Logs</span>
                </h4>
                {loading && (
                  <span className="text-[9px] font-bold text-yellow-400 px-2 py-0.5 bg-yellow-400/10 rounded-full animate-pulse border border-yellow-400/20">
                    Running...
                  </span>
                )}
              </div>

              <div className="space-y-3 font-mono text-[10px] leading-relaxed">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-2 border-l-2 border-emerald-500/30 pl-2.5">
                    <span className="text-emerald-400 font-bold shrink-0">[{log.agent}]:</span>
                    <span className="text-neutral-300 font-semibold">{log.output}</span>
                  </div>
                ))}

                {loading && currentStepIdx >= 0 && (
                  <div className="flex items-center space-x-2 animate-pulse pl-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                    <span className="text-[9px] text-neutral-500 italic">Thinking next step...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Summary Box */}
          {result && (
            <div className="space-y-5">
              
              {/* Recipe metadata box */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 text-white flex justify-between items-center shadow relative overflow-hidden">
                <div className="space-y-2 z-10 text-left">
                  <span className="bg-white/20 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {plannerType.toUpperCase()} SUCCESS
                  </span>
                  <h2 className="text-lg md:text-xl font-black">{result.recipe_name}</h2>
                  <div className="flex items-center space-x-4 text-[10px] font-bold text-neutral-100/90 pt-1">
                    <span>⏱ {result.cooking_time}</span>
                    <span>•</span>
                    <span>📈 {result.difficulty} Difficulty</span>
                    <span>•</span>
                    <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-md font-black">Score: {result.healthy_score}%</span>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center border border-white/25">
                  <Utensils className="h-7 w-7 text-white" />
                </div>
              </div>

              {/* Weekly Meal Plan Schedule if available */}
              {plannerType === 'weekly' && result.weekly_plan && (
                <div className="bg-white rounded-3xl border border-neutral-200/70 p-5 shadow-sm space-y-3">
                  <h3 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Weekly Meal Schedule</h3>
                  
                  <div className="divide-y divide-neutral-100 max-h-[220px] overflow-y-auto pr-1">
                    {Object.entries(result.weekly_plan).map(([day, meals]) => (
                      <div key={day} className="py-2.5 flex items-start space-x-3.5 text-xs text-left">
                        <span className="font-black text-neutral-800 w-20 shrink-0">{day}</span>
                        <div className="grid grid-cols-3 gap-2.5 text-[10px] leading-tight text-neutral-500 font-semibold">
                          <div><span className="font-black text-neutral-700 block">🍳 Breakfast</span>{meals.breakfast}</div>
                          <div><span className="font-black text-neutral-700 block">🍛 Lunch</span>{meals.lunch}</div>
                          <div><span className="font-black text-neutral-700 block">🥗 Dinner</span>{meals.dinner}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Healthy Swaps Swappers */}
              {result.healthy_alternatives.length > 0 && (
                <div className="bg-rose-50/50 rounded-3xl border border-rose-200/50 p-5 shadow-sm space-y-3">
                  <h3 className="font-black text-rose-800 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-rose-600" />
                    <span>AI Healthy Swap Recommendations</span>
                  </h3>
                  
                  <div className="space-y-3 text-left">
                    {result.healthy_alternatives.map((alt, idx) => {
                      const isSwapped = swappedItems[alt.original_id];
                      return (
                        <div key={idx} className="bg-white rounded-2xl border border-rose-100 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 shrink-0">
                            {alt.original_product && (
                              <div className="text-center">
                                <img src={alt.original_product.icon} className="h-9 w-9 object-contain mx-auto" />
                                <span className="text-[8px] text-red-500 font-extrabold line-through block mt-1">{alt.original_product.name}</span>
                              </div>
                            )}
                            <ArrowRight className="h-4 w-4 text-neutral-450 shrink-0" />
                            {alt.healthy_product && (
                              <div className="text-center">
                                <img src={alt.healthy_product.icon} className="h-9 w-9 object-contain mx-auto" />
                                <span className="text-[8px] text-emerald-600 font-black block mt-1">{alt.healthy_product.name}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 md:px-4">
                            <p className="text-[10px] text-neutral-500 font-semibold leading-snug">
                              {alt.explanation}
                            </p>
                          </div>

                          <button
                            onClick={() => handleSwap(alt.original_id, alt.healthy_id)}
                            disabled={isSwapped}
                            className={`py-2 px-4 rounded-xl text-[9px] font-black flex items-center space-x-1 shrink-0 ${
                              isSwapped
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95 transition-all cursor-pointer shadow-sm'
                            }`}
                          >
                            {isSwapped ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Swapped</span>
                              </>
                            ) : (
                              <span>Swap Now</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shopping List of Products */}
              <div className="bg-white rounded-3xl border border-neutral-200/70 p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Shopping List ({result.shopping_list.length} Items)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left">
                  {result.shopping_list.map((item, idx) => {
                    if (!item.product) return null;
                    return (
                      <div key={idx} className="bg-white rounded-2xl border border-neutral-150 p-3.5 flex space-x-3 shadow-sm hover:shadow transition-shadow relative">
                        <div className="h-16 w-16 bg-neutral-50 rounded-xl flex items-center justify-center shrink-0 p-1 border border-neutral-100">
                          <img src={item.product.icon} className="h-[90%] w-[90%] object-contain" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[8px] text-neutral-400 font-black uppercase tracking-wider leading-none">
                            {item.product.brand}
                          </span>
                          <h4 className="text-xs font-black text-neutral-800 truncate leading-tight">
                            {item.product.name}
                          </h4>
                          <p className="text-[9px] text-neutral-450 font-bold">{item.product.size} • Qty: {item.qty}</p>
                          <div className="flex items-center space-x-1.5 pt-0.5">
                            <span className="text-xs font-black text-neutral-900">₹{item.product.price}</span>
                            {item.product.original_price && item.product.original_price > item.product.price && (
                              <span className="text-[10px] text-neutral-450 line-through">₹{item.product.original_price}</span>
                            )}
                          </div>
                          
                          {/* Reason why recommended */}
                          <div className="text-[9px] text-yellow-750 font-bold bg-yellow-50/50 p-1 rounded border border-yellow-100/50 mt-1">
                            {item.reason}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Calculations & Budget Optimizer */}
              <div className="bg-white rounded-3xl border border-neutral-200/70 p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider">Plan Checkout Details</h3>
                
                <div className="bg-neutral-50 rounded-2xl p-4 space-y-2 text-xs font-semibold text-neutral-600">
                  <div className="flex justify-between">
                    <span>Original Subtotal:</span>
                    <span>₹{result.original_total}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-extrabold">
                    <span>AI Savings applied:</span>
                    <span>-₹{result.savings}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-black text-neutral-850">
                    <span>Estimated Grand Total:</span>
                    <span className="text-emerald-700">₹{result.grand_total}</span>
                  </div>
                </div>

                {/* Final Control buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleAddAllToCart}
                    className="flex-1 py-3.5 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-black rounded-2xl text-xs flex justify-center items-center space-x-1.5 shadow active:scale-95 transition-all cursor-pointer border border-yellow-500"
                  >
                    <ShoppingCart className="h-4.5 w-4.5" />
                    <span>Add All {result.shopping_list.reduce((acc, i) => acc + i.qty, 0)} Items to Cart</span>
                  </button>

                  <button
                    onClick={() => handleGenerate()}
                    className="py-3.5 px-5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-black rounded-2xl text-xs flex justify-center items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="h-4.5 w-4.5" />
                    <span>Optimize Again</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
