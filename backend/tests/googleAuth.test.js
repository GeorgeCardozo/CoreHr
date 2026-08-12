const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedGooglePayload } = require('../src/controllers/authController');

test('Google OAuth solo admite correos verificados del dominio institucional exacto', () => {
  assert.equal(isAllowedGooglePayload({ email: 'persona@gla.edu.co', email_verified: true }, 'gla.edu.co'), true);
  assert.equal(isAllowedGooglePayload({ email: 'persona@sub.gla.edu.co', email_verified: true }, 'gla.edu.co'), false);
  assert.equal(isAllowedGooglePayload({ email: 'persona@gla.edu.co.attacker.test', email_verified: true }, 'gla.edu.co'), false);
  assert.equal(isAllowedGooglePayload({ email: 'persona@gla.edu.co', email_verified: false }, 'gla.edu.co'), false);
});
