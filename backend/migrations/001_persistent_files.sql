-- Migración aditiva y segura para Neon/PostgreSQL.
-- No elimina ni transforma archivos o registros existentes.
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS foto_perfil_datos BYTEA;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS foto_perfil_tipo VARCHAR(100);

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS archivo_datos BYTEA;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS archivo_tipo VARCHAR(100);
