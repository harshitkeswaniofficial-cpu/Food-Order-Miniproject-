/**
 * routes/categoryRoutes.js
 * API routes for retrieving food categories
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/categories - Fetch all categories
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT category_id, category_name FROM food_categories ORDER BY category_id ASC';
    const result = await db.query(query);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve food categories from PostgreSQL database.',
      error: err.message
    });
  }
});

module.exports = router;
