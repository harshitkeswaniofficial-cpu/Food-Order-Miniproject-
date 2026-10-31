import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, User, ArrowLeft, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { api, setAdminToken } from '../services/api';

export default function AdminLogin({ onLoginSuccess, onBackToCustomerSite }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fillCredentials = () => {
    setUsernameOrEmail('admin');
    setPassword('Admin@123');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Please enter your administrator username or email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.adminLogin({
        usernameOrEmail: usernameOrEmail.trim(),
        password
      });

      if (response.success && response.token) {
        setAdminToken(response.token);
        localStorage.setItem('foodorder_admin_user', JSON.stringify(response.admin));
        onLoginSuccess(response.admin);
      } else {
        setErrorMessage(response.message || 'Login failed.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username/email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1rem',
      backgroundColor: 'var(--bg-page)'
    }}>
      {/* Back to Customer Site Button */}
      <button 
        onClick={onBackToCustomerSite}
        className="btn btn-secondary btn-sm"
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-muted)'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to FoodOrder Menu</span>
      </button>

      {/* Login Card */}
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-xl)',
        padding: '2.5rem 2rem',
        animation: 'modalFadeIn 0.25s ease-out'
      }}>
        {/* Brand & Badge */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            marginBottom: '0.85rem'
          }}>
            <Shield size={28} />
          </div>

          <h2 style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enter your credentials to access the management dashboard.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Info Box */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          marginBottom: '1.35rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Key size={15} color="#ea580c" />
              <span>Admin Credentials</span>
            </span>
            <button
              type="button"
              onClick={fillCredentials}
              style={{
                background: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Click to reset ID and password"
            >
              Fill Credentials
            </button>
          </div>
          <div style={{ color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: '0.25rem', columnGap: '0.5rem' }}>
            <span>Admin ID:</span>
            <strong style={{ color: 'var(--text-main)', userSelect: 'all' }}>admin</strong>
            <span>Password:</span>
            <strong style={{ color: 'var(--text-main)', userSelect: 'all' }}>Admin@123</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username or Email */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Username or Email *</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. admin or admin@foodorder.com"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="username"
                disabled={loading}
                required
              />
              <User size={17} style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)'
              }} />
            </div>
          </div>

          {/* Password with Show/Hide */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password *</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control"
                placeholder="Enter administrator password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.6rem' }}
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <Lock size={17} style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)'
              }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.2rem'
                }}
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Authenticating...</span>
              </span>
            ) : (
              <span>Sign In to Admin Dashboard</span>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          Protected Administrative Area &bull; Role-based access enforced by PostgreSQL
        </div>
      </div>
    </div>
  );
}
