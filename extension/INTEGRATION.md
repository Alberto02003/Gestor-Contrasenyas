# Integración de la Extensión con Electron

Este documento explica cómo integrar el native messaging con tu aplicación Electron existente.

## 1. Modificar `electron/main.cjs`

### Importar el módulo de native messaging

Al inicio del archivo, después de las importaciones existentes:

```javascript
const nativeMessaging = require('./extension/electron-native-messaging.cjs');
```

### Inicializar native messaging

Dentro de la función `createWindow()`, después de que la ventana esté creada:

```javascript
// Configurar sincronización de estado con extensión
nativeMessaging.setupVaultSync(mainWindow);
```

### Iniciar modo native messaging

En el inicio de la app (después de `app.whenReady()`):

```javascript
app.whenReady().then(() => {
  // Verificar si se ejecuta en modo native messaging
  if (process.argv.includes('--native-messaging')) {
    // Modo headless para native messaging
    nativeMessaging.setupNativeMessaging(mainWindow);
  } else {
    // Modo normal con UI
    createWindow();
    createTray();
    setupNetwork();
  }
});
```

## 2. Modificar el Store de Zustand (`src/stores/vaultStore.ts`)

Necesitas notificar a Electron cuando el estado de la vault cambie.

### Añadir función de notificación

```typescript
// Al inicio del archivo
const notifyElectronVaultChange = (state: VaultState) => {
  if (window.electronAPI) {
    window.electronAPI.send('vault-state-changed', {
      isUnlocked: state.isUnlocked,
      credentials: state.vault?.credentials || []
    });
  }
};
```

### Llamar en acciones relevantes

Añade esta llamada en:
- `unlockVault` (después de desbloquear)
- `lockVault` (después de bloquear)
- `addCredential`, `updateCredential`, `deleteCredential` (después de modificar)

Ejemplo en `unlockVault`:

```typescript
unlockVault: (masterPassword: string) => {
  try {
    // ... código existente de desbloqueo ...

    set({ isUnlocked: true, vault: decryptedVault, masterPassword });

    // Notificar a Electron
    notifyElectronVaultChange(get());
  } catch (error) {
    // ... manejo de errores ...
  }
}
```

## 3. Actualizar `electron/preload.cjs`

Añade los handlers necesarios para IPC:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ... API existente ...

  // Nueva API para extensión
  send: (channel, data) => {
    const validChannels = ['vault-state-changed'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  on: (channel, callback) => {
    const validChannels = ['extension-unlock-request'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});
```

## 4. Instalar la Extensión

### Paso 1: Actualizar el manifest con el Extension ID

1. Carga la extensión en Chrome:
   - Abre `chrome://extensions/`
   - Activa "Modo de desarrollador"
   - Clic en "Cargar extensión sin empaquetar"
   - Selecciona la carpeta `extension/`

2. Copia el ID de la extensión (ejemplo: `abcdefghijklmnopqrstuvwxyz123456`)

3. Actualiza `extension/native-host-manifest.json`:
   ```json
   {
     "name": "com.gestor.contrasenyas",
     "description": "Native messaging host para Gestor de Contraseñas",
     "path": "C:\\ruta\\completa\\a\\extension\\native-host.bat",
     "type": "stdio",
     "allowed_origins": [
       "chrome-extension://TU_EXTENSION_ID_AQUI/"
     ]
   }
   ```

### Paso 2: Actualizar native-host.bat

Edita `extension/native-host.bat` con la ruta correcta a tu ejecutable:

```batch
@echo off
set ELECTRON_PATH=C:\Users\amartin\Documents\Gestor-Contrasenyas\node_modules\.bin\electron.cmd
set APP_PATH=C:\Users\amartin\Documents\Gestor-Contrasenyas\electron\main.cjs

"%ELECTRON_PATH%" "%APP_PATH%" --native-messaging
```

### Paso 3: Registrar el Native Messaging Host

Ejecuta `extension/install-native-host.bat` como administrador.

Esto registrará el manifest en el registro de Windows.

## 5. Probar la Integración

### Test 1: Verificar registro

```batch
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gestor.contrasenyas"
```

Debería mostrar la ruta al manifest.

### Test 2: Probar desde la extensión

1. Abre la app Electron normalmente
2. Desbloquea la vault
3. Abre el popup de la extensión (clic en el icono)
4. Deberías ver tus credenciales

### Test 3: Probar autofill

1. Ve a una página de login (ej: github.com/login)
2. Debería aparecer un botón de candado en el campo de contraseña
3. Clic en el botón → selecciona credencial → autocompletar

## 6. Debugging

### Ver logs de native messaging

```javascript
// En background.js, verifica la consola:
chrome://extensions/ → Detalles de la extensión → "service worker" → Console
```

### Ver logs de Electron

Cuando ejecutes en modo native messaging, los logs irán a un archivo:

```batch
# Redirigir stderr a archivo para debugging
"%ELECTRON_PATH%" "%APP_PATH%" --native-messaging 2> native-messaging.log
```

## 7. Build para Producción

Cuando empaquetes la app con electron-builder:

1. Incluye la carpeta `extension/` en el build:

```json
// package.json - build config
{
  "build": {
    "extraResources": [
      {
        "from": "extension",
        "to": "extension"
      }
    ]
  }
}
```

2. El installer debería registrar automáticamente el native host en el registro.

## 8. Troubleshooting

### Error: "Failed to connect to native host"

- Verifica que el manifest está registrado correctamente
- Verifica que la ruta en `native-host.bat` es correcta
- Verifica que el Extension ID en el manifest coincide

### Error: "Vault bloqueada"

- Asegúrate de que la sincronización de estado está funcionando
- Verifica que `notifyElectronVaultChange()` se llama correctamente
- Revisa los logs en Electron DevTools

### El botón de autofill no aparece

- Verifica que el content script se inyectó correctamente
- Revisa la consola del navegador (F12) para errores
- Verifica que la página tiene un `<input type="password">`

## Arquitectura

```
┌─────────────────┐
│  Extensión      │
│  - Popup UI     │
│  - Content      │
│  - Background   │
└────────┬────────┘
         │
         │ Chrome Native Messaging
         │ (stdio, JSON messages)
         │
┌────────▼────────┐
│  Electron       │
│  - main.cjs     │
│  - IPC handlers │
└────────┬────────┘
         │
         │ IPC
         │
┌────────▼────────┐
│  Renderer       │
│  - Vault Store  │
│  - React App    │
└─────────────────┘
```

## Mensajes Soportados

### De Extensión → Electron

- `getVaultStatus` - Obtener estado de bloqueo
- `getCredentials` - Obtener credenciales por URL
- `searchCredentials` - Buscar credenciales
- `unlockVault` - Desbloquear vault

### De Electron → Extensión

- `vaultUpdated` - Notificación de cambio en vault

## Seguridad

- Los mensajes se validan en ambos lados
- Solo la extensión con ID registrado puede conectar
- La contraseña maestra nunca se almacena en la extensión
- Comunicación solo mediante stdio (no HTTP/WebSocket)
