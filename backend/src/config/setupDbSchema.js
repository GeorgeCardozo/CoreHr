const { Client } = require('pg');
const path = require('path');
const { ensureSchema } = require('./schema');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectionConfig } = require('./databaseOptions');

const main = async () => {
  const client = new Client(connectionConfig());
  try {
    await client.connect();
    await ensureSchema(client);
    console.log('Esquema de base de datos verificado y actualizado sin borrar información.');
  } catch (error) {
    console.error('Error al actualizar el esquema:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

if (require.main === module) main();

module.exports = { main };
