const columnExists = async (client, tableName, columnName) => {
  const result = await client.query(
    `SELECT 1
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2`,
    [tableName, columnName]
  );

  return result.rows.length > 0;
};

const ensureColumn = async (client, tableName, columnName, definition) => {
  await client.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${definition}`);
};

const ensureSchema = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      nombre VARCHAR(50) UNIQUE NOT NULL
    )
  `);
  await client.query(`
    INSERT INTO roles (id, nombre) VALUES (1, 'Administrador'), (2, 'Empleado')
    ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      correo VARCHAR(255) UNIQUE NOT NULL,
      contrasena VARCHAR(255) NOT NULL,
      rol_id INTEGER NOT NULL DEFAULT 2 REFERENCES roles(id),
      google_id VARCHAR(255) UNIQUE
    )
  `);
  await ensureColumn(client, 'usuarios', 'google_id', 'VARCHAR(255)');
  await client.query(`UPDATE usuarios SET rol_id = 2 WHERE rol_id NOT IN (1, 2) OR rol_id IS NULL`);
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_rol_id_fkey'
      ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES roles(id);
      END IF;
    END $$
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS empleados (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
      documento_identidad VARCHAR(50) UNIQUE NOT NULL,
      nombres VARCHAR(100) NOT NULL,
      apellidos VARCHAR(100) NOT NULL,
      telefono VARCHAR(50),
      fecha_ingreso DATE DEFAULT CURRENT_DATE,
      departamento VARCHAR(100),
      habilidades TEXT[],
      fecha_info_personal DATE,
      fecha_soportes DATE,
      fecha_seguridad DATE,
      superior_inmediato VARCHAR(100),
      fecha_terminacion DATE,
      tipo_genero VARCHAR(50),
      fecha_nacimiento DATE,
      correo_personal VARCHAR(255),
      contacto_emergencia VARCHAR(100),
      parentesco VARCHAR(50),
      telefono_emergencia VARCHAR(50),
      direccion VARCHAR(255),
      foto_perfil VARCHAR(255)
    )
  `);

  const employeeColumns = {
    documento_identidad: 'VARCHAR(50)',
    nombres: 'VARCHAR(100)',
    apellidos: 'VARCHAR(100)',
    telefono: 'VARCHAR(50)',
    fecha_ingreso: 'DATE',
    departamento: 'VARCHAR(100)',
    habilidades: 'TEXT[]',
    fecha_info_personal: 'DATE',
    fecha_soportes: 'DATE',
    fecha_seguridad: 'DATE',
    superior_inmediato: 'VARCHAR(100)',
    fecha_terminacion: 'DATE',
    tipo_genero: 'VARCHAR(50)',
    fecha_nacimiento: 'DATE',
    correo_personal: 'VARCHAR(255)',
    contacto_emergencia: 'VARCHAR(100)',
    parentesco: 'VARCHAR(50)',
    telefono_emergencia: 'VARCHAR(50)',
    direccion: 'VARCHAR(255)',
    foto_perfil: 'VARCHAR(255)'
  };

  for (const [name, definition] of Object.entries(employeeColumns)) {
    await ensureColumn(client, 'empleados', name, definition);
  }

  if (await columnExists(client, 'empleados', 'nombre')) {
    await client.query(`UPDATE empleados SET nombres = COALESCE(NULLIF(nombres, ''), nombre)`);
  }
  if (await columnExists(client, 'empleados', 'apellido')) {
    await client.query(`UPDATE empleados SET apellidos = COALESCE(NULLIF(apellidos, ''), apellido)`);
  }
  await client.query(`UPDATE empleados SET nombres = 'Colaborador' WHERE nombres IS NULL OR btrim(nombres) = ''`);
  await client.query(`UPDATE empleados SET apellidos = 'RRHH' WHERE apellidos IS NULL OR btrim(apellidos) = ''`);
  await client.query(`UPDATE empleados SET documento_identidad = 'REG-' || id WHERE documento_identidad IS NULL OR btrim(documento_identidad) = ''`);
  await client.query(`ALTER TABLE empleados ALTER COLUMN nombres SET NOT NULL`);
  await client.query(`ALTER TABLE empleados ALTER COLUMN apellidos SET NOT NULL`);
  await client.query(`ALTER TABLE empleados ALTER COLUMN documento_identidad SET NOT NULL`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS contratos (
      id SERIAL PRIMARY KEY,
      empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
      tipo_contrato VARCHAR(100) NOT NULL,
      cargo VARCHAR(100),
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE,
      salario NUMERIC(12, 2) NOT NULL CHECK (salario >= 0),
      estado VARCHAR(50) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
      CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
    )
  `);
  await ensureColumn(client, 'contratos', 'cargo', 'VARCHAR(100)');
  await ensureColumn(client, 'contratos', 'estado', `VARCHAR(50) NOT NULL DEFAULT 'Activo'`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS descargas_certificados (
      id SERIAL PRIMARY KEY,
      empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
      fecha_descarga TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS solicitudes (
      id SERIAL PRIMARY KEY,
      empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
      tipo_solicitud VARCHAR(100) NOT NULL,
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE NOT NULL,
      motivo TEXT NOT NULL,
      archivo_adjunto VARCHAR(255),
      estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado')),
      comentarios_admin TEXT,
      fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (fecha_fin >= fecha_inicio)
    )
  `);
  await ensureColumn(client, 'solicitudes', 'archivo_adjunto', 'VARCHAR(255)');
  await ensureColumn(client, 'solicitudes', 'estado', `VARCHAR(50) NOT NULL DEFAULT 'Pendiente'`);
  await ensureColumn(client, 'solicitudes', 'comentarios_admin', 'TEXT');
  await ensureColumn(client, 'solicitudes', 'fecha_creacion', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');

  await client.query(`
    CREATE TABLE IF NOT EXISTS notificaciones (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      titulo VARCHAR(255) NOT NULL,
      mensaje TEXT NOT NULL,
      tipo VARCHAR(50) NOT NULL DEFAULT 'info',
      leido BOOLEAN NOT NULL DEFAULT FALSE,
      enlace VARCHAR(255),
      fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query('CREATE INDEX IF NOT EXISTS idx_empleados_usuario_id ON empleados(usuario_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_contratos_empleado_estado ON contratos(empleado_id, estado)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_solicitudes_empleado_fecha ON solicitudes(empleado_id, fecha_creacion DESC)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leido ON notificaciones(usuario_id, leido, fecha_creacion DESC)');
};

module.exports = { ensureSchema };
