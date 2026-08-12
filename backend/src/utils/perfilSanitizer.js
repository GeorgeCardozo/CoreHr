const MASK = '••••••••';

// Estos campos pueden ser publicados voluntariamente por el titular.
// Por privacidad, todos parten ocultos hasta que el colaborador decida lo contrario.
const PROFILE_PRIVACY_FIELDS = [
  'correo',
  'telefono',
  'correo_personal',
  'tipo_genero',
  'fecha_nacimiento',
  'direccion',
  'habilidades',
];

// Estos datos nunca se comparten entre compañeros, aunque el perfil sea público.
const ALWAYS_PRIVATE_FIELDS = [
  'documento_identidad',
  'contacto_emergencia',
  'parentesco',
  'telefono_emergencia',
];

// Solo Gestión Humana puede consultar términos contractuales y salariales.
const ADMIN_ONLY_EMPLOYMENT_FIELDS = [
  'salario',
  'tipo_contrato',
  'contrato_fecha_inicio',
  'contrato_fecha_fin',
  'contrato_estado',
  'fecha_terminacion',
];

// El titular puede consultar su fecha de ingreso, pero no se publica a compañeros.
const PEER_RESTRICTED_FIELDS = ['fecha_ingreso'];

const INTERNAL_FIELDS = [
  'usuario_id',
  'rol_id',
  'usuario_activo',
  'activo',
  'descargas_mes_actual',
  'max_descargas_mes',
  'foto_perfil_datos',
  'foto_perfil_tipo',
];

const DEFAULT_PROFILE_PRIVACY = Object.freeze(
  Object.fromEntries(PROFILE_PRIVACY_FIELDS.map((field) => [field, false]))
);

const normalizeProfilePrivacy = (value) => {
  let preferences = value;
  if (typeof value === 'string') {
    try {
      preferences = JSON.parse(value);
    } catch {
      preferences = {};
    }
  }
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) preferences = {};

  return Object.fromEntries(
    PROFILE_PRIVACY_FIELDS.map((field) => [field, preferences[field] === true])
  );
};

const canViewFullPerfil = (requesterRolId, requesterUserId, perfilUsuarioId) =>
  Number(requesterRolId) === 1 || Number(perfilUsuarioId) === Number(requesterUserId);

const sanitizePerfilForViewer = (perfil, requesterUserId, requesterRolId) => {
  const sanitized = { ...perfil };
  const isAdmin = Number(requesterRolId) === 1;
  const isOwner = Number(perfil.usuario_id) === Number(requesterUserId);
  const privacy = normalizeProfilePrivacy(perfil.privacidad_perfil);

  // Los binarios nunca forman parte de respuestas JSON; solo se sirven por
  // el endpoint específico de foto.
  delete sanitized.foto_perfil_datos;
  delete sanitized.foto_perfil_tipo;

  if (!isAdmin) {
    for (const field of ADMIN_ONLY_EMPLOYMENT_FIELDS) delete sanitized[field];
  }

  if (isAdmin || isOwner) {
    sanitized.privacidad_perfil = privacy;
    sanitized.es_perfil_publico = false;
    return sanitized;
  }

  for (const field of PROFILE_PRIVACY_FIELDS) {
    if (!privacy[field]) sanitized[field] = MASK;
  }
  for (const field of ALWAYS_PRIVATE_FIELDS) sanitized[field] = MASK;
  for (const field of PEER_RESTRICTED_FIELDS) delete sanitized[field];
  for (const field of INTERNAL_FIELDS) delete sanitized[field];

  delete sanitized.privacidad_perfil;
  sanitized.es_perfil_publico = true;
  return sanitized;
};

module.exports = {
  MASK,
  PROFILE_PRIVACY_FIELDS,
  ALWAYS_PRIVATE_FIELDS,
  ADMIN_ONLY_EMPLOYMENT_FIELDS,
  PEER_RESTRICTED_FIELDS,
  DEFAULT_PROFILE_PRIVACY,
  normalizeProfilePrivacy,
  canViewFullPerfil,
  sanitizePerfilForViewer,
};
