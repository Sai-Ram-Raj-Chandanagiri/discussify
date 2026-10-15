const mongoose = require('mongoose');
const { User, Community, Discussion, Resource, Notification } = require('../models');

async function runCheck() {
  console.log('=== DISCUSSIFY MONGOOSE MODELS VALIDATION & SYNTAX CHECK ===\n');

  let passed = true;

  // 1. Verify User Model
  console.log('Checking User model...');
  const emailPath = User.schema.path('email');
  if (!emailPath) {
    console.error('❌ User schema missing email path');
    passed = false;
  } else {
    const isUnique = emailPath.options.unique === true;
    const isImmutable = emailPath.options.immutable === true;
    console.log(`  - email unique: ${isUnique ? '✅ true' : '❌ false'}`);
    console.log(`  - email immutable: ${isImmutable ? '✅ true' : '❌ false'}`);
    if (!isUnique || !isImmutable) passed = false;
  }

  // Check notificationSettings validator
  const userValid1 = new User({
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'hashed123',
    notificationSettings: { newDiscussions: true, newResources: false }
  });
  const errValid1 = userValid1.validateSync();
  console.log(`  - notificationSettings [true, false]: ${!errValid1?.errors?.['notificationSettings'] ? '✅ Valid (allowed)' : '❌ Unexpected error'}`);

  const userInvalid = new User({
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: 'hashed123',
    notificationSettings: { newDiscussions: false, newResources: false }
  });
  const errInvalid = userInvalid.validateSync();
  const hasNotificationError = Boolean(errInvalid?.errors?.['notificationSettings']);
  console.log(`  - notificationSettings [false, false] custom validator: ${hasNotificationError ? '✅ Caught validation error as required' : '❌ Failed to block both false'}`);
  if (!hasNotificationError) passed = false;

  // 2. Verify Community Model
  console.log('\nChecking Community model...');
  const commNamePath = Community.schema.path('name');
  if (!commNamePath) {
    console.error('❌ Community schema missing name path');
    passed = false;
  } else {
    const isCommNameUnique = commNamePath.options.unique === true;
    console.log(`  - name unique: ${isCommNameUnique ? '✅ true' : '❌ false'}`);
    if (!isCommNameUnique) passed = false;
  }

  const dummyUserId = new mongoose.Types.ObjectId();
  const comm = new Community({
    name: 'Tech Enthusiasts',
    description: 'A community for developers',
    isPrivate: false,
    creator: dummyUserId,
    members: [dummyUserId],
    invitedUsers: []
  });
  const commErr = comm.validateSync();
  console.log(`  - Community instance validation: ${!commErr ? '✅ Valid' : '❌ Error: ' + commErr.message}`);
  if (commErr) passed = false;

  // 3. Verify Discussion Model
  console.log('\nChecking Discussion model...');
  const dummyCommId = new mongoose.Types.ObjectId();
  const discussion = new Discussion({
    community: dummyCommId,
    author: dummyUserId,
    title: 'Getting started with MERN stack',
    content: 'Let us discuss architecture and best practices.',
    status: 'active',
    replies: [
      {
        author: dummyUserId,
        content: 'Great initiative!'
      }
    ]
  });
  const discErr = discussion.validateSync();
  console.log(`  - Discussion instance validation: ${!discErr ? '✅ Valid' : '❌ Error: ' + discErr.message}`);
  if (discErr) passed = false;

  // 4. Verify Resource Model
  console.log('\nChecking Resource model...');
  const validResource = new Resource({
    community: dummyCommId,
    author: dummyUserId,
    title: 'React Documentation',
    type: 'article',
    urlOrFilePath: 'https://react.dev',
    fileSize: 1024 * 1024 // 1MB
  });
  const resErr = validResource.validateSync();
  console.log(`  - Resource instance validation (1MB): ${!resErr ? '✅ Valid' : '❌ Error: ' + resErr.message}`);
  if (resErr) passed = false;

  const oversizedResource = new Resource({
    community: dummyCommId,
    author: dummyUserId,
    title: 'Large File',
    type: 'video',
    urlOrFilePath: '/uploads/huge.mp4',
    fileSize: 15 * 1024 * 1024 // 15MB > 10MB limit
  });
  const overErr = oversizedResource.validateSync();
  const hasSizeError = Boolean(overErr?.errors?.['fileSize']);
  console.log(`  - Resource file size validator (15MB > 10MB limit): ${hasSizeError ? '✅ Caught oversized file error as required' : '❌ Failed to catch oversized file'}`);
  if (!hasSizeError) passed = false;

  // 5. Verify Notification Model
  console.log('\nChecking Notification model...');
  const notification = new Notification({
    recipient: dummyUserId,
    community: dummyCommId,
    type: 'discussion',
    message: 'A new discussion was started in Tech Enthusiasts',
    isRead: false
  });
  const notifErr = notification.validateSync();
  console.log(`  - Notification instance validation: ${!notifErr ? '✅ Valid' : '❌ Error: ' + notifErr.message}`);
  if (notifErr) passed = false;

  console.log('\n======================================================');
  if (passed) {
    console.log('🎉 ALL 5 MONGOOSE MODELS PASSED SYNTAX & VALIDATION CHECKS!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED. Please review output above.');
    process.exit(1);
  }
}

runCheck().catch((err) => {
  console.error('Execution error during check:', err);
  process.exit(1);
});
