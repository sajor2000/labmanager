/**
 * Pre-deployment UI/UX Test Runner
 * 
 * This script runs all UI/UX tests before deployment to ensure 
 * all components are functioning correctly.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const mkdir = util.promisify(fs.mkdir);

// Configuration
const SERVER_START_COMMAND = 'npm';
const SERVER_START_ARGS = ['run', 'dev'];
const SERVER_URL = 'http://localhost:3000';
const SERVER_READY_REGEX = /ready in|compiled successfully/i;
const TEST_COMMAND = 'npx';
const TEST_ARGS = ['jest', '--config=jest.config.js', 'tests/ui'];
const REPORT_DIR = path.join(__dirname, 'reports');
const MAX_SERVER_START_TIME = 60000; // 60 seconds
const SERVER_CHECK_INTERVAL = 1000; // 1 second

/**
 * Create reports directory if it doesn't exist
 */
async function setupReportDirectory() {
  try {
    await mkdir(REPORT_DIR, { recursive: true });
    console.log(`Report directory created at ${REPORT_DIR}`);
  } catch (error) {
    console.error('Failed to create report directory:', error);
    process.exit(1);
  }
}

/**
 * Start the development server
 * @returns {Promise<ChildProcess>} The server process
 */
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting development server...');
    
    const serverProcess = spawn(SERVER_START_COMMAND, SERVER_START_ARGS, {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let serverStarted = false;
    const timeoutId = setTimeout(() => {
      if (!serverStarted) {
        serverProcess.kill();
        reject(new Error(`Server failed to start within ${MAX_SERVER_START_TIME / 1000} seconds`));
      }
    }, MAX_SERVER_START_TIME);
    
    serverProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
      
      if (SERVER_READY_REGEX.test(chunk) && !serverStarted) {
        serverStarted = true;
        clearTimeout(timeoutId);
        
        // Give it a moment to fully initialize
        setTimeout(() => {
          console.log('Server is ready!');
          resolve(serverProcess);
        }, 2000);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stderr.write(chunk);
    });
    
    serverProcess.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to start server: ${error.message}`));
    });
    
    serverProcess.on('exit', (code) => {
      if (!serverStarted) {
        clearTimeout(timeoutId);
        reject(new Error(`Server process exited with code ${code} before ready`));
      }
    });
  });
}

/**
 * Run the tests against the server
 * @returns {Promise<number>} The test exit code
 */
function runTests() {
  return new Promise((resolve, reject) => {
    console.log('\n🧪 Running UI/UX tests...');
    
    const testProcess = spawn(TEST_COMMAND, TEST_ARGS, {
      stdio: 'inherit',
      shell: true
    });
    
    testProcess.on('error', (error) => {
      reject(new Error(`Failed to run tests: ${error.message}`));
    });
    
    testProcess.on('exit', (code) => {
      resolve(code);
    });
  });
}

/**
 * Main function to run all tests
 */
async function main() {
  console.log('🚀 Starting UI/UX pre-deployment test runner');
  
  let serverProcess;
  let testsPassed = false;
  
  try {
    await setupReportDirectory();
    serverProcess = await startServer();
    
    // Wait for server to be fully ready
    console.log(`Waiting for server to be ready at ${SERVER_URL}...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run tests
    const testExitCode = await runTests();
    
    if (testExitCode === 0) {
      console.log('\n✅ All UI/UX tests passed! Ready for deployment.');
      testsPassed = true;
    } else {
      console.error(`\n❌ Tests failed with exit code ${testExitCode}`);
      console.error('Please fix the issues before deploying.');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Shutdown server
    if (serverProcess) {
      console.log('Shutting down development server...');
      serverProcess.kill();
    }
    
    if (testsPassed) {
      console.log('\n🎉 Pre-deployment UI/UX testing completed successfully!');
    }
  }
}

// Run the main function
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
