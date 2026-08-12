const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { connectionConfig } = require('../src/config/databaseOptions');
const { detectImageMime } = require('../src/utils/imageMime');
const { legacyProfilePhotoFilename } = require('../src/utils/profilePhoto');

const DEFAULT_PHOTOS_DIR = path.resolve(__dirname, '../uploads/perfiles');
const DEFAULT_REPORT_PATH = path.resolve(__dirname, '../scratch/profile-image-migration-report.json');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif']);

const parseArguments = (argv) => {
  const options = {
    apply: false,
    overwrite: false,
    photosDir: DEFAULT_PHOTOS_DIR,
    reportPath: DEFAULT_REPORT_PATH,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') options.apply = true;
    else if (argument === '--overwrite') options.overwrite = true;
    else if (argument === '--photos-dir') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--photos-dir requiere una ruta.');
      options.photosDir = path.resolve(value);
    } else if (argument === '--report') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--report requiere una ruta.');
      options.reportPath = path.resolve(value);
    }
    else if (argument === '--help') options.help = true;
    else throw new Error(`Argumento desconocido: ${argument}`);
  }
  if (options.overwrite && !options.apply) throw new Error('--overwrite requiere --apply.');
  return options;
};

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const scanPhotoFiles = async (photosDir) => {
  const entries = await fs.readdir(photosDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile() || !IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    const absolutePath = path.join(photosDir, entry.name);
    const bytes = await fs.readFile(absolutePath);
    files.push({
      name: entry.name,
      normalizedName: entry.name.toLowerCase(),
      absolutePath,
      size: bytes.length,
      mime: detectImageMime(bytes),
      hash: sha256(bytes),
      bytes,
    });
  }
  return files;
};

const buildIndexes = (files) => {
  const byName = new Map();
  const byDocument = new Map();
  const byHash = new Map();
  for (const file of files) {
    byName.set(file.normalizedName, file);
    const documentMatch = file.name.match(/^foto-(\d{5,12})\.(?:jpe?g|png|webp|gif|bmp|avif)$/i);
    if (documentMatch) {
      const values = byDocument.get(documentMatch[1]) || [];
      values.push(file);
      byDocument.set(documentMatch[1], values);
    }
    const hashValues = byHash.get(file.hash) || [];
    hashValues.push(file);
    byHash.set(file.hash, hashValues);
  }
  return { byName, byDocument, byHash };
};

const locatePhoto = (employee, indexes) => {
  const storedName = legacyProfilePhotoFilename(employee.foto_perfil);
  const exact = storedName ? indexes.byName.get(storedName.toLowerCase()) : null;
  if (exact) return { file: exact, method: 'ruta_foto_perfil' };

  const document = String(employee.documento_identidad || '').trim();
  const candidates = indexes.byDocument.get(document) || [];
  if (candidates.length === 1) return { file: candidates[0], method: 'documento_identidad' };
  if (candidates.length > 1 && new Set(candidates.map((candidate) => candidate.hash)).size === 1) {
    return { file: candidates.sort((a, b) => a.name.localeCompare(b.name))[0], method: 'documento_identidad_duplicado_identico' };
  }
  if (candidates.length > 1) return { ambiguous: candidates.map((candidate) => candidate.name) };
  return {};
};

const buildPlan = (employees, files) => {
  const indexes = buildIndexes(files);
  const matchedFileNames = new Set();
  const selectedFileNames = new Set();
  const rows = [];
  for (const employee of employees) {
    const located = locatePhoto(employee, indexes);
    if (located.file) {
      selectedFileNames.add(located.file.name);
      for (const duplicate of indexes.byHash.get(located.file.hash) || []) matchedFileNames.add(duplicate.name);
    }
    const document = String(employee.documento_identidad || '').trim();
    for (const candidate of indexes.byDocument.get(document) || []) matchedFileNames.add(candidate.name);
    rows.push({ employee, ...located });
  }

  return {
    rows,
    associatedAlternatives: files
      .filter((file) => matchedFileNames.has(file.name) && !selectedFileNames.has(file.name))
      .map(({ name, size, mime, hash }) => ({ archivo: name, bytes: size, mime, sha256: hash })),
    unassociatedFiles: files
      .filter((file) => !matchedFileNames.has(file.name))
      .map(({ name, size, mime, hash }) => ({ archivo: name, bytes: size, mime, sha256: hash })),
  };
};

const createReport = ({ options, employees, files, plan, migrated = [], errors = [] }) => {
  const found = plan.rows.filter((row) => row.file);
  const alreadyStored = found.filter((row) => row.employee.tiene_foto_perfil);
  const invalid = found.filter((row) => !row.file.mime);
  const eligible = found.filter((row) => row.file.mime && (!row.employee.tiene_foto_perfil || options.overwrite));
  const missing = plan.rows.filter((row) => !row.file && !row.ambiguous);
  const ambiguous = plan.rows.filter((row) => row.ambiguous);
  return {
    generado_en: new Date().toISOString(),
    modo: options.apply ? 'aplicado' : 'simulacion',
    sobrescritura_habilitada: options.overwrite,
    directorio_fotos: options.photosDir,
    resumen: {
      total_empleados: employees.length,
      archivos_detectados: files.length,
      fotos_encontradas_para_empleados: found.length,
      fotos_elegibles_para_migrar: eligible.length,
      fotos_migradas: migrated.length,
      fotos_existentes_omitidas: options.overwrite ? 0 : alreadyStored.length,
      empleados_sin_foto: missing.length,
      asociaciones_ambiguas: ambiguous.length,
      archivos_con_formato_no_reconocido: invalid.length,
      archivos_asociados_no_seleccionados: plan.associatedAlternatives.length,
      archivos_sin_empleado_asociado: plan.unassociatedFiles.length,
      errores: errors.length,
    },
    empleados_sin_foto: missing.map(({ employee }) => ({
      id: employee.id,
      documento_identidad: employee.documento_identidad,
      nombre: `${employee.nombres} ${employee.apellidos}`.trim(),
      foto_perfil: employee.foto_perfil,
    })),
    asociaciones_ambiguas: ambiguous.map(({ employee, ambiguous: candidates }) => ({
      id: employee.id,
      documento_identidad: employee.documento_identidad,
      nombre: `${employee.nombres} ${employee.apellidos}`.trim(),
      candidatos: candidates,
    })),
    archivos_con_formato_no_reconocido: invalid.map(({ employee, file }) => ({ empleado_id: employee.id, archivo: file.name })),
    archivos_asociados_no_seleccionados: plan.associatedAlternatives,
    archivos_sin_empleado_asociado: plan.unassociatedFiles,
    migradas: migrated,
    errores: errors,
  };
};

const printSummary = (report) => {
  const summary = report.resumen;
  console.log('\nMigración histórica de fotos de perfil');
  console.log(`Modo: ${report.modo}`);
  console.log(`Total empleados: ${summary.total_empleados}`);
  console.log(`Archivos detectados: ${summary.archivos_detectados}`);
  console.log(`Fotos encontradas: ${summary.fotos_encontradas_para_empleados}`);
  console.log(`Fotos elegibles para migrar: ${summary.fotos_elegibles_para_migrar}`);
  console.log(`Fotos migradas: ${summary.fotos_migradas}`);
  console.log(`Fotos ya existentes/omitidas: ${summary.fotos_existentes_omitidas}`);
  console.log(`Empleados sin foto: ${summary.empleados_sin_foto}`);
  console.log(`Asociaciones ambiguas: ${summary.asociaciones_ambiguas}`);
  console.log(`Archivos con formato no reconocido: ${summary.archivos_con_formato_no_reconocido}`);
  console.log(`Archivos asociados alternativos/duplicados: ${summary.archivos_asociados_no_seleccionados}`);
  console.log(`Archivos sin empleado asociado: ${summary.archivos_sin_empleado_asociado}`);
  console.log(`Errores: ${summary.errores}`);
};

const applyPlan = async (pool, plan, overwrite) => {
  const migrated = [];
  const errors = [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of plan.rows) {
      if (!row.file || (row.employee.tiene_foto_perfil && !overwrite)) continue;
      if (!row.file.mime) {
        errors.push({ empleado_id: row.employee.id, archivo: row.file.name, error: 'Formato de imagen no reconocido.' });
        continue;
      }
      const savepoint = `profile_photo_${Number(row.employee.id)}`;
      try {
        await client.query(`SAVEPOINT ${savepoint}`);
        const result = await client.query(
          `UPDATE empleados
              SET foto_perfil_datos = $1, foto_perfil_tipo = $2
            WHERE id = $3 AND ($4::boolean OR foto_perfil_datos IS NULL)
            RETURNING id`,
          [row.file.bytes, row.file.mime, row.employee.id, overwrite]
        );
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        if (result.rowCount === 1) {
          migrated.push({ empleado_id: row.employee.id, archivo: row.file.name, mime: row.file.mime, bytes: row.file.size, metodo: row.method });
        }
      } catch (error) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        errors.push({ empleado_id: row.employee.id, archivo: row.file.name, error: error.message });
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return { migrated, errors };
};

const run = async (argv = process.argv.slice(2)) => {
  const options = parseArguments(argv);
  if (options.help) {
    console.log('Uso: npm run migrate-profile-images -- [--apply] [--overwrite] [--photos-dir RUTA] [--report RUTA]');
    console.log('Sin --apply se ejecuta una simulación que no modifica PostgreSQL.');
    return null;
  }

  const files = await scanPhotoFiles(options.photosDir);
  const pool = new Pool(connectionConfig({ includePoolOptions: true }));
  try {
    const schema = await pool.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'empleados'
          AND column_name IN ('foto_perfil_datos', 'foto_perfil_tipo')`
    );
    if (schema.rowCount !== 2) {
      throw new Error('Faltan las columnas foto_perfil_datos/foto_perfil_tipo. Ejecute npm run migrate antes de esta migración histórica.');
    }
    const result = await pool.query(
      `SELECT id, documento_identidad, nombres, apellidos, foto_perfil,
              (foto_perfil_datos IS NOT NULL) AS tiene_foto_perfil, foto_perfil_tipo
         FROM empleados ORDER BY id`
    );
    const plan = buildPlan(result.rows, files);
    const outcome = options.apply ? await applyPlan(pool, plan, options.overwrite) : { migrated: [], errors: [] };
    const report = createReport({ options, employees: result.rows, files, plan, ...outcome });
    await fs.mkdir(path.dirname(options.reportPath), { recursive: true });
    await fs.writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    printSummary(report);
    console.log(`Reporte: ${options.reportPath}`);
    if (!options.apply) console.log('Simulación terminada: no se realizaron escrituras. Use --apply después de revisar el reporte.');
    if (report.resumen.errores > 0) process.exitCode = 1;
    return report;
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  run().catch((error) => {
    console.error('No fue posible completar la migración:', error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  parseArguments,
  fileNameFromStoredPath: legacyProfilePhotoFilename,
  scanPhotoFiles,
  buildIndexes,
  locatePhoto,
  buildPlan,
  createReport,
  applyPlan,
  run,
};
