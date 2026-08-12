const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
const empleadoPath = require.resolve('../src/controllers/empleadoController');
const solicitudPath = require.resolve('../src/controllers/solicitudController');
const originalDb = require.cache[dbPath];

const createResponse = () => {
  const response = { statusCode: 200, body: null, headers: {} };
  response.status = (code) => { response.statusCode = code; return response; };
  response.json = (body) => { response.body = body; return response; };
  response.send = (body) => { response.body = body; return response; };
  response.setHeader = (key, value) => { response.headers[key] = value; };
  return response;
};

test('la foto se persiste en PostgreSQL y se recupera con su MIME', async (t) => {
  const bytes = Buffer.from('imagen-prueba');
  let updateParams;
  const dbMock = {
    query: async (sql, params) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.startsWith('SELECT id FROM empleados WHERE usuario_id')) return { rows: [{ id: 9 }] };
      if (normalized.startsWith('UPDATE empleados SET foto_perfil')) {
        updateParams = params;
        return { rows: [{ id: 9, nombres: 'Eva', apellidos: 'Prueba', foto_perfil: '/api/empleados/9/foto' }] };
      }
      if (normalized.startsWith('SELECT foto_perfil_datos')) {
        return { rows: [{ foto_perfil_datos: bytes, foto_perfil_tipo: 'image/png' }] };
      }
      throw new Error(`Consulta no esperada: ${normalized}`);
    },
  };
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: dbMock };
  delete require.cache[empleadoPath];
  const { subirFotoPerfil, obtenerFotoPerfil } = require(empleadoPath);
  t.after(() => {
    delete require.cache[empleadoPath];
    if (originalDb) require.cache[dbPath] = originalDb;
    else delete require.cache[dbPath];
  });

  const uploadRes = createResponse();
  await subirFotoPerfil({ user: { id: 7, rol_id: 2 }, body: {}, query: {}, file: { buffer: bytes, mimetype: 'image/png' } }, uploadRes);
  assert.equal(uploadRes.statusCode, 200);
  assert.match(uploadRes.body.foto_perfil, /^\/api\/empleados\/9\/foto\?v=\d+$/);
  assert.deepEqual(updateParams.slice(1, 3), [bytes, 'image/png']);

  const downloadRes = createResponse();
  await obtenerFotoPerfil({ params: { id: '9' } }, downloadRes);
  assert.deepEqual(downloadRes.body, bytes);
  assert.equal(downloadRes.headers['Content-Type'], 'image/png');
});

test('un soporte persistido solo se entrega a su titular y conserva el MIME', async (t) => {
  const bytes = Buffer.from('pdf-prueba');
  const dbMock = {
    query: async (sql) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.startsWith('SELECT s.archivo_adjunto')) {
        return { rows: [{ archivo_adjunto: 'soporte.pdf', archivo_datos: bytes, archivo_tipo: 'application/pdf', usuario_id: 7 }] };
      }
      throw new Error(`Consulta no esperada: ${normalized}`);
    },
  };
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: dbMock };
  delete require.cache[solicitudPath];
  const { descargarAdjunto } = require(solicitudPath);
  t.after(() => {
    delete require.cache[solicitudPath];
    if (originalDb) require.cache[dbPath] = originalDb;
    else delete require.cache[dbPath];
  });

  const denied = createResponse();
  await descargarAdjunto({ params: { id: '3' }, user: { id: 8, rol_id: 2 } }, denied);
  assert.equal(denied.statusCode, 403);

  const allowed = createResponse();
  await descargarAdjunto({ params: { id: '3' }, user: { id: 7, rol_id: 2 } }, allowed);
  assert.deepEqual(allowed.body, bytes);
  assert.equal(allowed.headers['Content-Type'], 'application/pdf');
  assert.equal(allowed.headers['Cache-Control'], 'private, no-store');
});
