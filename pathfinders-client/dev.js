#!/usr/bin/env node
/**
 * Development script to start the Next.js frontend
 * with the appropriate environment variables
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

// Print banner
console.log(`
${colors.bright}${colors.cyan}====================================${colors.reset}
${colors.bright}${colors.green}  PATHFINDERS CLIENT - DEV SERVER  ${colors.reset}
${colors.bright}${colors.cyan}====================================${colors.reset}
`);

// Check for .env.development file
const envPath = path.join(__dirname, '.env.development');
if (!fs.existsSync(envPath)) {
  console.log(`${colors.yellow}Warning: .env.development file not found. Using default configuration.${colors.reset}`);
}

// Check if backend server is accessible
try {
  console.log(`${colors.cyan}Checking if backend server is running...${colors.reset}`);
  // Use a simple HTTP request to check if backend is up
  // This is just a check, not a dependency for starting the frontend
  const http = require('http');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  
  const req = http.get(backendUrl, (res) => {
    if (res.statusCode === 200) {
      console.log(`${colors.green}✓ Backend server is running at ${backendUrl}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}! Backend server returned status ${res.statusCode}${colors.reset}`);
    }
  });
  
  req.on('error', () => {
    console.log(`${colors.yellow}! Backend server not reachable at ${backendUrl}${colors.reset}`);
    console.log(`${colors.yellow}  Make sure to start the Django server with: python manage_local.py runserver${colors.reset}`);
  });
  
  req.end();
} catch (error) {
  console.log(`${colors.yellow}! Error checking backend server: ${error.message}${colors.reset}`);
}

// Start the Next.js dev server
console.log(`${colors.cyan}Starting Next.js development server...${colors.reset}`);
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error(`${colors.yellow}Error starting development server: ${error.message}${colors.reset}`);
  process.exit(1);
} 