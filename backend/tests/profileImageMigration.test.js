const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseArguments,
  fileNameFromStoredPath,
  buildIndexes,
  locatePhoto,
  buildPlan,
  applyPlan,
} = require('../scripts/migrate-profile-images-to-db');

const file = (name, hash = name) => ({ name, normalizedName: name.toLowerCase(), hash, bytes: Buffer.from(hash), mime: 'image/jpeg', size: hash.length });

test('la migración es simulación por defecto y exige --apply para sobrescribir', () => {
  assert.deepEqual(parseArguments([]).apply, false);
  assert.throws(() => parseArguments(['--overwrite']), /requiere --apply/);
  assert.throws(() => parseArguments(['--photos-dir']), /requiere una ruta/);
  assert.deepEqual(parseArguments(['--apply', '--overwrite']).overwrite, true);
});

test('extrae únicamente archivos dentro de la ruta histórica de perfiles', () => {
  assert.equal(fileNameFromStoredPath('/uploads/perfiles/foto-123.jpg'), 'foto-123.jpg');
  assert.equal(fileNameFromStoredPath('https://api.example/uploads/perfiles/foto-456.png?x=1'), 'foto-456.png');
  assert.equal(fileNameFromStoredPath('/uploads/solicitudes/soporte.pdf'), null);
  assert.equal(fileNameFromStoredPath('/api/empleados/2/foto'), null);
});

test('prioriza la ruta exacta y usa el documento solo con asociación inequívoca', () => {
  const exact = file('foto-9999999999999-42.png', 'nuevo');
  const documentPhoto = file('foto-12345678.jpg', 'historico');
  const indexes = buildIndexes([exact, documentPhoto]);
  assert.deepEqual(
    locatePhoto({ foto_perfil: `/uploads/perfiles/${exact.name}`, documento_identidad: '12345678' }, indexes).file,
    exact
  );
  assert.deepEqual(locatePhoto({ foto_perfil: null, documento_identidad: '12345678' }, indexes).file, documentPhoto);
});

test('los duplicados binarios de un archivo asociado no se reportan como huérfanos', () => {
  const historical = file('foto-12345678.jpg', 'mismo-hash');
  const duplicate = file('foto-1785350000000-1.jpg', 'mismo-hash');
  const orphan = file('foto-1785350000001-2.jpg', 'otro-hash');
  const plan = buildPlan([
    { id: 7, documento_identidad: '12345678', nombres: 'Ana', apellidos: 'Prueba', foto_perfil: '/uploads/perfiles/foto-12345678.jpg' },
  ], [historical, duplicate, orphan]);
  assert.deepEqual(plan.unassociatedFiles.map(({ archivo }) => archivo), [orphan.name]);
  assert.deepEqual(plan.associatedAlternatives.map(({ archivo }) => archivo), [duplicate.name]);
});

test('al aplicar no se sobrescribe BYTEA existente salvo confirmación explícita', async () => {
  const queries = [];
  const client = {
    query: async (sql, params) => {
      queries.push({ sql, params });
      return sql.trim().startsWith('UPDATE empleados') ? { rowCount: 1, rows: [{ id: params[2] }] } : { rows: [] };
    },
    release() {},
  };
  const pool = { connect: async () => client };
  const photo = file('foto-12345678.jpg');
  const plan = {
    rows: [
      { employee: { id: 1, tiene_foto_perfil: true }, file: photo, method: 'ruta_foto_perfil' },
      { employee: { id: 2, tiene_foto_perfil: false }, file: photo, method: 'documento_identidad' },
    ],
  };

  const result = await applyPlan(pool, plan, false);
  const updates = queries.filter(({ sql }) => sql.trim().startsWith('UPDATE empleados'));
  assert.equal(updates.length, 1);
  assert.equal(updates[0].params[2], 2);
  assert.equal(result.migrated.length, 1);
});
