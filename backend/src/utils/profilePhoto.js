const fs = require('fs/promises');
const path = require('path');
const { detectImageMime } = require('./imageMime');

const profilePhotoPath = (employee) => {
  const employeeId = employee?.empleado_id || employee?.id;
  if (!employeeId || (!employee.foto_perfil_datos && !employee.tiene_foto_perfil)) {
    return null;
  }
  return `/api/empleados/${employeeId}/foto`;
};

const legacyProfilePhotoFilename = (storedPath) => {
  if (!storedPath) return null;
  try {
    const pathname = new URL(String(storedPath), 'http://corehr.local').pathname;
    if (!pathname.toLowerCase().startsWith('/uploads/perfiles/')) return null;
    return path.basename(decodeURIComponent(pathname));
  } catch {
    return null;
  }
};

const readLegacyProfilePhoto = async (storedPath, uploadsDir) => {
  const filename = legacyProfilePhotoFilename(storedPath);
  if (!filename) return null;
  const bytes = await fs.readFile(path.join(uploadsDir, filename));
  return { bytes, mime: detectImageMime(bytes), filename };
};

const normalizeProfilePhoto = (employee) => {
  if (!employee) return employee;
  const tieneFotoPerfil = Boolean(employee.foto_perfil_datos || employee.tiene_foto_perfil);
  return {
    ...employee,
    foto_perfil: profilePhotoPath(employee),
    tiene_foto_perfil: tieneFotoPerfil,
  };
};

module.exports = { profilePhotoPath, legacyProfilePhotoFilename, readLegacyProfilePhoto, normalizeProfilePhoto };
