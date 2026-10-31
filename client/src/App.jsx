import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MenuCard from './components/MenuCard';
import CartModal from './components/CartModal';
import CheckoutModal from './components/CheckoutModal';
import OrderConfirmationModal from './components/OrderConfirmationModal';
import OrdersView from './components/OrdersView';
import AdminView from './components/AdminView';
import AdminLogin from './components/AdminLogin';
import { api, clearAdminSession, getStoredAdminUser } from './services/api';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const getInitialView = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/admin/login')) return 'admin_login';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/orders') || path.startsWith('/my-orders')) return 'orders';
    return 'menu';
  };

  const [activeView, setActiveView] = useState(getInitialView);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Auth State
  const [adminUser, setAdminUser] = useState(getStoredAdminUser);
  const [adminAuthChecking, setAdminAuthChecking] = useState(false);

  // Cart state persisted in localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('foodorder_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [customerPhoneForTracking, setCustomerPhoneForTracking] = useState('');

  // Status & Health
  const [loading, setLoading] = useState(true);
  const [dbHealth, setDbHealth] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('foodorder_cart', JSON.stringify(cart));
  }, [cart]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protected route & admin session verification
  useEffect(() => {
    if (activeView === 'admin') {
      const token = localStorage.getItem('foodorder_admin_token');
      if (!token) {
        navigateTo('admin_login', '/admin/login');
      } else {
        setAdminAuthChecking(true);
        api.getAdminMe()
          .then((res) => {
            setAdminUser(res.data.admin);
          })
          .catch(() => {
            clearAdminSession();
            setAdminUser(null);
            navigateTo('admin_login', '/admin/login');
          })
          .finally(() => {
            setAdminAuthChecking(false);
          });
      }
    } else if (activeView === 'admin_login') {
      const token = localStorage.getItem('foodorder_admin_token');
      if (token) {
        api.getAdminMe()
          .then((res) => {
            setAdminUser(res.data.admin);
            navigateTo('admin', '/admin');
          })
          .catch(() => {
            clearAdminSession();
            setAdminUser(null);
          });
      }
    }
  }, [activeView]);

  // Navigate helper that keeps URL path in sync
  const navigateTo = (view, explicitPath = null) => {
    setActiveView(view);
    const targetPath = explicitPath || (
      view === 'admin_login' ? '/admin/login' :
      view === 'admin' ? '/admin' :
      view === 'orders' ? '/orders' : '/'
    );
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Initial Load: Check DB Health and fetch categories + menu
  useEffect(() => {
    checkHealthAndLoadData();
  }, []);

  // Fetch menu when category or search changes
  useEffect(() => {
    if (activeView === 'menu') {
      fetchMenuItems(selectedCategory, searchQuery);
    }
  }, [selectedCategory, searchQuery]);

  const checkHealthAndLoadData = async () => {
    setLoading(true);
    try {
      const healthRes = await api.getHealth().catch(err => ({ status: 'DEGRADED', database: { connected: false, error: err.message } }));
      setDbHealth(healthRes.database || { connected: false });

      // Fetch categories
      const catRes = await api.getCategories().catch(() => ({ data: [] }));
      setCategories(catRes.data || []);

      // Fetch menu items
      await fetchMenuItems(selectedCategory, searchQuery);
    } catch (err) {
      console.error('Initial load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (cat, search) => {
    try {
      const res = await api.getMenuItems(cat, search);
      setMenuItems(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch menu items:', err.message);
      setMenuItems([]);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart operations
  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.ITEM_ID === item.ITEM_ID);
      if (existing) {
        showToast(`Increased quantity of ${item.ITEM_NAME} (x${existing.quantity + 1})`);
        return prev.map((c) => c.ITEM_ID === item.ITEM_ID ? { ...c, quantity: c.quantity + 1 } : c);
      } else {
        showToast(`Added ${item.ITEM_NAME} to your cart!`);
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const handleUpdateCartQty = (itemId, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(itemId);
    } else {
      setCart((prev) => prev.map((c) => c.ITEM_ID === itemId ? { ...c, quantity: newQty } : c));
    }
  };

  const handleRemoveCartItem = (itemId) => {
    setCart((prev) => prev.filter((c) => c.ITEM_ID !== itemId));
    showToast('Item removed from cart');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Shopping cart cleared');
  };

  const handleOrderSuccess = (orderData) => {
    setIsCheckoutOpen(false);
    setCart([]);
    setConfirmedOrder(orderData);
    setCustomerPhoneForTracking(orderData.customerPhone);
  };

  const handleViewOrders = (phone) => {
    setCustomerPhoneForTracking(phone);
    navigateTo('orders', '/orders');
  };

  // Admin Auth Handlers
  const handleAdminLoginSuccess = (userData) => {
    setAdminUser(userData);
    showToast(`Welcome to Admin Portal, ${userData.username}!`);
    navigateTo('admin', '/admin');
  };

  const handleAdminLogout = async () => {
    try {
      await api.adminLogout();
    } catch (err) {
      // ignore
    } finally {
      clearAdminSession();
      setAdminUser(null);
      showToast('Logged out of Admin Portal.');
      navigateTo('admin_login', '/admin/login');
    }
  };

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // VIEW 1: DEDICATED ADMIN LOGIN
  if (activeView === 'admin_login') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminLogin 
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToMenu={() => navigateTo('menu', '/')}
        />
        {toastMessage && (
          <div className="toast-container">
            <div className="toast">
              <span>🔒</span>
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: PROTECTED ADMIN DASHBOARD
  if (activeView === 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {adminAuthChecking ? (
          <div style={{ textAlign: 'center', padding: '6rem 0' }}>
            <RefreshCw className="animate-spin" size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Verifying administrator credentials...</p>
          </div>
        ) : (
          <main style={{ flex: 1 }}>
            <AdminView 
              categories={categories}
              onMenuUpdated={() => fetchMenuItems(selectedCategory, searchQuery)}
              adminUser={adminUser}
              onLogout={handleAdminLogout}
              onBackToCustomerSite={() => navigateTo('menu', '/')}
            />
          </main>
        )}

        <footer style={{
          background: '#fff',
          borderTop: '1px solid var(--border-color)',
          padding: '1.5rem 0',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div className="container">
            <p><strong>FoodOrder Admin Portal</strong> — PostgreSQL Role-Based Administration</p>
          </div>
        </footer>

        {toastMessage && (
          <div className="toast-container">
            <div className="toast">
              <span>🍕</span>
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 3: CUSTOMER PORTAL (Menu & Orders)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Customer Navbar */}
      <Navbar 
        activeView={activeView}
        setActiveView={(v) => navigateTo(v)}
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
        dbHealth={dbHealth}
        adminUser={adminUser}
      />

      {/* Database Setup Banner (Visible if DB is not connected) */}
      {dbHealth && !dbHealth.connected && (
        <div style={{
          background: '#fffbeb',
          borderBottom: '1px solid #fde68a',
          padding: '0.85rem 1.25rem',
          fontSize: '0.9rem',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={19} color="#d97706" />
            <div>
              <strong>PostgreSQL Database Setup Required:</strong> To enable ordering and live menu data, ensure PostgreSQL is running and seeded.
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={checkHealthAndLoadData}
            style={{ fontSize: '0.8rem' }}
          >
            <RefreshCw size={13} />
            <span>Re-check Database</span>
          </button>
        </div>
      )}

      {/* Customer Main Content */}
      <main style={{ flex: 1 }}>
        {activeView === 'menu' && (
          <>
            <Hero 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            <div className="container" style={{ padding: '2rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.75rem' }}>
                  {selectedCategory === 'all' 
                    ? 'All Dishes' 
                    : categories.find(c => String(c.CATEGORY_ID) === selectedCategory)?.CATEGORY_NAME || 'Category Dishes'}
                </h2>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Showing {menuItems.length} dishes
                </span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                  <RefreshCw className="animate-spin" size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Loading food items from PostgreSQL Database...</p>
                </div>
              ) : menuItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <h3>No dishes found</h3>
                  <p>
                    {dbHealth && !dbHealth.connected 
                      ? 'Please initialize the database using the SQL scripts to load menu dishes.'
                      : 'Try adjusting your search or category filter.'}
                  </p>
                  <button 
                    className="btn btn-secondary" 
                    style={{ marginTop: '1rem' }}
                    onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="menu-grid">
                  {menuItems.map((item) => {
                    const inCartItem = cart.find(c => c.ITEM_ID === item.ITEM_ID);
                    return (
                      <MenuCard 
                        key={item.ITEM_ID}
                        item={item}
                        onAddToCart={handleAddToCart}
                        isInCart={inCartItem ? inCartItem.quantity : 0}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'orders' && (
          <OrdersView 
            initialPhone={customerPhoneForTracking}
            onBrowseMenu={() => navigateTo('menu', '/')}
          />
        )}
      </main>

      {/* Customer Footer */}
      <footer style={{
        background: '#fff',
        borderTop: '1px solid var(--border-color)',
        padding: '2rem 0',
        marginTop: '3rem',
        textAlign: 'center',
        fontSize: '0.88rem',
        color: 'var(--text-muted)'
      }}>
        <div className="container">
          <p><strong>FoodOrder</strong> — Online Food Ordering System</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
            Built with React (Vite), Node.js, Express, and PostgreSQL 18.
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <button
              onClick={() => navigateTo('admin')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              🔒 Administrator Portal Login
            </button>
          </div>
        </div>
      </footer>

      {/* Cart Modal */}
      <CartModal 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onBackToCart={() => {
          setIsCheckoutOpen(false);
          setIsCartOpen(true);
        }}
        cartItems={cart}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal 
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewOrders={handleViewOrders}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <span>🍕</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
