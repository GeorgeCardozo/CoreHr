const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const toDateOnly = (value) => {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const candidate = String(value).slice(0, 10);
  return DATE_ONLY.test(candidate) ? candidate : '';
};

export const todayDateOnly = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${value.year}-${value.month}-${value.day}`;
};

export const formatDateOnlyEsCo = (value, options = {}) => {
  const date = toDateOnly(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    ...options,
  }).format(new Date(`${date}T12:00:00`));
};
