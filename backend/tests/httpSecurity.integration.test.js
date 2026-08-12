const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const dbPath = require.resolve('../src/config/db');
const serverPath = require.resolve('../server');

const originalDb = require.cache[dbPath];
const originalServer = require.cache[serverPath];
const originalJwtSecret = process.env.JWT_SECRET;
const originalCorsOrigins = process.env.CORS_ORIGINS;
process.env.JWT_SECRET = 'test-secret-for-http-integration-with-at-least-32-characters';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGINS = 'https://core-hr-five.vercel.app';

const users = {
  1: { id: 1, correo: 'admin@gla.edu.co', rol_id: 1, activo: true, token_version: 0, debe_cambiar_contrasena: false },
  2: { id: 2, correo: 'empleado@gla.edu.co', rol_id: 2, activo: true, token_version: 0, debe_cambiar_contrasena: true },
  3: { id: 3, correo: 'otro@gla.edu.co', rol_id: 2, activo: true, token_version: 0, debe_cambiar_contrasena: false },
};

const employee = {
  id: 2,
  empleado_id: 2,
  usuario_id: 2,
  nombres: 'Ana',
  apellidos: 'García',
  documento_identidad: '1234567890',
  fecha_ingreso: '2024-02-01',
  departamento: 'Académico',
  cargo: 'Docente',
  tipo_contrato: 'Indefinido',
  salario: 3200000,
  activo: true,
  correo: 'empleado@gla.edu.co',
  usuario_activo: true,
  privacidad_perfil: { telefono: true },
};

let profilePrivacy = { telefono: true };

const dbMock = {
  query: async (sql, params = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    if (normalized.startsWith('SELECT id, correo, rol_id, activo, token_version, debe_cambiar_contrasena FROM usuarios')) {
      return { rows: users[Number(params[0])] ? [users[Number(params[0])]] : [] };
    }
    if (normalized.includes('SELECT e.id AS empleado_id')) return { rows: [employee] };
    if (normalized.startsWith('SELECT privacidad_perfil FROM empleados')) return { rows: [{ privacidad_perfil: profilePrivacy }] };
    if (normalized.startsWith('UPDATE empleados SET privacidad_perfil')) {
      profilePrivacy = JSON.parse(params[0]);
      return { rows: [{ privacidad_perfil: profilePrivacy }] };
    }
    if (normalized.includes('FROM empleados e') && (normalized.includes('WHERE e.id = $1') || normalized.includes('WHERE e.usuario_id = $1'))) {
      return { rows: [employee] };
    }
    if (normalized.includes('SELECT e.*, u.correo')) return { rows: [] };
    if (normalized.startsWith('INSERT INTO descargas_certificados')) return { rows: [] };
    if (normalized.includes('SELECT s.archivo_adjunto, s.archivo_datos, s.archivo_tipo, e.usuario_id')) {
      return { rows: [{ archivo_adjunto: 'soporte-inexistente.pdf', archivo_datos: null, archivo_tipo: null, usuario_id: 2 }] };
    }
    return { rows: [] };
  },
  pool: { connect: async () => { throw new Error('La prueba HTTP no debe abrir una conexión real a PostgreSQL.'); } },
};

require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: dbMock };
delete require.cache[serverPath];
const { app } = require(serverPath);

const sign = (id) => jwt.sign({ id, rol_id: users[id].rol_id, correo: users[id].correo, tv: 0 }, process.env.JWT_SECRET, { expiresIn: '1h' });
let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  delete require.cache[serverPath];
  if (originalServer) require.cache[serverPath] = originalServer;
  if (originalDb) require.cache[dbPath] = originalDb;
  else delete require.cache[dbPath];
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
  if (originalCorsOrigins === undefined) delete process.env.CORS_ORIGINS;
  else process.env.CORS_ORIGINS = originalCorsOrigins;
});

const request = async (path, { method = 'GET', token, body } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const type = response.headers.get('content-type') || '';
  return { response, body: type.includes('application/pdf') ? Buffer.from(await response.arrayBuffer()) : await response.json() };
};

test('health valida la conexión de la API con PostgreSQL', async () => {
  const result = await request('/health');
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body, { status: 'ok', database: 'connected' });
});

test('CORS permite el frontend estable y rechaza orígenes no configurados', async () => {
  const allowed = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://core-hr-five.vercel.app',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization',
    },
  });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://core-hr-five.vercel.app');

  const denied = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://sitio-no-autorizado.example' } });
  assert.equal(denied.status, 403);
});

test('las rutas administrativas rechazan solicitudes sin autenticación', async () => {
  const result = await request('/api/empleados', { method: 'POST', body: {} });
  assert.equal(result.response.status, 401);
});

test('la sesión devuelve el indicador obligatorio de contraseña desde la base de datos', async () => {
  const result = await request('/api/auth/me', { token: sign(2) });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.user.debe_cambiar_contrasena, true);
  assert.equal(result.body.user.rol_id, 2);
});

test('el centro de recursos no está disponible para administradores', async () => {
  const result = await request('/api/recursos/chat', {
    method: 'POST',
    token: sign(1),
    body: { mensaje: '¿Cómo solicito vacaciones?' },
  });
  assert.equal(result.response.status, 403);
});

test('RBAC bloquea a empleados en la lista de personal y contratos', async () => {
  const employeeToken = sign(2);
  const employeesResult = await request('/api/empleados', { token: employeeToken });
  const contractsResult = await request('/api/contratos', { token: employeeToken });
  assert.equal(employeesResult.response.status, 403);
  assert.equal(contractsResult.response.status, 403);
});

test('RBAC permite a administradores la lista administrativa', async () => {
  const result = await request('/api/empleados', { token: sign(1) });
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body.empleados, []);
});

test('un empleado consulta otro perfil sin información contractual ni identificadores privados', async () => {
  const result = await request('/api/empleados/perfil/2', { token: sign(3) });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.perfil.cargo, 'Docente');
  assert.equal(result.body.perfil.documento_identidad, '••••••••');
  assert.equal(result.body.perfil.salario, undefined);
  assert.equal(result.body.perfil.usuario_id, undefined);
});

test('un empleado solo puede modificar preferencias de privacidad permitidas', async () => {
  const valid = await request('/api/empleados/perfil/privacidad', {
    method: 'PUT', token: sign(2), body: { preferencias: { correo_personal: true } },
  });
  assert.equal(valid.response.status, 200);
  assert.equal(valid.body.privacidad_perfil.correo_personal, true);

  const invalid = await request('/api/empleados/perfil/privacidad', {
    method: 'PUT', token: sign(2), body: { preferencias: { salario: true } },
  });
  assert.equal(invalid.response.status, 400);
});

test('las fechas inválidas de solicitudes son rechazadas antes de persistir', async () => {
  const result = await request('/api/solicitudes', {
    method: 'POST',
    token: sign(2),
    body: { tipo_solicitud: 'Vacaciones', fecha_inicio: '2026-02-31', fecha_fin: '2026-02-31', motivo: 'Prueba' },
  });
  assert.equal(result.response.status, 400);
});

test('un empleado puede generar su propio PDF y no el de otra persona', async () => {
  const own = await request('/api/empleados/certificado?empleado_id=2', { token: sign(2) });
  assert.equal(own.response.status, 200);
  assert.equal(own.response.headers.get('content-type'), 'application/pdf');
  assert.equal(own.body.subarray(0, 4).toString(), '%PDF');

  const other = await request('/api/empleados/certificado?empleado_id=2', { token: sign(3) });
  assert.equal(other.response.status, 403);
});

test('los soportes adjuntos no se exponen a empleados ajenos', async () => {
  const result = await request('/api/solicitudes/2/adjunto', { token: sign(3) });
  assert.equal(result.response.status, 403);
});

test('una foto de directorio se puede solicitar sin exponer información de perfil', async () => {
  const result = await fetch(`${baseUrl}/api/empleados/2/foto`);
  assert.equal(result.status, 404);
  assert.deepEqual(await result.json(), { message: 'La foto de perfil no está disponible.' });
});
