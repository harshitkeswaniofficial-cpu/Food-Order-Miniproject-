import React, { useState } from 'react';
import { X, CheckCircle, Truck, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  onBackToCart,
  cartItems, 
  onOrderSuccess 
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.PRICE) * item.quantity), 0);
  const deliveryFee = subtotal >= 500 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits).');
      return;
    }
    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 6) {
      setErrorMessage('Please enter a complete delivery address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        items: cartItems.map((item) => ({
          itemId: item.ITEM_ID,
          quantity: item.quantity
        }))
      };

      const result = await api.placeOrder(orderPayload);

      // Save order metadata to localStorage for easy customer order tracking and private access
      try {
        const existingLocal = JSON.parse(localStorage.getItem('foodorder_customer_orders') || '[]');
        const newRecord = {
          orderId: result.data.orderId,
          customerPhone: customerPhone.trim(),
          customerName: customerName.trim(),
          orderDate: new Date().toISOString(),
          totalAmount: result.data.totalAmount
        };
        localStorage.setItem('foodorder_customer_orders', JSON.stringify([newRecord, ...existingLocal.slice(0, 19)]));
        localStorage.setItem('foodorder_last_phone', customerPhone.trim());
      } catch (storageErr) {
        console.warn('Could not persist order to local storage:', storageErr);
      }

      onOrderSuccess(result.data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to place order. Please ensure the PostgreSQL Database is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="modal-close" onClick={onBackToCart} title="Back to Cart">
              <ArrowLeft size={18} />
            </button>
            <h2 className="modal-title">Checkout & Delivery</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close checkout">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="modal-body">
          {errorMessage && (
            <div style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Name */}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="e.g., Rahul Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input 
              type="tel" 
              className="form-control"
              placeholder="e.g., 9876543210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>

          {/* Delivery Address */}
          <div className="form-group">
            <label className="form-label">Delivery Address *</label>
            <textarea 
              className="form-control"
              rows={3}
              placeholder="Flat / House No, Building, Street, Landmark, City..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
            />
          </div>

          {/* Payment Method Notice */}
          <div style={{
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Truck size={22} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                Payment Method: Cash on Delivery (COD)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Pay with cash when food arrives at your door.
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bill-summary">
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              Order Items ({cartItems.length}):
            </div>
            {cartItems.map((item) => (
              <div key={item.ITEM_ID} className="bill-row" style={{ fontSize: '0.82rem' }}>
                <span>{item.quantity}x {item.ITEM_NAME}</span>
                <span>₹{(parseFloat(item.PRICE) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="bill-row total">
              <span>Final Bill to Pay</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Saving to PostgreSQL Database...</span>
              ) : (
                <span>Place Order with Cash on Delivery (₹{grandTotal.toFixed(2)})</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
