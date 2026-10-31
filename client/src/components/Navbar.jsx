import React from 'react';
import { ShoppingBag, Utensils, ClipboardList, Database, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, cartCount, onOpenCart, dbHealth, adminUser }) {
  return (
    <header className="navbar">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <div 
          className="nav-brand" 
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveView('menu')}
        >
          <span className="nav-brand-icon">🍕</span>
          <span>FoodOrder</span>
        </div>

        {/* Public Navigation Links */}
        <nav className="nav-links">
          <button 
            className={`nav-link ${activeView === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveView('menu')}
          >
            <Utensils size={18} />
            <span>Menu</span>
          </button>

          <button 
            className={`nav-link ${activeView === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveView('orders')}
          >
            <ClipboardList size={18} />
            <span>My Orders</span>
          </button>

          <button 
            className={`nav-link ${activeView === 'admin' || activeView === 'admin_login' ? 'active' : ''}`}
            onClick={() => setActiveView('admin')}
            title="Administrator Management Portal"
          >
            <ShieldCheck size={18} />
            <span>Admin Portal</span>
          </button>
        </nav>

        {/* Database Status, Admin Button & Shopping Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {dbHealth && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.3rem 0.65rem',
                borderRadius: '9999px',
                background: dbHealth.connected ? '#dcfce7' : '#fef3c7',
                color: dbHealth.connected ? '#15803d' : '#b45309',
                border: `1px solid ${dbHealth.connected ? '#bbf7d0' : '#fde68a'}`
              }}
              title={dbHealth.connected ? 'PostgreSQL Database Connected' : dbHealth.error || 'PostgreSQL Setup Required'}
            >
              <Database size={13} />
              <span>{dbHealth.connected ? 'PostgreSQL: Online' : 'PostgreSQL: Check DB'}</span>
            </div>
          )}

          <button 
            onClick={() => setActiveView('admin')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: activeView === 'admin' || activeView === 'admin_login' ? '#fef3c7' : '#f8fafc',
              color: activeView === 'admin' || activeView === 'admin_login' ? '#92400e' : 'var(--text-main)',
              border: `1px solid ${activeView === 'admin' || activeView === 'admin_login' ? '#fde68a' : '#e2e8f0'}`,
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Go to Admin Portal"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef3c7';
              e.currentTarget.style.borderColor = '#fde68a';
              e.currentTarget.style.color = '#92400e';
            }}
            onMouseLeave={(e) => {
              if (activeView !== 'admin' && activeView !== 'admin_login') {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = 'var(--text-main)';
              }
            }}
          >
            <ShieldCheck size={16} color="#d97706" />
            <span>Admin</span>
          </button>

          <button className="cart-btn" onClick={onOpenCart} aria-label="Shopping Cart">
            <ShoppingBag size={18} />
            <span>Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
