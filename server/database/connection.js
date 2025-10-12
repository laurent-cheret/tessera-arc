const { Pool } = require('pg');
require('dotenv').config();

// Database configuration - works for both local and production
const dbConfig = {
  // Production (Railway) uses PGUSER, PGHOST, etc.
  // Local uses DB_USER, DB_HOST, etc.
  user: process.env.PGUSER || process.env.DB_USER || 'postgres',
  host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
  database: process.env.PGDATABASE || process.env.DB_NAME || 'arc_crowdsourcing',
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'password',
  port: process.env.PGPORT || process.env.DB_PORT || 5432,
  
  // Enable SSL for production (Railway), disable for local
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${dbConfig.database} @ ${dbConfig.host}`);
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
};

// Helper function for transactions
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ID Generation helper
const { v4: uuidv4 } = require('uuid');

const generateId = (prefix) => {
  return `${prefix}_${uuidv4().replace(/-/g, '')}`;
};

// Database health check
const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW() as timestamp, version() as version');
    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
      connections: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

module.exports = {
  pool,
  query,
  transaction,
  generateId,
  healthCheck
};