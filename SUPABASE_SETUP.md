# Cloud Chat Sync con Supabase - Guía de Configuración

## ¿Por qué Supabase?

El sistema actual guarda las conversaciones solo en `localStorage`, lo que significa que:
- ❌ Si cambias de navegador, pierdes el historial
- ❌ Si limpias la caché, pierdes todo
- ❌ No hay sincronización entre dispositivos

Con Supabase (gratis para siempre en el tier gratuito):
- ✅ Historial persistente en la nube
- ✅ Sincronización automática entre dispositivos
- ✅ Backup automático de todas tus conversaciones
- ✅ Acceso desde cualquier navegador

## Configuración (5 minutos)

### 1. Crear cuenta en Supabase (Gratis)
1. Ve a https://supabase.com
2. Click en "Start your project" o "Sign In"
3. Crea una cuenta con GitHub, Google, o email

### 2. Crear un proyecto
1. Click en "New Project"
2. Nombre: `primekg-chat` (o el que prefieras)
3. Database Password: genera una segura (la necesitarás después)
4. Region: elige la más cercana (por ejemplo, `South America (São Paulo)`)
5. Click "Create new project" (tarda 1-2 minutos)

### 3. Crear la tabla de chat
1. En tu proyecto, ve a **SQL Editor** (menú izquierdo)
2. Click en "New query"
3. Copia y pega el contenido del archivo `supabase_schema.sql`
4. Click "Run" o presiona Ctrl+Enter
5. Debería aparecer "Success. No rows returned"

### 4. Obtener tus credenciales
1. Ve a **Project Settings** (ícono de engranaje abajo a la izquierda)
2. Click en **API** en el menú de configuración
3. Copia estos dos valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJI...` (es un JWT largo)

### 5. Configurar la app
1. En la raíz del proyecto, crea un archivo `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` y pega tus valores:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## ¡Listo! 🎉

Ahora cuando envíes mensajes en el chat:
- Se guardan automáticamente en Supabase
- Se sincronizan entre todos tus dispositivos
- Persisten incluso si limpias la caché

## Verificación

Para confirmar que funciona:
1. Envía un mensaje en el chat
2. Ve a Supabase > **Table Editor** > `chat_sessions`
3. Deberías ver tu sesión de chat guardada

## Desactivar (Opcional)

Si prefieres usar solo `localStorage` sin Supabase:
- Simplemente no crees el archivo `.env`
- O borra las variables `VITE_SUPABASE_*` del `.env`
- La app seguirá funcionando normalmente, solo sin sincronización en la nube

## Límites del Free Tier

Supabase es MUY generoso:
- ✅ 500 MB de base de datos (suficiente para ~100,000 conversaciones)
- ✅ 1 GB de ancho de banda (más que suficiente)
- ✅ 50,000 usuarios activos mensuales
- ✅ Sin tarjeta de crédito requerida
- ✅ Para siempre gratis

Para este caso de uso (guardar chats), es básicamente ilimitado en la práctica.

## Solución de Problemas

### "Missing URL or Anon Key. Cloud sync disabled"
- Verifica que el archivo `.env` existe en la raíz del proyecto
- Verifica que las variables empiezan con `VITE_` (Vite requiere este prefijo)
- Reinicia el servidor después de crear/editar `.env`

### "Failed to load sessions"
- Verifica que ejecutaste el SQL para crear la tabla
- Verifica que la política de RLS está activada (el script lo hace automáticamente)

### Los mensajes no se sincronizan
- Abre la consola del navegador (F12)
- Busca mensajes de `[Supabase]` para ver si hay errores
- Verifica que tus credenciales son correctas en `.env`

## Privacidad

- Cada navegador genera un "fingerprint" único aleatorio
- Tus chats se asocian a ese fingerprint
- Sin autenticación real = sin datos de usuario identificables
- Para mayor privacidad, puedes self-hostear Supabase
