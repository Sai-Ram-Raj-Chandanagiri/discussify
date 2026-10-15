const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `resource-${req.user?._id || 'user'}-${uniqueSuffix}${ext}`);
  }
});

// Maximum allowed size limit for resources is 5 MB
const MAX_RESOURCE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_RESOURCE_SIZE
  }
}).single('file');

const uploadResourceFile = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'The resource exceeds the maximum allowed size limit.'
        });
      }
      return res.status(400).json({
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        message: err.message
      });
    }
    next();
  });
};

module.exports = {
  uploadResourceFile,
  MAX_RESOURCE_SIZE
};
