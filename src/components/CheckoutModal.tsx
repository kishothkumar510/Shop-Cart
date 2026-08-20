import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CreditCard, Truck, MapPin, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, Lock, Sparkles, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, PaymentDetails, ShippingAddress } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess, onToast }) => {
  const { items, subtotal, discount, shipping: initialShipping, tax, total: baseTotal, appliedPromo, refreshCart } = useCart();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [step, setStep] = useState<'shipping' | 'delivery' | 'payment'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Shipping Form State
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.defaultAddress?.fullName || user?.name || '',
    street: user?.defaultAddress?.street || '',
    apartment: user?.defaultAddress?.apartment || '',
    city: user?.defaultAddress?.city || '',
    state: user?.defaultAddress?.state || '',
    zipCode: user?.defaultAddress?.zipCode || '',
    country: user?.defaultAddress?.country || 'India',
    phone: user?.defaultAddress?.phone || user?.phone || ''
  });

  // Delivery Method State
  const deliveryOptions = [
    { id: 'ship_standard', name: 'Standard Express Delivery', price: 0, estimatedDelivery: '2-4 Business Days', description: 'Delhivery / BlueDart carbon-neutral transit' },
    { id: 'ship_priority', name: 'Priority Fast Dispatch', price: 99, estimatedDelivery: '24-48 Hours', description: 'Expedited processing & priority handling' },
    { id: 'ship_overnight', name: 'Same-Day Metro Dispatch', price: 199, estimatedDelivery: 'Today (Within 6 Hours)', description: 'Direct hyper-local courier delivery' }
  ];
  const [selectedDelivery, setSelectedDelivery] = useState(deliveryOptions[0]);

  // Payment Form State
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: 'stripe_sandbox',
    cardNumber: '4242 4242 4242 4242',
    cardExp: '12/28',
    cardCvc: '123',
    cardholderName: user?.name || 'Rahul Sharma',
    saveCard: true,
    simulateScenario: 'success'
  });

  useEffect(() => {
    if (user?.defaultAddress) {
      setShippingAddress(user.defaultAddress);
    } else if (user) {
      setShippingAddress(prev => ({
        ...prev,
        fullName: prev.fullName || user.name,
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  if (!isOpen) return null;

  // Autofill mock test address
  const handleAutofillTestAddress = () => {
    setShippingAddress({
      fullName: user?.name || 'Rahul Sharma',
      street: '402, Lotus Residency, 12th Main Road',
      apartment: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560038',
      country: 'India',
      phone: '+91 98765 43210'
    });
    onToast('Loaded Indian demo shipping address (Bengaluru)', 'info');
  };

  // Quick Test Card Switcher
  const handleSelectTestCard = (type: 'success' | 'decline' | 'insufficient_funds' | 'expired_card') => {
    if (type === 'success') {
      setPaymentDetails(prev => ({
        ...prev,
        cardNumber: '4242 4242 4242 4242',
        cardExp: '12/28',
        cardCvc: '123',
        simulateScenario: 'success'
      }));
      onToast('Selected: 4242... (Instant Success Test Card)', 'info');
    } else if (type === 'decline') {
      setPaymentDetails(prev => ({
        ...prev,
        cardNumber: '4000 0000 0000 0002',
        cardExp: '12/28',
        cardCvc: '456',
        simulateScenario: 'decline'
      }));
      onToast('Selected: ...0002 (Simulate Card Decline)', 'info');
    } else if (type === 'insufficient_funds') {
      setPaymentDetails(prev => ({
        ...prev,
        cardNumber: '4000 0000 0000 0003',
        cardExp: '12/28',
        cardCvc: '789',
        simulateScenario: 'insufficient_funds'
      }));
      onToast('Selected: ...0003 (Simulate Insufficient Funds)', 'info');
    } else if (type === 'expired_card') {
      setPaymentDetails(prev => ({
        ...prev,
        cardNumber: '4000 0000 0000 0004',
        cardExp: '01/21',
        cardCvc: '999',
        simulateScenario: 'expired_card'
      }));
      onToast('Selected: ...0004 (Simulate Expired Card)', 'info');
    }
  };

  // Format Card Number input with spaces
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g) || [];
    setPaymentDetails(prev => ({ ...prev, cardNumber: parts.join(' ') }));
  };

  // Format Exp
  const handleExpChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setPaymentDetails(prev => ({ ...prev, cardExp: `${raw.slice(0, 2)}/${raw.slice(2)}` }));
    } else {
      setPaymentDetails(prev => ({ ...prev, cardExp: raw }));
    }
  };

  // Price calculations including chosen delivery
  const finalShippingPrice = selectedDelivery.price;
  const taxableAmount = Math.max(0, subtotal - discount);
  const calculatedTax = Math.round(taxableAmount * 0.05 * 100) / 100;
  const finalOrderTotal = Math.max(0, Math.round((taxableAmount + finalShippingPrice + calculatedTax) * 100) / 100);

  const handleValidateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode) {
      setCheckoutError('Please fill in all required shipping address fields');
      return;
    }
    setCheckoutError(null);
    setStep('delivery');
  };

  const handleProcessPayment = async () => {
    setCheckoutError(null);
    setIsProcessing(true);

    try {
      // Step 1 status
      setProcessingStatusText('Validating real-time inventory & stock locks...');
      await new Promise(r => setTimeout(r, 600));

      // Step 2 status
      setProcessingStatusText('Contacting Stripe Sandbox Gateway v2.4...');
      await new Promise(r => setTimeout(r, 700));

      const payload = {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress,
        shippingMethod: selectedDelivery,
        paymentDetails,
        promoCode: appliedPromo?.code
      };

      setProcessingStatusText('Authorizing charge & executing atomic stock decrement...');
      const response = await api.checkout.processPayment(payload);

      // Refresh cart state to empty
      await refreshCart();

      setIsProcessing(false);
      onToast('Payment approved! Order placed successfully.', 'success');
      onClose();
      onOrderSuccess(response.order);
    } catch (err: unknown) {
      setIsProcessing(false);
      const message = err instanceof Error ? err.message : 'Checkout transaction failed';
      setCheckoutError(message);
      onToast(message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        id="checkout-modal-panel"
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-3xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col md:flex-row max-h-[92vh]"
      >
        {/* Close Button */}
        <button
          id="close-checkout-modal-btn"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Column: Checkout Step Forms */}
        <div className="md:w-3/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border-r border-zinc-800">
          <div>
            {/* Step Breadcrumbs */}
            <div className="flex items-center gap-2 mb-6 text-xs">
              <button
                onClick={() => !isProcessing && setStep('shipping')}
                className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg transition ${
                  step === 'shipping'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                1. Shipping
              </button>
              <span className="text-zinc-600">/</span>
              <button
                onClick={() => !isProcessing && setStep('delivery')}
                className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg transition ${
                  step === 'delivery'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                2. Delivery
              </button>
              <span className="text-zinc-600">/</span>
              <button
                onClick={() => !isProcessing && setStep('payment')}
                className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg transition ${
                  step === 'payment'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                3. Sandbox Payment
              </button>
            </div>

            {/* Error banner */}
            {checkoutError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Transaction Aborted</div>
                  <div>{checkoutError}</div>
                </div>
              </div>
            )}

            {/* STEP 1: Shipping Address */}
            {step === 'shipping' && (
              <form onSubmit={handleValidateShipping} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    Shipping & Contact Information
                  </h3>
                  <button
                    type="button"
                    onClick={handleAutofillTestAddress}
                    className="text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg font-medium transition"
                  >
                    ⚡ Autofill Sandbox Address
                  </button>
                </div>

                {!isAuthenticated && (
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
                    <span>Checking out as Guest. Want order tracking in your account?</span>
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="text-emerald-400 hover:underline font-semibold"
                    >
                      Sign In with JWT
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Full Recipient Name *
                  </label>
                  <input
                    id="shipping-fullname-input"
                    type="text"
                    required
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Street Address / Flat No *
                    </label>
                    <input
                      id="shipping-street-input"
                      type="text"
                      required
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      placeholder="402, Lotus Residency, 12th Main"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Locality / Area
                    </label>
                    <input
                      id="shipping-apartment-input"
                      type="text"
                      value={shippingAddress.apartment}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, apartment: e.target.value })}
                      placeholder="Indiranagar"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      City *
                    </label>
                    <input
                      id="shipping-city-input"
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      placeholder="Bengaluru"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      State *
                    </label>
                    <input
                      id="shipping-state-input"
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      placeholder="Karnataka"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      PIN Code *
                    </label>
                    <input
                      id="shipping-zip-input"
                      type="text"
                      required
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      placeholder="560038"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      disabled
                      value={shippingAddress.country}
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Contact Mobile Number
                    </label>
                    <input
                      id="shipping-phone-input"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    id="continue-to-delivery-btn"
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950 transition"
                  >
                    <span>Continue to Delivery Options</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Delivery Options */}
            {step === 'delivery' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  Select Delivery Speed
                </h3>

                <div className="space-y-3">
                  {deliveryOptions.map((opt) => {
                    const isSelected = selectedDelivery.id === opt.id;
                    return (
                      <div
                        key={opt.id}
                        id={`delivery-option-${opt.id}`}
                        onClick={() => setSelectedDelivery(opt)}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/40'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-emerald-400 bg-emerald-500 text-zinc-950' : 'border-zinc-600'
                          }`}>
                            {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-100 text-sm">{opt.name}</div>
                            <div className="text-xs text-zinc-400">{opt.description}</div>
                            <div className="text-xs text-emerald-400 font-medium mt-0.5">Est. {opt.estimatedDelivery}</div>
                          </div>
                        </div>

                        <div className="text-sm font-bold text-zinc-100">
                          {opt.price === 0 ? <span className="text-emerald-400">Free</span> : `₹${opt.price.toLocaleString('en-IN')}`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Shipping
                  </button>
                  <button
                    id="continue-to-payment-btn"
                    type="button"
                    onClick={() => setStep('payment')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950 transition"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Sandbox Module */}
            {step === 'payment' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Secure Payment Sandbox
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    TEST MODE ACTIVE
                  </span>
                </div>

                {/* 1-Click Test Card Chips */}
                <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Choose Simulation Test Card:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      id="test-card-success-btn"
                      type="button"
                      onClick={() => handleSelectTestCard('success')}
                      className={`p-2 rounded-xl border text-left transition ${
                        paymentDetails.simulateScenario === 'success'
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> 4242 •••• 4242
                      </div>
                      <div className="text-[10px] text-zinc-400">Instant Approved (Visa/RuPay)</div>
                    </button>

                    <button
                      id="test-card-decline-btn"
                      type="button"
                      onClick={() => handleSelectTestCard('decline')}
                      className={`p-2 rounded-xl border text-left transition ${
                        paymentDetails.simulateScenario === 'decline'
                          ? 'bg-rose-950/50 border-rose-500 text-rose-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 4000 •••• 0002
                      </div>
                      <div className="text-[10px] text-zinc-400">Simulate Card Declined</div>
                    </button>

                    <button
                      id="test-card-insufficient-btn"
                      type="button"
                      onClick={() => handleSelectTestCard('insufficient_funds')}
                      className={`p-2 rounded-xl border text-left transition ${
                        paymentDetails.simulateScenario === 'insufficient_funds'
                          ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 4000 •••• 0003
                      </div>
                      <div className="text-[10px] text-zinc-400">Simulate Insufficient Balance</div>
                    </button>

                    <button
                      id="test-card-expired-btn"
                      type="button"
                      onClick={() => handleSelectTestCard('expired_card')}
                      className={`p-2 rounded-xl border text-left transition ${
                        paymentDetails.simulateScenario === 'expired_card'
                          ? 'bg-purple-950/50 border-purple-500 text-purple-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="font-bold text-purple-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> 4000 •••• 0004
                      </div>
                      <div className="text-[10px] text-zinc-400">Simulate Expired Card</div>
                    </button>
                  </div>
                </div>

                {/* Card input form */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Card Number (Visa / MasterCard / RuPay)
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        id="payment-cardnumber-input"
                        type="text"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 pl-9 text-sm text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Expiration Date
                      </label>
                      <input
                        id="payment-cardexp-input"
                        type="text"
                        value={paymentDetails.cardExp}
                        onChange={(e) => handleExpChange(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Security CVV / CVC
                      </label>
                      <input
                        id="payment-cardcvc-input"
                        type="text"
                        maxLength={4}
                        value={paymentDetails.cardCvc}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, cardCvc: e.target.value.replace(/\D/g, '') })}
                        placeholder="123"
                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Name on Card
                    </label>
                    <input
                      id="payment-cardholder-input"
                      type="text"
                      value={paymentDetails.cardholderName}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, cardholderName: e.target.value })}
                      placeholder="Rahul Sharma"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Processing Overlay Banner if active */}
                {isProcessing && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-200 flex items-center gap-2.5 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>{processingStatusText}</span>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setStep('delivery')}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <button
                    id="submit-payment-btn"
                    type="button"
                    disabled={isProcessing}
                    onClick={handleProcessPayment}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-emerald-950/80 transition active:scale-98 disabled:opacity-60"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isProcessing ? 'Authorizing Sandbox...' : `Authorize & Pay ₹${finalOrderTotal.toFixed(2)}`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              256-bit Sandbox Encryption & RBI/PCI-DSS compliant
            </span>
            <span>Atomic Stock Engine</span>
          </div>
        </div>

        {/* Right Column: Order Summary & Item Snapshot */}
        <div className="md:w-2/5 p-6 bg-zinc-950 flex flex-col justify-between overflow-y-auto">
          <div>
            <h4 className="font-bold text-zinc-200 text-sm mb-3">Order Summary ({items.length} items)</h4>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2.5 text-xs bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover rounded-lg shrink-0 border border-zinc-800"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-200 truncate">{item.product.name}</div>
                    <div className="text-zinc-500 text-[10px]">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="font-bold text-zinc-200">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-zinc-200">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promo Discount ({appliedPromo?.code})</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery ({selectedDelivery.name.split(' ')[0]})</span>
                <span className="font-medium text-zinc-200">
                  {selectedDelivery.price === 0 ? <span className="text-emerald-400">Free</span> : `₹${selectedDelivery.price.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-medium text-zinc-200">₹{calculatedTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-zinc-100 pt-3 border-t border-zinc-800">
                <span>Total Payable</span>
                <span className="text-emerald-400 font-extrabold text-lg">₹{finalOrderTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-300">Atomic Stock Guarantee:</div>
            <p className="leading-relaxed">
              Product inventory is validated and adjusted atomically upon successful payment authorization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
