const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads/perfiles');
fs.mkdirSync(uploadDir, { recursive: true });

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `foto-${crypto.randomUUID()}${extensionByMime[file.mimetype] || ''}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (extensionByMime[file.mimetype]) return cb(null, true);
    return cb(new Error('Solo se permiten archivos de imagen JPG, PNG o WEBP.'), false);
  },
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 10 },
});

module.exports = upload;
