const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_DATE = /^(\d{4}-\d{2}-\d{2})T/;

const isValidIsoDate = (value) => {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const normalizeDateOnly = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string') return undefined;
  const candidate = ISO_DATE.test(value) ? value : value.match(ISO_TIMESTAMP_DATE)?.[1];
  return candidate && isValidIsoDate(candidate) ? candidate : undefined;
};

const normalizeEmployeeDates = (employee) => {
  if (!employee) return employee;
  const normalized = { ...employee };
  for (const field of [
    'fecha_ingreso', 'fecha_info_personal', 'fecha_soportes',
    'fecha_seguridad', 'fecha_terminacion', 'fecha_nacimiento',
  ]) {
    if (Object.hasOwn(normalized, field)) {
      const value = normalizeDateOnly(normalized[field]);
      if (value !== undefined) normalized[field] = value;
    }
  }
  return normalized;
};

const normalizeDateFields = (record, fields) => {
  if (!record) return record;
  const normalized = { ...record };
  for (const field of fields) {
    if (!Object.hasOwn(normalized, field)) continue;
    const value = normalizeDateOnly(normalized[field]);
    if (value !== undefined) normalized[field] = value;
  }
  return normalized;
};

const isDateRangeValid = (start, end) => {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return false;
  return start <= end;
};

const formatDateEsCo = (value) => {
  if (!isValidIsoDate(value)) return 'la fecha registrada';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00.000Z`));
};

module.exports = {
  isValidIsoDate,
  isDateRangeValid,
  normalizeDateOnly,
  normalizeEmployeeDates,
  normalizeDateFields,
  formatDateEsCo,
};
