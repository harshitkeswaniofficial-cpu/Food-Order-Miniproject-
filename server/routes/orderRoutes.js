/**
 * routes/orderRoutes.js
 * API routes for placing and managing customer food orders using PostgreSQL transactions.
 * Protected: Listing all orders, updating order status (Administrator only)
 * Public: Order placement, Customer order tracking with privacy masking
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { verifyAdmin } = require('../middleware/authMiddleware');

/**
 * Helper to mask phone numbers (e.g., 98****3210) for privacy
 */
function maskPhone(phone) {
  if (!phone || phone.length < 5) return '****';
  const clean = phone.trim();
  const start = clean.slice(0, 2);
  const end = clean.slice(-2);
  return `${start}${'*'.repeat(Math.max(4, clean.length - 4))}${end}`;
}

/**
 * Helper to mask street/apartment addresses for public lookup
 */
function maskAddress(addr) {
  if (!addr) return '***';
  const parts = addr.split(',');
  if (parts.length > 1) {
    const first = parts[0].trim().slice(0, 8);
    const last = parts[parts.length - 1].trim();
    return `${first}***, ${last}`;
  }
  return addr.slice(0, 8) + '***';
}

/**
 * Checks if the request contains a valid admin token without failing if absent
 */
function isRequestFromAdmin(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'foodorder_secure_jwt_secret_key_2026_production';
    const decoded = jwt.verify(token, secret);
    return decoded && decoded.role === 'ADMIN';
  } catch {
    return false;
  }
}

// GET /api/orders - Protected: Fetch all orders for Admin view
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        o.order_id,
        o.customer_name,
        o.customer_phone,
        o.delivery_address,
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI:SS') AS order_date,
        o.total_amount,
        o.order_status,
        (SELECT COUNT(*) FROM food_order_items i WHERE i.order_id = o.order_id) AS total_items
      FROM food_orders o
      ORDER BY o.order_id DESC
    `;
    const result = await db.query(query);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders from database.',
      error: err.message
    });
  }
});

// GET /api/orders/:id - Fetch full details of an order with its line items
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const verifyPhone = (req.query.phone || '').trim();
    const isAdmin = isRequestFromAdmin(req);

    // 1. Fetch order header
    const orderSql = `
      SELECT 
        order_id,
        customer_name,
        customer_phone,
        delivery_address,
        TO_CHAR(order_date, 'YYYY-MM-DD HH24:MI:SS') AS order_date,
        total_amount,
        order_status
      FROM food_orders
      WHERE order_id = $1
    `;
    const orderRes = await db.query(orderSql, [orderId]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Order #${orderId} was not found.`
      });
    }

    // 2. Fetch order items with item names and prices
    const itemsSql = `
      SELECT 
        i.order_item_id,
        i.order_id,
        i.item_id,
        m.item_name,
        m.image_url,
        i.quantity,
        i.unit_price,
        (i.quantity * i.unit_price) AS line_total
      FROM food_order_items i
      JOIN menu_items m ON i.item_id = m.item_id
      WHERE i.order_id = $1
      ORDER BY i.order_item_id ASC
    `;
    const itemsRes = await db.query(itemsSql, [orderId]);

    const order = { ...orderRes.rows[0] };
    order.ITEMS = itemsRes.rows;
    order.items = itemsRes.rows;

    // Apply privacy masking if not admin and not verified with matching phone
    const phoneMatches = verifyPhone && verifyPhone === order.customer_phone;
    if (!isAdmin && !phoneMatches) {
      order.customer_phone = maskPhone(order.customer_phone);
      order.CUSTOMER_PHONE = order.customer_phone;
      order.delivery_address = maskAddress(order.delivery_address);
      order.DELIVERY_ADDRESS = order.delivery_address;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('Error fetching order details:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details.',
      error: err.message
    });
  }
});

// GET /api/orders/customer/:phone - Public: Customer order tracking with privacy masking
router.get('/customer/:phone', async (req, res) => {
  try {
    const phone = req.params.phone.trim();
    const verifyOrderId = req.query.orderId ? parseInt(req.query.orderId, 10) : null;
    const isAdmin = isRequestFromAdmin(req);

    const query = `
      SELECT 
        o.order_id,
        o.customer_name,
        o.customer_phone,
        o.delivery_address,
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI:SS') AS order_date,
        o.total_amount,
        o.order_status,
        (SELECT COUNT(*) FROM food_order_items i WHERE i.order_id = o.order_id) AS total_items
      FROM food_orders o
      WHERE o.customer_phone = $1
      ORDER BY o.order_id DESC
    `;
    const result = await db.query(query, [phone]);

    // Mask sensitive details to prevent arbitrary phone number snooping
    const processedOrders = result.rows.map((ord) => {
      const copy = { ...ord };
      const isVerified = isAdmin || (verifyOrderId && verifyOrderId === copy.order_id);
      if (!isVerified) {
        copy.customer_phone = maskPhone(copy.customer_phone);
        copy.CUSTOMER_PHONE = copy.customer_phone;
        copy.delivery_address = maskAddress(copy.delivery_address);
        copy.DELIVERY_ADDRESS = copy.delivery_address;
      }
      return copy;
    });

    res.json({
      success: true,
      count: processedOrders.length,
      data: processedOrders
    });
  } catch (err) {
    console.error('Error fetching customer orders:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders.',
      error: err.message
    });
  }
});

// POST /api/orders - Public: Place a new order using a PostgreSQL transaction
router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, deliveryAddress, items } = req.body;

    // 1. Validation
    if (!customerName || customerName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide a valid customer name.' });
    }
    if (!customerPhone || customerPhone.trim().length < 7) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number.' });
    }
    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a complete delivery address.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Please select food items.' });
    }

    // 2. Fetch current prices from database and verify availability
    const itemIds = items.map(item => parseInt(item.itemId || item.ITEM_ID, 10));
    
    if (itemIds.some(id => isNaN(id))) {
      return res.status(400).json({ success: false, message: 'Invalid item ID found in cart.' });
    }

    const menuCheckSql = `
      SELECT item_id, item_name, price, is_available
      FROM menu_items
      WHERE item_id = ANY($1::int[])
    `;
    const menuResult = await db.query(menuCheckSql, [itemIds]);
    const dbItemsMap = new Map();
    menuResult.rows.forEach(row => {
      dbItemsMap.set(row.item_id, row);
    });

    let calculatedTotal = 0;
    const verifiedOrderItems = [];

    for (const item of items) {
      const id = parseInt(item.itemId || item.ITEM_ID, 10);
      const qty = parseInt(item.quantity || item.QUANTITY || 1, 10);

      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for item ID ${id}.` });
      }

      const dbItem = dbItemsMap.get(id);
      if (!dbItem) {
        return res.status(400).json({ success: false, message: `Dish with ID ${id} no longer exists in our menu.` });
      }
      if (dbItem.is_available !== 'Y') {
        return res.status(400).json({ success: false, message: `Sorry, "${dbItem.item_name}" is currently unavailable.` });
      }

      const unitPrice = parseFloat(dbItem.price);
      calculatedTotal += unitPrice * qty;

      verifiedOrderItems.push({
        itemId: id,
        itemName: dbItem.item_name,
        quantity: qty,
        unitPrice: unitPrice,
        lineTotal: unitPrice * qty
      });
    }

    calculatedTotal = Math.round(calculatedTotal * 100) / 100;

    // 3. Execute Transaction: Insert Order Header + Order Items atomically
    const orderResult = await db.executeTransaction(async (client) => {
      // A. Insert into food_orders
      const orderInsertSql = `
        INSERT INTO food_orders (
          customer_name,
          customer_phone,
          delivery_address,
          order_date,
          total_amount,
          order_status
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, 'PLACED')
        RETURNING order_id
      `;

      const headerRes = await client.query(orderInsertSql, [
        customerName.trim(),
        customerPhone.trim(),
        deliveryAddress.trim(),
        calculatedTotal
      ]);
      const newOrderId = headerRes.rows[0].order_id;

      // B. Insert each item into food_order_items
      const itemInsertSql = `
        INSERT INTO food_order_items (
          order_id,
          item_id,
          quantity,
          unit_price
        ) VALUES ($1, $2, $3, $4)
      `;

      for (const orderItem of verifiedOrderItems) {
        await client.query(itemInsertSql, [
          newOrderId,
          orderItem.itemId,
          orderItem.quantity,
          orderItem.unitPrice
        ]);
      }

      return {
        orderId: newOrderId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        totalAmount: calculatedTotal,
        orderStatus: 'PLACED',
        items: verifiedOrderItems
      };
    });

    console.log(`[PostgreSQL DB] Order #${orderResult.orderId} committed successfully with ${verifiedOrderItems.length} items. Total: ₹${calculatedTotal}`);

    res.status(201).json({
      success: true,
      message: 'Your food order has been placed successfully with Cash on Delivery!',
      data: orderResult
    });
  } catch (err) {
    console.error('Error placing order:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to place order in database. Transaction has been rolled back.',
      error: err.message
    });
  }
});

// PATCH /api/orders/:id/status - Protected: Update order status (Admin only)
router.patch('/:id/status', verifyAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const allowedStatuses = ['PLACED', 'PREPARING', 'DELIVERED', 'CANCELLED'];
    if (!status || !allowedStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`
      });
    }

    const newStatus = status.toUpperCase();
    const updateSql = `
      UPDATE food_orders
      SET order_status = $1
      WHERE order_id = $2
      RETURNING order_id, order_status
    `;
    const result = await db.query(updateSql, [newStatus, orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Order #${orderId} not found.`
      });
    }

    res.json({
      success: true,
      message: `Order #${orderId} status updated to ${newStatus}.`,
      data: { orderId, orderStatus: newStatus }
    });
  } catch (err) {
    console.error('Error updating order status:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status in database.',
      error: err.message
    });
  }
});

module.exports = router;
