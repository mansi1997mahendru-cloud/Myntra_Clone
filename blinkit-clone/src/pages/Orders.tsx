import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Clock, CheckCircle2, ChevronRight, RotateCcw, Loader2, ClipboardList, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  id: number;
  qty: number;
  price: number;
  product: {
    id: number;
    name: string;
    icon: string;
  };
}

interface Order {
  id: number;
  address: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_charge: number;
  handling_charge: number;
  grand_total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:8000/api/orders/${user.uid}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (e: any) {
      console.error(e);
      setError('Could not connect to the orders database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll orders list every 10 seconds to auto-update simulation transitions
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Dynamic grouping logic:
  // Show order as Active if placed in the last 60 seconds (simulates live dispatch)
  const isOrderActive = (order: Order) => {
    const elapsed = Date.now() - new Date(order.created_at).getTime();
    return elapsed < 60000; // 60 seconds delivery loop
  };

  const activeOrders = orders.filter(isOrderActive);
  const pastOrders = orders.filter(o => !isOrderActive(o));

  const formatItemsString = (items: OrderItem[]) => {
    return items.map(item => `${item.product.name} x${item.qty}`).join(', ');
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8 flex flex-col justify-center items-center text-center min-h-[400px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-xs text-neutral-450 font-semibold">Loading orders...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-8 flex flex-col justify-center items-center text-center space-y-4 min-h-[400px]">
        <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-450">
          <ClipboardList className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-neutral-800 text-base">Login to view orders</h3>
          <p className="text-xs text-neutral-500 font-semibold max-w-[240px]">
            Please sign in to view your complete order history and track deliveries.
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="py-3 px-6 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-black rounded-xl text-xs active:scale-95 transition-transform"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 text-left pb-16">
      <h2 className="text-lg font-extrabold text-neutral-800 tracking-tight">Your Orders</h2>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2.5 text-rose-700 text-xs font-semibold">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Orders Section */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-neutral-450 uppercase tracking-wider">
            Active Orders (Live Tracking)
          </h3>
          {activeOrders.map((order) => {
            const timeLeft = Math.max(1, Math.round((60000 - (Date.now() - new Date(order.created_at).getTime())) / 1000));
            return (
              <div 
                key={order.id} 
                className="bg-white rounded-2xl border-2 border-emerald-500 p-4 shadow-sm relative overflow-hidden space-y-3.5"
              >
                {/* Status Badge */}
                <div className="absolute right-0 top-0 bg-emerald-600 text-white text-[9px] font-black px-3.5 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center space-x-1">
                  <Clock className="h-3 w-3 animate-spin" />
                  <span>On the Way</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wide">
                    Order ID: #{order.id}
                  </span>
                  <h4 className="text-sm font-black text-emerald-600 leading-tight">
                    Arriving in {timeLeft}s
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-medium">Placed at {formatDate(order.created_at)}</p>
                </div>

                <div className="border-t border-dashed border-neutral-100 pt-3 flex justify-between items-center text-xs font-semibold text-neutral-600">
                  <span className="truncate max-w-[200px]">{formatItemsString(order.items)}</span>
                  <span className="font-extrabold text-neutral-900 shrink-0">₹{order.grand_total}</span>
                </div>

                <button 
                  onClick={() => alert(`Tracking details: Your order is leaving partner center. ETA ${timeLeft} seconds.`)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex justify-center items-center space-x-1 shadow-sm active:scale-98 transition-transform cursor-pointer"
                >
                  <span>Track Live Delivery</span>
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Past Orders Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-neutral-450 uppercase tracking-wider">
          Past Orders
        </h3>
        
        {pastOrders.length === 0 && activeOrders.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center text-neutral-400 font-semibold text-xs shadow-sm">
            No orders found. Add items to cart and check out to see them here!
          </div>
        ) : (
          <div className="space-y-4">
            {pastOrders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wide">
                        ID: #{order.id}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-neutral-300"></span>
                      <span className="text-[10px] text-neutral-500 font-bold">{formatDate(order.created_at)}</span>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className="flex items-center space-x-1 text-neutral-500">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-extrabold text-neutral-800">Delivered</span>
                    </div>
                  </div>

                  <span className="text-sm font-black text-neutral-900">₹{order.grand_total}</span>
                </div>

                <p className="text-[11px] font-semibold text-neutral-500 leading-relaxed border-t border-neutral-100 pt-2.5">
                  {formatItemsString(order.items)}
                </p>

                <div className="flex justify-end pt-1">
                  <button 
                    onClick={() => alert(`Details: Delivered to ${order.address} via ${order.payment_method}`)}
                    className="py-2 px-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 text-neutral-700 font-black rounded-xl text-[10px] flex items-center space-x-1.5 transition-colors active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>View Order Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
