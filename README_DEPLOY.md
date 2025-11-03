# Despliegue en Cloudflare Pages

## Estructura del Proyecto

Este proyecto está configurado para desplegarse en Cloudflare Pages con D1.

```
.
├── functions/
│   └── api/
│       ├── status.js       # GET /api/status
│       ├── whitelist.js    # GET /api/whitelist  
│       └── admin.js        # GET/POST /api/admin
├── admin.html              # Panel de administración
├── index.html              # Página de inicio
└── schema.sql              # Schema de D1
```

## Variables Requeridas

- `ADMIN_TOKEN`: Token para el panel admin (ej: MyBoost_IQ_1009)

## D1 Binding Requerido

- Variable: `DB`
- Database: `myboostiq-db`

## Endpoints

- GET `/api/status` - Estado actual (público)
- GET `/api/whitelist` - Lista de wallets (público)
- GET/POST `/api/admin` - Administración (protegido)
