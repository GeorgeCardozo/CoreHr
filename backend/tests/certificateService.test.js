const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCertificatePdf } = require('../src/services/certificateService');

test('buildCertificatePdf genera un PDF válido sin depender del HTTP response', async () => {
  const pdf = await buildCertificatePdf({
    nombres: 'Ana',
    apellidos: 'García',
    documento_identidad: '1234567890',
    fecha_ingreso: '2026-01-15',
    cargo: 'Docente',
    salario: 3000000,
  });
  assert.ok(Buffer.isBuffer(pdf));
  assert.ok(pdf.length > 1000);
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
});
