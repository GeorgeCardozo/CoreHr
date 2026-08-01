# CoreRRHH

Aplicativo web local para centralizar la información de colaboradores y automatizar procesos de Gestión Humana del Gimnasio Los Arrayanes Bilingüe.

## Componentes

- Backend: Node.js, Express, JWT/RBAC, PostgreSQL y generación de certificados PDF.
- Frontend: React, Vite y Tailwind CSS.
- Roles: `1` Administrador y `2` Empleado.
- Los soportes de solicitudes se almacenan fuera de la carpeta pública y se consultan con autorización JWT.

## Puesta en marcha local

1. Copia `backend/.env.example` como `backend/.env` y configura PostgreSQL, `JWT_SECRET` y, si se desea, las variables `SEED_ADMIN_*`.
2. Instala dependencias desde la raíz y desde cada aplicación:

   ```bash
   npm install
   npm --prefix backend install
   npm --prefix frontend install
   ```

3. Inicializa la base de datos sin borrar información existente:

   ```bash
   npm run init-db
   ```

4. Ejecuta backend y frontend en terminales separadas:

   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

El frontend usa `/api` y el proxy de Vite en desarrollo. Para una instalación on-premise, puede definirse `VITE_API_URL` en `frontend/.env` con la URL completa del backend, por ejemplo `http://servidor-local:3000/api`.

## Verificaciones

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

El script de esquema es idempotente: crea tablas, índices y relaciones faltantes, pero no elimina tablas ni registros.
