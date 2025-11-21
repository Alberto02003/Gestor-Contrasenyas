# 📝 Code Snippets para Integración

Snippets útiles para integrar la extensión con tu aplicación.

## 🔧 Electron main.cjs

### Importar módulo

```javascript
// Al inicio del archivo, después de otras importaciones
const nativeMessaging = require('../extension/electron-native-messaging.cjs');
```

### Inicializar en createWindow()

```javascript
function createWindow() {
  // ... código existente de creación de ventana ...

  mainWindow = new BrowserWindow({
    // ... configuración ...
  });

  // AÑADIR ESTO al final de createWindow():
  nativeMessaging.setupVaultSync(mainWindow);

  // ... resto del código ...
}
```

### Modificar app.whenReady()

```javascript
app.whenReady().then(() => {
  // Verificar si se ejecuta en modo native messaging
  if (process.argv.includes('--native-messaging')) {
    console.log('[NativeMessaging] Modo activado');
    createWindow();
    nativeMessaging.setupNativeMessaging(mainWindow);
    // NO llamar createTray() ni setupNetwork() en modo native messaging
  } else {
    // Modo normal de la app
    createWindow();
    createTray();
    setupNetwork();
  }
});
```

---

## 🎨 Electron preload.cjs

### Añadir API para extensión

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ========== API EXISTENTE ==========
  // Mantén toda tu API actual aquí...
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onThemeChange: (callback) => {
    ipcRenderer.on('theme-changed', (event, theme) => callback(theme));
  },
  // ... resto de tu API ...

  // ========== NUEVA API PARA EXTENSIÓN ==========
  send: (channel, data) => {
    // Canales permitidos para enviar
    const validChannels = ['vault-state-changed'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  on: (channel, callback) => {
    // Canales permitidos para escuchar
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

---

## 📦 Zustand Store (vaultStore.ts)

### Función auxiliar para notificar

```typescript
// Añadir al inicio del archivo, ANTES de la definición del store
const notifyElectronVaultChange = (state: VaultState) => {
  // Verificar si estamos en Electron
  if (window.electronAPI?.send) {
    try {
      window.electronAPI.send('vault-state-changed', {
        isUnlocked: state.isUnlocked,
        credentials: state.vault?.credentials || []
      });
      console.log('[Extension] Estado sincronizado con Electron');
    } catch (error) {
      console.error('[Extension] Error sincronizando estado:', error);
    }
  }
};
```

### Modificar unlockVault

```typescript
unlockVault: (masterPassword: string) => {
  try {
    const encryptedData = localStorage.getItem('vault');
    if (!encryptedData) {
      throw new Error('No vault found');
    }

    const decryptedVault = decryptVault(encryptedData, masterPassword);

    set({
      isUnlocked: true,
      vault: decryptedVault,
      masterPassword
    });

    // ✅ AÑADIR ESTO:
    notifyElectronVaultChange(get());

  } catch (error) {
    throw new Error('Invalid password');
  }
}
```

### Modificar lockVault

```typescript
lockVault: () => {
  set({
    isUnlocked: false,
    vault: null,
    masterPassword: null
  });

  // ✅ AÑADIR ESTO:
  notifyElectronVaultChange(get());
}
```

### Modificar addCredential

```typescript
addCredential: (credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => {
  const state = get();
  if (!state.isUnlocked || !state.vault || !state.masterPassword) {
    throw new Error('Vault is locked');
  }

  const newCredential: Credential = {
    ...credential,
    id: randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const updatedVault = {
    ...state.vault,
    credentials: [...state.vault.credentials, newCredential]
  };

  const encryptedData = encryptVault(updatedVault, state.masterPassword);
  localStorage.setItem('vault', encryptedData);

  set({ vault: updatedVault });

  // ✅ AÑADIR ESTO:
  notifyElectronVaultChange(get());
}
```

### Modificar updateCredential

```typescript
updateCredential: (id: string, updates: Partial<Credential>) => {
  const state = get();
  if (!state.isUnlocked || !state.vault || !state.masterPassword) {
    throw new Error('Vault is locked');
  }

  const updatedCredentials = state.vault.credentials.map(cred =>
    cred.id === id
      ? { ...cred, ...updates, updatedAt: Date.now() }
      : cred
  );

  const updatedVault = {
    ...state.vault,
    credentials: updatedCredentials
  };

  const encryptedData = encryptVault(updatedVault, state.masterPassword);
  localStorage.setItem('vault', encryptedData);

  set({ vault: updatedVault });

  // ✅ AÑADIR ESTO:
  notifyElectronVaultChange(get());
}
```

### Modificar deleteCredential

```typescript
deleteCredential: (id: string) => {
  const state = get();
  if (!state.isUnlocked || !state.vault || !state.masterPassword) {
    throw new Error('Vault is locked');
  }

  const updatedCredentials = state.vault.credentials.filter(
    cred => cred.id !== id
  );

  const updatedVault = {
    ...state.vault,
    credentials: updatedCredentials
  };

  const encryptedData = encryptVault(updatedVault, state.masterPassword);
  localStorage.setItem('vault', encryptedData);

  set({ vault: updatedVault });

  // ✅ AÑADIR ESTO:
  notifyElectronVaultChange(get());
}
```

---

## 🔍 Debugging Snippets

### Ver logs de background service worker

```javascript
// chrome://extensions/
// Encuentra tu extensión → "service worker" → clic en "service worker"
// O desde la consola:
chrome.runtime.getBackgroundPage((bg) => console.log(bg));
```

### Ver logs del content script

```javascript
// F12 en cualquier página web → Console
// Buscar: "Gestor de Contraseñas - Content script cargado"
```

### Simular mensaje desde extension

```javascript
// En la consola de background service worker:
chrome.runtime.sendMessage({
  type: 'GET_VAULT_STATUS'
}, (response) => {
  console.log('Response:', response);
});
```

### Verificar estado del native port

```javascript
// En background.js, añadir temporalmente:
console.log('Native port status:', {
  isConnected,
  port: nativePort,
  lastError: chrome.runtime.lastError
});
```

### Test manual de native messaging

```batch
# Windows - Ejecutar manualmente
cd C:\Users\amartin\Documents\Gestor-Contrasenyas
node_modules\.bin\electron.cmd electron/main.cjs --native-messaging

# Luego enviar mensaje JSON manualmente (stdin):
# (longitud en 4 bytes little-endian + JSON)
```

---

## 🧪 Testing Snippets

### Test de conexión desde popup

```javascript
// En popup.js, añadir temporalmente:
chrome.runtime.sendMessage({ type: 'CONNECT_NATIVE' }, (response) => {
  console.log('Connection test:', response);
  alert(response.success ? '✅ Conectado' : '❌ Error de conexión');
});
```

### Test de obtener credenciales

```javascript
// En popup.js:
chrome.runtime.sendMessage({
  type: 'GET_CREDENTIALS',
  url: 'github.com'
}, (response) => {
  console.log('Credentials:', response);
  if (response.error) {
    console.error('Error:', response.error);
  }
});
```

### Test de autofill desde content script

```javascript
// En la consola de cualquier página con formulario:
chrome.runtime.sendMessage({
  type: 'AUTOFILL_CREDENTIAL',
  credential: {
    id: 'test',
    title: 'Test',
    username: 'test@example.com',
    password: 'test123',
    url: 'example.com',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}, (response) => {
  console.log('Autofill result:', response);
});
```

---

## 🛠️ Utilidades

### Convertir Extension ID a allowed_origins

```javascript
// Si tu Extension ID es: abcdefghijklmnopqrstuvwxyz123456
// El allowed_origins debe ser:
"chrome-extension://abcdefghijklmnopqrstuvwxyz123456/"
// ⚠️ NO OLVIDAR la barra final "/"
```

### Verificar registro de Windows

```batch
REM Ver si está registrado
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gestor.contrasenyas"

REM Ver el valor
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gestor.contrasenyas" /ve

REM Eliminar registro (si necesitas reinstalar)
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gestor.contrasenyas" /f
```

### Crear archivo .bat de debug

```batch
@echo off
REM debug-native-messaging.bat

echo Iniciando Electron en modo Native Messaging con logs...
echo.

set ELECTRON_PATH=C:\Users\amartin\Documents\Gestor-Contrasenyas\node_modules\.bin\electron.cmd
set APP_PATH=C:\Users\amartin\Documents\Gestor-Contrasenyas\electron\main.cjs

REM Redirigir stderr a archivo
"%ELECTRON_PATH%" "%APP_PATH%" --native-messaging 2> native-debug.log

echo.
echo Logs guardados en: native-debug.log
pause
```

---

## 📋 Checklist de Integración

Copia y pega esto en tu editor para ir marcando:

```markdown
## Electron Integration
- [ ] Importé nativeMessaging en main.cjs
- [ ] Añadí setupVaultSync() en createWindow()
- [ ] Modifiqué app.whenReady() para soportar --native-messaging
- [ ] Actualicé preload.cjs con nueva API
- [ ] Probé que la app funciona normalmente (sin --native-messaging)

## Zustand Store Integration
- [ ] Añadí función notifyElectronVaultChange()
- [ ] Modifiqué unlockVault()
- [ ] Modifiqué lockVault()
- [ ] Modifiqué addCredential()
- [ ] Modifiqué updateCredential()
- [ ] Modifiqué deleteCredential()

## Extension Setup
- [ ] Generé los 4 iconos (16, 32, 48, 128)
- [ ] Ejecuté build.bat
- [ ] Cargué extensión en Chrome
- [ ] Copié Extension ID
- [ ] Actualicé native-host-manifest.json con Extension ID
- [ ] Actualicé native-host.bat con rutas correctas
- [ ] Ejecuté install-native-host.bat como administrador
- [ ] Verifiqué registro con reg query

## Testing
- [ ] Popup abre sin errores
- [ ] Popup muestra "Vault bloqueada" cuando corresponde
- [ ] Desbloqueé vault en app → popup muestra credenciales
- [ ] Búsqueda funciona en popup
- [ ] Botón de candado aparece en campos de password
- [ ] Autofill funciona correctamente
- [ ] Añadí credencial en app → aparece en extensión
- [ ] Bloqueé vault → popup muestra "Vault bloqueada"
```

---

## 🎨 Personalización de Estilos

### Cambiar tema de la extensión a light

```css
/* En popup.css y content.css, cambiar: */
:root {
  --background: 0 0% 100%;          /* Blanco */
  --foreground: 222.2 84% 4.9%;     /* Negro */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  /* ... resto de colores invertidos ... */
}
```

### Personalizar icono del botón de autofill

```javascript
// En content.js, modificar addAutofillButton():
button.innerHTML = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <!-- Tu SVG personalizado aquí -->
  </svg>
`;
```

---

**¡Estos snippets te ahorrarán mucho tiempo! Copia y pega según necesites. 🚀**
