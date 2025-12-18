# Sistema de Facturación - Railway

Aplicación web completa de facturación lista para desplegar en Railway.

## 📋 Estructura del Proyecto

```
facturacion-web-final/
├── server.js          → Backend Node.js con Express
├── package.json       → Dependencias del proyecto
├── public/
│   ├── index.html     → Página principal HTML
│   └── app.jsx        → Aplicación React (frontend)
└── README.md          → Este archivo
```

## 🚀 Despliegue en Railway

### Paso 1: Limpiar GitHub

1. Ve a https://github.com/jacklondon101/sistema-facturacion
2. **ELIMINA TODOS los archivos** del repositorio (puedes eliminar el repo completo y crear uno nuevo)

### Paso 2: Subir Proyecto Completo

**Opción A - Repositorio Nuevo (RECOMENDADO):**

1. En GitHub, crea un **nuevo repositorio** llamado `facturacion-railway`
2. Click en **"uploading an existing file"**
3. **Arrastra TODA la carpeta** descomprimida
4. **"Commit changes"**

**Opción B - Repositorio Existente:**

1. Ve a tu repositorio
2. Elimina TODOS los archivos actuales
3. Click en **"Add file"** → **"Upload files"**
4. Arrastra TODOS los archivos de la carpeta descomprimida
5. **"Commit changes"**

### Paso 3: Conectar con Railway

1. Ve a https://railway.app
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona tu repositorio
4. Railway desplegará automáticamente

### Paso 4: Generar Dominio

1. En Railway, ve a **Settings**
2. **Networking** → **"Generate Domain"**
3. ¡Listo! Abre la URL

## ✅ Verificación

Después de desplegar, verifica que:
- ✅ El sitio carga sin errores
- ✅ Puedes crear clientes
- ✅ Puedes crear servicios
- ✅ Puedes crear facturas
- ✅ Puedes descargar PDFs

## 🔧 Características

- Backend Node.js con Express
- Base de datos SQLite
- Frontend React moderno
- Generación de PDFs profesionales
- Diseño responsive
- Búsqueda en tiempo real

## 📞 Soporte

Si hay algún problema, verifica los logs en Railway.

## 📝 Licencia

MIT
