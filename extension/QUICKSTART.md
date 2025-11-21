# 🚀 Quick Start - Extensión de Navegador

Guía rápida para poner en marcha la extensión en 10 minutos.

## ✅ Checklist Rápido

- [ ] Generar iconos
- [ ] Build de la extensión
- [ ] Cargar en Chrome
- [ ] Configurar Native Messaging
- [ ] Integrar con Electron
- [ ] Probar

---

## 1️⃣ Generar Iconos (2 minutos)

### Opción A: Generador HTML (Recomendado)

```batch
# Abre el generador en tu navegador
start extension/create-icons.html
```

Haz clic en **"Descargar Todos los Iconos"** y guárdalos en `extension/assets/`

### Opción B: Usar tus propios iconos

Coloca 4 archivos PNG en `extension/assets/`:
- `icon16.png` (16x16px)
- `icon32.png` (32x32px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

---

## 2️⃣ Build de la Extensión (30 segundos)

```batch
cd extension
build.bat
```

Esto crea la carpeta `extension/build/` con todos los archivos listos.

---

## 3️⃣ Cargar en Chrome (1 minuto)

1. Abre Chrome y ve a: **chrome://extensions/**
2. Activa **"Modo de desarrollador"** (toggle superior derecha)
3. Clic en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta: `extension/build/`
5. **COPIA EL ID** de la extensión (ej: `abcdefghijklmnopqrstuvwxyz123456`)

---

## 4️⃣ Configurar Native Messaging (2 minutos)

### Paso 1: Actualizar manifest con tu Extension ID

Edita `extension/native-host-manifest.json`:

```json
{
  "name": "com.gestor.contrasenyas",
  "description": "Native messaging host para Gestor de Contraseñas",
  "path": "C:\\Users\\amartin\\Documents\\Gestor-Contrasenyas\\extension\\native-host.bat",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://TU_EXTENSION_ID_AQUI/"
  ]
}
```

⚠️ **Importante**:
- Reemplaza `TU_EXTENSION_ID_AQUI` con el ID que copiaste
- Usa la ruta **ABSOLUTA** al archivo `native-host.bat`
- Usa dobles barras invertidas `\\` en Windows

### Paso 2: Actualizar native-host.bat

Edita `extension/native-host.bat`:

```batch
@echo off
set ELECTRON_PATH=C:\Users\amartin\Documents\Gestor-Contrasenyas\node_modules\.bin\electron.cmd
set APP_PATH=C:\Users\amartin\Documents\Gestor-Contrasenyas\electron\main.cjs

"%ELECTRON_PATH%" "%APP_PATH%" --native-messaging
```

Ajusta las rutas según tu instalación.

### Paso 3: Registrar Native Host

```batch
# Ejecuta como administrador:
extension/install-native-host.bat
```

Verifica que se registró:

```batch
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gestor.contrasenyas"
```

---

## 5️⃣ Integrar con Electron (3 minutos)

### Paso 1: Importar módulo en main.cjs

En `electron/main.cjs`, añade al inicio (después de las importaciones):

```javascript
const nativeMessaging = require('../extension/electron-native-messaging.cjs');
```

### Paso 2: Inicializar en createWindow()

Dentro de `createWindow()`, después de crear la ventana:

```javascript
// Configurar sincronización con extensión
nativeMessaging.setupVaultSync(mainWindow);
```

### Paso 3: Verificar modo native messaging

En `app.whenReady()`:

```javascript
app.whenReady().then(() => {
  if (process.argv.includes('--native-messaging')) {
    // Modo headless para extensión
    createWindow(); // Crea ventana pero no la muestra
    nativeMessaging.setupNativeMessaging(mainWindow);
  } else {
    // Modo normal
    createWindow();
    createTray();
    setupNetwork();
  }
});
```

### Paso 4: Actualizar preload.cjs

En `electron/preload.cjs`, añade:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... API existente ...

  // Nueva API para extensión
  send: (channel, data) => {
    const validChannels = ['vault-state-changed'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
});
```

### Paso 5: Sincronizar estado en vaultStore.ts

En `src/stores/vaultStore.ts`, añade función auxiliar:

```typescript
// Al inicio del archivo
const notifyElectronVaultChange = (state: VaultState) => {
  if (window.electronAPI?.send) {
    window.electronAPI.send('vault-state-changed', {
      isUnlocked: state.isUnlocked,
      credentials: state.vault?.credentials || []
    });
  }
};
```

Llama esta función en:
- `unlockVault()` - después de desbloquear
- `lockVault()` - después de bloquear
- `addCredential()`, `updateCredential()`, `deleteCredential()` - después de modificar

Ejemplo en `unlockVault`:

```typescript
unlockVault: (masterPassword: string) => {
  try {
    // ... código de desbloqueo ...
    set({ isUnlocked: true, vault: decryptedVault, masterPassword });

    // Notificar a extensión
    notifyElectronVaultChange(get());
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## 6️⃣ Probar (2 minutos)

### Test 1: Verificar conexión

1. Abre tu app Electron normalmente
2. Desbloquea la vault
3. Abre el **popup de la extensión** (clic en el icono)
4. ✅ Deberías ver tus credenciales

### Test 2: Autofill

1. Ve a **github.com/login**
2. ✅ Debería aparecer un **botón de candado** en el campo de password
3. Clic en el botón
4. ✅ Selecciona una credencial y verifica que se autocompleta

### Test 3: Búsqueda

1. Abre el popup de la extensión
2. Escribe en la barra de búsqueda
3. ✅ Verifica que filtra las credenciales

---

## 🐛 Troubleshooting Rápido

### ❌ "Failed to connect to native host"

**Causa**: Native messaging no configurado correctamente.

**Solución**:
```batch
# 1. Verifica registro
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gestor.contrasenyas"

# 2. Verifica que el Extension ID coincide en native-host-manifest.json

# 3. Reinstala native host
extension/install-native-host.bat
```

### ❌ "Vault bloqueada" en popup

**Causa**: Sincronización no configurada o vault realmente bloqueada.

**Solución**:
1. Verifica que añadiste `notifyElectronVaultChange()` en vaultStore
2. Abre la app Electron y desbloquea la vault
3. Verifica logs en DevTools (F12 en la app)

### ❌ Botón de autofill no aparece

**Causa**: Content script no se inyectó.

**Solución**:
1. Refresca la página (F5)
2. Verifica en F12 → Console que aparece: `"Gestor de Contraseñas - Content script cargado"`
3. Verifica que la página tiene `<input type="password">`

### ❌ Extension ID incorrecto

**Causa**: El ID cambió al recargar la extensión.

**Solución**:
1. Copia el nuevo ID desde chrome://extensions/
2. Actualiza `native-host-manifest.json`
3. Re-ejecuta `install-native-host.bat`
4. Reinicia Chrome

---

## 📊 Verificación Final

Completa este checklist:

- [ ] Los iconos se ven bien en chrome://extensions/
- [ ] El popup abre y muestra credenciales
- [ ] La búsqueda funciona en el popup
- [ ] El botón de candado aparece en campos de password
- [ ] El autofill funciona correctamente
- [ ] Al añadir credencial en la app, aparece en la extensión
- [ ] Al bloquear la vault, el popup muestra "Vault bloqueada"

---

## 📚 Próximos Pasos

Una vez que todo funcione:

1. **Lee el README completo**: `extension/README.md`
2. **Revisa INTEGRATION.md**: Para entender la arquitectura completa
3. **Personaliza**: Modifica estilos en `popup.css` y `content.css`
4. **Prueba en más sitios**: GitHub, Gmail, Facebook, etc.
5. **Feedback**: Reporta bugs o sugerencias

---

## 🆘 Ayuda Adicional

Si sigues teniendo problemas:

1. **Revisa logs**:
   - Background: chrome://extensions/ → "service worker" → Console
   - Content: F12 en cualquier página → Console
   - Electron: DevTools de la app

2. **Consulta documentación**:
   - [INTEGRATION.md](INTEGRATION.md) - Guía detallada de integración
   - [README.md](README.md) - Documentación completa

3. **Debugging**:
   ```batch
   # Ejecutar con logs
   "%ELECTRON_PATH%" "%APP_PATH%" --native-messaging 2> debug.log
   ```

---

**¡Listo! Tu extensión debería estar funcionando ahora. 🎉**

Si algo no funciona, revisa el troubleshooting o consulta INTEGRATION.md para más detalles.
