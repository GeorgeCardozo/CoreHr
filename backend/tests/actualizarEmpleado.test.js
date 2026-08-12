const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../src/config/db');
const controllerPath = require.resolve('../src/controllers/empleadoController');
const { isValidIsoDate, normalizeDateOnly } = require('../src/utils/dateValidation');

const baseEmployee = () => ({
  id: 9,
  usuario_id: 7,
  correo: 'empleado@arrayanes.edu.co',
  documento_identidad: '1000123456',
  nombres: 'Eva',
  apellidos: 'Prueba',
  telefono: '3000000000',
  fecha_ingreso: new Date('2024-01-15T00:00:00.000Z'),
  habilidades: ['Excel'],
  fecha_info_personal: new Date('2025-01-01T00:00:00.000Z'),
  fecha_soportes: '2025-02-01T00:00:00.000Z',
  fecha_seguridad: new Date('2025-03-01T00:00:00.000Z'),
  superior_inmediato: 'RectorÃ­a',
  departamento: 'AcadÃ©mico',
  fecha_terminacion: null,
  tipo_genero: 'Femenino',
  fecha_nacimiento: '1990-05-10',
  correo_personal: 'eva@example.com',
  contacto_emergencia: 'Contacto',
  parentesco: 'Madre',
  telefono_emergencia: '3110000000',
  direccion: 'DirecciÃ³n existente',
  foto_perfil_datos: null,
  foto_perfil_tipo: null,
  activo: true,
});

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const runUpdate = async ({ role = 2, body, existing = baseEmployee(), duplicateEmail = false }) => {
  const queries = [];
  const current = { ...existing };
  const client = {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      queries.push({ sql: normalized, params });
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(normalized)) return { rows: [] };
      if (normalized.startsWith('SELECT e.*, u.correo')) return { rows: [current] };
      if (normalized.startsWith('UPDATE usuarios SET correo')) {
        if (duplicateEmail) {
          const error = new Error('duplicate');
          error.code = '23505';
          error.constraint = 'usuarios_correo_key';
          throw error;
        }
        current.correo = params[0];
        return { rows: [] };
      }
      if (normalized.startsWith('UPDATE usuarios SET activo')) return { rows: [] };
      if (normalized.startsWith('UPDATE empleados SET')) {
        const setClause = normalized.match(/UPDATE empleados SET (.+) WHERE id/)[1];
        const fields = setClause.split(',').map((assignment) => assignment.trim().split(' = ')[0]);
        fields.forEach((field, index) => { current[field] = params[index]; });
        return { rows: [{ ...current }] };
      }
      throw new Error(`Consulta inesperada: ${normalized}`);
    },
    release() {},
  };

  const previousDb = require.cache[dbPath];
  const previousController = require.cache[controllerPath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { pool: { connect: async () => client } },
  };
  delete require.cache[controllerPath];
  try {
    const { actualizarEmpleado } = require(controllerPath);
    const res = response();
    await actualizarEmpleado({ params: { id: '9' }, user: { id: role === 1 ? 1 : 7, rol_id: role }, body }, res);
    return { res, queries, current };
  } finally {
    delete require.cache[controllerPath];
    if (previousController) require.cache[controllerPath] = previousController;
    if (previousDb) require.cache[dbPath] = previousDb;
    else delete require.cache[dbPath];
  }
};

test('actualizaciones parciales del colaborador', async (t) => {
  for (const [name, body, field, expected] of [
    ['telÃ©fono', { telefono: '3201234567' }, 'telefono', '3201234567'],
    ['gÃ©nero', { tipo_genero: 'No binario' }, 'tipo_genero', 'No binario'],
    ['correo personal', { correo_personal: 'nuevo@example.com' }, 'correo_personal', 'nuevo@example.com'],
    ['direcciÃ³n', { direccion: 'Nueva direcciÃ³n' }, 'direccion', 'Nueva direcciÃ³n'],
    ['fecha de nacimiento', { fecha_nacimiento: '1992-06-20' }, 'fecha_nacimiento', '1992-06-20'],
  ]) {
    await t.test(`modifica solamente ${name}`, async () => {
      const { res, current } = await runUpdate({ body });
      assert.equal(res.statusCode, 200);
      assert.equal(current[field], expected);
      assert.equal(current.documento_identidad, '1000123456');
    });
  }

  await t.test('acepta fecha_ingreso existente como Date y fechas administrativas histÃ³ricas', async () => {
    const { res } = await runUpdate({ body: { telefono: '3209999999' } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.empleado.fecha_ingreso, '2024-01-15');
    assert.equal(res.body.empleado.fecha_soportes, '2025-02-01');
  });

  await t.test('una fecha opcional vacÃ­a se transforma en null', async () => {
    const { res, current } = await runUpdate({ body: { fecha_nacimiento: '' } });
    assert.equal(res.statusCode, 200);
    assert.equal(current.fecha_nacimiento, null);
  });

  await t.test('rechaza campos administrativos', async () => {
    const { res, queries } = await runUpdate({ body: { departamento: 'Finanzas' } });
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /departamento/);
    assert.equal(queries.some(({ sql }) => sql.startsWith('UPDATE empleados SET')), false);
  });
});

test('actualizaciones parciales del administrador', async (t) => {
  await t.test('modifica solamente telÃ©fono sin exigir correo ni identidad', async () => {
    const { res, queries } = await runUpdate({ role: 1, body: { telefono: '3201111111' } });
    assert.equal(res.statusCode, 200);
    const update = queries.find(({ sql }) => sql.startsWith('UPDATE empleados SET'));
    assert.match(update.sql, /SET telefono = \$1 WHERE/);
  });

  await t.test('modifica solamente fecha de ingreso', async () => {
    const { res, current } = await runUpdate({ role: 1, body: { fecha_ingreso: '2024-02-01' } });
    assert.equal(res.statusCode, 200);
    assert.equal(current.fecha_ingreso, '2024-02-01');
  });

  await t.test('conserva correo institucional cuando no se envÃ­a', async () => {
    const { res, queries } = await runUpdate({ role: 1, body: { telefono: '3202222222' } });
    assert.equal(res.body.empleado.correo, 'empleado@arrayanes.edu.co');
    assert.equal(queries.some(({ sql }) => sql.startsWith('UPDATE usuarios SET correo')), false);
  });

  await t.test('cambia correo institucional dentro de la transacciÃ³n', async () => {
    const { res, queries } = await runUpdate({ role: 1, body: { correo: 'nuevo@arrayanes.edu.co' } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.empleado.correo, 'nuevo@arrayanes.edu.co');
    assert.equal(queries.some(({ sql }) => sql.startsWith('UPDATE usuarios SET correo')), true);
  });

  await t.test('rechaza correo invÃ¡lido', async () => {
    const { res } = await runUpdate({ role: 1, body: { correo: 'correo-invalido' } });
    assert.equal(res.statusCode, 400);
  });

  await t.test('devuelve 409 para correo duplicado', async () => {
    const { res } = await runUpdate({ role: 1, body: { correo: 'duplicado@arrayanes.edu.co' }, duplicateEmail: true });
    assert.equal(res.statusCode, 409);
    assert.match(res.body.message, /correo institucional/);
  });

  await t.test('modifica una fecha sin afectar las demÃ¡s', async () => {
    const { res, current } = await runUpdate({ role: 1, body: { fecha_soportes: '2026-04-01' } });
    assert.equal(res.statusCode, 200);
    assert.equal(current.fecha_soportes, '2026-04-01');
    assert.equal(current.fecha_seguridad.toISOString(), '2025-03-01T00:00:00.000Z');
  });

  await t.test('una actualizaciÃ³n parcial no borra campos existentes', async () => {
    const { current } = await runUpdate({ role: 1, body: { departamento: 'Talento Humano' } });
    assert.equal(current.departamento, 'Talento Humano');
    assert.equal(current.direccion, 'DirecciÃ³n existente');
    assert.deepEqual(current.habilidades, ['Excel']);
  });
});

test('normalizaciÃ³n y validaciÃ³n de fechas DATE', async (t) => {
  await t.test('acepta YYYY-MM-DD vÃ¡lido', () => assert.equal(isValidIsoDate('2026-02-28'), true));
  await t.test('rechaza una fecha imposible', () => assert.equal(isValidIsoDate('2026-02-30'), false));
  await t.test('normaliza Date proveniente de PostgreSQL', () => {
    assert.equal(normalizeDateOnly(new Date('2024-01-15T00:00:00.000Z')), '2024-01-15');
  });
  await t.test('normaliza un timestamp ISO histÃ³rico sin desplazar el dÃ­a', () => {
    assert.equal(normalizeDateOnly('2024-01-15T05:00:00.000Z'), '2024-01-15');
  });
  await t.test('rechaza terminaciÃ³n anterior al ingreso', async () => {
    const { res } = await runUpdate({ role: 1, body: { fecha_terminacion: '2023-12-31' } });
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /anterior/);
  });
});
