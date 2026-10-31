import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ShoppingBag, 
  UtensilsCrossed, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Check, 
  AlertCircle,
  LogOut,
  User,
  ArrowLeft
} from 'lucide-react';
import { api, clearAdminSession } from '../services/api';

export default function AdminView({ categories = [], onMenuUpdated, adminUser, onLogout, onBackToCustomerSite }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'menu'
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Add/Edit Menu Item Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formItemName, setFormItemName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState('Y');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, menuRes] = await Promise.all([
        api.getAdminStats(),
        api.getAllOrders(),
        api.getMenuItems('all')
      ]);

      setStats(statsRes.data);
      setOrders(ordersRes.data || []);
      setMenuItems(menuRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err.message);
      if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('session expired'))) {
        showMessage('Session expired or unauthorized. Please log in again.', 'error');
        if (onLogout) {
          setTimeout(() => onLogout(), 1200);
        }
      } else {
        showMessage(`Failed to load data: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      // Update local state immediately
      setOrders(prev => prev.map(o => o.ORDER_ID === orderId ? { ...o, ORDER_STATUS: newStatus } : o));
      showMessage(`Order #${orderId} status updated to ${newStatus}.`, 'success');
      // Refresh stats
      api.getAdminStats().then(res => setStats(res.data)).catch(() => {});
    } catch (err) {
      showMessage(`Failed to update status: ${err.message}`, 'error');
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormItemName('');
    setFormCategoryId(categories[0]?.CATEGORY_ID || 1);
    setFormDescription('');
    setFormPrice('');
    setFormImageUrl('');
    setFormIsAvailable('Y');
    setShowItemModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormItemName(item.ITEM_NAME);
    setFormCategoryId(item.CATEGORY_ID);
    setFormDescription(item.DESCRIPTION || '');
    setFormPrice(item.PRICE);
    setFormImageUrl(item.IMAGE_URL || '');
    setFormIsAvailable(item.IS_AVAILABLE);
    setShowItemModal(true);
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!formItemName.trim()) {
      alert('Please enter a dish name.');
      return;
    }
    if (isNaN(formPrice) || Number(formPrice) < 0) {
      alert('Please enter a valid non-negative price.');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const payload = {
        itemName: formItemName.trim(),
        categoryId: parseInt(formCategoryId, 10),
        description: formDescription.trim(),
        price: parseFloat(formPrice),
        imageUrl: formImageUrl.trim(),
        isAvailable: formIsAvailable
      };

      if (editingItem) {
        await api.updateMenuItem(editingItem.ITEM_ID, payload);
        showMessage(`Dish "${payload.itemName}" updated successfully!`);
      } else {
        await api.addMenuItem(payload);
        showMessage(`New dish "${payload.itemName}" added to menu!`);
      }

      setShowItemModal(false);
      // Refresh local menu list and tell parent App
      const refreshedMenu = await api.getMenuItems('all');
      setMenuItems(refreshedMenu.data || []);
      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      alert(`Error saving menu item: ${err.message}`);
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate "${itemName}"?`)) {
      return;
    }

    try {
      const res = await api.deleteMenuItem(itemId);
      showMessage(res.message || `Dish "${itemName}" deleted/deactivated.`);
      const refreshedMenu = await api.getMenuItems('all');
      setMenuItems(refreshedMenu.data || []);
      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      showMessage(`Delete error: ${err.message}`, 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Admin Session & Navigation Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '0.875rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>FoodOrder Admin Portal</span>
              <span style={{
                background: '#fef3c7',
                color: '#92400e',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Role: {adminUser?.role || 'ADMIN'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Logged in as <strong style={{ color: 'var(--text-main)' }}>{adminUser?.username || 'admin'}</strong> {adminUser?.email ? `(${adminUser.email})` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBackToCustomerSite && (
            <button
              onClick={onBackToCustomerSite}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#f3f4f6',
                color: 'var(--text-main)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Return to Customer Menu"
            >
              <ArrowLeft size={16} />
              <span>Customer View</span>
            </button>
          )}

          <button
            onClick={onLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '0.5rem 0.95rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Admin Title & Controls */}
      <div className="admin-header">
        <div>
          <h2>Admin Management Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Control live menu items, monitor customer orders, and inspect PostgreSQL Database records.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Analytics & Overview
          </button>
          <button 
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📦 Customer Orders ({orders.length})
          </button>
          <button 
            className={`admin-tab ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍔 Menu Management ({menuItems.length})
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div style={{
          background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: message.type === 'error' ? '#b91c1c' : '#15803d',
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div>
          {/* KPI Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Total Gross Revenue</div>
              <div className="stat-val" style={{ color: 'var(--primary)' }}>
                ₹{stats?.summary?.TOTAL_REVENUE ? parseFloat(stats.summary.TOTAL_REVENUE).toFixed(2) : '0.00'}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Total Orders Placed</div>
              <div className="stat-val">{stats?.summary?.TOTAL_ORDERS || orders.length}</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Active Menu Dishes</div>
              <div className="stat-val">{stats?.menu?.AVAILABLE_DISHES || menuItems.length}</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Pending Orders</div>
              <div className="stat-val" style={{ color: 'var(--warning)' }}>
                {(stats?.summary?.PLACED_ORDERS || 0) + (stats?.summary?.PREPARING_ORDERS || 0)}
              </div>
            </div>
          </div>

          {/* Top Selling Dishes Table */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>🏆 Top Selling Food Items (PostgreSQL Aggregated)</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Dish Name</th>
                    <th>Total Servings Sold</th>
                    <th>Total Sales Revenue (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.topDishes && stats.topDishes.length > 0 ? (
                    stats.topDishes.map((dish, i) => (
                      <tr key={i}>
                        <td><strong>{dish.ITEM_NAME}</strong></td>
                        <td>{dish.TOTAL_SOLD} units</td>
                        <td>₹{parseFloat(dish.REVENUE_GENERATED).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No orders recorded yet to calculate best-sellers.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Customer Orders in Database</h3>
            <button className="btn btn-secondary btn-sm" onClick={loadAllAdminData}>
              <RefreshCw size={14} />
              <span>Refresh Orders</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Date & Time</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No orders currently present in PostgreSQL Database.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.ORDER_ID}>
                      <td><strong>#{ord.ORDER_ID}</strong></td>
                      <td>{ord.CUSTOMER_NAME}</td>
                      <td>{ord.CUSTOMER_PHONE}</td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.DELIVERY_ADDRESS}>
                        {ord.DELIVERY_ADDRESS}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{ord.ORDER_DATE}</td>
                      <td><strong>₹{parseFloat(ord.TOTAL_AMOUNT).toFixed(2)}</strong></td>
                      <td>
                        <span className={`status-badge status-${ord.ORDER_STATUS.toLowerCase()}`}>
                          {ord.ORDER_STATUS}
                        </span>
                      </td>
                      <td>
                        <select 
                          value={ord.ORDER_STATUS}
                          onChange={(e) => handleStatusChange(ord.ORDER_ID, e.target.value)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                        >
                          <option value="PLACED">PLACED</option>
                          <option value="PREPARING">PREPARING</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3>Live Catalog Menu Items</h3>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <Plus size={16} />
              <span>Add New Food Item</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Dish Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item.ITEM_ID}>
                    <td>
                      <img 
                        src={item.IMAGE_URL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                        alt={item.ITEM_NAME}
                        style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    </td>
                    <td>
                      <div><strong>{item.ITEM_NAME}</strong></div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '300px' }}>{item.DESCRIPTION}</div>
                    </td>
                    <td>{item.CATEGORY_NAME}</td>
                    <td><strong>₹{parseFloat(item.PRICE).toFixed(2)}</strong></td>
                    <td>
                      <span className={`status-badge ${item.IS_AVAILABLE === 'Y' ? 'status-delivered' : 'status-cancelled'}`}>
                        {item.IS_AVAILABLE === 'Y' ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit Dish"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteItem(item.ITEM_ID, item.ITEM_NAME)}
                          title="Delete / Deactivate Dish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {showItemModal && (
        <div className="modal-backdrop" onClick={() => setShowItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? 'Edit Food Item' : 'Add New Food Item'}</h3>
              <button className="modal-close" onClick={() => setShowItemModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="modal-body">
              <div className="form-group">
                <label className="form-label">Dish Name *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g., Paneer Tikka Pizza"
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select 
                  className="form-control"
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.CATEGORY_ID} value={c.CATEGORY_ID}>
                      {c.CATEGORY_NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Price in Rupees (₹) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="e.g., 299.00"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control"
                  rows={2}
                  placeholder="Short description of ingredients and spices..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input 
                  type="url" 
                  className="form-control"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input 
                  type="checkbox" 
                  id="availCheck"
                  checked={formIsAvailable === 'Y'}
                  onChange={(e) => setFormIsAvailable(e.target.checked ? 'Y' : 'N')}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="availCheck" style={{ cursor: 'pointer', fontWeight: 600 }}>
                  Dish is Available for Ordering
                </label>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.8rem' }}
                  disabled={isSubmittingItem}
                >
                  {isSubmittingItem ? 'Saving to PostgreSQL Database...' : editingItem ? 'Save Changes' : 'Create Food Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
