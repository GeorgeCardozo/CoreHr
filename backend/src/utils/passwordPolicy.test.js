const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePassword } = require('./passwordPolicy');

test('la política de contraseña exige longitud y complejidad mínimas', () => {
  assert.equal(validatePassword('Corta1').valid, false);
  assert.equal(validatePassword('solominusculas123').valid, false);
  assert.equal(validatePassword('MAYUSCULAS123').valid, false);
  assert.equal(validatePassword('ClaveTemporal123').valid, true);
});
