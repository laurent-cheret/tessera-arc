// server/scripts/securityAudit.js
// Quick security vulnerability scanner

const fs = require('fs');
const path = require('path');

console.log('🔒 SECURITY AUDIT REPORT');
console.log('='.repeat(70));
console.log('Generated:', new Date().toISOString());
console.log('='.repeat(70));

let issuesFound = 0;
let warnings = 0;

// ============================================================================
// CHECK 1: Environment Variables Protection
// ============================================================================
console.log('\n📋 CHECK 1: Environment Variables Protection');
console.log('-'.repeat(70));

try {
  const gitignorePath = path.join(__dirname, '../../.gitignore');
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  
  if (gitignore.includes('.env')) {
    console.log('✓ .env is listed in .gitignore');
  } else {
    console.log('✗ CRITICAL: .env is NOT in .gitignore!');
    console.log('  Action: Add ".env" to your .gitignore file');
    issuesFound++;
  }
  
  // Check for .env in client folder
  const clientEnvPath = path.join(__dirname, '../../client/.env');
  if (fs.existsSync(clientEnvPath)) {
    console.log('✗ WARNING: .env file found in client folder!');
    console.log('  Action: Move all environment variables to server/.env');
    issuesFound++;
  } else {
    console.log('✓ No .env file in client folder');
  }
  
  // Check for REACT_APP_ or VITE_ secrets
  const clientSrcPath = path.join(__dirname, '../../client/src');
  const files = fs.readdirSync(clientSrcPath, { recursive: true });
  
  let foundSecrets = false;
  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const filePath = path.join(clientSrcPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('REACT_APP_DB_') || 
          content.includes('REACT_APP_PASSWORD') ||
          content.includes('REACT_APP_SECRET')) {
        console.log(`✗ WARNING: Possible secrets in ${file}`);
        foundSecrets = true;
        warnings++;
      }
    }
  }
  
  if (!foundSecrets) {
    console.log('✓ No obvious secrets in client code');
  }
  
} catch (error) {
  console.log('⚠ Could not complete .env check:', error.message);
}

// ============================================================================
// CHECK 2: SQL Injection Protection
// ============================================================================
console.log('\n📋 CHECK 2: SQL Injection Protection');
console.log('-'.repeat(70));

try {
  const serverIndexPath = path.join(__dirname, '../index.js');
  const serverCode = fs.readFileSync(serverIndexPath, 'utf8');
  
  // Check for parameterized queries
  const hasParameterized = /\$\d+/.test(serverCode);
  
  // Check for string concatenation in SQL
  const hasStringConcat = /VALUES.*\$\{/.test(serverCode) || 
                          /INSERT.*\$\{/.test(serverCode) ||
                          /UPDATE.*\$\{/.test(serverCode);
  
  if (hasParameterized && !hasStringConcat) {
    console.log('✓ Using parameterized queries ($1, $2, $3...)');
  } else if (hasStringConcat) {
    console.log('✗ CRITICAL: SQL injection vulnerability detected!');
    console.log('  Found string interpolation in SQL queries');
    console.log('  Action: Replace ${variable} with $1, $2, $3 and pass array');
    issuesFound++;
  } else if (!hasParameterized) {
    console.log('⚠ WARNING: Could not detect parameterized queries');
    console.log('  Manual review needed');
    warnings++;
  }
  
  // Find all query locations
  const queryMatches = serverCode.match(/client\.query\([^)]+\)/g);
  if (queryMatches) {
    console.log(`  Found ${queryMatches.length} database query locations`);
  }
  
} catch (error) {
  console.log('⚠ Could not complete SQL check:', error.message);
}

// ============================================================================
// CHECK 3: Rate Limiting
// ============================================================================
console.log('\n📋 CHECK 3: Rate Limiting');
console.log('-'.repeat(70));

try {
  const serverIndexPath = path.join(__dirname, '../index.js');
  const serverCode = fs.readFileSync(serverIndexPath, 'utf8');
  
  const hasRateLimit = serverCode.includes('rate-limit') || 
                       serverCode.includes('rateLimit') ||
                       serverCode.includes('express-rate-limit');
  
  if (hasRateLimit) {
    console.log('✓ Rate limiting detected');
  } else {
    console.log('✗ WARNING: No rate limiting found');
    console.log('  Action: Install express-rate-limit package');
    console.log('  Attackers can spam your API with unlimited requests');
    warnings++;
  }
  
} catch (error) {
  console.log('⚠ Could not complete rate limit check:', error.message);
}

// ============================================================================
// CHECK 4: Input Validation
// ============================================================================
console.log('\n📋 CHECK 4: Input Validation');
console.log('-'.repeat(70));

try {
  const serverIndexPath = path.join(__dirname, '../index.js');
  const serverCode = fs.readFileSync(serverIndexPath, 'utf8');
  
  const hasValidation = serverCode.includes('validate') || 
                        serverCode.includes('sanitize') ||
                        serverCode.includes('validator') ||
                        serverCode.includes('.trim()') ||
                        serverCode.includes('.length >');
  
  if (hasValidation) {
    console.log('✓ Some input validation detected');
    console.log('  Recommend: Validate ALL user inputs');
  } else {
    console.log('⚠ WARNING: Limited or no input validation');
    console.log('  Action: Add validation for text lengths, data types, formats');
    warnings++;
  }
  
} catch (error) {
  console.log('⚠ Could not complete validation check:', error.message);
}

// ============================================================================
// CHECK 5: Error Message Handling
// ============================================================================
console.log('\n📋 CHECK 5: Error Message Handling');
console.log('-'.repeat(70));

try {
  const serverIndexPath = path.join(__dirname, '../index.js');
  const serverCode = fs.readFileSync(serverIndexPath, 'utf8');
  
  // Check for error.message being sent to client
  const exposesErrors = /res\..*\.json\(\{.*error\s*:\s*error\.message/.test(serverCode) ||
                        /res\..*\.send\(error/.test(serverCode);
  
  if (exposesErrors) {
    console.log('✗ WARNING: Detailed error messages exposed to client');
    console.log('  Action: Send generic errors to users, log details privately');
    console.log('  Example: res.json({ error: "Request failed" })');
    warnings++;
  } else {
    console.log('✓ Error messages appear to be sanitized');
  }
  
  // Check for console.error (good for logging)
  const logsErrors = serverCode.includes('console.error');
  if (logsErrors) {
    console.log('✓ Errors are being logged server-side');
  } else {
    console.log('⚠ Consider adding console.error for debugging');
  }
  
} catch (error) {
  console.log('⚠ Could not complete error handling check:', error.message);
}

// ============================================================================
// CHECK 6: HTTPS and CORS Configuration
// ============================================================================
console.log('\n📋 CHECK 6: HTTPS and CORS Configuration');
console.log('-'.repeat(70));

try {
  const serverIndexPath = path.join(__dirname, '../index.js');
  const serverCode = fs.readFileSync(serverIndexPath, 'utf8');
  
  const hasCORS = serverCode.includes('cors');
  if (hasCORS) {
    console.log('✓ CORS middleware detected');
    
    // Check if CORS is configured properly
    if (serverCode.includes('cors()')) {
      console.log('⚠ WARNING: CORS allows ALL origins (cors())');
      console.log('  Action: Configure allowed origins for production');
    }
  } else {
    console.log('⚠ No CORS configuration detected');
  }
  
  // Check for helmet (security headers)
  const hasHelmet = serverCode.includes('helmet');
  if (hasHelmet) {
    console.log('✓ Helmet security headers detected');
  } else {
    console.log('⚠ Consider adding helmet for security headers');
  }
  
} catch (error) {
  console.log('⚠ Could not complete HTTPS/CORS check:', error.message);
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 SUMMARY');
console.log('='.repeat(70));

console.log(`\nCritical Issues: ${issuesFound}`);
console.log(`Warnings: ${warnings}`);

if (issuesFound === 0 && warnings === 0) {
  console.log('\n✅ Great! No major security issues detected');
  console.log('   Your code follows good security practices');
} else if (issuesFound > 0) {
  console.log('\n⚠️  CRITICAL: Fix the issues marked with ✗ before deploying');
  console.log('   These vulnerabilities can be exploited by attackers');
} else {
  console.log('\n⚠️  Some warnings found - not critical but recommended to fix');
}

console.log('\n' + '='.repeat(70));
console.log('For detailed fixes, share this report with Claude');
console.log('='.repeat(70));