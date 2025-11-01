const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'arc_crowdsourcing',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  const migrationPath = path.join(__dirname, 'migrations', '002_simplify_phase1_to_main_idea.sql');
  
  console.log('📂 Reading migration file...');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('🔄 Running migration: 002_simplify_phase1_to_main_idea.sql');
  
  try {
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'responses' 
      AND column_name IN ('q1_main_idea', 'q1_primary_impression_old', 'q4_word_count')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 Updated columns in responses table:');
    console.table(result.rows);
    
    // Check if migration was successful
    const hasMainIdea = result.rows.some(row => row.column_name === 'q1_main_idea');
    const hasOldColumn = result.rows.some(row => row.column_name === 'q1_primary_impression_old');
    const noWordCount = !result.rows.some(row => row.column_name === 'q4_word_count');
    
    if (hasMainIdea && hasOldColumn && noWordCount) {
      console.log('\n✅ All changes applied correctly!');
      console.log('   ✓ q1_main_idea column added');
      console.log('   ✓ Old columns renamed with _old suffix');
      console.log('   ✓ Word count columns removed');
    } else {
      console.log('\n⚠️  Migration may be incomplete. Please check manually.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n👋 Database connection closed');
  }
}

runMigration();