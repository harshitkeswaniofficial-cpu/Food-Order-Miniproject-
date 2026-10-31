import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQty, 
  onRemoveItem, 
  onClearCart,
  onProceedToCheckout 
}) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.PRICE) * item.quantity), 0);
  const deliveryFee = subtotal >= 500 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={22} color="var(--primary)" />
            <h2 className="modal-title">Your Food Cart ({cartItems.length})</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {cartItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Looks like you haven't added any delicious food yet.</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1.25rem' }}
                onClick={onClose}
              >
                Explore Menu
              </button>
            </div>
          ) : (
            <div>
              {cartItems.map((item) => (
                <div key={item.ITEM_ID} className="cart-item">
                  <img 
                    src={item.IMAGE_URL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                    alt={item.ITEM_NAME}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.ITEM_NAME}</div>
                    <div className="cart-item-price">₹{parseFloat(item.PRICE).toFixed(2)} each</div>
                  </div>

                  {/* Qty controls */}
                  <div className="cart-qty-controls">
                    <button 
                      className="btn-qty" 
                      onClick={() => onUpdateQty(item.ITEM_ID, item.quantity - 1)}
                      title="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-number">{item.quantity}</span>
                    <button 
                      className="btn-qty" 
                      onClick={() => onUpdateQty(item.ITEM_ID, item.quantity + 1)}
                      title="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div style={{ fontWeight: 700, minWidth: '70px', textAlign: 'right', fontSize: '0.95rem' }}>
                    ₹{(parseFloat(item.PRICE) * item.quantity).toFixed(2)}
                  </div>

                  {/* Remove */}
                  <button 
                    className="btn-item-delete"
                    onClick={() => onRemoveItem(item.ITEM_ID)}
                    title="Remove dish"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}

              {/* Bill Breakdown */}
              <div className="bill-summary">
                <div className="bill-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="bill-row">
                  <span>Delivery Charge</span>
                  <span>{deliveryFee === 0 ? <strong style={{ color: 'var(--success)' }}>FREE (Orders ₹500+)</strong> : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="bill-row total">
                  <span>Final Bill Amount</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary btn-sm" onClick={onClearCart}>
              Clear Cart
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
