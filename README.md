# CoreRRHH

Aplicativo on-premise para centralizar la información de colaboradores y automatizar la expedición de certificaciones laborales del Gimnasio Los Arrayanes Bilingüe.

## Alcance implementado

- Backend Node.js/Express y PostgreSQL; frontend React/Vite/Tailwind CSS.
- Autenticación JWT y RBAC: solo el rol Administrador consulta contratos y salarios.
- Perfil de empleado con actualización de datos personales permitidos y controles de privacidad por campo.
- Gestión administrativa de colaboradores, contratos, solicitudes y soportes protegidos.
- Certificación laboral PDF inmediata desde el perfil; no expone salario al empleado.
- Directorio con perfiles públicos entre colaboradores: cargo y datos institucionales visibles, preferencias personales opt-in y términos contractuales siempre restringidos.

## Puesta en marcha local

1. Copia [backend/.env.example](backend/.env.example) a `backend/.env`, crea un `JWT_SECRET` aleatorio de al menos 32 caracteres y configura PostgreSQL.
2. Instala las dependencias:

   ```bash
   npm install
   npm --prefix backend install
   npm --prefix frontend install
   ```

3. Inicializa el esquema de forma idempotente:

   ```bash
   npm run init-db
   ```

   El inicializador agrega las tablas, columnas e índices faltantes; no elimina tablas ni registros.

4. Ejecuta los procesos en terminales separadas:

   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

## Pruebas y compilación

```bash
npm --prefix backend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend audit --omit=dev --audit-level=high
npm --prefix frontend audit --omit=dev --audit-level=high
```

## Despliegue en Neon, Render y Vercel

- Neon: configure `DATABASE_URL` en Render. El arranque ejecuta una migración idempotente que agrega estructura faltante y nunca elimina registros. Para aplicar solo la migración de archivos persistentes manualmente: `psql "$DATABASE_URL" -f backend/migrations/001_persistent_files.sql`.
- Render: use el `render.yaml` de la raíz, establezca `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGINS=https://core-hr-five.vercel.app` y `GOOGLE_CLIENT_ID`. La comprobación `/health` valida también la conexión con PostgreSQL.
- Vercel: importe el repositorio con `frontend` como Root Directory, use `npm run build`, `dist` como Output Directory y configure `VITE_API_URL=https://corehr-g5kz.onrender.com/api` y `VITE_GOOGLE_CLIENT_ID`. `frontend/vercel.json` resuelve las rutas SPA.
- Google Cloud: registre `https://core-hr-five.vercel.app` como origen JavaScript autorizado y utilice el mismo Client ID web en frontend y backend. El backend limita las cuentas a `GOOGLE_ALLOWED_DOMAIN`.

Las fotos de perfil y soportes nuevos se guardan en PostgreSQL para sobrevivir reinicios de Render. Los archivos antiguos que ya se perdieron del disco efímero no pueden reconstruirse y deben cargarse nuevamente.

### Migración manual de fotos históricas

El comando es una simulación de solo lectura mientras no se agregue `--apply`:

```bash
cd backend
npm run migrate-profile-images
```

Revise `backend/scratch/profile-image-migration-report.json`. Para migrar contra la conexión configurada sin sobrescribir fotos que ya estén en BYTEA:

```bash
npm run migrate-profile-images -- --apply
```

`DATABASE_URL` tiene prioridad sobre `DB_*`. `--overwrite` existe para una corrección deliberada, requiere `--apply` y no debe usarse en la primera ejecución. El script no cambia `foto_perfil`, no borra archivos y ejecutarlo nuevamente omite las fotos ya persistidas.

Para Neon desde PowerShell, asigne temporalmente la URL copiada del panel, simule, revise el reporte y solo entonces aplique:

```powershell
$env:DATABASE_URL = 'postgresql://...'
npm run migrate
npm run migrate-profile-images
npm run migrate-profile-images -- --apply
Remove-Item Env:DATABASE_URL
```

La URL contiene credenciales: no la guarde en Git ni en el historial compartido. El análisis local reproducible de los archivos incluidos en este equipo está en `backend/reports/profile-image-migration-analysis.json`.

## Lista mínima antes de producción local

- Definir `NODE_ENV=production`, `CORS_ORIGINS` con los orígenes reales y un `JWT_SECRET` único. No reutilizar valores de ejemplo.
- Publicar frontend y API detrás de HTTPS mediante el proxy o servidor institucional; no exponer PostgreSQL ni el puerto de la API a Internet.
- Establecer respaldos cifrados de PostgreSQL, retención de soportes y procedimiento de restauración probado.
- Configurar la política institucional de tratamiento de datos, los canales de atención de titulares y los datos oficiales que aparecerán en certificados (`INSTITUTION_*`).
- Entregar contraseñas temporales por un canal seguro. CoreRRHH nunca las envía por correo y obliga el cambio en el primer acceso.
- Restringir físicamente el servidor, limitar las cuentas administradoras y registrar el responsable de cada despliegue.

Las guías internas de la aplicación no emiten conceptos legales ni cálculos de nómina; las novedades laborales deben validarse con Gestión Humana.
