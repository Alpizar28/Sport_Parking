# 🔐 CONFIGURACIÓN DE VARIABLES DE ENTORNO PARA VERCEL

## 📋 VARIABLES REQUERIDAS

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Valor:** Tu URL de Supabase (ejemplo: `https://eplpppndxyjsszrulfzb.supabase.co`)
- **Tipo:** ✅ Público (puede exponerse al cliente)
- **Sensible:** ❌ NO
- **Entornos:** Production, Preview, Development
- **Dónde encontrarlo:**
  1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
  2. Selecciona tu proyecto
  3. Settings → API
  4. Copia "Project URL"

---

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Valor:** Tu clave anónima de Supabase (ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- **Tipo:** ✅ Público (puede exponerse al cliente)
- **Sensible:** ❌ NO (está protegida por RLS)
- **Entornos:** Production, Preview, Development
- **Dónde encontrarlo:**
  1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
  2. Selecciona tu proyecto
  3. Settings → API
  4. Copia "anon public" key

---

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Valor:** Tu clave de servicio de Supabase (ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- **Tipo:** 🔒 PRIVADO (NUNCA exponer al cliente)
- **Sensible:** ✅ SÍ - **MARCAR COMO SENSIBLE EN VERCEL**
- **Entornos:** Production, Preview, Development
- **Dónde encontrarlo:**
  1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
  2. Selecciona tu proyecto
  3. Settings → API
  4. Copia "service_role" key
- **⚠️ CRÍTICO:** Esta clave bypasea RLS. Solo usar server-side.

---

### 4. NEXT_PUBLIC_SITE_URL
- **Valor:** URL de tu sitio en producción (ejemplo: `https://sport-parking.vercel.app`)
- **Tipo:** ✅ Público
- **Sensible:** ❌ NO
- **Entornos:** 
  - Production: `https://tu-dominio.com` o `https://tu-app.vercel.app`
  - Preview: `https://$VERCEL_URL` (Vercel lo reemplaza automáticamente)
  - Development: `http://localhost:3000`
- **Uso:** Callbacks de autenticación, reset de contraseña

---

### 5. CRON_SECRET (Opcional pero recomendado)
- **Valor:** Una cadena aleatoria segura (ejemplo: `cron_secret_abc123xyz789`)
- **Tipo:** 🔒 PRIVADO
- **Sensible:** ✅ SÍ - **MARCAR COMO SENSIBLE EN VERCEL**
- **Entornos:** Production
- **Generar:** `openssl rand -base64 32` o usar generador de contraseñas
- **Uso:** Proteger el endpoint `/api/cron/expire-holds`

---

## 🚀 CÓMO CONFIGURAR EN VERCEL

### Opción 1: Dashboard de Vercel (Recomendado)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **Settings** → **Environment Variables**
3. Agrega cada variable una por una:

#### Para cada variable:
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://eplpppndxyjsszrulfzb.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
```

#### ⚠️ IMPORTANTE para variables sensibles:
- `SUPABASE_SERVICE_ROLE_KEY`: Marcar como **"Sensitive"** ✓
- `CRON_SECRET`: Marcar como **"Sensitive"** ✓

---

### Opción 2: Vercel CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login
vercel login

# Link tu proyecto
vercel link

# Agregar variables de entorno
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Pegar valor cuando te lo pida
# Seleccionar entornos: Production, Preview, Development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel env add CRON_SECRET

# Verificar
vercel env ls
```

---

## 📝 CONFIGURACIÓN COMPLETA PASO A PASO

### 1. Preparar valores

Crea un archivo temporal (NO LO SUBAS A GIT) con tus valores:

```bash
# temp-env-values.txt (NO SUBIR A GIT)

NEXT_PUBLIC_SUPABASE_URL=https://eplpppndxyjsszrulfzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=https://sport-parking.vercel.app
CRON_SECRET=tu_cron_secret_aqui
```

### 2. Configurar en Vercel Dashboard

| Variable | Valor | Sensible | Production | Preview | Development |
|----------|-------|----------|------------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Tu URL | ❌ | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key | ❌ | ✓ | ✓ | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | Tu service key | ✅ | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_SITE_URL` | Ver abajo | ❌ | ✓ | ✓ | ✓ |
| `CRON_SECRET` | Random string | ✅ | ✓ | - | - |

#### Valores específicos para `NEXT_PUBLIC_SITE_URL`:

- **Production:** `https://sport-parking.vercel.app` (o tu dominio custom)
- **Preview:** `https://$VERCEL_URL` (Vercel lo reemplaza automáticamente)
- **Development:** `http://localhost:3000`

---

## 🔒 CONFIGURACIÓN DE SUPABASE AUTH

Después de configurar las variables en Vercel, actualiza Supabase:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. **Authentication** → **URL Configuration**
4. Agrega estas URLs:

### Site URL
```
https://sport-parking.vercel.app
```

### Redirect URLs (una por línea)
```
https://sport-parking.vercel.app/auth/callback
https://sport-parking.vercel.app/update-password
http://localhost:3000/auth/callback
http://localhost:3000/update-password
```

Si tienes dominio custom, agrégalo también:
```
https://tu-dominio.com/auth/callback
https://tu-dominio.com/update-password
```

---

## ✅ VERIFICACIÓN

### 1. Verificar que las variables estén configuradas

```bash
# En tu terminal local
vercel env ls

# Deberías ver:
# NEXT_PUBLIC_SUPABASE_URL (Production, Preview, Development)
# NEXT_PUBLIC_SUPABASE_ANON_KEY (Production, Preview, Development)
# SUPABASE_SERVICE_ROLE_KEY (Production, Preview, Development) [Sensitive]
# NEXT_PUBLIC_SITE_URL (Production, Preview, Development)
# CRON_SECRET (Production) [Sensitive]
```

### 2. Hacer un deployment de prueba

```bash
# Deployment de prueba (preview)
vercel

# Deployment a producción
vercel --prod
```

### 3. Verificar en el navegador

1. Ve a tu URL de Vercel
2. Abre DevTools → Console
3. Ejecuta:
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// Debería mostrar tu URL de Supabase

console.log(process.env.SUPABASE_SERVICE_ROLE_KEY)
// Debería mostrar undefined (no debe estar expuesto al cliente)
```

---

## 🚨 SEGURIDAD

### ✅ CORRECTO:
- Variables `NEXT_PUBLIC_*` pueden estar en el cliente
- `SUPABASE_SERVICE_ROLE_KEY` marcada como "Sensitive"
- `CRON_SECRET` solo en Production
- Diferentes valores para Production/Preview/Development

### ❌ INCORRECTO:
- Exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente
- Usar mismas credenciales para dev y producción
- Commitear `.env.local` a Git
- Compartir `CRON_SECRET` públicamente

---

## 🔄 ROTACIÓN DE CLAVES

Si necesitas rotar las claves:

1. **Generar nuevas claves en Supabase:**
   - Settings → API → "Generate new service_role key"

2. **Actualizar en Vercel:**
   - Settings → Environment Variables
   - Editar `SUPABASE_SERVICE_ROLE_KEY`
   - Pegar nueva clave

3. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

## 📞 SOPORTE

Si tienes problemas:

1. **Vercel:** https://vercel.com/support
2. **Supabase:** https://supabase.com/support
3. **Documentación:** 
   - https://vercel.com/docs/environment-variables
   - https://supabase.com/docs/guides/auth

---

## 📋 CHECKLIST FINAL

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada y marcada como Sensible
- [ ] `NEXT_PUBLIC_SITE_URL` configurada para cada entorno
- [ ] `CRON_SECRET` generada y configurada
- [ ] Redirect URLs actualizadas en Supabase
- [ ] Deployment de prueba exitoso
- [ ] Verificación en navegador completada
- [ ] Archivo temporal con valores eliminado

---

**Última actualización:** 2026-01-27
