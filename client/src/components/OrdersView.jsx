import React, { useState, useEffect } from 'react';
import { Search, Package, Clock, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function OrdersView({ initialPhone = '', onBrowseMenu }) {
  const [phone, setPhone] = useState(initialPhone);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Auto fetch if initialPhone or stored phone is available
  useEffect(() => {
    const phoneToUse = initialPhone || localStorage.getItem('foodorder_last_phone') || '';
    if (phoneToUse) {
      setPhone(phoneToUse);
      fetchOrdersForPhone(phoneToUse);
    }
  }, [initialPhone]);

  const fetchOrdersForPhone = async (phoneToSearch, specificOrderId = null) => {
    if (!phoneToSearch || phoneToSearch.trim() === '') {
      setError('Please enter your phone number to track your orders.');
      setOrders([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Check if user has an order ID stored in localStorage for verification
      let verifyOrderId = specificOrderId;
      if (!verifyOrderId) {
        try {
          const localOrders = JSON.parse(localStorage.getItem('foodorder_customer_orders') || '[]');
          const match = localOrders.find(o => o.customerPhone === phoneToSearch.trim());
          if (match) verifyOrderId = match.orderId;
        } catch {
          // ignore localStorage parse error
        }
      }

      const res = await api.getCustomerOrders(phoneToSearch.trim(), verifyOrderId);
      setOrders(res.data || []);
      if ((res.data || []).length === 0) {
        setError(`No orders found matching phone number: ${phoneToSearch}`);
      } else {
        localStorage.setItem('foodorder_last_phone', phoneToSearch.trim());
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderItems = async (orderId) => {
    setDetailsLoading(true);
    try {
      const res = await api.getOrderById(orderId, phone.trim());
      setSelectedOrderDetails(res.data);
    } catch (err) {
      alert(`Failed to load details for Order #${orderId}: ${err.message}`);
    } finally {
      setDetailsLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
        return <span className="status-badge status-placed">⏳ Placed</span>;
      case 'PREPARING':
        return <span className="status-badge status-preparing">🍳 Preparing</span>;
      case 'DELIVERED':
        return <span className="status-badge status-delivered">✅ Delivered</span>;
      case 'CANCELLED':
        return <span className="status-badge status-cancelled">❌ Cancelled</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h2>Order History & Tracking</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Check the live preparation and delivery status of your food orders.
          </p>
        </div>

        {/* Phone filter bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); fetchOrdersForPhone(phone); }}
          style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '380px' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              className="form-control"
              placeholder="Search by phone number..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Track</button>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => fetchOrdersForPhone(phone)}
            title="Refresh list"
          >
            <RefreshCw size={15} />
          </button>
        </form>
      </div>

      {/* Customer Privacy Notice */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1e40af',
        padding: '0.65rem 1rem',
        borderRadius: '8px',
        marginBottom: '1.25rem',
        fontSize: '0.84rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>🔒</span>
        <span>
          <strong>Customer Privacy Protection Active:</strong> For security, phone numbers and delivery addresses are masked during public lookups.
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <RefreshCw className="animate-spin" size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Retrieving orders from PostgreSQL Database...</p>
        </div>
      ) : error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.25rem', borderRadius: '12px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={22} />
          <div>{error}</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📱</div>
          <h3>Track Your Food Orders</h3>
          <p>Enter the mobile phone number used during checkout in the search box above to view your live orders and status.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={onBrowseMenu}>
            Browse Menu & Order
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((ord) => (
            <div 
              key={ord.ORDER_ID}
              style={{
                background: '#fff',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Order Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                      Order #{ord.ORDER_ID}
                    </span>
                    {renderStatusBadge(ord.ORDER_STATUS)}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Placed on: {ord.ORDER_DATE}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
                    ₹{parseFloat(ord.TOTAL_AMOUNT).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Cash on Delivery
                  </div>
                </div>
              </div>

              {/* Customer details bar */}
              <div style={{
                background: 'var(--bg-muted)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.86rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem'
              }}>
                <div><strong>Customer:</strong> {ord.CUSTOMER_NAME}</div>
                <div><strong>Phone:</strong> {ord.CUSTOMER_PHONE}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Delivery Address:</strong> {ord.DELIVERY_ADDRESS}</div>
              </div>

              {/* Status Visual Tracker */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: ord.ORDER_STATUS === 'PLACED' ? 800 : 500,
                  color: ord.ORDER_STATUS === 'PLACED' ? 'var(--warning)' : 'var(--text-muted)'
                }}>
                  <Clock size={16} /> 1. Placed
                </div>
                <div style={{ width: '40px', height: '2px', background: 'var(--border-color)' }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: ord.ORDER_STATUS === 'PREPARING' ? 800 : 500,
                  color: ord.ORDER_STATUS === 'PREPARING' ? 'var(--info)' : 'var(--text-muted)'
                }}>
                  <Package size={16} /> 2. Kitchen Preparing
                </div>
                <div style={{ width: '40px', height: '2px', background: 'var(--border-color)' }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: ord.ORDER_STATUS === 'DELIVERED' ? 800 : 500,
                  color: ord.ORDER_STATUS === 'DELIVERED' ? 'var(--success)' : 'var(--text-muted)'
                }}>
                  <CheckCircle size={16} /> 3. Delivered
                </div>
              </div>

              {/* Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleViewOrderItems(ord.ORDER_ID)}
                >
                  View Ordered Dishes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Items Modal */}
      {selectedOrderDetails && (
        <div className="modal-backdrop" onClick={() => setSelectedOrderDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Dishes in Order #{selectedOrderDetails.ORDER_ID}</h3>
              <button className="modal-close" onClick={() => setSelectedOrderDetails(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedOrderDetails.ITEMS && selectedOrderDetails.ITEMS.map((item) => (
                  <div 
                    key={item.ORDER_ITEM_ID}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    <img 
                      src={item.IMAGE_URL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                      alt={item.ITEM_NAME}
                      style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.ITEM_NAME}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        ₹{parseFloat(item.UNIT_PRICE).toFixed(2)} × {item.QUANTITY}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      ₹{parseFloat(item.LINE_TOTAL).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1.25rem',
                paddingTop: '0.75rem',
                borderTop: '2px dashed var(--border-color)',
                fontWeight: 800,
                fontSize: '1.1rem'
              }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary)' }}>₹{parseFloat(selectedOrderDetails.TOTAL_AMOUNT).toFixed(2)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setSelectedOrderDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
