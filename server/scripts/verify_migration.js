// server/scripts/verify_migration.js
// Verifies database column reorganization was successful

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'arc_crowdsourcing',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function verifyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 VERIFYING DATABASE MIGRATION');
    console.log('='.repeat(70));
    
    // Expected column names after migration
    const expectedColumns = [
      // Q1
      'q1_primary_impression',
      'q1_primary_features',
      'q1_primary_other_text',
      'q1_secondary_impressions',
      // Q2
      'q2_initial_hypothesis',
      // Q3
      'q3_confidence_level',
      // Q4
      'q4_what_you_tried',
      'q4_word_count',
      // Q5
      'q5_hypothesis_revised',
      'q5_revision_reason',
      // Q6
      'q6_strategy_used',
      // Q7
      'q7_difficulty_rating',
      // Q8
      'q8_challenge_factors',
      'q8_challenge_other'
    ];
    
    // Old column names that should NOT exist
    const oldColumns = [
      'primary_impression',
      'primary_features',
      'initial_hypothesis',
      'confidence_level',
      'transformation_rule_full',
      'hypothesis_revised',
      'strategy_used',
      'difficulty_rating',
      'challenge_factors'
    ];
    
    // Step 1: Check all new columns exist
    console.log('\n📋 Step 1: Checking new column names...');
    
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'responses'
      ORDER BY column_name
    `);
    
    const actualColumns = columnsResult.rows.map(r => r.column_name);
    
    let allNewColumnsExist = true;
    for (const col of expectedColumns) {
      if (actualColumns.includes(col)) {
        console.log(`  ✓ ${col}`);
      } else {
        console.log(`  ✗ MISSING: ${col}`);
        allNewColumnsExist = false;
      }
    }
    
    // Step 2: Check old columns are gone
    console.log('\n📋 Step 2: Checking old columns removed...');
    
    let noOldColumnsExist = true;
    for (const col of oldColumns) {
      if (actualColumns.includes(col)) {
        console.log(`  ✗ OLD COLUMN STILL EXISTS: ${col}`);
        noOldColumnsExist = false;
      } else {
        console.log(`  ✓ ${col} removed`);
      }
    }
    
    // Step 3: Check constraints
    console.log('\n📋 Step 3: Checking constraints...');
    
    const constraints = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'responses' 
        AND constraint_type = 'CHECK'
      ORDER BY constraint_name
    `);
    
    const expectedConstraints = [
      'valid_q1_primary_impression',
      'valid_q3_confidence',
      'valid_q7_difficulty'
    ];
    
    let allConstraintsExist = true;
    const actualConstraints = constraints.rows.map(r => r.constraint_name);
    
    for (const constraint of expectedConstraints) {
      if (actualConstraints.includes(constraint)) {
        console.log(`  ✓ ${constraint}`);
      } else {
        console.log(`  ✗ MISSING: ${constraint}`);
        allConstraintsExist = false;
      }
    }
    
    // Step 4: Check indexes
    console.log('\n📋 Step 4: Checking indexes...');
    
    const indexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'responses'
      ORDER BY indexname
    `);
    
    const expectedIndexes = [
      'idx_responses_q3_confidence',
      'idx_responses_q6_strategy',
      'idx_responses_q7_difficulty'
    ];
    
    let allIndexesExist = true;
    const actualIndexes = indexes.rows.map(r => r.indexname);
    
    for (const idx of expectedIndexes) {
      if (actualIndexes.includes(idx)) {
        console.log(`  ✓ ${idx}`);
      } else {
        console.log(`  ✗ MISSING: ${idx}`);
        allIndexesExist = false;
      }
    }
    
    // Step 5: Check data integrity (if data exists)
    console.log('\n📋 Step 5: Checking data integrity...');
    
    const rowCount = await client.query('SELECT COUNT(*) FROM responses');
    const count = parseInt(rowCount.rows[0].count);
    
    console.log(`  ℹ Total rows: ${count}`);
    
    if (count > 0) {
      // Check that data is still accessible
      const sampleData = await client.query(`
        SELECT 
          response_id,
          q1_primary_impression,
          q2_initial_hypothesis,
          q3_confidence_level,
          q7_difficulty_rating
        FROM responses 
        LIMIT 1
      `);
      
      if (sampleData.rows.length > 0) {
        console.log('  ✓ Data is accessible with new column names');
        console.log(`  ✓ Sample response_id: ${sampleData.rows[0].response_id}`);
      } else {
        console.log('  ⚠ No data to verify');
      }
    } else {
      console.log('  ℹ No existing data (fresh database)');
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 MIGRATION VERIFICATION SUMMARY');
    console.log('='.repeat(70));
    
    const allChecks = [
      { name: 'New columns exist', passed: allNewColumnsExist },
      { name: 'Old columns removed', passed: noOldColumnsExist },
      { name: 'Constraints updated', passed: allConstraintsExist },
      { name: 'Indexes rebuilt', passed: allIndexesExist }
    ];
    
    const passedCount = allChecks.filter(c => c.passed).length;
    const totalCount = allChecks.length;
    
    console.log('');
    allChecks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
    });
    
    console.log('');
    console.log(`Score: ${passedCount}/${totalCount} checks passed`);
    console.log('');
    
    if (passedCount === totalCount) {
      console.log('✅ ===================================================');
      console.log('✅ MIGRATION SUCCESSFUL!');
      console.log('✅ ===================================================');
      console.log('');
      console.log('Next steps:');
      console.log('1. Update backend code (server/index.js)');
      console.log('2. Update frontend components');
      console.log('3. Test complete submission');
      console.log('');
      return true;
    } else {
      console.log('❌ ===================================================');
      console.log('❌ MIGRATION INCOMPLETE OR FAILED');
      console.log('❌ ===================================================');
      console.log('');
      console.log('Action required:');
      console.log('1. Review error messages above');
      console.log('2. Run rollback script if needed:');
      console.log('   psql -U postgres -d arc_crowdsourcing -f server/scripts/rollback_rename_columns.sql');
      console.log('');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    console.error('');
    console.error('Database may be in inconsistent state!');
    console.error('Consider running rollback script.');
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run verification
verifyMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });