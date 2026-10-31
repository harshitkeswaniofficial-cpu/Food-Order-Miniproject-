/**
 * middleware/authMiddleware.js
 * JWT authentication and Administrator role-based access control middleware.
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware that validates the JWT Bearer token and verifies
 * that the user exists in PostgreSQL with the 'ADMIN' role.
 */
async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in as an administrator.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing.'
      });
    }

    const secret = process.env.JWT_SECRET || 'foodorder_secure_jwt_secret_key_2026_production';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.'
      });
    }

    // Verify admin still exists in PostgreSQL database and has ADMIN role
    const adminQuery = `
      SELECT admin_id, username, email, role 
      FROM admin_users 
      WHERE admin_id = $1
    `;
    const result = await db.query(adminQuery, [decoded.adminId]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found or has been removed.'
      });
    }

    const admin = result.rows[0];
    if (admin.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have administrator privileges.'
      });
    }

    // Attach verified admin to request object
    req.admin = {
      adminId: admin.admin_id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware Error]:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server authentication error.',
      error: err.message
    });
  }
}

module.exports = {
  verifyAdmin
};
