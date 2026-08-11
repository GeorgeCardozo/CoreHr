const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
const controllerPath = require.resolve('../src/controllers/empleadoController');

const employeeProfile = {
  id: 2,
  usuario_id: 99,
  nombres: 'Ana',
  apellidos: 'García',
  documento_identidad: '1234567890',
  contacto_emergencia: 'Juan García',
  telefono_emergencia: '3001234567',
  salario: 5000000,
  cargo: 'Docente',
  tipo_contrato: 'Indefinido',
  activo: true,
  usuario_activo: true,
  privacidad_perfil: { telefono: true },
};

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; },
});

const withController = async (callback) => {
  const previousDb = require.cache[dbPath];
  const previousController = require.cache[controllerPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: {
      query: async (sql) => sql.includes('FROM empleados e') ? { rows: [employeeProfile] } : { rows: [] },
    },
  };
  delete require.cache[controllerPath];

  try {
    await callback(require(controllerPath));
  } finally {
    delete require.cache[controllerPath];
    if (previousController) require.cache[controllerPath] = previousController;
    if (previousDb) require.cache[dbPath] = previousDb;
    else delete require.cache[dbPath];
  }
};

test('obtenerPerfil permite una vista pública censurada de otro colaborador', async () => {
  await withController(async ({ obtenerPerfil }) => {
    const res = createResponse();
    await obtenerPerfil({ user: { id: 1, rol_id: 2 }, params: { id: '2' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.perfil.cargo, 'Docente');
    assert.equal(res.body.perfil.documento_identidad, '••••••••');
    assert.equal(res.body.perfil.salario, undefined);
    assert.equal(res.body.perfil.tipo_contrato, undefined);
  });
});

test('obtenerPerfil permite el perfil propio sin términos contractuales', async () => {
  await withController(async ({ obtenerPerfil }) => {
    const res = createResponse();
    await obtenerPerfil({ user: { id: 99, rol_id: 2 }, params: { id: '2' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.perfil.documento_identidad, employeeProfile.documento_identidad);
    assert.equal(res.body.perfil.salario, undefined);
    assert.equal(res.body.perfil.tipo_contrato, undefined);
  });
});

test('obtenerPerfil permite a un administrador consultar términos contractuales', async () => {
  await withController(async ({ obtenerPerfil }) => {
    const res = createResponse();
    await obtenerPerfil({ user: { id: 1, rol_id: 1 }, params: { id: '2' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.perfil.salario, 5000000);
    assert.equal(res.body.perfil.tipo_contrato, 'Indefinido');
  });
});
