const multer = require('multer');

const extensionByMime = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const uploadSolicitudes = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (extensionByMime[file.mimetype]) return cb(null, true);
    return cb(new Error('Solo se permiten comprobantes en PDF, JPG, PNG o WEBP.'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 10 },
});

module.exports = uploadSolicitudes;
