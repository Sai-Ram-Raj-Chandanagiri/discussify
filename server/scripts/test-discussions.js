const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User, Community, Discussion } = require('../models');
const app = require('../server');

dotenv.config();

async function testUserStory4() {
  console.log('=== TESTING USER STORY 4: COMMUNITIES & DISCUSSIONS ===\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discussify');

  const emailCreator = 'creator.us4@example.com';
  const emailInvited = 'invited.us4@example.com';
  const emailOutsider = 'outsider.us4@example.com';

  await User.deleteMany({ email: { $in: [emailCreator, emailInvited, emailOutsider] } });
  await Community.deleteMany({ name: { $regex: /^US4 /i } });

  const server = app.listen(5004);
  const baseUrl = 'http://localhost:5004/api';

  try {
    // 1. Register users
    const rCreator = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US4 Creator', email: emailCreator, password: 'Password123!' })
    })).json();

    const rInvited = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US4 Invited', email: emailInvited, password: 'Password123!' })
    })).json();

    const rOutsider = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US4 Outsider', email: emailOutsider, password: 'Password123!' })
    })).json();

    // 2. Create private community and public community
    const privComm = (await (await fetch(`${baseUrl}/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rCreator.token}` },
      body: JSON.stringify({ name: 'US4 Private Circle', description: 'Exclusive secret discussions', isPrivate: true })
    })).json()).community;

    const pubComm = (await (await fetch(`${baseUrl}/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rCreator.token}` },
      body: JSON.stringify({ name: 'US4 Public Agora', description: 'Open public discussions and ideas', isPrivate: false })
    })).json()).community;

    // 3. Test Keyword Search: GET /api/communities?search=Agora
    console.log('Test 1: Searching communities by keyword...');
    const searchRes = await fetch(`${baseUrl}/communities?search=Agora`);
    const searchData = await searchRes.json();
    console.log(`Status: ${searchRes.status}`);
    console.log('Search matches found:', searchData.count);
    if (searchRes.status !== 200 || !searchData.communities.some(c => c.name === 'US4 Public Agora')) {
      throw new Error(`Search failed: ${JSON.stringify(searchData)}`);
    }
    console.log('✅ Test 1 Passed: Keyword search returned matching communities.\n');

    // 4. Verification Item 1: Try joining a private community with an uninvited account
    console.log('Test 2: Attempting to join private community without invitation (outsider)...');
    const joinPrivRes = await fetch(`${baseUrl}/communities/${privComm._id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rOutsider.token}` }
    });
    const joinPrivData = await joinPrivRes.json();
    console.log(`Status: ${joinPrivRes.status}`);
    console.log('Message:', joinPrivData.message);
    if (
      joinPrivRes.status !== 403 ||
      joinPrivData.message !== 'You cannot join a private community without an invitation.'
    ) {
      throw new Error(
        `Negative criterion failed! Expected 403 and "You cannot join a private community without an invitation.", got ${joinPrivRes.status}: ${JSON.stringify(joinPrivData)}`
      );
    }
    console.log('✅ Test 2 Passed: Uninvited join to private community strictly blocked with 403 and exact message.\n');

    // 5. Invite user & then join private community
    console.log('Test 3: Inviting user and joining private community...');
    await fetch(`${baseUrl}/communities/${privComm._id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rCreator.token}` },
      body: JSON.stringify({ email: emailInvited })
    });
    const joinInvitedRes = await fetch(`${baseUrl}/communities/${privComm._id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rInvited.token}` }
    });
    const joinInvitedData = await joinInvitedRes.json();
    console.log(`Status: ${joinInvitedRes.status}`);
    if (joinInvitedRes.status !== 200) {
      throw new Error(`Invited join failed: ${JSON.stringify(joinInvitedData)}`);
    }
    console.log('✅ Test 3 Passed: Invited user successfully joined private community.\n');

    // 6. Verification Item 2: Try posting a discussion in a community you haven't joined
    console.log('Test 4: Attempting to post discussion without joining community (outsider)...');
    const postOutsiderRes = await fetch(`${baseUrl}/communities/${pubComm._id}/discussions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rOutsider.token}` },
      body: JSON.stringify({
        title: 'Unauthorized Post',
        content: 'I have not joined this community yet.'
      })
    });
    const postOutsiderData = await postOutsiderRes.json();
    console.log(`Status: ${postOutsiderRes.status}`);
    console.log('Message:', postOutsiderData.message);
    if (
      postOutsiderRes.status !== 403 ||
      postOutsiderData.message !== 'You must be a member of this community to participate in discussions.'
    ) {
      throw new Error(
        `Negative criterion failed! Expected 403 and "You must be a member of this community to participate in discussions.", got ${postOutsiderRes.status}: ${JSON.stringify(postOutsiderData)}`
      );
    }
    console.log('✅ Test 4 Passed: Non-member discussion creation strictly blocked with 403 and exact message.\n');

    // 7. Join public community and post discussion
    console.log('Test 5: Outsider joins public community and posts discussion...');
    const joinPubRes = await fetch(`${baseUrl}/communities/${pubComm._id}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rOutsider.token}` }
    });
    if (joinPubRes.status !== 200) {
      throw new Error('Failed to join public community');
    }

    const postDiscussionRes = await fetch(`${baseUrl}/communities/${pubComm._id}/discussions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rOutsider.token}` },
      body: JSON.stringify({
        title: 'Welcome to Discussify Agora',
        content: 'Let us discuss scalable MERN stack patterns.'
      })
    });
    const postDiscussionData = await postDiscussionRes.json();
    console.log(`Status: ${postDiscussionRes.status}`);
    console.log('Discussion ID:', postDiscussionData.discussion?._id);
    if (postDiscussionRes.status !== 201 || !postDiscussionData.discussion) {
      throw new Error(`Failed to post discussion: ${JSON.stringify(postDiscussionData)}`);
    }
    const discussionId = postDiscussionData.discussion._id;
    console.log('✅ Test 5 Passed: Successfully created discussion as a member.\n');

    // 8. Reply to discussion
    console.log('Test 6: Replying to discussion as community creator/member...');
    const replyRes = await fetch(`${baseUrl}/discussions/${discussionId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rCreator.token}` },
      body: JSON.stringify({
        content: 'Great discussion topic! Fully agreed.'
      })
    });
    const replyData = await replyRes.json();
    console.log(`Status: ${replyRes.status}`);
    console.log('Replies count:', replyData.discussion?.replies?.length);
    if (replyRes.status !== 201 || replyData.discussion?.replies?.length !== 1) {
      throw new Error(`Failed to reply to discussion: ${JSON.stringify(replyData)}`);
    }
    console.log('✅ Test 6 Passed: Successfully posted reply to discussion.\n');

    // 9. Leave community
    console.log('Test 7: Leaving community...');
    const leaveRes = await fetch(`${baseUrl}/communities/${pubComm._id}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rOutsider.token}` }
    });
    const leaveData = await leaveRes.json();
    console.log(`Status: ${leaveRes.status}`);
    console.log('Message:', leaveData.message);
    if (leaveRes.status !== 200) {
      throw new Error(`Failed to leave community: ${JSON.stringify(leaveData)}`);
    }
    console.log('✅ Test 7 Passed: Successfully left community.\n');

    console.log('🎉 ALL USER STORY 4 BACKEND TESTS PASSED 100%!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testUserStory4().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
