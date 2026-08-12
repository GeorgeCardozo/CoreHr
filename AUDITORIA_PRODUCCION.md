# Auditoría y preparación de producción de CoreRRHH

Fecha de revisión: 12 de agosto de 2026.

## Estado ejecutivo

El código queda preparado para PostgreSQL local o Neon, backend en Render y frontend React/Vite en Vercel. Se corrigieron dos causas de pérdida de estado que afectaban directamente el uso real: el seed administrativo volvía a activar el cambio obligatorio de contraseña en cada inicialización, y las imágenes/soportes se guardaban en el filesystem efímero de Render.

La base local configurada fue migrada con operaciones aditivas y respondió correctamente al nuevo health check. No se ejecutaron escrituras sobre Neon ni se modificaron cuentas o datos del entorno productivo.

## Hallazgos corregidos

### Contraseña de primer ingreso

- El seed ya no modifica una cuenta administrativa existente, no reactiva usuarios, no cambia su hash y no restaura `debe_cambiar_contrasena`.
- La contraseña de seed solo es necesaria para crear la cuenta inicial y puede retirarse después del entorno.
- El backend continúa tomando la bandera desde PostgreSQL en `/api/auth/me` y el cambio exitoso la persiste en `false`, incrementa `token_version` y entrega un JWT nuevo.
- Un error 401 por escribir mal la contraseña actual ya no provoca un cierre de sesión automático en el frontend.

### Fotos y soportes

- Las nuevas fotos y los adjuntos se reciben en memoria y se persisten como `BYTEA` junto con su MIME en PostgreSQL.
- La foto se sirve desde `/api/empleados/:id/foto`; los soportes conservan autorización de administrador o titular en `/api/solicitudes/:id/adjunto`.
- Las respuestas JSON eliminan binarios y las listas de solicitudes ya no seleccionan blobs, evitando carga de memoria y transferencia innecesaria.
- Se conserva lectura del filesystem para soportes antiguos que todavía existan. Los archivos antiguos ya borrados por reinicios de Render deben cargarse de nuevo.

### Neon, Render y Vercel

- El backend acepta `DATABASE_URL` con SSL para Neon y mantiene variables `DB_*` para desarrollo local.
- `npm start` ejecuta primero la migración idempotente del esquema y falla antes de levantar la API si PostgreSQL no está disponible.
- `/health` comprueba la conexión a la base y responde 503 cuando está degradada.
- CORS normaliza barras finales, limita métodos/cabeceras y acepta únicamente los orígenes configurados.
- Se añadió `render.yaml` y una reescritura SPA en `frontend/vercel.json`.
- La URL de API del frontend se normaliza y añade `/api` si fue omitido.

### Google OAuth

- El backend usa exclusivamente `GOOGLE_CLIENT_ID`; una variable Vite nunca se interpreta como secreto/configuración del servidor.
- Se verifica el ID token contra el audience configurado, `email_verified`, el dominio institucional exacto y la existencia/actividad de la cuenta local.
- Si no existe Client ID en el frontend, el formulario tradicional sigue funcionando y no se monta un proveedor de Google inválido.

## Migración aditiva

La migración `backend/migrations/001_persistent_files.sql` solo agrega cuatro columnas mediante `ADD COLUMN IF NOT EXISTS`:

- `empleados.foto_perfil_datos`
- `empleados.foto_perfil_tipo`
- `solicitudes.archivo_datos`
- `solicitudes.archivo_tipo`

No elimina tablas, columnas ni registros. El mismo cambio forma parte del inicializador idempotente ejecutado por Render.

## Variables de producción

Render debe definir como mínimo:

- `NODE_ENV=production`
- `DATABASE_URL` con la URL de Neon
- `JWT_SECRET` aleatorio de al menos 32 caracteres
- `CORS_ORIGINS=https://core-hr-five.vercel.app`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_ALLOWED_DOMAIN=gla.edu.co`
- `TRUST_PROXY=true`

Vercel, con `frontend` como Root Directory, debe definir:

- `VITE_API_URL=https://corehr-g5kz.onrender.com/api`
- `VITE_GOOGLE_CLIENT_ID` con el mismo Client ID web

En Google Cloud debe registrarse `https://core-hr-five.vercel.app` como origen JavaScript autorizado.

## Resultado de validación

- 28 pruebas backend: aprobadas.
- ESLint frontend: aprobado.
- Build de producción Vite: aprobado.
- Auditoría npm de dependencias productivas backend/frontend: 0 vulnerabilidades.
- Migración sobre PostgreSQL local configurado: aprobada y sin borrado de datos.
- Arranque real local y `/health`: HTTP 200, base conectada.
- Render público: HTTP 200 y CORS acepta el dominio estable, pero aún ejecuta la versión anterior (`/health` no incluye el estado de base).
- Vercel público: 404 `NOT_FOUND` de infraestructura; la solicitud no alcanza la aplicación React.

## Acciones externas pendientes

1. Publicar estos cambios en la rama conectada a Render y Vercel.
2. En Render, cargar las variables anteriores y redeplegar; comprobar que `/health` responda `{"status":"ok","database":"connected"}`.
3. En Vercel, verificar Production Branch, Root Directory `frontend`, Build Command `npm run build`, Output Directory `dist` y asociar el dominio `core-hr-five.vercel.app` al deployment de producción.
4. Confirmar en Google Cloud el origen estable y el mismo Client ID en ambos servicios.
5. Volver a cargar fotos o soportes históricos que ya se hayan perdido del disco efímero.

El repositorio no fue publicado ni se alteró la base productiva durante esta auditoría.
