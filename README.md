# Discussify

Discussify is a full-stack MERN social platform enabling users to create communities, join discussions, and share resources.

## Monorepo Architecture

- `/server`: Express.js, Mongoose, JWT authentication, Multer for file uploads, CORS.
- `/client`: React (via Vite), Material UI (`@mui/material`), Material Icons (`@mui/icons-material`), React Router (`react-router-dom`), Axios, custom `styles.css` and a uniform Material theme.

## Mongoose Data Models (`/server/models`)

1. **User (`User.js`)**:
   - `name`: String (required)
   - `email`: String (required, unique: true, immutable: true)
   - `passwordHash`: String (required)
   - `role`: `'user'` (default) | `'admin'`
   - `bio`: String
   - `profilePictureUrl`: String
   - `resetPasswordToken`: String
   - `resetPasswordExpires`: Date
   - `activityLog`: Array of `{ action, timestamp, metadata }`
   - `notificationSettings`: `{ newDiscussions: Boolean, newResources: Boolean }` with custom validator preventing both from being disabled simultaneously.

2. **Community (`Community.js`)**:
   - `name`: String (required, unique: true)
   - `description`: String
   - `isPrivate`: Boolean (default: false)
   - `creator`: ObjectId ref `User` (required)
   - `members`: Array of ObjectId refs to `User`
   - `invitedUsers`: Array of ObjectId refs to `User`
   - `createdAt`: Date

3. **Discussion (`Discussion.js`)**:
   - `community`: ObjectId ref `Community` (required)
   - `author`: ObjectId ref `User` (required)
   - `title`: String (required)
   - `content`: String (required)
   - `status`: `'active'` (default) | `'closed'`
   - `replies`: Array of `{ author, content, createdAt }`
   - `createdAt`: Date

4. **Resource (`Resource.js`)**:
   - `community`: ObjectId ref `Community` (required)
   - `author`: ObjectId ref `User` (required)
   - `title`: String (required)
   - `type`: `'article'` | `'video'` | `'other'` (required)
   - `urlOrFilePath`: String (required)
   - `fileSize`: Number with validator against maximum allowed file size (10 MB)
   - `createdAt`: Date

5. **Notification (`Notification.js`)**:
   - `recipient`: ObjectId ref `User` (required)
   - `community`: ObjectId ref `Community` (required)
   - `type`: `'discussion'` | `'resource'` (required)
   - `message`: String (required)
   - `isRead`: Boolean (default: false)
   - `createdAt`: Date

## Running the Application

### 1. Server Verification & Test
```bash
npm run test:models
```

### 2. Run Server
```bash
npm run server
```

### 3. Run Client
```bash
npm run client
```
