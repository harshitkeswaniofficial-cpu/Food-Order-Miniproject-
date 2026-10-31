/**
 * scripts/initAdmin.js
 * One-time administrator initialization script.
 * Reads administrator credentials securely from environment variables,
 * hashes the password with bcrypt, and stores it in the admin_users table.
 */

const bcrypt = require('bcryptjs');
const db = require('../config/database');
require('dotenv').config();

async function initAdmin(shouldClosePool = false) {
  const username = (process.env.ADMIN_USERNAME || 'admin').trim();
  const email = (process.env.ADMIN_EMAIL || 'admin@foodorder.com').trim().toLowerCase();
  const rawPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  if (!rawPassword || rawPassword.length < 6) {
    console.error('[Admin Setup Error] ADMIN_PASSWORD in server/.env must be at least 6 characters.');
    if (shouldClosePool) process.exit(1);
    throw new Error('ADMIN_PASSWORD must be at least 6 characters.');
  }

  try {
    // 1. Ensure admin_users table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        admin_id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'ADMIN' NOT NULL CHECK (role = 'ADMIN'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 2. Hash password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

    // 3. Upsert admin user (insert or update password if exists)
    const checkSql = 'SELECT admin_id, username, email FROM admin_users WHERE username = $1 OR email = $2';
    const existing = await db.query(checkSql, [username, email]);

    if (existing.rows.length > 0) {
      const adminId = existing.rows[0].admin_id;
      const updateSql = `
        UPDATE admin_users 
        SET password_hash = $1, username = $2, email = $3
        WHERE admin_id = $4
        RETURNING admin_id, username, email, role, created_at
      `;
      const updateRes = await db.query(updateSql, [passwordHash, username, email, adminId]);
      console.log('====================================================');
      console.log('  Admin Account Updated Successfully');
      console.log(`  Username: ${updateRes.rows[0].username}`);
      console.log(`  Email:    ${updateRes.rows[0].email}`);
      console.log(`  Role:     ${updateRes.rows[0].role}`);
      console.log('====================================================');
    } else {
      const insertSql = `
        INSERT INTO admin_users (username, email, password_hash, role)
        VALUES ($1, $2, $3, 'ADMIN')
        RETURNING admin_id, username, email, role, created_at
      `;
      const insertRes = await db.query(insertSql, [username, email, passwordHash]);
      console.log('====================================================');
      console.log('  Initial Admin Account Created Successfully');
      console.log(`  Username: ${insertRes.rows[0].username}`);
      console.log(`  Email:    ${insertRes.rows[0].email}`);
      console.log(`  Role:     ${insertRes.rows[0].role}`);
      console.log('====================================================');
    }
  } catch (err) {
    console.error('[Admin Setup Error]:', err.message);
    if (shouldClosePool) process.exit(1);
    throw err;
  } finally {
    if (shouldClosePool) {
      await db.closePool();
    }
  }
}

if (require.main === module) {
  initAdmin(true);
}

module.exports = { initAdmin };
