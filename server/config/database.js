/**
 * config/database.js
 * PostgreSQL connection pool configuration using the 'pg' library.
 */

const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'foodorder_db',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };

const pool = new Pool(dbConfig);

// Pool error listener
pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

/**
 * Normalizes query rows so both UPPERCASE and lowercase column keys are accessible.
 * This guarantees complete compatibility with React frontend components.
 */
function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const normalized = { ...row };
  for (const [key, value] of Object.entries(row)) {
    normalized[key.toUpperCase()] = value;
  }
  return normalized;
}

/**
 * Executes a single parameterized query safely using the pool
 * @param {string} text - SQL query with $1, $2... placeholders
 * @param {Array} params - Bind parameter values
 */
async function query(text, params = []) {
  const result = await pool.query(text, params);
  return {
    rows: (result.rows || []).map(normalizeRow),
    rowCount: result.rowCount
  };
}

/**
 * Executes multiple operations inside a PostgreSQL transaction (BEGIN / COMMIT / ROLLBACK)
 * @param {Function} callback - Async function that receives the active client connection
 */
async function executeTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      console.warn('[PostgreSQL DB] Error during transaction. Rolling back changes...');
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[PostgreSQL DB] Rollback error:', rollbackErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Tests connection health for /api/health endpoint
 */
async function checkHealth() {
  try {
    await pool.query('SELECT 1 AS status_check');
    return {
      connected: true,
      message: 'PostgreSQL database connected successfully',
      target: process.env.DATABASE_URL ? 'Cloud PostgreSQL (DATABASE_URL)' : `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
    };
  } catch (err) {
    return {
      connected: false,
      message: 'PostgreSQL database connection failed',
      error: err.message,
      target: process.env.DATABASE_URL ? 'Cloud PostgreSQL (DATABASE_URL)' : `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
    };
  }
}

/**
 * Gracefully shuts down pool on server termination
 */
async function closePool() {
  try {
    await pool.end();
    console.log('[PostgreSQL DB] Connection pool closed.');
  } catch (err) {
    console.error('[PostgreSQL DB] Error closing pool:', err.message);
  }
}

module.exports = {
  pool,
  query,
  executeTransaction,
  checkHealth,
  closePool,
  normalizeRow
};
