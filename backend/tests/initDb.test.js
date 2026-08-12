const test = require('node:test');
const assert = require('node:assert/strict');

const originalEmail = process.env.SEED_ADMIN_EMAIL;
const originalPassword = process.env.SEED_ADMIN_PASSWORD;
process.env.SEED_ADMIN_EMAIL = 'admin@gla.edu.co';
process.env.SEED_ADMIN_PASSWORD = 'TemporalAdmin2026';

const { seedAdminIfConfigured } = require('../src/config/initDb');

test.after(() => {
  if (originalEmail === undefined) delete process.env.SEED_ADMIN_EMAIL;
  else process.env.SEED_ADMIN_EMAIL = originalEmail;
  if (originalPassword === undefined) delete process.env.SEED_ADMIN_PASSWORD;
  else process.env.SEED_ADMIN_PASSWORD = originalPassword;
});

test('el seed no modifica contraseña, actividad ni primer ingreso de un administrador existente', async () => {
  const queries = [];
  const client = {
    query: async (sql, params = []) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      queries.push({ sql: normalized, params });
      if (normalized.startsWith('SELECT id FROM usuarios')) return { rows: [{ id: 4 }] };
      if (normalized.startsWith('INSERT INTO empleados')) return { rows: [] };
      throw new Error(`Consulta no esperada: ${normalized}`);
    },
  };

  await seedAdminIfConfigured(client);

  assert.equal(queries.some(({ sql }) => sql.startsWith('UPDATE usuarios')), false);
  assert.equal(queries.some(({ sql }) => sql.startsWith('INSERT INTO usuarios')), false);
  assert.equal(queries.some(({ sql }) => sql.startsWith('INSERT INTO empleados')), true);
});

test('un administrador existente no requiere conservar la contraseña de seed en el entorno', async () => {
  delete process.env.SEED_ADMIN_PASSWORD;
  const client = {
    query: async (sql) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.startsWith('SELECT id FROM usuarios')) return { rows: [{ id: 4 }] };
      if (normalized.startsWith('INSERT INTO empleados')) return { rows: [] };
      throw new Error(`Consulta no esperada: ${normalized}`);
    },
  };

  await assert.doesNotReject(seedAdminIfConfigured(client));
});
