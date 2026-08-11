const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizePerfilForViewer, MASK } = require('./perfilSanitizer');

describe('sanitizePerfilForViewer', () => {
  const fullPerfil = {
    id: 2,
    usuario_id: 5,
    nombres: 'Ana',
    apellidos: 'García',
    documento_identidad: '123456789',
    telefono: '3001234567',
    correo_personal: 'ana@gmail.com',
    correo: 'ana@empresa.com',
    fecha_nacimiento: '1990-05-01',
    contacto_emergencia: 'Pedro García',
    parentesco: 'Padre',
    telefono_emergencia: '3009876543',
    direccion: 'Calle 1 #2-3',
    salario: 2500000,
    departamento: 'Académico',
    descargas_mes_actual: 1,
    max_descargas_mes: 2,
  };

  it('returns full profile for the owner', () => {
    const result = sanitizePerfilForViewer(fullPerfil, 5, 2);
    assert.equal(result.contacto_emergencia, 'Pedro García');
    assert.equal(result.documento_identidad, '123456789');
    assert.equal(result.descargas_mes_actual, 1);
  });

  it('returns full profile for administrators', () => {
    const result = sanitizePerfilForViewer(fullPerfil, 99, 1);
    assert.equal(result.telefono_emergencia, '3009876543');
    assert.equal(result.correo, 'ana@empresa.com');
  });

  it('masks sensitive fields for other authenticated users', () => {
    const result = sanitizePerfilForViewer(fullPerfil, 10, 2);

    assert.equal(result.nombres, 'Ana');
    assert.equal(result.departamento, 'Académico');
    assert.equal(result.documento_identidad, MASK);
    assert.equal(result.telefono, MASK);
    assert.equal(result.correo_personal, MASK);
    assert.equal(result.correo, MASK);
    assert.equal(result.fecha_nacimiento, MASK);
    assert.equal(result.contacto_emergencia, MASK);
    assert.equal(result.parentesco, MASK);
    assert.equal(result.telefono_emergencia, MASK);
    assert.equal(result.direccion, MASK);
    assert.equal(result.salario, MASK);
    assert.equal(result.descargas_mes_actual, undefined);
    assert.equal(result.max_descargas_mes, undefined);
  });
});
