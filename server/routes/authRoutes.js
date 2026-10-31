/**
 * routes/authRoutes.js
 * Administrator authentication routes: Login, Current Admin Profile, Logout
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { verifyAdmin } = require('../middleware/authMiddleware');

// POST /api/auth/login - Administrator login
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !usernameOrEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username or email address is required.'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
    }

    const cleanIdentifier = usernameOrEmail.trim();

    // Query admin user by username OR email
    const query = `
      SELECT admin_id, username, email, password_hash, role
      FROM admin_users
      WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)
    `;
    const result = await db.query(query, [cleanIdentifier]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    const admin = result.rows[0];

    // Verify password hash with bcrypt
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.'
      });
    }

    // Role check
    if (admin.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.'
      });
    }

    // Sign JWT token
    const secret = process.env.JWT_SECRET || 'foodorder_secure_jwt_secret_key_2026_production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      {
        adminId: admin.admin_id,
        username: admin.username,
        role: admin.role
      },
      secret,
      { expiresIn }
    );

    res.json({
      success: true,
      message: 'Administrator authentication successful.',
      token,
      admin: {
        adminId: admin.admin_id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      },
      data: {
        token,
        admin: {
          adminId: admin.admin_id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      }
    });
  } catch (err) {
    console.error('Error during admin login:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: err.message
    });
  }
});

// GET /api/auth/me - Verify session and fetch current admin info
router.get('/me', verifyAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin,
    data: {
      admin: req.admin
    }
  });
});

// POST /api/auth/logout - Administrative logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

module.exports = router;
