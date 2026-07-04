import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ShieldAlert, 
  ShoppingBag, 
  ClipboardList, 
  Users, 
  Tag, 
  Plus, 
  Trash2, 
  Edit
} from 'lucide-react';

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

interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  mobile: string;
  is_active: boolean;
}

interface Order {
  id: number;
  user_id: string;
  address: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_charge: number;
  handling_charge: number;
  tip: number;
  grand_total: number;
  status: string;
  created_at: string;
}

interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
  max_discount: number | null;
  min_order_value: number;
  description: string;
  is_active: boolean;
}

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'coupons'>('products');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  // Modal / Form states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [prodName, setProdName] = useState('');
  const [prodSize, setProdSize] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodOrigPrice, setProdOrigPrice] = useState(0);
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodStock, setProdStock] = useState(15);
  const [prodIcon, setProdIcon] = useState('');
  const [prodDiscount, setProdDiscount] = useState('');

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDisc, setCouponDisc] = useState(10);
  const [couponMinVal, setCouponMinVal] = useState(0);
  const [couponMaxDisc, setCouponMaxDisc] = useState(0);
  const [couponDesc, setCouponDesc] = useState('');

  const [loading, setLoading] = useState(false);

  // Verification checks
  const isAdmin = user && (user.email === 'mansi1997mahendru@gmail.com' || user.email.includes('admin'));

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const res = await fetch("http://localhost:8000/api/products/search?q=");
        if (res.ok) setProducts(await res.json());
      } else if (activeTab === 'orders') {
        const res = await fetch("http://localhost:8000/api/admin/orders");
        if (res.ok) setOrders(await res.json());
      } else if (activeTab === 'users') {
        const res = await fetch("http://localhost:8000/api/admin/users");
        if (res.ok) setUsersList(await res.json());
      } else if (activeTab === 'coupons') {
        const res = await fetch("http://localhost:8000/api/coupons");
        if (res.ok) setCoupons(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [activeTab, user]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: prodName,
      size: prodSize,
      price: Number(prodPrice),
      original_price: Number(prodOrigPrice) || Number(prodPrice),
      icon: prodIcon || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop",
      images_list: prodIcon,
      discount: prodDiscount || "Best Price",
      brand: prodBrand,
      category: prodCategory,
      description: prodDesc,
      stock: Number(prodStock),
      is_best_seller: false,
      is_recommended: false
    };

    try {
      const url = editingProduct 
        ? `http://localhost:8000/api/admin/products/${editingProduct.id}`
        : "http://localhost:8000/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSize(p.size);
    setProdPrice(p.price);
    setProdOrigPrice(p.original_price);
    setProdBrand(p.brand);
    setProdCategory(p.category);
    setProdDesc(p.description);
    setProdStock(p.stock);
    setProdIcon(p.icon);
    setProdDiscount(p.discount);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/admin/products/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUser = async (userId: number, currentActive: boolean) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: couponCode.toUpperCase().trim(),
      discount_percentage: Number(couponDisc),
      min_order_value: Number(couponMinVal),
      max_discount: Number(couponMaxDisc) || null,
      description: couponDesc
    };
    try {
      const res = await fetch("http://localhost:8000/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowCouponModal(false);
        setCouponCode('');
        setCouponDisc(10);
        setCouponMinVal(0);
        setCouponMaxDisc(0);
        setCouponDesc('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-6 flex flex-col justify-center items-center text-center space-y-4 min-h-[calc(100vh-200px)]">
        <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
          <ShieldAlert className="h-9 w-9" />
        </div>
        <h3 className="font-extrabold text-neutral-800 text-lg">Admin View Restricted</h3>
        <p className="text-xs text-neutral-500 font-semibold max-w-[280px]">
          Only authorized admin accounts have access permissions to manage products, categories, users, and coupons.
        </p>
        <button
          onClick={() => navigate('/home')}
          className="py-3 px-6 bg-yellow-400 text-neutral-900 font-extrabold rounded-xl shadow-md text-xs active:scale-95 transition-transform"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 pb-20 text-left">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-black text-neutral-900">Blinkit Admin Dashboard</h1>
        
        <div className="flex space-x-2">
          {activeTab === 'products' && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setProdName('');
                setProdSize('');
                setProdPrice(0);
                setProdOrigPrice(0);
                setProdBrand('');
                setProdCategory('');
                setProdDesc('');
                setProdStock(15);
                setProdIcon('');
                setProdDiscount('');
                setShowProductModal(true);
              }}
              className="bg-emerald-600 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center space-x-1.5 shadow active:scale-95 transition-transform cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          )}
          {activeTab === 'coupons' && (
            <button
              onClick={() => setShowCouponModal(true)}
              className="bg-emerald-600 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center space-x-1.5 shadow active:scale-95 transition-transform cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Coupon</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-neutral-200">
        {[
          { id: 'products', label: 'Products', icon: ShoppingBag },
          { id: 'orders', label: 'Orders', icon: ClipboardList },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'coupons', label: 'Coupons', icon: Tag }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 px-6 flex items-center space-x-2 border-b-2 text-xs font-black transition-colors cursor-pointer ${
                activeTab === t.id 
                  ? 'border-yellow-500 text-yellow-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading overlay */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          <span className="text-xs text-neutral-500 font-semibold">Loading data...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm p-4">
          
          {/* 1. PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-black uppercase text-[10px]">
                    <th className="py-3 px-2">Image</th>
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2">Stock</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 font-semibold text-neutral-700">
                      <td className="py-2.5 px-2">
                        <div className="h-10 w-10 p-0.5 border border-neutral-200 rounded-lg overflow-hidden flex items-center justify-center bg-neutral-50">
                          <img src={p.icon} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-extrabold text-neutral-850">
                        {p.name}
                        <span className="block text-[10px] text-neutral-400 font-bold">{p.size} | {p.brand}</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-black">₹{p.price}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.stock === 0 ? 'bg-rose-100 text-rose-700' : p.stock < 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.stock === 0 ? 'Out of Stock' : `${p.stock} units`}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right space-x-2">
                        <button onClick={() => handleEditProduct(p)} className="p-1 hover:text-yellow-600 text-neutral-400"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-1 hover:text-rose-600 text-neutral-400"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-black uppercase text-[10px]">
                    <th className="py-3 px-2">Order ID</th>
                    <th className="py-3 px-2">User ID</th>
                    <th className="py-3 px-2">Total Amount</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 font-semibold text-neutral-700">
                      <td className="py-3 px-2 font-extrabold text-neutral-850">#{o.id}</td>
                      <td className="py-3 px-2 text-neutral-500 font-bold">User {o.user_id}</td>
                      <td className="py-3 px-2 font-black">₹{o.grand_total}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : o.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <select 
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-neutral-50 border border-neutral-200 rounded-lg p-1 text-xs font-bold focus:outline-none"
                        >
                          <option value="Placed">Placed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Packed">Packed</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. USERS TAB */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-black uppercase text-[10px]">
                    <th className="py-3 px-2">User ID</th>
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Mobile</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 font-semibold text-neutral-700">
                      <td className="py-3 px-2 font-bold text-neutral-500">{u.id}</td>
                      <td className="py-3 px-2 font-extrabold text-neutral-850">{u.full_name}</td>
                      <td className="py-3 px-2 font-bold text-neutral-600">{u.email}</td>
                      <td className="py-3 px-2 font-bold text-neutral-600">{u.mobile}</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleToggleUser(u.id, u.is_active)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            u.is_active 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                              : 'bg-rose-50 text-rose-700 border border-rose-350'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. COUPONS TAB */}
          {activeTab === 'coupons' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-black uppercase text-[10px]">
                    <th className="py-3 px-2">Coupon Code</th>
                    <th className="py-3 px-2">Discount %</th>
                    <th className="py-3 px-2">Min Order</th>
                    <th className="py-3 px-2">Max Disc</th>
                    <th className="py-3 px-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 font-semibold text-neutral-700">
                      <td className="py-3 px-2"><span className="bg-yellow-100 border border-yellow-250 text-yellow-800 font-black px-2 py-0.5 rounded-md text-[10px]">{c.code}</span></td>
                      <td className="py-3 px-2 font-black">{c.discount_percentage}%</td>
                      <td className="py-3 px-2 font-black">₹{c.min_order_value}</td>
                      <td className="py-3 px-2 font-bold text-neutral-600">{c.max_discount ? `₹${c.max_discount}` : 'No Max'}</td>
                      <td className="py-3 px-2 text-neutral-500 font-bold leading-tight">{c.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* A. PRODUCT ENTRY / EDIT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-neutral-800">
              {editingProduct ? 'Edit Existing Product' : 'Add New Product'}
            </h3>
            
            <form onSubmit={handleProductSubmit} className="space-y-3 font-semibold text-neutral-700">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Product Name</label>
                <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Weight/Size</label>
                  <input type="text" required value={prodSize} onChange={e => setProdSize(e.target.value)} placeholder="e.g. 500 g" className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Brand</label>
                  <input type="text" required value={prodBrand} onChange={e => setProdBrand(e.target.value)} className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Selling Price (₹)</label>
                  <input type="number" required value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))} className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">MRP (₹)</label>
                  <input type="number" value={prodOrigPrice} onChange={e => setProdOrigPrice(Number(e.target.value))} className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Inventory Stock</label>
                  <input type="number" required value={prodStock} onChange={e => setProdStock(Number(e.target.value))} className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Category</label>
                  <select required value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="w-full p-2.5 border border-neutral-200 bg-white rounded-xl focus:outline-none font-bold">
                    <option value="">Select Category</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Dairy, Bread & Eggs">Dairy, Bread & Eggs</option>
                    <option value="Munchies">Munchies</option>
                    <option value="Cold Drinks & Juices">Cold Drinks & Juices</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Tea & Coffee">Tea & Coffee</option>
                    <option value="Atta, Rice & Dal">Atta, Rice & Dal</option>
                    <option value="Oil & Ghee">Oil & Ghee</option>
                    <option value="Masala">Masala</option>
                    <option value="Frozen Food">Frozen Food</option>
                    <option value="Ice Cream">Ice Cream</option>
                    <option value="Biscuits">Biscuits</option>
                    <option value="Chocolates">Chocolates</option>
                    <option value="Cleaning Essentials">Cleaning Essentials</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Baby Care">Baby Care</option>
                    <option value="Pet Care">Pet Care</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Discount Tag</label>
                  <input type="text" value={prodDiscount} onChange={e => setProdDiscount(e.target.value)} placeholder="e.g. 10% OFF" className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Product Photo URL</label>
                <input type="text" value={prodIcon} onChange={e => setProdIcon(e.target.value)} placeholder="Unsplash URL" className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none font-medium" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Product Description</label>
                <textarea rows={3} value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="py-2.5 px-4 bg-neutral-100 text-neutral-700 font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-emerald-600 text-white font-extrabold rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. COUPON CREATION MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-xs">
            <h3 className="text-base font-black text-neutral-800">Add New Coupon</h3>
            
            <form onSubmit={handleCouponSubmit} className="space-y-3 font-semibold text-neutral-700">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Coupon Code</label>
                <input type="text" required value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="e.g. WELCOME15" className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Discount (%)</label>
                  <input type="number" required min={1} max={100} value={couponDisc} onChange={e => setCouponDisc(Number(e.target.value))} className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Min Order Value (₹)</label>
                  <input type="number" required min={0} value={couponMinVal} onChange={e => setCouponMinVal(Number(e.target.value))} className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Max Discount Amount (₹)</label>
                <input type="number" value={couponMaxDisc} onChange={e => setCouponMaxDisc(Number(e.target.value))} placeholder="Optional" className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black tracking-wider text-neutral-450">Description</label>
                <input type="text" required value={couponDesc} onChange={e => setCouponDesc(e.target.value)} placeholder="e.g. Flat 10% Off up to ₹50!" className="w-full p-2.5 border border-neutral-200 rounded-xl focus:outline-none" />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="py-2.5 px-4 bg-neutral-100 text-neutral-700 font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-emerald-600 text-white font-extrabold rounded-xl shadow"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
