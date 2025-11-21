#!/usr/bin/env node

/**
 * Script de prueba para el Auth Service
 * Ejecutar: node test-auth.js
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

let accessToken = '';
let sessionToken = '';
let userId = 0;

// Generar username único
const timestamp = Date.now();
const testUser = {
  username: `testuser_${timestamp}`,
  email: `test_${timestamp}@example.com`,
  password: 'Test123456'
};

async function testHealthCheck() {
  log.info('Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/auth/health`);
    log.success(`Health check: ${response.data.status}`);
    return true;
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testRegister() {
  log.info('Testing user registration...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    userId = response.data.user.id;
    log.success(`User registered: ${response.data.user.username} (ID: ${userId})`);
    console.log('   User:', JSON.stringify(response.data.user, null, 2));
    return true;
  } catch (error) {
    log.error(`Registration failed: ${error.response?.data?.error || error.message}`);
    if (error.response?.data?.details) {
      console.log('   Details:', error.response.data.details);
    }
    return false;
  }
}

async function testDuplicateRegister() {
  log.info('Testing duplicate registration (should fail)...');
  try {
    await axios.post(`${BASE_URL}/auth/register`, testUser);
    log.error('Duplicate registration should have failed!');
    return false;
  } catch (error) {
    if (error.response?.status === 409) {
      log.success('Duplicate registration correctly rejected');
      return true;
    }
    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  log.info('Testing user login...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });
    
    accessToken = response.data.accessToken;
    sessionToken = response.data.sessionToken;
    
    log.success('Login successful');
    console.log('   Access Token:', accessToken.substring(0, 50) + '...');
    console.log('   Session Token:', sessionToken.substring(0, 50) + '...');
    console.log('   Expires At:', response.data.expiresAt);
    return true;
  } catch (error) {
    log.error(`Login failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testInvalidLogin() {
  log.info('Testing invalid login (should fail)...');
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: 'wrongpassword'
    });
    log.error('Invalid login should have failed!');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log.success('Invalid login correctly rejected');
      return true;
    }
    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

async function testValidate() {
  log.info('Testing token validation...');
  try {
    const response = await axios.get(`${BASE_URL}/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Session-Token': sessionToken
      }
    });
    
    log.success('Token validation successful');
    console.log('   Valid:', response.data.valid);
    console.log('   User:', response.data.user.username);
    return true;
  } catch (error) {
    log.error(`Token validation failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testGetCurrentUser() {
  log.info('Testing get current user...');
  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Session-Token': sessionToken
      }
    });
    
    log.success('Get current user successful');
    console.log('   User:', JSON.stringify(response.data.user, null, 2));
    return true;
  } catch (error) {
    log.error(`Get current user failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  log.info('Testing unauthorized access (should fail)...');
  try {
    await axios.get(`${BASE_URL}/auth/me`);
    log.error('Unauthorized access should have failed!');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log.success('Unauthorized access correctly rejected');
      return true;
    }
    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

async function testLogout() {
  log.info('Testing user logout...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Session-Token': sessionToken
      }
    });
    
    log.success('Logout successful');
    console.log('   Message:', response.data.message);
    return true;
  } catch (error) {
    log.error(`Logout failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testAccessAfterLogout() {
  log.info('Testing access after logout (should fail)...');
  try {
    await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Session-Token': sessionToken
      }
    });
    log.error('Access after logout should have failed!');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log.success('Access after logout correctly rejected');
      return true;
    }
    log.error(`Unexpected error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n==============================================');
  console.log('  AUTH SERVICE TEST SUITE');
  console.log('==============================================\n');
  console.log(`Testing: ${BASE_URL}\n`);

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testRegister },
    { name: 'Duplicate Registration', fn: testDuplicateRegister },
    { name: 'User Login', fn: testLogin },
    { name: 'Invalid Login', fn: testInvalidLogin },
    { name: 'Token Validation', fn: testValidate },
    { name: 'Get Current User', fn: testGetCurrentUser },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'User Logout', fn: testLogout },
    { name: 'Access After Logout', fn: testAccessAfterLogout }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa entre tests
  }

  console.log('\n==============================================');
  console.log('  TEST RESULTS');
  console.log('==============================================');
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}`);
  console.log('==============================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Ejecutar tests
runTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
