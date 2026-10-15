const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User } = require('../models');
const app = require('../server');

dotenv.config();

async function testAuthEndpoints() {
  console.log('=== TESTING USER STORY 1 AUTH ENDPOINTS ===\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discussify');
  
  // Clean up any test users
  const testEmail = 'alex.tester@example.com';
  await User.deleteMany({ email: testEmail });

  const server = app.listen(5001);
  const baseUrl = 'http://localhost:5001/api/auth';

  try {
    // Test 1: Register New User
    console.log('Test 1: Registering new user...');
    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Tester',
        email: testEmail,
        password: 'Password123!'
      })
    });
    const regData = await regRes.json();
    console.log(`Status: ${regRes.status}`);
    console.log('Response:', regData.message);
    if (regRes.status !== 201 || !regData.token) {
      throw new Error(`Register failed with status ${regRes.status}: ${JSON.stringify(regData)}`);
    }
    console.log('✅ Test 1 Passed: User registered successfully.\n');

    // Test 2: Register duplicate email -> Expect 409 Conflict with exact error message
    console.log('Test 2: Registering duplicate user with same email...');
    const dupRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Impostor',
        email: testEmail,
        password: 'AnotherPassword456!'
      })
    });
    const dupData = await dupRes.json();
    console.log(`Status: ${dupRes.status}`);
    console.log('Response:', dupData.message);
    if (dupRes.status !== 409 || dupData.message !== 'An account with this email address already exists.') {
      throw new Error(`Duplicate register test failed! Expected 409 and message "An account with this email address already exists.", got ${dupRes.status}: ${JSON.stringify(dupData)}`);
    }
    console.log('✅ Test 2 Passed: Duplicate registration failed with 409 and exact expected message.\n');

    // Test 3: Login with invalid password -> Expect 401 Unauthorized with exact message
    console.log('Test 3: Logging in with wrong password...');
    const wrongLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999'
      })
    });
    const wrongData = await wrongLoginRes.json();
    console.log(`Status: ${wrongLoginRes.status}`);
    console.log('Response:', wrongData.message);
    if (wrongLoginRes.status !== 401 || wrongData.message !== 'Invalid email or password.') {
      throw new Error(`Invalid password test failed! Expected 401 and "Invalid email or password.", got ${wrongLoginRes.status}: ${JSON.stringify(wrongData)}`);
    }
    console.log('✅ Test 3 Passed: Login with wrong password failed with 401 and exact expected message.\n');

    // Test 4: Login with valid credentials -> Expect 200, JWT token, user payload
    console.log('Test 4: Logging in with valid credentials...');
    const validLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    });
    const validData = await validLoginRes.json();
    console.log(`Status: ${validLoginRes.status}`);
    console.log('Response:', validData.message);
    if (validLoginRes.status !== 200 || !validData.token || validData.user.email !== testEmail) {
      throw new Error(`Valid login failed! Got ${validLoginRes.status}: ${JSON.stringify(validData)}`);
    }
    console.log('✅ Test 4 Passed: Logged in successfully with JWT and user payload.\n');

    // Test 5: Forgot Password
    console.log('Test 5: Requesting password reset...');
    const forgotRes = await fetch(`${baseUrl}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotData = await forgotRes.json();
    console.log(`Status: ${forgotRes.status}`);
    console.log('Response:', forgotData.message);
    if (forgotRes.status !== 200 || !forgotData.resetToken) {
      throw new Error(`Forgot password failed: ${JSON.stringify(forgotData)}`);
    }
    console.log('✅ Test 5 Passed: Password reset token generated.\n');

    // Test 6: Reset Password
    console.log('Test 6: Resetting password using token...');
    const resetRes = await fetch(`${baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: forgotData.resetToken,
        newPassword: 'NewSecurePassword888!'
      })
    });
    const resetData = await resetRes.json();
    console.log(`Status: ${resetRes.status}`);
    console.log('Response:', resetData.message);
    if (resetRes.status !== 200) {
      throw new Error(`Reset password failed: ${JSON.stringify(resetData)}`);
    }
    console.log('✅ Test 6 Passed: Password reset successfully.\n');

    // Test 7: Login with new password
    console.log('Test 7: Logging in with newly reset password...');
    const newLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'NewSecurePassword888!'
      })
    });
    const newLoginData = await newLoginRes.json();
    if (newLoginRes.status !== 200 || !newLoginData.token) {
      throw new Error(`Login with new password failed! ${JSON.stringify(newLoginData)}`);
    }
    console.log('✅ Test 7 Passed: Logged in with new password.\n');

    console.log('🎉 ALL BACKEND AUTH TESTS PASSED 100%!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testAuthEndpoints().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
