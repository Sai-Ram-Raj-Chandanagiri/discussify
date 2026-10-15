const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User } = require('../models');
const app = require('../server');

dotenv.config();

async function testProfileEndpoints() {
  console.log('=== TESTING USER STORY 2 PROFILE ENDPOINTS ===\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discussify');

  const testEmail = 'profile.tester@example.com';
  await User.deleteMany({ email: testEmail });

  const server = app.listen(5003);
  const baseUrl = 'http://localhost:5003/api';

  try {
    // 1. Register test user
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Profile Tester',
        email: testEmail,
        password: 'Password123!'
      })
    });
    const regData = await regRes.json();
    const token = regData.token;

    // 2. Test GET /api/users/profile
    console.log('Test 1: Fetching profile details (GET /profile)...');
    const getRes = await fetch(`${baseUrl}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    console.log(`Status: ${getRes.status}`);
    console.log('Email in response:', getData.user?.email);
    console.log('Activity log count:', getData.user?.activityLog?.length);
    if (getRes.status !== 200 || getData.user?.email !== testEmail || !Array.isArray(getData.user?.activityLog)) {
      throw new Error(`Failed to get profile: ${JSON.stringify(getData)}`);
    }
    console.log('✅ Test 1 Passed: Retrieved profile and activity log.\n');

    // 3. Verification Item: Attempt to modify email -> Must fail with exact message
    console.log('Test 2: Attempting to modify email address via PUT /profile...');
    const emailTamperRes = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Profile Tester Modified',
        email: 'hacked.email@example.com' // Different email
      })
    });
    const emailTamperData = await emailTamperRes.json();
    console.log(`Status: ${emailTamperRes.status}`);
    console.log('Message:', emailTamperData.message);
    if (
      emailTamperRes.status !== 400 ||
      emailTamperData.message !== 'Email address cannot be edited.'
    ) {
      throw new Error(
        `Email immutability test failed! Expected 400 and "Email address cannot be edited.", got ${emailTamperRes.status}: ${JSON.stringify(emailTamperData)}`
      );
    }
    console.log('✅ Test 2 Passed: Email modification strictly blocked with 400 and exact expected message.\n');

    // 4. Verification Item: Attempt to upload file larger than 2MB limit -> Must fail with exact message
    console.log('Test 3: Attempting to upload image exceeding 2MB limit (2.5MB)...');
    const largeBuffer = Buffer.alloc(2.5 * 1024 * 1024); // 2.5 MB dummy image
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Construct multipart form-data body
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="profilePicture"; filename="huge.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const multipartBody = Buffer.concat([
      Buffer.from(header, 'utf-8'),
      largeBuffer,
      Buffer.from(footer, 'utf-8')
    ]);

    const largeUploadRes = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${token}`
      },
      body: multipartBody
    });
    const largeUploadData = await largeUploadRes.json();
    console.log(`Status: ${largeUploadRes.status}`);
    console.log('Message:', largeUploadData.message);
    if (
      largeUploadRes.status !== 400 ||
      largeUploadData.message !== 'Profile picture exceeds the maximum size limit of 2MB.'
    ) {
      throw new Error(
        `Oversized upload test failed! Expected 400 and "Profile picture exceeds the maximum size limit of 2MB.", got ${largeUploadRes.status}: ${JSON.stringify(largeUploadData)}`
      );
    }
    console.log('✅ Test 3 Passed: Oversized image strictly blocked with 400 and exact expected message.\n');

    // 5. Test updating name, bio, and valid profile image (<2MB)
    console.log('Test 4: Updating name, bio, and valid profile image (50KB)...');
    const validImageBuffer = Buffer.alloc(50 * 1024); // 50 KB dummy image
    const validBoundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    let validMultipart = Buffer.concat([
      Buffer.from(`--${validBoundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nAlex Updated\r\n`, 'utf-8'),
      Buffer.from(`--${validBoundary}\r\nContent-Disposition: form-data; name="bio"\r\n\r\nFull-stack engineer passionate about open source.\r\n`, 'utf-8'),
      Buffer.from(`--${validBoundary}\r\nContent-Disposition: form-data; name="profilePicture"; filename="avatar.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`, 'utf-8'),
      validImageBuffer,
      Buffer.from(`\r\n--${validBoundary}--\r\n`, 'utf-8')
    ]);

    const updateRes = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${validBoundary}`,
        Authorization: `Bearer ${token}`
      },
      body: validMultipart
    });
    const updateData = await updateRes.json();
    console.log(`Status: ${updateRes.status}`);
    console.log('Updated Name:', updateData.user?.name);
    console.log('Updated Bio:', updateData.user?.bio);
    console.log('Profile Picture URL:', updateData.user?.profilePictureUrl);
    if (
      updateRes.status !== 200 ||
      updateData.user?.name !== 'Alex Updated' ||
      updateData.user?.bio !== 'Full-stack engineer passionate about open source.' ||
      !updateData.user?.profilePictureUrl
    ) {
      throw new Error(`Profile update failed: ${JSON.stringify(updateData)}`);
    }
    console.log('✅ Test 4 Passed: Profile details and avatar updated successfully.\n');

    console.log('🎉 ALL USER STORY 2 BACKEND TESTS PASSED 100%!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testProfileEndpoints().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
