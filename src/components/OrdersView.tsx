import React, { useState, useEffect, useCallback } from 'react';
import { X, Package, Truck, CheckCircle2, Clock, Calendar, ChevronRight, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order } from '../types';

interface OrdersViewProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ isOpen, onClose, onToast }) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.checkout.getOrders();
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      onToast('Could not load orders history', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, onToast]);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, fetchOrders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        id="orders-view-panel"
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-3xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                {user?.role === 'admin' ? 'All Customer Orders (Admin View)' : 'My Orders & Order Receipts'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isAuthenticated ? `Authenticated as ${user?.email}` : 'Please sign in to view persistent order history'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={fetchOrders}
                disabled={isLoading}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                title="Refresh Orders"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              id="close-orders-view-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isAuthenticated ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-200">Sign in to view your orders</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Orders placed while authenticated with JWT are persisted securely to the database.
              </p>
              <button
                id="orders-login-prompt-btn"
                onClick={() => openAuthModal('login')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition"
              >
                Sign In with JWT
              </button>
            </div>
          ) : isLoading ? (
            <div className="py-16 text-center text-zinc-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
              <p className="text-xs">Loading order ledger from database...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-zinc-300">No orders placed yet</h3>
              <p className="text-xs text-zinc-400">
                Add products to your cart and complete the Stripe sandbox checkout.
              </p>
            </div>
          ) : selectedOrder ? (
            /* Selected Order Detail View */
            <div className="space-y-5 animate-fadeIn">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to All Orders
              </button>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-zinc-100 font-mono">{selectedOrder.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase">
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Placed {new Date(selectedOrder.createdAt).toLocaleDateString()} at {new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-zinc-400">Total Charged</div>
                  <div className="text-xl font-extrabold text-emerald-400">₹{selectedOrder.total.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Order Items ({selectedOrder.items.length})</h4>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs">
                    <div className="flex items-center gap-3">
                      <img src={item.imageUrl} alt={item.name} referrerPolicy="no-referrer" className="w-12 h-12 object-cover rounded-lg border border-zinc-800" />
                      <div>
                        <div className="font-semibold text-zinc-200 text-sm">{item.name}</div>
                        <div className="text-zinc-400 font-mono text-[11px]">{item.sku} • Quantity: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="font-bold text-zinc-200 text-sm">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Receipt Summary Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <h5 className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-sky-400" />
                    Shipping & Tracking
                  </h5>
                  <div className="text-zinc-400 leading-relaxed space-y-1">
                    <div><strong className="text-zinc-300">Recipient:</strong> {selectedOrder.shippingAddress.fullName}</div>
                    <div><strong className="text-zinc-300">Address:</strong> {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.apartment ? `${selectedOrder.shippingAddress.apartment}, ` : ''}{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</div>
                    <div><strong className="text-zinc-300">Method:</strong> {selectedOrder.shippingMethod?.name || 'Standard Ground'}</div>
                    <div className="font-mono text-emerald-400"><strong className="text-zinc-300">Tracking:</strong> {selectedOrder.trackingNumber}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <h5 className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Payment Authorization
                  </h5>
                  <div className="text-zinc-400 space-y-1">
                    <div><strong className="text-zinc-300">Method:</strong> {selectedOrder.payment.paymentMethod}</div>
                    <div className="truncate font-mono text-[10px]"><strong className="text-zinc-300">Txn:</strong> {selectedOrder.payment.transactionId}</div>
                    <div><strong className="text-zinc-300">Gateway:</strong> {selectedOrder.payment.gateway}</div>
                    <div><strong className="text-zinc-300">Subtotal:</strong> ₹{selectedOrder.subtotal.toLocaleString('en-IN')}</div>
                    {selectedOrder.discount > 0 && <div><strong className="text-emerald-400">Discount:</strong> -₹{selectedOrder.discount.toLocaleString('en-IN')}</div>}
                    <div><strong className="text-zinc-300">GST & Delivery:</strong> ₹{(selectedOrder.tax + selectedOrder.shipping).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  id={`order-row-${ord.id}`}
                  onClick={() => setSelectedOrder(ord)}
                  className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 font-mono text-sm">{ord.id}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 uppercase">
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'} • {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-emerald-400">₹{ord.total.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{ord.payment.paymentMethod}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
