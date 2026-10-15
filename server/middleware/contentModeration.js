const path = require('path');
const fs = require('fs');

// Prohibited terms for community safety and content moderation
const PROHIBITED_TERMS = [
  'inappropriate',
  'offensive',
  'spam',
  'scam',
  'malware',
  'phishing',
  'virus',
  'trojan',
  'ransomware',
  'spyware',
  'hate',
  'harassment',
  'nsfw',
  'porn',
  'warez',
  'crack',
  'exploit',
  'illicit',
  'violence'
];

// Suspicious executable file extensions not allowed for community sharing
const SUSPICIOUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.vbs',
  '.js',
  '.scr',
  '.msi',
  '.pif',
  '.application',
  '.gadget',
  '.hta',
  '.jar',
  '.reg',
  '.sct',
  '.vbe',
  '.ws',
  '.wsc',
  '.wsf',
  '.wsh'
];

const containsInappropriateTerm = (text) => {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return PROHIBITED_TERMS.some((term) => {
    const wordRegex = new RegExp(`(^|\\W)${term}(\\W|$)`, 'i');
    return wordRegex.test(lower);
  });
};

const hasSuspiciousExtension = (filenameOrUrl) => {
  if (!filenameOrUrl || typeof filenameOrUrl !== 'string') return false;
  try {
    if (filenameOrUrl.startsWith('http://') || filenameOrUrl.startsWith('https://')) {
      const parsed = new URL(filenameOrUrl);
      const pathname = parsed.pathname.toLowerCase();
      const ext = path.extname(pathname).toLowerCase();
      return SUSPICIOUS_EXTENSIONS.includes(ext);
    }
  } catch {
    // Fall back to clean extension extraction
  }
  const clean = filenameOrUrl.split('?')[0].toLowerCase();
  const ext = path.extname(clean).toLowerCase();
  return SUSPICIOUS_EXTENSIONS.includes(ext);
};

const moderateContent = (req, res, next) => {
  const { title, description, urlOrFilePath } = req.body;
  const fileOriginalName = req.file ? req.file.originalname : '';

  let isFlagged = false;

  // Check text content
  if (
    containsInappropriateTerm(title) ||
    containsInappropriateTerm(description) ||
    containsInappropriateTerm(urlOrFilePath) ||
    containsInappropriateTerm(fileOriginalName)
  ) {
    isFlagged = true;
  }

  // Check suspicious extensions
  if (
    hasSuspiciousExtension(urlOrFilePath) ||
    hasSuspiciousExtension(fileOriginalName)
  ) {
    isFlagged = true;
  }

  if (isFlagged) {
    // Clean up uploaded file if present
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.warn('Failed to clean up flagged file:', cleanupErr.message);
      }
    }

    // STRICT NEGATIVE CRITERION:
    // If flagged, return 400 Bad Request with exact message:
    // "Your submission contains inappropriate content and cannot be shared."
    return res.status(400).json({
      message: 'Your submission contains inappropriate content and cannot be shared.'
    });
  }

  next();
};

module.exports = {
  moderateContent,
  PROHIBITED_TERMS,
  SUSPICIOUS_EXTENSIONS,
  containsInappropriateTerm,
  hasSuspiciousExtension
};
