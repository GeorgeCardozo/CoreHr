const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const dbPath = require.resolve('../src/config/db');
const controllerPath = require.resolve('../src/controllers/authController');
const originalDb = require.cache[dbPath];
const originalController = require.cache[controllerPath];
const originalJwtSecret = process.env.JWT_SECRET;

test('cambiarContrasena persiste el hash, desactiva la obligación y emite una sesión nueva', async (t) => {
  process.env.JWT_SECRET = 'test-secret-for-password-change-with-at-least-32-characters';
  const currentPassword = 'Temporal2026A';
  const newPassword = 'SeguraNueva2026B';
  let persistedHash = null;

  const usuario = {
    id: 7,
    correo: 'persona@gla.edu.co',
    contrasena: await bcrypt.hash(currentPassword, 4),
    rol_id: 2,
    activo: true,
    token_version: 0,
    debe_cambiar_contrasena: true,
  };

  const dbMock = {
    query: async (sql, params = []) => {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized.startsWith('SELECT id, correo, contrasena')) return { rows: [usuario] };
      if (normalized.startsWith('UPDATE usuarios SET contrasena')) {
        persistedHash = params[0];
        return {
          rows: [{
            id: usuario.id,
            correo: usuario.correo,
            rol_id: usuario.rol_id,
            token_version: 1,
            debe_cambiar_contrasena: false,
          }],
        };
      }
      throw new Error(`Consulta no esperada: ${normalized}`);
    },
  };

  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: dbMock };
  delete require.cache[controllerPath];
  const { cambiarContrasena } = require(controllerPath);

  t.after(() => {
    delete require.cache[controllerPath];
    if (originalController) require.cache[controllerPath] = originalController;
    if (originalDb) require.cache[dbPath] = originalDb;
    else delete require.cache[dbPath];
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  });

  let statusCode = 200;
  let responseBody;
  const req = {
    user: { id: usuario.id },
    body: { contrasena_actual: currentPassword, nueva_contrasena: newPassword },
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await cambiarContrasena(req, res);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.user.debe_cambiar_contrasena, false);
  assert.equal(await bcrypt.compare(newPassword, persistedHash), true);
  assert.equal(await bcrypt.compare(currentPassword, persistedHash), false);
  const tokenPayload = jwt.verify(responseBody.token, process.env.JWT_SECRET);
  assert.equal(tokenPayload.tv, 1);
});
