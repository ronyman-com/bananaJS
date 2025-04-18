const path = require('path');
const fs = require('fs-extra');

console.log('--- Path Test Script Starting ---');
console.log(`Node.js Version: ${process.version}`);
console.log(`Current Working Directory: ${process.cwd()}`);

let testProjectRoot = '';
let testPublicDir = ''; // Initialize as empty string

try {
  console.log('Step 1: Defining Project Root...');
  testProjectRoot = process.cwd(); // Use CWD as root for simplicity
  console.log(`  Project Root set to: ${testProjectRoot}`);
  if (typeof testProjectRoot !== 'string' || !testProjectRoot) {
    throw new Error('Failed to get a valid project root string.');
  }

  console.log('Step 2: Defining Public Directory Path...');
  testPublicDir = path.join(testProjectRoot, 'public');
  console.log(`  Public Dir Path defined as: ${testPublicDir}`);
  if (typeof testPublicDir !== 'string' || !testPublicDir) {
    // This error message is different
    throw new Error('Failed to define a valid public directory path string.');
  }

  console.log('Step 3: Checking Type and Value before fs.existsSync...');
  console.log(`  Value of testPublicDir: ${testPublicDir}`);
  console.log(`  Type of testPublicDir: ${typeof testPublicDir}`);

  if (typeof testPublicDir !== 'string' || !testPublicDir) {
      // This error message is also different
      console.error('CRITICAL FAILURE: testPublicDir is invalid right before check!');
      process.exit(1);
  }

  console.log(`Step 4: Executing fs.existsSync("${testPublicDir}")...`);
  const directoryExists = fs.existsSync(testPublicDir);
  console.log(`  fs.existsSync returned: ${directoryExists}`);

  if (!directoryExists) {
    console.log('Step 5: Directory does NOT exist. Logging expected error message...');
    // This is the specific error message format from the original code
    console.error(`❌ Error: Public directory not found at ${testPublicDir}`);
    console.error('Please create a public/ or dist/ directory in your project root.');
    // We don't exit here in the test to see if the script finishes
  } else {
    console.log('Step 5: Directory EXISTS. Check passed.');
  }

} catch (error) {
  console.error('--- TEST SCRIPT ENCOUNTERED AN UNEXPECTED ERROR ---');
  console.error(error.stack || error); // Print the full error stack

  // Check if the error happened during public dir definition
  if (typeof testPublicDir !== 'string' || !testPublicDir) {
      console.error('\n--- Attempting to simulate original error message ---');
      console.error('❌ CLI Error: publicDir is not defined (Error occurred during definition)');
  }
}

console.log('--- Path Test Script Finished ---');
