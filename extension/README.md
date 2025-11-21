# 🔐 Extensión de Navegador - Gestor de Contraseñas

Extensión minimalista para Chrome/Edge que se integra con tu gestor de contraseñas local mediante Native Messaging.

## ✨ Características

- 🎯 **Auto-detección de formularios**: Detecta automáticamente campos de login en páginas web
- 🔒 **Auto-completado seguro**: Rellena credenciales con un solo clic
- 🎨 **Diseño minimal**: UI oscura/clara que coincide con la estética de la app
- 🔐 **Sin servidores**: Toda la comunicación es local mediante Native Messaging
- ⚡ **Rápido y ligero**: Menos de 50KB de código

## 📋 Requisitos

- Windows 10/11
- Chrome o Edge (versión 88+)
- Aplicación Gestor de Contraseñas instalada

## 🚀 Instalación

### 1. Build de la extensión

```batch
cd extension
build.bat
```

Esto creará la carpeta `build/` con todos los archivos necesarios.

### 2. Generar iconos

Necesitas crear iconos PNG para la extensión en `extension/assets/`:

- `icon16.png` (16x16px)
- `icon32.png` (32x32px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

Puedes usar herramientas como:
- [Favicon Generator](https://realfavicongenerator.net/)
- [IconGenerator](https://icongenerator.net/)
- Photoshop/GIMP/Figma

Diseño recomendado: Icono de candado con colores que coincidan con tu app.

### 3. Cargar extensión en Chrome

1. Abre Chrome/Edge
2. Ve a `chrome://extensions/` (o `edge://extensions/`)
3. Activa **"Modo de desarrollador"** (toggle en la esquina superior derecha)
4. Clic en **"Cargar extensión sin empaquetar"**
5. Selecciona la carpeta `extension/build/`

### 4. Configurar Native Messaging

Sigue las instrucciones detalladas en [INTEGRATION.md](INTEGRATION.md).

Resumen rápido:

```batch
# 1. Copia el Extension ID desde chrome://extensions/
# 2. Actualiza native-host-manifest.json con el ID
# 3. Ejecuta como administrador:
install-native-host.bat
```

## 🎯 Uso

### Popup

Clic en el icono de la extensión en la barra de herramientas:

- **Vault bloqueada**: Botón para abrir la app y desbloquear
- **Vault desbloqueada**: Lista de credenciales disponibles
- **Búsqueda**: Filtra credenciales en tiempo real
- **Clic en credencial**: Auto-completa el formulario actual

### Auto-fill en páginas

1. Navega a una página con formulario de login
2. Aparecerá un **botón de candado** en el campo de contraseña
3. Clic en el botón → selecciona credencial → auto-completa

### Atajos de teclado (próximamente)

- `Ctrl+Shift+P`: Abrir popup
- `Ctrl+Shift+F`: Auto-completar formulario actual

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│          Extensión de Navegador          │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │   Popup     │  │  Content Script │  │
│  │   (UI)      │  │  (Auto-detect)  │  │
│  └──────┬──────┘  └────────┬────────┘  │
│         │                  │            │
│         └────────┬─────────┘            │
│                  │                      │
│         ┌────────▼─────────┐            │
│         │  Background SW   │            │
│         │  (Native Msg)    │            │
│         └────────┬─────────┘            │
└──────────────────┼──────────────────────┘
                   │
           Native Messaging
           (stdio, JSON)
                   │
┌──────────────────▼──────────────────────┐
│      Aplicación Electron (main.cjs)     │
├─────────────────────────────────────────┤
│  - Vault Store                          │
│  - Credenciales cifradas                │
│  - IPC con renderer                     │
└─────────────────────────────────────────┘
```

## 📁 Estructura de Archivos

```
extension/
├── manifest.json              # Configuración de la extensión
├── native-host-manifest.json  # Config de native messaging
├── native-host.bat            # Launcher para Electron
├── install-native-host.bat    # Instalador de native host
├── build.bat                  # Script de build
├── INTEGRATION.md             # Guía de integración
├── README.md                  # Este archivo
│
├── src/
│   ├── background/
│   │   └── background.js      # Service worker
│   ├── content/
│   │   ├── content.js         # Script inyectado en páginas
│   │   └── content.css        # Estilos del content script
│   └── popup/
│       ├── popup.html         # UI del popup
│       ├── popup.css          # Estilos del popup
│       └── popup.js           # Lógica del popup
│
├── assets/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
├── electron-native-messaging.cjs  # Módulo para Electron
└── build/                     # Output del build (generado)
```

## 🔒 Seguridad

- ✅ **Sin almacenamiento local**: No guarda credenciales en el navegador
- ✅ **Comunicación local**: Todo mediante Native Messaging (stdio)
- ✅ **Sin servidores externos**: Cero transmisión de datos
- ✅ **Manifest V3**: Usa la última versión de Chrome Extensions API
- ✅ **Content Security Policy**: Protección contra XSS
- ✅ **ID validation**: Solo tu extensión puede conectarse al native host

## 🛠️ Desarrollo

### Debugging

**Background Service Worker:**
```
chrome://extensions/ → Detalles → "service worker" → Inspect
```

**Content Script:**
```
F12 en cualquier página → Console
```

**Popup:**
```
Clic derecho en popup → Inspeccionar
```

**Native Messaging:**
```batch
# Ver logs de stdio
"%ELECTRON_PATH%" "%APP_PATH%" --native-messaging 2> logs.txt
```

### Testing

1. **Test básico**: Abrir popup y verificar conexión
2. **Test de vault**: Desbloquear y ver credenciales
3. **Test de autofill**: Probar en github.com/login
4. **Test de búsqueda**: Filtrar credenciales en popup
5. **Test de sincronización**: Añadir credencial en app → verificar en extensión

## 🐛 Troubleshooting

### "Failed to connect to native host"

**Solución:**
1. Verifica que el manifest está registrado:
   ```batch
   reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gestor.contrasenyas"
   ```
2. Verifica que el Extension ID coincide en `native-host-manifest.json`
3. Verifica permisos de ejecución en `native-host.bat`

### "Vault bloqueada" en popup

**Solución:**
1. Abre la app Electron y desbloquea la vault
2. Verifica que la sincronización de estado funciona (ver INTEGRATION.md)
3. Revisa logs en Electron DevTools

### Botón de autofill no aparece

**Solución:**
1. Verifica que el content script se inyectó (F12 → Console → buscar "Gestor")
2. Verifica que la página tiene `<input type="password">`
3. Prueba refrescar la página

### La extensión no encuentra credenciales

**Solución:**
1. Verifica que las credenciales tienen el campo `url` configurado
2. Verifica que el dominio coincide (ej: `github.com` debe estar en la URL)
3. Usa la búsqueda manual en el popup

## 📝 TODO / Roadmap

- [ ] Generación de iconos automática
- [ ] Atajos de teclado configurables
- [ ] Soporte para Firefox
- [ ] Detección inteligente de campos (XPath, ML)
- [ ] Captura automática de nuevas credenciales
- [ ] Sugerencia de contraseñas al registrarse
- [ ] Integración con biometría del navegador
- [ ] Modo incógnito configurable

## 🤝 Contribuir

Esta extensión es parte del proyecto Gestor de Contraseñas. Para contribuir:

1. Fork del repositorio
2. Crea una branch para tu feature
3. Commit de cambios
4. Push y crea Pull Request

## 📄 Licencia

Mismo licenciamiento que el proyecto principal.

## 🔗 Links

- [Documentación de Native Messaging](https://developer.chrome.com/docs/apps/nativeMessaging/)
- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Electron IPC](https://www.electronjs.org/docs/latest/api/ipc-main)

---

**Hecho con ❤️ para mantener tus contraseñas seguras y accesibles**
