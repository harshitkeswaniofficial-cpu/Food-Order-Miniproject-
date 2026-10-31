import React from 'react';
import { CheckCircle2, X, ClipboardList, ShoppingBag } from 'lucide-react';

export default function OrderConfirmationModal({ order, onClose, onViewOrders }) {
  if (!order) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <h2 className="modal-title" style={{ color: '#15803d' }}>Order Placed Successfully!</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div style={{ textAlign: 'center', margin: '0.5rem 0 1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order ID</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
              #{order.orderId}
            </div>
            <span className="status-badge status-placed" style={{ marginTop: '0.4rem' }}>
              Status: PLACED
            </span>
          </div>

          <div style={{
            background: 'var(--bg-muted)',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontSize: '0.88rem'
          }}>
            <div style={{ marginBottom: '0.35rem' }}>
              <strong>Customer:</strong> {order.customerName} ({order.customerPhone})
            </div>
            <div style={{ marginBottom: '0.35rem' }}>
              <strong>Delivery Address:</strong> {order.deliveryAddress}
            </div>
            <div>
              <strong>Payment Method:</strong> Cash on Delivery (COD)
            </div>
          </div>

          {/* Items Breakdown */}
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Ordered Items:
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
            {order.items && order.items.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.4rem 0',
                  borderBottom: idx !== order.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                  fontSize: '0.85rem'
                }}
              >
                <span>{item.quantity}x {item.itemName}</span>
                <strong>₹{(item.unitPrice * item.quantity).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          {/* Grand Total */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '2px dashed var(--border-color)',
            fontSize: '1.1rem',
            fontWeight: 800
          }}>
            <span>Total Payable Amount</span>
            <span style={{ color: 'var(--primary)' }}>₹{parseFloat(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1 }}
            onClick={onClose}
          >
            <ShoppingBag size={16} />
            <span>Order More</span>
          </button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }}
            onClick={() => {
              onClose();
              onViewOrders(order.customerPhone);
            }}
          >
            <ClipboardList size={16} />
            <span>Track Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
