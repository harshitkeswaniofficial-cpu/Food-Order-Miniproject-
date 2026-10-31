/**
 * routes/menuRoutes.js
 * API routes for managing menu items in PostgreSQL.
 * Public: Browse, Search, Filter
 * Protected: Add, Edit, Delete (Requires Administrator privileges)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('../middleware/authMiddleware');

// GET /api/menu - Public: Retrieve menu items with optional category filter and search
router.get('/', async (req, res) => {
  try {
    const { category, search, availableOnly } = req.query;
    let query = `
      SELECT 
        m.item_id,
        m.category_id,
        c.category_name,
        m.item_name,
        m.description,
        m.price,
        m.image_url,
        m.is_available
      FROM menu_items m
      JOIN food_categories c ON m.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      params.push(parseInt(category, 10));
      query += ` AND m.category_id = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      query += ` AND m.item_name ILIKE $${params.length}`;
    }

    if (availableOnly === 'true') {
      query += " AND m.is_available = 'Y'";
    }

    query += ' ORDER BY m.item_id ASC';

    const result = await db.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching menu items:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve menu items from PostgreSQL database.',
      error: err.message
    });
  }
});

// GET /api/menu/:id - Public: Retrieve single menu item
router.get('/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const query = `
      SELECT 
        m.item_id,
        m.category_id,
        c.category_name,
        m.item_name,
        m.description,
        m.price,
        m.image_url,
        m.is_available
      FROM menu_items m
      JOIN food_categories c ON m.category_id = c.category_id
      WHERE m.item_id = $1
    `;
    const result = await db.query(query, [itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Food item with ID ${itemId} not found.`
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching menu item:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item details.',
      error: err.message
    });
  }
});

// POST /api/menu - Protected: Add a new menu item (Admin only)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { categoryId, itemName, description, price, imageUrl, isAvailable } = req.body;

    // Validation
    if (!itemName || itemName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Item name is required.' });
    }
    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'Valid Category ID is required.' });
    }
    if (price === undefined || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
    }

    const cleanCategory = parseInt(categoryId, 10);
    const cleanName = itemName.trim();
    const cleanDesc = description ? description.trim() : '';
    const cleanPrice = parseFloat(price);
    const cleanImage = imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
    const cleanAvail = isAvailable === 'N' ? 'N' : 'Y';

    const insertSql = `
      INSERT INTO menu_items (
        category_id, item_name, description, price, image_url, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(insertSql, [
      cleanCategory,
      cleanName,
      cleanDesc,
      cleanPrice,
      cleanImage,
      cleanAvail
    ]);

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding menu item:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add menu item into PostgreSQL database.',
      error: err.message
    });
  }
});

// PUT /api/menu/:id - Protected: Edit an existing menu item (Admin only)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id, 10);
    const { categoryId, itemName, description, price, imageUrl, isAvailable } = req.body;

    if (!itemName || itemName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Item name is required.' });
    }
    if (price === undefined || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required.' });
    }

    const cleanCategory = parseInt(categoryId, 10);
    const cleanName = itemName.trim();
    const cleanDesc = description ? description.trim() : '';
    const cleanPrice = parseFloat(price);
    const cleanImage = imageUrl && imageUrl.trim() !== '' ? imageUrl.trim() : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
    const cleanAvail = isAvailable === 'N' ? 'N' : 'Y';

    const updateSql = `
      UPDATE menu_items
      SET category_id = $1,
          item_name = $2,
          description = $3,
          price = $4,
          image_url = $5,
          is_available = $6
      WHERE item_id = $7
      RETURNING *
    `;

    const result = await db.query(updateSql, [
      cleanCategory,
      cleanName,
      cleanDesc,
      cleanPrice,
      cleanImage,
      cleanAvail,
      itemId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Item with ID ${itemId} not found.`
      });
    }

    res.json({
      success: true,
      message: 'Menu item updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating menu item:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item.',
      error: err.message
    });
  }
});

// DELETE /api/menu/:id - Protected: Delete or deactivate a menu item (Admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  try {
    const deleteSql = 'DELETE FROM menu_items WHERE item_id = $1';
    const result = await db.query(deleteSql, [itemId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: `Item with ID ${itemId} not found.`
      });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully from database.'
    });
  } catch (err) {
    // Foreign key violation error code in PostgreSQL is 23503
    if (err.code === '23503' || (err.message && err.message.includes('foreign key'))) {
      console.log(`[PostgreSQL DB] Item ${itemId} has existing order references. Deactivating instead...`);
      try {
        await db.query("UPDATE menu_items SET is_available = 'N' WHERE item_id = $1", [itemId]);
        return res.json({
          success: true,
          message: 'Item has existing customer orders, so it was marked as Unavailable (deactivated) to preserve order history.'
        });
      } catch (deactivateErr) {
        return res.status(500).json({
          success: false,
          message: 'Failed to deactivate menu item.',
          error: deactivateErr.message
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item.',
      error: err.message
    });
  }
});

module.exports = router;
