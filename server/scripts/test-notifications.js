const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User, Community, Discussion, Resource, Notification } = require('../models');
const app = require('../server');

dotenv.config();

async function testUserStory7() {
  console.log('=== TESTING USER STORY 7: NOTIFICATIONS & SETTINGS ===\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discussify');

  const emailAuthor = 'author.us7@example.com';
  const emailMemberA = 'memberA.us7@example.com';
  const emailMemberB = 'memberB.us7@example.com';

  await User.deleteMany({ email: { $in: [emailAuthor, emailMemberA, emailMemberB] } });
  await Community.deleteMany({ name: { $regex: /^US7 /i } });
  await Notification.deleteMany({});

  const server = app.listen(5007);
  const baseUrl = 'http://localhost:5007/api';

  try {
    // 1. Register users
    console.log('1. Registering test users...');
    const rAuthor = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US7 Author', email: emailAuthor, password: 'Password123!' })
    })).json();

    const rMemberA = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US7 Member A', email: emailMemberA, password: 'Password123!' })
    })).json();

    const rMemberB = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US7 Member B', email: emailMemberB, password: 'Password123!' })
    })).json();

    console.log('✅ Users registered successfully.');

    // 2. Verify default notificationSettings
    console.log('\n2. Verifying default notificationSettings...');
    const profA = await (await fetch(`${baseUrl}/users/profile`, {
      headers: { Authorization: `Bearer ${rMemberA.token}` }
    })).json();

    if (profA.user.notificationSettings?.newDiscussions !== true || profA.user.notificationSettings?.newResources !== true) {
      throw new Error(`Default notificationSettings should both be true: ${JSON.stringify(profA.user.notificationSettings)}`);
    }
    console.log('✅ Default settings are both enabled: { newDiscussions: true, newResources: true }');

    // 3. Test Strict Negative Criterion 2: Block turning off all notifications
    console.log('\n3. Testing Strict Negative Criterion 2: Attempting to disable both notification types simultaneously...');
    const blockBothRes = await fetch(`${baseUrl}/users/notification-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rMemberA.token}` },
      body: JSON.stringify({ newDiscussions: false, newResources: false })
    });
    const blockBothData = await blockBothRes.json();
    console.log(`Status: ${blockBothRes.status}, Message: "${blockBothData.message}"`);

    const expectedBlockMsg = 'You cannot turn off all notifications. At least one notification type must remain enabled.';
    if (blockBothRes.status !== 400 || blockBothData.message !== expectedBlockMsg) {
      throw new Error(`Expected 400 with "${expectedBlockMsg}", got ${blockBothRes.status}: "${blockBothData.message}"`);
    }
    console.log('✅ Strict Negative Criterion 2 PASSED: 400 returned with exact message.');

    // 4. Update Member A: newDiscussions = true, newResources = false
    console.log('\n4. Updating Member A preferences: { newDiscussions: true, newResources: false }...');
    const updateARes = await fetch(`${baseUrl}/users/notification-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rMemberA.token}` },
      body: JSON.stringify({ newDiscussions: true, newResources: false })
    });
    const updateAData = await updateARes.json();
    if (updateARes.status !== 200 || updateAData.notificationSettings?.newResources !== false) {
      throw new Error(`Failed to update Member A notification settings: ${JSON.stringify(updateAData)}`);
    }
    console.log('✅ Member A settings updated to: { newDiscussions: true, newResources: false }');

    // Also test: with newResources now false, attempting to turn off newDiscussions alone should be blocked
    console.log('Testing turning off second notification type when one is already disabled...');
    const blockSecondRes = await fetch(`${baseUrl}/users/notification-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rMemberA.token}` },
      body: JSON.stringify({ newDiscussions: false })
    });
    const blockSecondData = await blockSecondRes.json();
    if (blockSecondRes.status !== 400 || blockSecondData.message !== expectedBlockMsg) {
      throw new Error(`Expected 400 with "${expectedBlockMsg}", got ${blockSecondRes.status}: "${blockSecondData.message}"`);
    }
    console.log('✅ Correctly blocked turning off last remaining enabled notification type.');

    // 5. Update Member B: newDiscussions = false, newResources = true
    console.log('\n5. Updating Member B preferences: { newDiscussions: false, newResources: true }...');
    const updateBRes = await fetch(`${baseUrl}/users/notification-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rMemberB.token}` },
      body: JSON.stringify({ newDiscussions: false, newResources: true })
    });
    const updateBData = await updateBRes.json();
    if (updateBRes.status !== 200 || updateBData.notificationSettings?.newDiscussions !== false) {
      throw new Error(`Failed to update Member B settings: ${JSON.stringify(updateBData)}`);
    }
    console.log('✅ Member B settings updated to: { newDiscussions: false, newResources: true }');

    // 6. Create community and have Member A and Member B join
    console.log('\n6. Creating community and joining members...');
    const commData = (await (await fetch(`${baseUrl}/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rAuthor.token}` },
      body: JSON.stringify({ name: 'US7 Tech Community', description: 'Testing notifications', isPrivate: false })
    })).json()).community;

    const commId = commData._id;

    await fetch(`${baseUrl}/communities/${commId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rMemberA.token}` }
    });
    await fetch(`${baseUrl}/communities/${commId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rMemberB.token}` }
    });
    console.log('✅ Member A and Member B joined US7 Tech Community.');

    // 7. Author creates a Discussion:
    // Member A has newDiscussions: true -> MUST receive notification
    // Member B has newDiscussions: false -> MUST NOT receive notification
    // Author -> MUST NOT receive notification
    console.log('\n7. Author creates a Discussion: testing dispatch based on notificationSettings...');
    const discRes = await fetch(`${baseUrl}/communities/${commId}/discussions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rAuthor.token}` },
      body: JSON.stringify({ title: 'React 19 Hooks Discussion', content: 'What are your thoughts?' })
    });
    const discData = await discRes.json();
    if (discRes.status !== 201) {
      throw new Error(`Failed to create discussion: ${JSON.stringify(discData)}`);
    }

    // Check Member A notifications
    const notifsA = await (await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${rMemberA.token}` }
    })).json();
    console.log(`Member A notification count: ${notifsA.count}`);
    const foundDiscNotifA = notifsA.notifications.some((n) => n.type === 'discussion' && n.message.includes('React 19 Hooks Discussion'));
    if (!foundDiscNotifA) {
      throw new Error(`Member A should have received discussion notification, but did not: ${JSON.stringify(notifsA)}`);
    }
    console.log('✅ Member A (newDiscussions: true) received discussion notification.');

    // Check Member B notifications
    const notifsB = await (await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${rMemberB.token}` }
    })).json();
    console.log(`Member B notification count: ${notifsB.count}`);
    const foundDiscNotifB = notifsB.notifications.some((n) => n.type === 'discussion' && n.message.includes('React 19 Hooks Discussion'));
    if (foundDiscNotifB) {
      throw new Error('Member B has newDiscussions: false, but received discussion notification!');
    }
    console.log('✅ Member B (newDiscussions: false) did NOT receive discussion notification.');

    // Check Author notifications
    const notifsAuthor = await (await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${rAuthor.token}` }
    })).json();
    const foundDiscNotifAuthor = notifsAuthor.notifications.some((n) => n.message.includes('React 19 Hooks Discussion'));
    if (foundDiscNotifAuthor) {
      throw new Error('Author should NOT receive notification for their own discussion!');
    }
    console.log('✅ Author excluded from receiving self-notification.');

    // 8. Author creates a Resource:
    // Member A has newResources: false -> MUST NOT receive notification
    // Member B has newResources: true -> MUST receive notification
    console.log('\n8. Author shares a Resource: testing dispatch based on notificationSettings...');
    const resRes = await fetch(`${baseUrl}/communities/${commId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rAuthor.token}` },
      body: JSON.stringify({
        title: 'React 19 Official Documentation',
        type: 'article',
        urlOrFilePath: 'https://react.dev'
      })
    });
    const resData = await resRes.json();
    if (resRes.status !== 201) {
      throw new Error(`Failed to create resource: ${JSON.stringify(resData)}`);
    }

    // Check Member B notifications
    const notifsBAfterRes = await (await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${rMemberB.token}` }
    })).json();
    const foundResNotifB = notifsBAfterRes.notifications.some((n) => n.type === 'resource' && n.message.includes('React 19 Official Documentation'));
    if (!foundResNotifB) {
      throw new Error(`Member B should have received resource notification, but did not: ${JSON.stringify(notifsBAfterRes)}`);
    }
    console.log('✅ Member B (newResources: true) received resource notification.');

    // Check Member A notifications
    const notifsAAfterRes = await (await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${rMemberA.token}` }
    })).json();
    const foundResNotifA = notifsAAfterRes.notifications.some((n) => n.type === 'resource' && n.message.includes('React 19 Official Documentation'));
    if (foundResNotifA) {
      throw new Error('Member A has newResources: false, but received resource notification!');
    }
    console.log('✅ Member A (newResources: false) did NOT receive resource notification.');

    // 9. Test Strict Negative Criterion 1: Member leaves community
    // - Unread notifications for that community are cleared
    // - Further notifications in that community are NOT sent to left user
    console.log('\n9. Testing Strict Negative Criterion 1: User leaves community...');
    // Member B currently has 1 unread notification from the resource
    console.log(`Member B notifications before leaving: ${notifsBAfterRes.count}`);
    if (notifsBAfterRes.count === 0) {
      throw new Error('Member B should have at least 1 notification before leaving.');
    }

    // Member B leaves the community
    const leaveRes = await fetch(`${baseUrl}/communities/${commId}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rMemberB.token}` }
    });
    if (leaveRes.status !== 200) {
      throw new Error(`Failed to leave community: ${leaveRes.status}`);
    }
    console.log('Member B left the community.');

    // Verify unread notifications for that community are cleared
    const notifsBAfterLeave = await (await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${rMemberB.token}` }
    })).json();
    console.log(`Member B notifications after leaving: ${notifsBAfterLeave.count}`);
    if (notifsBAfterLeave.count !== 0) {
      throw new Error(`Expected notifications for left community to be cleared, but found ${notifsBAfterLeave.count}`);
    }
    console.log('✅ Unread notifications for left community were cleared upon leaving.');

    // Now Author shares another resource in that community
    console.log('Author creates another resource in US7 community...');
    await fetch(`${baseUrl}/communities/${commId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rAuthor.token}` },
      body: JSON.stringify({
        title: 'Second Resource After Leave',
        type: 'article',
        urlOrFilePath: 'https://example.com/guide'
      })
    });

    // Verify Member B did NOT receive the notification
    const notifsBFinal = await (await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${rMemberB.token}` }
    })).json();
    if (notifsBFinal.count !== 0) {
      throw new Error(`Member B should not receive notifications for communities they left, but has ${notifsBFinal.count}`);
    }
    console.log('✅ Strict Negative Criterion 1 PASSED: User never receives notifications for communities they have left.');

    // 10. Test Notification endpoints: mark read & mark all read
    console.log('\n10. Testing Notification endpoints (mark as read)...');
    const notifToRead = notifsAAfterRes.notifications[0];
    const markReadRes = await fetch(`${baseUrl}/notifications/${notifToRead._id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${rMemberA.token}` }
    });
    const markReadData = await markReadRes.json();
    if (markReadRes.status !== 200 || !markReadData.notification?.isRead) {
      throw new Error(`Failed to mark notification as read: ${JSON.stringify(markReadData)}`);
    }
    console.log('✅ Marked single notification as read.');

    const markAllRes = await fetch(`${baseUrl}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${rMemberA.token}` }
    });
    if (markAllRes.status !== 200) {
      throw new Error(`Failed to mark all as read: ${markAllRes.status}`);
    }
    console.log('✅ Marked all notifications as read.');

    console.log('\n🎉 ALL USER STORY 7 BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testUserStory7()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  });
