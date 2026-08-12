const isProduction = () => process.env.NODE_ENV === 'production';

const sslOptions = () => {
  if (process.env.DB_SSL === 'false') return false;
  if (process.env.DB_SSL === 'true' || process.env.DATABASE_URL || isProduction()) {
    return { rejectUnauthorized: false };
  }
  return false;
};

const connectionConfig = ({ includePoolOptions = false } = {}) => {
  const connectionString = process.env.DATABASE_URL?.trim();
  const base = connectionString
    ? { connectionString }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_DATABASE || 'core_rrhh',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : 5432,
      };

  if (!includePoolOptions) return { ...base, ssl: sslOptions() };
  return {
    ...base,
    ssl: sslOptions(),
    max: Number(process.env.DB_POOL_MAX || 20),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
  };
};

module.exports = { connectionConfig };
