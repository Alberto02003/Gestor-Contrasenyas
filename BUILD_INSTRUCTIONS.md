# 📦 Instrucciones de Compilación - Gestor de Contraseñas

Este documento explica cómo crear instaladores para Windows (.exe) y macOS (.dmg).

---

## 🎯 Resumen Rápido

| Plataforma | Requisito | Comando |
|------------|-----------|---------|
| **Windows** | Windows PC | `npm run build:electron` |
| **macOS** | Mac | `npm run build:electron` |
| **Ambas** | GitHub Actions | Push tag `v1.0.0` |

---

## 🪟 Compilar para Windows (desde Windows)

### Requisitos
- Windows 10/11
- Node.js 18 o superior
- Git Bash o PowerShell

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el icono
node convert-icon.cjs

# 3. Compilar la aplicación
npm run build:electron

# 4. El instalador estará en:
# dist-electron/Gestor de Contraseñas-Setup-1.0.0.exe
```

**Resultado:** `Gestor de Contraseñas-Setup-1.0.0.exe` (137 MB aprox.)

---

## 🍎 Compilar para macOS (desde Mac)

### Requisitos
- macOS 10.13+ (High Sierra o superior)
- Node.js 18 o superior
- Xcode Command Line Tools

### Instalar Xcode Command Line Tools
```bash
xcode-select --install
```

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el icono ICNS
node convert-icon-mac.js

# 3. Compilar la aplicación
npm run build:electron

# 4. Los instaladores estarán en:
# dist-electron/Gestor de Contraseñas-1.0.0.dmg        (x64)
# dist-electron/Gestor de Contraseñas-1.0.0-arm64.dmg  (Apple Silicon)
```

**Resultado:**
- DMG para Intel Macs (x64)
- DMG para Apple Silicon (arm64)

---

## 🚀 Compilar para AMBAS plataformas (GitHub Actions)

Esta es la **forma recomendada** porque no necesitas acceso a una Mac.

### Setup Inicial

1. **Sube tu código a GitHub**
   ```bash
   git add .
   git commit -m "Add build configuration"
   git push origin main
   ```

2. **El workflow ya está configurado** en `.github/workflows/build-release.yml`

### Crear un Release

#### Opción A: Mediante Tag (Automático)

```bash
# 1. Crear y publicar un tag de versión
git tag v1.0.0
git push origin v1.0.0

# 2. GitHub Actions compilará automáticamente para:
#    - Windows (.exe)
#    - macOS (.dmg para Intel y Apple Silicon)

# 3. Los instaladores aparecerán en:
#    https://github.com/TU_USUARIO/TU_REPO/releases
```

#### Opción B: Manual

1. Ve a tu repositorio en GitHub
2. Click en **Actions** → **Build and Release**
3. Click en **Run workflow** → **Run workflow**
4. Espera 5-10 minutos
5. Los instaladores aparecerán en **Artifacts**

### Descargar los Instaladores

Después de la compilación:
- Ve a **Releases** (si usaste tag)
- O ve a **Actions** → **Build and Release** → **Artifacts**

Encontrarás:
```
✅ Gestor de Contraseñas-Setup-1.0.0.exe          (Windows)
✅ Gestor de Contraseñas-1.0.0.dmg                (macOS Intel)
✅ Gestor de Contraseñas-1.0.0-arm64.dmg          (macOS Apple Silicon)
```

---

## 📋 Troubleshooting

### Error: "image must be at least 256x256"
```bash
# Regenerar el icono
node convert-icon.cjs  # Windows
node convert-icon-mac.js  # macOS
```

### Error: "Cannot find module 'sharp'"
```bash
npm install
```

### macOS: "App is damaged and can't be opened"
```bash
# En la Mac del usuario, ejecutar:
xattr -cr "/Applications/Gestor de Contraseñas.app"
```

### GitHub Actions falla
- Verifica que el archivo `.github/workflows/build-release.yml` existe
- Asegúrate de que los permisos de Actions están habilitados en Settings → Actions

---

## 🔧 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Configuración de electron-builder |
| `convert-icon.cjs` | Crea icon.ico para Windows |
| `convert-icon-mac.js` | Crea icon.icns para macOS |
| `build/icon.ico` | Icono Windows (generado) |
| `build/icon.icns` | Icono macOS (generado) |
| `build/entitlements.mac.plist` | Permisos macOS |
| `.github/workflows/build-release.yml` | GitHub Actions workflow |

---

## 🎨 Personalizar Iconos

Si quieres cambiar el icono:

1. Reemplaza `public/icon.png` con tu icono (PNG, recomendado 1024x1024)
2. Regenera los iconos:
   ```bash
   node convert-icon.cjs       # Windows
   node convert-icon-mac.js    # macOS
   ```

---

## 📝 Actualizar Versión

Para crear una nueva versión:

1. Actualiza la versión en `package.json`:
   ```json
   {
     "version": "1.1.0"
   }
   ```

2. Commit y crea un tag:
   ```bash
   git add package.json
   git commit -m "Bump version to 1.1.0"
   git tag v1.1.0
   git push origin main
   git push origin v1.1.0
   ```

3. GitHub Actions creará automáticamente el release

---

## ✅ Checklist de Release

- [ ] Versión actualizada en `package.json`
- [ ] Changelog actualizado (si tienes)
- [ ] Tests pasando
- [ ] Iconos generados correctamente
- [ ] Tag creado y pusheado
- [ ] GitHub Actions completado exitosamente
- [ ] Instaladores descargados y probados

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs de GitHub Actions
2. Verifica que todos los archivos de configuración existen
3. Asegúrate de que las dependencias están instaladas

---

**¡Listo!** Ahora puedes crear instaladores para Windows y macOS fácilmente. 🎉
