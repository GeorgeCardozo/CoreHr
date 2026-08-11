const MASK = '••••••••';

const SENSITIVE_FIELDS = [
  'salario',
  'documento_identidad',
  'telefono',
  'correo_personal',
  'fecha_nacimiento',
  'contacto_emergencia',
  'parentesco',
  'telefono_emergencia',
  'direccion',
  'correo',
];

const canViewFullPerfil = (requesterRolId, requesterUserId, perfilUsuarioId) =>
  requesterRolId === 1 || Number(perfilUsuarioId) === Number(requesterUserId);

const sanitizePerfilForViewer = (perfil, requesterUserId, requesterRolId) => {
  if (canViewFullPerfil(requesterRolId, requesterUserId, perfil.usuario_id)) {
    return perfil;
  }

  const sanitized = { ...perfil };
  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field] != null && sanitized[field] !== '') {
      sanitized[field] = MASK;
    }
  }

  delete sanitized.descargas_mes_actual;
  delete sanitized.max_descargas_mes;

  return sanitized;
};

module.exports = {
  MASK,
  SENSITIVE_FIELDS,
  canViewFullPerfil,
  sanitizePerfilForViewer,
};
