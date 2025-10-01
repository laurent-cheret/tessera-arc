const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration for initial connection (to postgres db)
const initialConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default postgres database first
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
};

// Target database name
const targetDbName = process.env.DB_NAME || 'arc_crowdsourcing';

async function setupDatabase() {
  console.log('🔧 Setting up ARC Crowdsourcing Database...');
  
  try {
    // Step 1: Connect to postgres database
    console.log('📡 Connecting to PostgreSQL...');
    const initialPool = new Pool(initialConfig);
    
    // Step 2: Check if target database exists
    console.log(`🔍 Checking if database '${targetDbName}' exists...`);
    const dbCheckResult = await initialPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName]
    );
    
    if (dbCheckResult.rows.length === 0) {
      // Step 3: Create database if it doesn't exist
      console.log(`📦 Creating database '${targetDbName}'...`);
      await initialPool.query(`CREATE DATABASE ${targetDbName}`);
      console.log(`✅ Database '${targetDbName}' created successfully!`);
    } else {
      console.log(`✅ Database '${targetDbName}' already exists.`);
    }
    
    await initialPool.end();
    
    // Step 4: Connect to the target database
    console.log(`🔗 Connecting to '${targetDbName}' database...`);
    const targetConfig = {
      ...initialConfig,
      database: targetDbName
    };
    const targetPool = new Pool(targetConfig);
    
    // Step 5: Run schema creation with improved SQL handling
    console.log('📋 Creating database schema...');
    const schemaPath = path.join(__dirname, '../database_schema_fixed.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.log('⚠️  Fixed schema file not found, trying original...');
      const originalSchemaPath = path.join(__dirname, '../database_schema.sql');
      if (!fs.existsSync(originalSchemaPath)) {
        throw new Error(`Schema file not found at: ${schemaPath} or ${originalSchemaPath}`);
      }
      
      // Use the original but execute it differently
      await executeSchemaWithProperParsing(targetPool, originalSchemaPath);
    } else {
      // Use the fixed schema file
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute the entire SQL as one statement
      console.log('📝 Executing schema creation...');
      await targetPool.query(schemaSql);
      console.log('✅ Schema executed successfully!');
    }
    
    // Step 6: Verify tables were created
    console.log('🔍 Verifying table creation...');
    const tableCheckResult = await targetPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tableCheckResult.rows.map(row => row.table_name);
    console.log(`📊 Created ${tables.length} tables:`, tables.join(', '));
    
    if (tables.length === 0) {
      throw new Error('No tables were created! Schema execution failed.');
    }
    
    // Step 7: Run a basic health check
    console.log('🏥 Running health check...');
    const healthResult = await targetPool.query('SELECT NOW() as timestamp, version() as version');
    console.log(`✅ Database is healthy! Timestamp: ${healthResult.rows[0].timestamp}`);
    
    await targetPool.end();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log(`📊 Tables created: ${tables.join(', ')}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run db:populate (to load ARC tasks)');
    console.log('   2. Start the server: npm run dev');
    console.log('   3. Test the application: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Make sure PostgreSQL is running');
    console.error('   2. Check your database credentials in .env file');
    console.error('   3. Ensure the postgres user has database creation privileges');
    console.error('   4. Try connecting manually: psql -U postgres -h localhost');
    
    process.exit(1);
  }
}

// Alternative function for handling complex SQL with functions
async function executeSchemaWithProperParsing(pool, schemaPath) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // Instead of splitting on semicolons, execute smaller logical blocks
  const sqlBlocks = [
    // Block 1: Create tables
    schemaSql.substring(
      schemaSql.indexOf('CREATE TABLE participants'),
      schemaSql.indexOf('-- =====================================================\n-- Indexes')
    ),
    // Block 2: Create indexes
    schemaSql.substring(
      schemaSql.indexOf('-- Indexes for Performance'),
      schemaSql.indexOf('-- =====================================================\n-- Functions') > 0 
        ? schemaSql.indexOf('-- =====================================================\n-- Functions')
        : schemaSql.indexOf('-- =====================================================\n-- Views') > 0
        ? schemaSql.indexOf('-- =====================================================\n-- Views')
        : schemaSql.length
    )
  ];
  
  for (let i = 0; i < sqlBlocks.length; i++) {
    const block = sqlBlocks[i].trim();
    if (block && !block.startsWith('--')) {
      try {
        console.log(`📝 Executing SQL block ${i + 1}...`);
        await pool.query(block);
      } catch (error) {
        console.warn(`⚠️  Warning in block ${i + 1}: ${error.message}`);
      }
    }
  }
}

// Helper function to create .env file if it doesn't exist
function createEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  const envExamplePath = path.join(__dirname, '../.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('📄 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created! Please update the database password.');
    console.log('⚠️  Remember to set a secure DB_PASSWORD in .env file');
  }
}

// Run setup if called directly
if (require.main === module) {
  createEnvFile();
  setupDatabase();
}

module.exports = { setupDatabase };