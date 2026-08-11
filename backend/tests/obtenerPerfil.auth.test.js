const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const dbPath = path.join(__dirname, '../src/config/db');
const controllerPath = path.join(__dirname, '../src/controllers/empleadoController');

const otherEmployeeProfile = {
  id: 2,
  usuario_id: 99,
  nombres: 'Ana',
  apellidos: 'García',
  contacto_emergencia: 'Juan García',
  telefono_emergencia: '3001234567',
  documento_identidad: '1234567890',
  salario: 5000000,
};

function installDbMock() {
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      query: async (sql, params) => {
        if (sql.includes('FROM empleados e') && params?.[0] === '2') {
          return { rows: [otherEmployeeProfile] };
        }
        if (sql.includes('FROM descargas_certificados')) {
          return { rows: [{ total: '0' }] };
        }
        return { rows: [] };
      },
    },
  };
}

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('obtenerPerfil denies non-admin users from reading another employee profile', async () => {
  installDbMock();
  delete require.cache[controllerPath];

  const { obtenerPerfil } = require(controllerPath);
  const req = { user: { id: 1, rol_id: 2 }, params: { id: '2' } };
  const res = createMockRes();

  await obtenerPerfil(req, res);

  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /permisos/i);
});

test('obtenerPerfil allows an employee to read their own profile', async () => {
  installDbMock();
  delete require.cache[controllerPath];

  const { obtenerPerfil } = require(controllerPath);
  const req = { user: { id: 99, rol_id: 2 }, params: { id: '2' } };
  const res = createMockRes();

  await obtenerPerfil(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.perfil.id, 2);
  assert.equal(res.body.perfil.contacto_emergencia, otherEmployeeProfile.contacto_emergencia);
});

test('obtenerPerfil allows admins to read any employee profile', async () => {
  installDbMock();
  delete require.cache[controllerPath];

  const { obtenerPerfil } = require(controllerPath);
  const req = { user: { id: 1, rol_id: 1 }, params: { id: '2' } };
  const res = createMockRes();

  await obtenerPerfil(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.perfil.documento_identidad, otherEmployeeProfile.documento_identidad);
});
