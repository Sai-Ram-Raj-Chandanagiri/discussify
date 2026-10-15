const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { User, Community, Resource } = require('../models');
const app = require('../server');

dotenv.config();

async function testUserStory5() {
  console.log('=== TESTING USER STORY 5: RESOURCE SHARING & MODERATION ===\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/discussify');

  const emailMember = 'member.us5@example.com';
  const emailOutsider = 'outsider.us5@example.com';

  await User.deleteMany({ email: { $in: [emailMember, emailOutsider] } });
  await Community.deleteMany({ name: { $regex: /^US5 /i } });

  const server = app.listen(5005);
  const baseUrl = 'http://localhost:5005/api';

  try {
    // 1. Register users
    const rMember = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US5 Member', email: emailMember, password: 'Password123!' })
    })).json();

    const rOutsider = await (await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'US5 Outsider', email: emailOutsider, password: 'Password123!' })
    })).json();

    // 2. Create community with rMember as creator/member
    const comm = (await (await fetch(`${baseUrl}/communities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rMember.token}` },
      body: JSON.stringify({ name: 'US5 Resource Hub', description: 'Sharing articles and videos', isPrivate: false })
    })).json()).community;

    const communityId = comm._id;

    // 3. Test sharing valid article link
    console.log('Test 1: Sharing a valid article resource link...');
    const shareRes = await fetch(`${baseUrl}/communities/${communityId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rMember.token}` },
      body: JSON.stringify({
        title: 'MERN Stack Architectural Guide',
        type: 'article',
        urlOrFilePath: 'https://react.dev/learn'
      })
    });
    const shareData = await shareRes.json();
    console.log(`Status: ${shareRes.status}`);
    console.log('Resource Title:', shareData.resource?.title);
    if (shareRes.status !== 201 || !shareData.resource) {
      throw new Error(`Failed to share article: ${JSON.stringify(shareData)}`);
    }
    console.log('✅ Test 1 Passed: Article resource shared successfully.\n');

    // 4. Test GET /api/communities/:id/resources
    console.log('Test 2: Listing shared resources in the community...');
    const listRes = await fetch(`${baseUrl}/communities/${communityId}/resources`);
    const listData = await listRes.json();
    console.log(`Status: ${listRes.status}`);
    console.log('Resource count:', listData.count);
    if (listRes.status !== 200 || listData.count !== 1) {
      throw new Error(`Failed to list resources: ${JSON.stringify(listData)}`);
    }
    console.log('✅ Test 2 Passed: Resources listed successfully.\n');

    // 5. Negative Criterion 1: Exceeding maximum file size limit (5MB)
    console.log('Test 3: Attempting to upload resource exceeding 5MB (6MB)...');
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB dummy resource
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    let largeMultipart = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nHuge Video Lecture\r\n`, 'utf-8'),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="type"\r\n\r\nvideo\r\n`, 'utf-8'),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="huge_video.mp4"\r\nContent-Type: video/mp4\r\n\r\n`, 'utf-8'),
      largeBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
    ]);

    const largeRes = await fetch(`${baseUrl}/communities/${communityId}/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${rMember.token}`
      },
      body: largeMultipart
    });
    const largeData = await largeRes.json();
    console.log(`Status: ${largeRes.status}`);
    console.log('Message:', largeData.message);
    if (
      largeRes.status !== 400 ||
      largeData.message !== 'The resource exceeds the maximum allowed size limit.'
    ) {
      throw new Error(
        `Oversized resource test failed! Expected 400 and "The resource exceeds the maximum allowed size limit.", got ${largeRes.status}: ${JSON.stringify(largeData)}`
      );
    }
    console.log('✅ Test 3 Passed: Oversized resource strictly blocked with 400 and exact expected message.\n');

    // 6. Negative Criterion 2: Inappropriate content / prohibited terms
    console.log('Test 4: Attempting to share resource with prohibited terms (malware)...');
    const badContentRes = await fetch(`${baseUrl}/communities/${communityId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rMember.token}` },
      body: JSON.stringify({
        title: 'Free software crack and malware package',
        type: 'other',
        urlOrFilePath: 'https://badsite.com/download'
      })
    });
    const badContentData = await badContentRes.json();
    console.log(`Status: ${badContentRes.status}`);
    console.log('Message:', badContentData.message);
    if (
      badContentRes.status !== 400 ||
      badContentData.message !== 'Your submission contains inappropriate content and cannot be shared.'
    ) {
      throw new Error(
        `Content moderation test failed! Expected 400 and "Your submission contains inappropriate content and cannot be shared.", got ${badContentRes.status}: ${JSON.stringify(badContentData)}`
      );
    }
    console.log('✅ Test 4 Passed: Inappropriate terms strictly blocked with 400 and exact expected message.\n');

    // 7. Negative Criterion 2 (Suspicious file extension)
    console.log('Test 5: Attempting to share resource with suspicious file extension (.exe)...');
    const badExtRes = await fetch(`${baseUrl}/communities/${communityId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rMember.token}` },
      body: JSON.stringify({
        title: 'Useful Tool Setup',
        type: 'other',
        urlOrFilePath: 'https://trusted.com/setup.exe'
      })
    });
    const badExtData = await badExtRes.json();
    console.log(`Status: ${badExtRes.status}`);
    console.log('Message:', badExtData.message);
    if (
      badExtRes.status !== 400 ||
      badExtData.message !== 'Your submission contains inappropriate content and cannot be shared.'
    ) {
      throw new Error(
        `Suspicious extension test failed! Expected 400 and "Your submission contains inappropriate content and cannot be shared.", got ${badExtRes.status}: ${JSON.stringify(badExtData)}`
      );
    }
    console.log('✅ Test 5 Passed: Suspicious extension strictly blocked with 400 and exact expected message.\n');

    // 8. Sharing by non-member
    console.log('Test 6: Attempting to share resource as a non-member...');
    const nonMemberRes = await fetch(`${baseUrl}/communities/${communityId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rOutsider.token}` },
      body: JSON.stringify({
        title: 'Outsider Guide',
        type: 'article',
        urlOrFilePath: 'https://example.com'
      })
    });
    const nonMemberData = await nonMemberRes.json();
    console.log(`Status: ${nonMemberRes.status}`);
    if (nonMemberRes.status !== 403) {
      throw new Error(`Non-member share should be 403, got ${nonMemberRes.status}: ${JSON.stringify(nonMemberData)}`);
    }
    console.log('✅ Test 6 Passed: Non-member sharing strictly blocked.\n');

    console.log('🎉 ALL USER STORY 5 BACKEND TESTS PASSED 100%!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testUserStory5().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
