const multer = require('multer');

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const upload = multer({
  // Render usa un filesystem efímero. La memoria solo conserva el archivo
  // durante la petición; el controlador lo persiste inmediatamente en Neon.
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (extensionByMime[file.mimetype]) return cb(null, true);
    return cb(new Error('Solo se permiten archivos de imagen JPG, PNG o WEBP.'), false);
  },
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 10 },
});

module.exports = upload;
