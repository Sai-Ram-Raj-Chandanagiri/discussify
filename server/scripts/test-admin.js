const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User, Community, Discussion, Resource, Notification } = require('../models');
const app = require('../server');

dotenv.config();

async function testUserStory6() {
  console.log('=== TESTING USER STORY 6: ADMIN MANAGEMENT & RESTRICTIONS ===\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discussify');

  const emailAdmin = 'admin.us6@example.com';
  const emailUser = 'regular.us6@example.com';

  await User.deleteMany({ email: { $in: [emailAdmin, emailUser] } });
  await Community.deleteMany({ name: { $regex: /^US6 /i } });

  const server = app.listen(5006);
  const baseUrl = 'http://localhost:5006/api';

  try {
    // 1. Register users
    console.log('1. Registering test admin and regular user...');
    const rAdmin = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US6 Admin', email: emailAdmin, password: 'Password123!' })
    })).json();

    const rUser = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US6 Regular User', email: emailUser, password: 'Password123!' })
    })).json();

    // Promote rAdmin user to 'admin' role in DB
    await User.findByIdAndUpdate(rAdmin.user.id, { role: 'admin' });
    // Re-login to get updated token with admin role
    const adminLoginRes = await (await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailAdmin, password: 'Password123!' })
    })).json();
    const adminToken = adminLoginRes.token;

    console.log('✅ Registered and promoted admin user.');

    // 2. Test requireAdmin middleware: Regular user cannot access /api/admin
    console.log('\n2. Testing requireAdmin middleware protection...');
    const forbiddenRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${rUser.token}` }
    });
    const forbiddenData = await forbiddenRes.json();
    console.log(`Regular user access status: ${forbiddenRes.status}, message: "${forbiddenData.message}"`);
    if (forbiddenRes.status !== 403 || !forbiddenData.message.includes('Administrator privileges required')) {
      throw new Error(`Expected 403 for non-admin, got ${forbiddenRes.status}: "${forbiddenData.message}"`);
    }
    console.log('✅ Non-admin access properly blocked with 403.');

    // 3. Admin lists all users & communities
    console.log('\n3. Admin lists users and communities...');
    const usersRes = await (await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })).json();
    console.log(`Total users found: ${usersRes.count}`);
    if (usersRes.count < 2) {
      throw new Error('Admin should see at least 2 users.');
    }
    console.log('✅ Admin successfully retrieved all users.');

    // 4. Create test communities
    console.log('\n4. Creating test communities...');
    const comm1 = (await (await fetch(`${baseUrl}/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'US6 Active Comm', description: 'Community with active discussions', isPrivate: false })
    })).json()).community;

    const comm2 = (await (await fetch(`${baseUrl}/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'US6 Empty Comm', description: 'Community without active discussions', isPrivate: false })
    })).json()).community;

    // Regular user joins both communities
    await fetch(`${baseUrl}/communities/${comm1._id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rUser.token}` }
    });
    await fetch(`${baseUrl}/communities/${comm2._id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rUser.token}` }
    });

    const commListRes = await (await fetch(`${baseUrl}/admin/communities`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })).json();
    console.log(`Total communities found: ${commListRes.count}`);
    if (commListRes.count < 2) {
      throw new Error('Admin should see at least 2 communities.');
    }
    console.log('✅ Admin successfully retrieved all communities.');

    // 5. Test Strict Negative Criterion 1: Admin cannot edit user email
    console.log('\n5. Testing Strict Negative Criterion 1: Admin attempting to edit user email...');
    const editEmailRes = await fetch(`${baseUrl}/admin/users/${rUser.user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'US6 New Name', email: 'hacked.email@example.com' })
    });
    const editEmailData = await editEmailRes.json();
    console.log(`Status: ${editEmailRes.status}, Message: "${editEmailData.message}"`);
    const expectedEmailMsg = "Admins are not permitted to edit a user's email address.";
    if (editEmailRes.status !== 400 || editEmailData.message !== expectedEmailMsg) {
      throw new Error(`Expected 400 with "${expectedEmailMsg}", got ${editEmailRes.status}: "${editEmailData.message}"`);
    }
    console.log('✅ Strict Negative Criterion 1 PASSED: Admin cannot edit user email.');

    // 6. Admin successfully updates user details (name, bio, role)
    console.log('\n6. Admin updates user details (name, bio, role)...');
    const updateRes = await fetch(`${baseUrl}/admin/users/${rUser.user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'US6 Regular Updated', bio: 'Updated by administrator.', role: 'user' })
    });
    const updateData = await updateRes.json();
    if (updateRes.status !== 200 || updateData.user?.name !== 'US6 Regular Updated') {
      throw new Error(`Failed to update user: ${JSON.stringify(updateData)}`);
    }
    console.log('✅ Admin successfully updated user details.');

    // 7. Admin edits community information
    console.log('\n7. Admin updates community information...');
    const updateCommRes = await fetch(`${baseUrl}/admin/communities/${comm2._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'US6 Empty Comm Renamed', description: 'Updated description', isPrivate: true })
    });
    const updateCommData = await updateCommRes.json();
    if (updateCommRes.status !== 200 || updateCommData.community?.name !== 'US6 Empty Comm Renamed') {
      throw new Error(`Failed to update community: ${JSON.stringify(updateCommData)}`);
    }
    console.log('✅ Admin successfully updated community information.');

    // 8. Add an active discussion to comm1
    console.log('\n8. Creating active discussion in US6 Active Comm...');
    const discRes = await fetch(`${baseUrl}/communities/${comm1._id}/discussions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: 'Active Discussion 1', content: 'Testing active discussions rule' })
    });
    if (discRes.status !== 201) {
      throw new Error('Failed to create discussion.');
    }
    console.log('✅ Created active discussion in comm1.');

    // 9. Test Strict Negative Criterion 2: Cannot delete community with active discussions
    console.log('\n9. Testing Strict Negative Criterion 2: Deleting community with active discussions...');
    const delActiveCommRes = await fetch(`${baseUrl}/admin/communities/${comm1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const delActiveCommData = await delActiveCommRes.json();
    console.log(`Status: ${delActiveCommRes.status}, Message: "${delActiveCommData.message}"`);
    const expectedDiscMsg = 'Cannot delete a community that has active discussions.';
    if (delActiveCommRes.status !== 400 || delActiveCommData.message !== expectedDiscMsg) {
      throw new Error(`Expected 400 with "${expectedDiscMsg}", got ${delActiveCommRes.status}: "${delActiveCommData.message}"`);
    }
    console.log('✅ Strict Negative Criterion 2 PASSED: Deleting community with active discussions blocked with 400 and exact message.');

    // 10. Admin deletes community without active discussions
    console.log('\n10. Deleting community without active discussions (comm2)...');
    const delEmptyCommRes = await fetch(`${baseUrl}/admin/communities/${comm2._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (delEmptyCommRes.status !== 200) {
      throw new Error(`Failed to delete empty community: ${delEmptyCommRes.status}`);
    }
    console.log('✅ Admin successfully deleted empty community.');

    // 11. Admin deletes user and verify removal from community memberships
    console.log('\n11. Admin deletes user and verifies membership removal...');
    // Verify user is in comm1 members before deletion
    const comm1Before = await Community.findById(comm1._id);
    const wasMember = comm1Before.members.some((m) => m.toString() === rUser.user.id);
    if (!wasMember) {
      throw new Error('User should have been a member of comm1.');
    }

    const delUserRes = await fetch(`${baseUrl}/admin/users/${rUser.user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (delUserRes.status !== 200) {
      throw new Error(`Failed to delete user: ${delUserRes.status}`);
    }

    // Verify user is removed from comm1 members
    const comm1After = await Community.findById(comm1._id);
    const isStillMember = comm1After.members.some((m) => m.toString() === rUser.user.id);
    if (isStillMember) {
      throw new Error('User was not removed from community memberships upon deletion!');
    }
    console.log('✅ User deleted and successfully removed from community memberships.');

    console.log('\n🎉 ALL USER STORY 6 BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testUserStory6()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  });
