/**
 * scripts/initDB.js
 * Cloud database initialization script.
 * Reads the schema, seed data, and admin migration SQL files and runs them
 * against the target database (local or cloud via DATABASE_URL).
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { initAdmin } = require('./initAdmin');

async function initializeDatabase(shouldClosePool = false) {
  console.log('====================================================');
  console.log('  INITIALIZING FOODORDER DATABASE FOR DEPLOYMENT    ');
  console.log('====================================================\n');

  const rootDir = path.resolve(__dirname, '../..');
  const schemaFile = path.join(rootDir, 'database', '01_schema.sql');
  const seedFile = path.join(rootDir, 'database', '02_seed_data.sql');
  const adminMigrationFile = path.join(rootDir, 'database', '04_admin_migration.sql');

  try {
    // 1. Run Schema
    if (fs.existsSync(schemaFile)) {
      console.log('-> Executing 01_schema.sql...');
      const schemaSql = fs.readFileSync(schemaFile, 'utf8');
      await db.pool.query(schemaSql);
      console.log('   [SUCCESS] Schema tables and constraints created.');
    }

    // 2. Run Admin Migration
    if (fs.existsSync(adminMigrationFile)) {
      console.log('-> Executing 04_admin_migration.sql...');
      const adminSql = fs.readFileSync(adminMigrationFile, 'utf8');
      await db.pool.query(adminSql);
      console.log('   [SUCCESS] admin_users table created.');
    }

    // 3. Run Seed Data
    if (fs.existsSync(seedFile)) {
      console.log('-> Executing 02_seed_data.sql...');
      const seedSql = fs.readFileSync(seedFile, 'utf8');
      await db.pool.query(seedSql);
      console.log('   [SUCCESS] Categories and 18 menu items seeded.');
    }

    // 4. Create/Upsert Admin Account
    console.log('-> Setting up Default Administrator Account...');
    await initAdmin(false);

    console.log('\n====================================================');
    console.log('  DATABASE INITIALIZATION COMPLETE & READY!          ');
    console.log('====================================================');
    return { success: true, message: 'Database initialized and seeded successfully.' };
  } catch (err) {
    console.error('\n[Database Init Error]:', err.message);
    if (shouldClosePool) process.exit(1);
    throw err;
  } finally {
    if (shouldClosePool) {
      await db.closePool();
    }
  }
}

if (require.main === module) {
  initializeDatabase(true);
}

module.exports = { initializeDatabase };
