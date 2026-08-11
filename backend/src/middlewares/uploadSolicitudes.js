const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads/solicitudes');
fs.mkdirSync(uploadDir, { recursive: true });

const extensionByMime = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `soporte-${crypto.randomUUID()}${extensionByMime[file.mimetype] || ''}`),
});

const uploadSolicitudes = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (extensionByMime[file.mimetype]) return cb(null, true);
    return cb(new Error('Solo se permiten comprobantes en PDF, JPG, PNG o WEBP.'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 10 },
});

module.exports = uploadSolicitudes;
