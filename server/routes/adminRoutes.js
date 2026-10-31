/**
 * routes/adminRoutes.js
 * Summary metrics and analytical queries for Admin Dashboard in PostgreSQL.
 * Protected: Requires Administrator Bearer token.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Protect all admin analytical endpoints with verifyAdmin middleware
router.use(verifyAdmin);

// GET /api/admin/stats - Overview metrics calculated live from PostgreSQL
router.get('/stats', async (req, res) => {
  try {
    // 1. Overall Order & Revenue metrics
    const overallStatsSql = `
      SELECT 
        COUNT(order_id) AS total_orders,
        COALESCE(SUM(CASE WHEN order_status != 'CANCELLED' THEN total_amount ELSE 0 END), 0) AS total_revenue,
        COUNT(CASE WHEN order_status = 'PLACED' THEN 1 END) AS placed_orders,
        COUNT(CASE WHEN order_status = 'PREPARING' THEN 1 END) AS preparing_orders,
        COUNT(CASE WHEN order_status = 'DELIVERED' THEN 1 END) AS delivered_orders,
        COUNT(CASE WHEN order_status = 'CANCELLED' THEN 1 END) AS cancelled_orders
      FROM food_orders
    `;
    const overallRes = await db.query(overallStatsSql);

    // 2. Total Menu Items & Categories
    const menuStatsSql = `
      SELECT 
        (SELECT COUNT(*) FROM menu_items) AS total_dishes,
        (SELECT COUNT(*) FROM menu_items WHERE is_available = 'Y') AS available_dishes,
        (SELECT COUNT(*) FROM food_categories) AS total_categories
    `;
    const menuRes = await db.query(menuStatsSql);

    // 3. Top 5 Best Selling Dishes
    const topDishesSql = `
      SELECT 
        m.item_name,
        SUM(i.quantity) AS total_sold,
        SUM(i.quantity * i.unit_price) AS revenue_generated
      FROM food_order_items i
      JOIN menu_items m ON i.item_id = m.item_id
      JOIN food_orders o ON i.order_id = o.order_id
      WHERE o.order_status != 'CANCELLED'
      GROUP BY m.item_name
      ORDER BY total_sold DESC
      LIMIT 5
    `;
    const topDishesRes = await db.query(topDishesSql);

    res.json({
      success: true,
      data: {
        summary: overallRes.rows[0],
        menu: menuRes.rows[0],
        topDishes: topDishesRes.rows
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load admin statistics from database.',
      error: err.message
    });
  }
});

module.exports = router;
