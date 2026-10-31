/**
 * server/app.js
 * FoodOrder - Online Food Ordering System
 * Express Backend with PostgreSQL Connectivity
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so frontend (Vite at port 5173, 5174, etc.) can communicate with backend seamlessly
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parser
app.use(express.json());

// HTTP Request logger
app.use(morgan('dev'));

// ----------------------------------------------------------------------------
// Health Check Endpoint: Reports genuine PostgreSQL connection status
// ----------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  const dbHealth = await db.checkHealth();
  const statusCode = dbHealth.connected ? 200 : 503;
  res.status(statusCode).json({
    status: dbHealth.connected ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    service: 'FoodOrder Backend API',
    database: dbHealth
  });
});

// ----------------------------------------------------------------------------
// Mount Core Application Routes
// ----------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'FoodOrder - Online Food Ordering System API',
    version: '1.0.0',
    documentation: 'See README.md for setup instructions with PostgreSQL and pgAdmin/psql',
    endpoints: {
      health: '/api/health',
      categories: '/api/categories',
      menu: '/api/menu',
      orders: '/api/orders',
      adminStats: '/api/admin/stats'
    }
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// ----------------------------------------------------------------------------
// Server Initialization and Graceful Shutdown
// ----------------------------------------------------------------------------
const server = app.listen(PORT, async () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'foodorder_db';

  console.log('================================================================');
  console.log(`  FoodOrder Backend Server running on http://localhost:${PORT}`);
  console.log(`  PostgreSQL Target: postgresql://${process.env.DB_USER || 'postgres'}@${host}:${port}/${dbName}`);
  console.log(`  Health Check:      http://localhost:${PORT}/api/health`);
  console.log('================================================================');
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nShutting down server gracefully...');
  server.close(async () => {
    console.log('HTTP server closed.');
    await db.closePool();
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = app;
