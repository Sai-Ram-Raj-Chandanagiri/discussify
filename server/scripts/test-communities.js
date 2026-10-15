const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User, Community, Notification } = require('../models');
const app = require('../server');

dotenv.config();

async function testCommunityEndpoints() {
  console.log('=== TESTING USER STORY 3 COMMUNITY ENDPOINTS ===\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discussify');

  // Clean up test data
  const testEmail1 = 'creator.test@example.com';
  const testEmail2 = 'invited.test@example.com';
  await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
  await Community.deleteMany({ name: { $regex: /^Test Community/i } });

  const server = app.listen(5002);
  const baseUrl = 'http://localhost:5002/api';

  try {
    // 1. Register test creator
    const regRes1 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Creator Test',
        email: testEmail1,
        password: 'Password123!'
      })
    });
    const regData1 = await regRes1.json();
    const token1 = regData1.token;
    const user1 = regData1.user;

    // 2. Register second user to invite
    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invited Test',
        email: testEmail2,
        password: 'Password123!'
      })
    });
    const regData2 = await regRes2.json();
    const user2 = regData2.user;

    // 3. Create Community
    console.log('Test 1: Creating a new community...');
    const createRes = await fetch(`${baseUrl}/communities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        name: 'Test Community Alpha',
        description: 'A community for automated testing',
        isPrivate: false
      })
    });
    const createData = await createRes.json();
    console.log(`Status: ${createRes.status}`);
    console.log('Message:', createData.message);
    if (createRes.status !== 201 || !createData.community) {
      throw new Error(`Failed to create community: ${JSON.stringify(createData)}`);
    }
    const communityId = createData.community._id;
    const isCreatorInMembers = createData.community.members.some(
      (m) => (m._id || m).toString() === user1.id.toString()
    );
    if (!isCreatorInMembers) {
      throw new Error('Creator was not automatically added to community.members!');
    }
    console.log('✅ Test 1 Passed: Community created and creator is automatically in members.\n');

    // 4. Verification Item 1: Try creating a community with an existing name (case-insensitive)
    console.log('Test 2: Creating a community with an existing name (case-insensitive)...');
    const dupRes = await fetch(`${baseUrl}/communities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        name: 'test community alpha', // lowercase duplicate
        description: 'Attempting to duplicate name',
        isPrivate: true
      })
    });
    const dupData = await dupRes.json();
    console.log(`Status: ${dupRes.status}`);
    console.log('Message:', dupData.message);
    if (
      dupRes.status !== 409 ||
      dupData.message !== 'A community with this name already exists.'
    ) {
      throw new Error(
        `Duplicate community test failed! Expected 409 and "A community with this name already exists.", got ${dupRes.status}: ${JSON.stringify(dupData)}`
      );
    }
    console.log('✅ Test 2 Passed: Duplicate community name correctly rejected with 409 and exact expected message.\n');

    // 5. Verification Item 2: Invite a user who is ALREADY a member
    console.log('Test 3: Inviting a user who is already a member (the creator)...');
    const inviteMemberRes = await fetch(`${baseUrl}/communities/${communityId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        email: testEmail1 // already a member
      })
    });
    const inviteMemberData = await inviteMemberRes.json();
    console.log(`Status: ${inviteMemberRes.status}`);
    console.log('Message:', inviteMemberData.message);
    if (
      inviteMemberRes.status !== 400 ||
      inviteMemberData.message !== 'This user is already a member of the community.'
    ) {
      throw new Error(
        `Already-a-member invite test failed! Expected 400 and "This user is already a member of the community.", got ${inviteMemberRes.status}: ${JSON.stringify(inviteMemberData)}`
      );
    }
    console.log('✅ Test 3 Passed: Inviting an existing member correctly rejected with 400 and exact expected message.\n');

    // 6. Invite a new user successfully
    console.log('Test 4: Inviting a new user (user2)...');
    const inviteNewRes = await fetch(`${baseUrl}/communities/${communityId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        email: testEmail2
      })
    });
    const inviteNewData = await inviteNewRes.json();
    console.log(`Status: ${inviteNewRes.status}`);
    console.log('Message:', inviteNewData.message);
    if (inviteNewRes.status !== 200) {
      throw new Error(`Failed to invite new user: ${JSON.stringify(inviteNewData)}`);
    }
    console.log('✅ Test 4 Passed: Successfully invited new user.\n');

    // 7. Update community information
    console.log('Test 5: Updating community details...');
    const updateRes = await fetch(`${baseUrl}/communities/${communityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        description: 'Updated community description for testing',
        isPrivate: true
      })
    });
    const updateData = await updateRes.json();
    console.log(`Status: ${updateRes.status}`);
    console.log('Updated isPrivate:', updateData.community.isPrivate);
    if (updateRes.status !== 200 || updateData.community.isPrivate !== true) {
      throw new Error(`Failed to update community: ${JSON.stringify(updateData)}`);
    }
    console.log('✅ Test 5 Passed: Successfully updated community details.\n');

    console.log('🎉 ALL USER STORY 3 BACKEND TESTS PASSED 100%!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testCommunityEndpoints().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
