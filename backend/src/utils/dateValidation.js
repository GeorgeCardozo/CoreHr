const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isValidIsoDate = (value) => {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
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

module.exports = { isValidIsoDate, isDateRangeValid, formatDateEsCo };
