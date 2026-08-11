const PDFDocument = require('pdfkit');
const { formatDateEsCo } = require('../utils/dateValidation');

const getInstitution = () => ({
  name: process.env.INSTITUTION_NAME || 'Gimnasio Los Arrayanes Bilingüe',
  city: process.env.INSTITUTION_CITY || 'Bogotá D.C.',
  contact: process.env.INSTITUTION_CONTACT || '',
});

const formatSalary = (salary) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(Number(salary || 0));

const buildCertificatePdf = (employee, { includeSalary = false } = {}) => new Promise((resolve, reject) => {
  const document = new PDFDocument({ margin: 50, size: 'A4', info: { Title: 'Certificación laboral CoreRRHH' } });
  const chunks = [];
  const institution = getInstitution();

  document.on('data', (chunk) => chunks.push(chunk));
  document.on('error', reject);
  document.on('end', () => resolve(Buffer.concat(chunks)));

  document
    .fillColor('#065f46')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(institution.name.toUpperCase(), { align: 'center' });

  document
    .fillColor('#475569')
    .fontSize(10)
    .font('Helvetica')
    .text(institution.contact ? `${institution.city} | ${institution.contact}` : institution.city, { align: 'center' });

  document.moveDown(2);
  document.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, document.y).lineTo(545, document.y).stroke();
  document.moveDown(3);

  document.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('CERTIFICACIÓN LABORAL', { align: 'center' });
  document.moveDown(2);

  const employeeName = `${employee.nombres} ${employee.apellidos}`.replace(/\s+/g, ' ').trim();
  const details = `La institución certifica que ${employeeName}, identificado(a) con documento ${employee.documento_identidad}, se encuentra vinculado(a) desempeñando el cargo de ${employee.cargo || 'Colaborador Institucional'}.\n\n` +
    `La fecha de ingreso registrada es ${formatDateEsCo(employee.fecha_ingreso)}.` +
    (includeSalary ? ` Actualmente devenga un salario básico mensual de ${formatSalary(employee.salario)}.` : '') +
    `\n\nSe expide la presente certificación a solicitud del interesado, en ${institution.city}, el ${formatDateEsCo(new Date().toISOString().slice(0, 10))}.`;

  document
    .fillColor('#334155')
    .fontSize(12)
    .font('Helvetica')
    .text(details, { align: 'justify', lineGap: 6, paragraphGap: 10 });

  document.moveDown(4);
  document.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('DEPARTAMENTO DE RECURSOS HUMANOS');
  document.fillColor('#475569').fontSize(10).font('Helvetica').text(institution.name);
  document.end();
});

module.exports = { buildCertificatePdf };
