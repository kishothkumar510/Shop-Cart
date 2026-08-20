import React, { useEffect } from 'react';
import { CheckCircle2, Package, Truck, ArrowRight, ShieldCheck, Download, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../types';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onViewOrders: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({ order, onClose, onViewOrders }) => {
  useEffect(() => {
    if (order) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Fallback silently if canvas-confetti context is sandboxed
      }
    }
  }, [order]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div
        id="order-confirmation-panel"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 text-zinc-100 shadow-2xl overflow-hidden"
      >
        {/* Top Success Badge */}
        <div className="text-center space-y-2 pb-6 border-b border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/60 animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
            Order Confirmed & Paid!
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Payment authorized via <span className="text-emerald-400 font-semibold">{order.payment.gateway}</span>. Real-time inventory has been deducted atomically.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono">
            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-300 font-bold">
              Order ID: {order.id}
            </span>
            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300">
              Tracking: {order.trackingNumber}
            </span>
          </div>
        </div>

        {/* Order Details & Summary */}
        <div className="py-5 space-y-4 max-h-72 overflow-y-auto pr-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-emerald-400" />
            Purchased Items ({order.items.length})
          </h4>

          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover rounded-lg border border-zinc-800"
                  />
                  <div>
                    <div className="font-semibold text-zinc-200">{item.name}</div>
                    <div className="text-zinc-500 font-mono text-[10px]">{item.sku} • Qty: {item.quantity}</div>
                  </div>
                </div>
                <div className="font-bold text-zinc-200 text-sm">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Shipping & Payment Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="font-semibold text-zinc-300 flex items-center gap-1 mb-1">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                Delivery Destination
              </div>
              <div className="text-zinc-400 leading-relaxed">
                <div>{order.shippingAddress.fullName}</div>
                <div>{order.shippingAddress.street} {order.shippingAddress.apartment}</div>
                <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="font-semibold text-zinc-300 flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Payment Record
              </div>
              <div className="text-zinc-400 space-y-0.5">
                <div>Method: {order.payment.paymentMethod}</div>
                <div className="font-mono text-[10px] text-zinc-500 truncate">Txn ID: {order.payment.transactionId}</div>
                <div className="text-emerald-400 font-semibold">Total Paid: ₹{order.total.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="view-all-orders-modal-btn"
              onClick={() => {
                onClose();
                onViewOrders();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
            >
              View in Orders Dashboard
            </button>
            <button
              id="continue-shopping-modal-btn"
              onClick={onClose}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
