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

## Lista mínima antes de producción local

- Definir `NODE_ENV=production`, `CORS_ORIGINS` con los orígenes reales y un `JWT_SECRET` único. No reutilizar valores de ejemplo.
- Publicar frontend y API detrás de HTTPS mediante el proxy o servidor institucional; no exponer PostgreSQL ni el puerto de la API a Internet.
- Establecer respaldos cifrados de PostgreSQL, retención de soportes y procedimiento de restauración probado.
- Configurar la política institucional de tratamiento de datos, los canales de atención de titulares y los datos oficiales que aparecerán en certificados (`INSTITUTION_*`).
- Entregar contraseñas temporales por un canal seguro. CoreRRHH nunca las envía por correo y obliga el cambio en el primer acceso.
- Restringir físicamente el servidor, limitar las cuentas administradoras y registrar el responsable de cada despliegue.

Las guías internas de la aplicación no emiten conceptos legales ni cálculos de nómina; las novedades laborales deben validarse con Gestión Humana.
