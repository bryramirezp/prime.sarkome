# Sistema de Recovery Key - Guía de Usuario

## ¿Qué es el Recovery Key?

El **Recovery Key** (Código de Recuperación) es tu "llave maestra" para acceder a tus chats guardados en la nube. Es un identificador único que se genera automáticamente la primera vez que usas la aplicación.

### Ejemplo de Recovery Key:
```
fp_x8k92m1a2b3c4d5e
```

## ¿Cómo Funciona?

### 1. Primera Vez
Cuando entras a la app por primera vez:
- Se genera automáticamente un Recovery Key único
- Se guarda en el `localStorage` de tu navegador
- Después de 2 segundos, aparece un modal mostrándote tu clave
- **¡IMPORTANTE!** Guarda esta clave en un lugar seguro

### 2. Uso Normal
Mientras uses el mismo navegador:
- Tus chats se guardan automáticamente en Supabase
- El Recovery Key se usa "invisible" para identificarte
- No necesitas hacer nada

### 3. Si Borras Datos del Navegador
Si limpias caché/cookies o cambias de dispositivo:
- Tu navegador "olvida" tu Recovery Key
- **PERO** tus chats siguen en Supabase
- Puedes recuperarlos importando tu Recovery Key guardada

## Cómo Usar el Modal

### Acceder al Modal
1. Click en el botón 🔑 (llave dorada) en el header
2. O espera 2 segundos en tu primera visita

### Pestaña "Export Key"
**Copiar la Clave:**
- Click en "Copy Key"
- Pégala en un lugar seguro (notas, password manager, etc.)

**Descargar JSON:**
- Click en "Download JSON"
- Se descarga un archivo `primekg-recovery-key-YYYY-MM-DD.json`
- Guárdalo en tu computadora o nube (Google Drive, Dropbox, etc.)

**Formato del JSON:**
```json
{
  "recoveryKey": "fp_x8k92m1a2b3c4d5e",
  "generatedAt": "2026-01-25T18:00:00.000Z",
  "application": "PrimeKG Precision Medicine Explorer",
  "instructions": "Keep this key safe..."
}
```

### Pestaña "Import Key"
**Restaurar tus Chats:**
1. Pega tu Recovery Key en el campo de texto
2. Click en "Import & Restore Chats"
3. La página se recarga automáticamente
4. Tus chats aparecen sincronizados desde Supabase

## Seguridad

### ⚠️ Advertencias Importantes
- **Trata tu Recovery Key como una contraseña**
- Cualquiera con tu clave puede ver tus chats
- No la compartas públicamente
- No la subas a GitHub u otros repositorios públicos

### ✅ Mejores Prácticas
1. **Guarda múltiples copias:**
   - Copia en password manager (1Password, Bitwarden, etc.)
   - Archivo JSON en Google Drive/Dropbox
   - Nota física en lugar seguro

2. **Verifica que funciona:**
   - Después de guardar, prueba importarla en modo incógnito
   - Confirma que tus chats se cargan correctamente

3. **Actualiza si cambias de dispositivo:**
   - Si usas la app en un nuevo dispositivo, importa tu clave
   - Todos tus chats estarán disponibles

## Casos de Uso

### Escenario 1: Cambio de Computadora
```
1. En computadora vieja: Export → Download JSON
2. Transfiere el archivo a nueva computadora
3. En computadora nueva: Import → Pega la clave
4. ✅ Todos tus chats están de vuelta
```

### Escenario 2: Limpieza de Navegador
```
1. Antes de limpiar: Export → Copy Key
2. Guarda en notas/password manager
3. Después de limpiar: Import → Pega la clave
4. ✅ Chats restaurados
```

### Escenario 3: Uso Multi-Dispositivo
```
1. En dispositivo A: Export → Copy Key
2. En dispositivo B: Import → Pega la misma clave
3. ✅ Ambos dispositivos ven los mismos chats
```

## Preguntas Frecuentes

### ¿Puedo cambiar mi Recovery Key?
No directamente. Si quieres "empezar de cero":
1. Borra `primekg_fingerprint` del localStorage
2. Recarga la página
3. Se generará una nueva clave (pero perderás acceso a chats anteriores)

### ¿Qué pasa si pierdo mi Recovery Key?
Si no guardaste tu clave y borraste datos del navegador:
- **No hay forma de recuperar tus chats antiguos**
- Tendrás que empezar con una nueva clave
- Por eso es crítico guardarla cuando la ves por primera vez

### ¿Puedo tener múltiples Recovery Keys?
Sí, pero cada clave tiene sus propios chats separados:
- `fp_abc123` → Chats del usuario A
- `fp_xyz789` → Chats del usuario B
- No se mezclan

### ¿Es seguro guardar la clave en un archivo JSON?
Sí, siempre que:
- No lo subas a repositorios públicos
- Lo guardes en almacenamiento privado (Drive personal, no compartido)
- Cifres el archivo si contiene datos muy sensibles

## Implementación Técnica

### Dónde se Guarda
```typescript
// En el navegador
localStorage.setItem('primekg_fingerprint', 'fp_xxx');

// En Supabase
users {
  fingerprint: 'fp_xxx',  // <-- Tu Recovery Key
  chat_sessions: [...],
  chat_messages: [...]
}
```

### Cómo se Genera
```typescript
const fp = 'fp_' + 
  Math.random().toString(36).substring(2, 15) + 
  Date.now().toString(36);
// Resultado: fp_x8k92m1a2b3c4d5e
```

### Flujo de Importación
```
1. Usuario pega clave → setItem('primekg_fingerprint', clave)
2. window.location.reload()
3. useChatSessions hook detecta nueva clave
4. chatSyncService.loadSessions(nueva_clave)
5. Chats se cargan desde Supabase
```

## Soporte

Si tienes problemas:
1. Verifica que Supabase está configurado (`.env`)
2. Abre la consola del navegador (F12) y busca errores
3. Confirma que tu Recovery Key tiene el formato correcto (`fp_...`)
4. Intenta en modo incógnito para descartar problemas de caché
