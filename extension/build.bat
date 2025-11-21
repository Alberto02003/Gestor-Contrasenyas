@echo off
echo ====================================
echo   Gestor de Contrasenyas
echo   Build de Extension de Navegador
echo ====================================
echo.

REM Limpiar build anterior
if exist "build" (
    echo Limpiando build anterior...
    rmdir /s /q build
)

REM Crear estructura de directorios
echo Creando estructura de directorios...
mkdir build
mkdir build\assets

REM Copiar archivos de la extension
echo Copiando archivos...
copy manifest.json build\ >nul
copy src\background\background.js build\background.js >nul
copy src\content\content.js build\content.js >nul
copy src\content\content.css build\content.css >nul
copy src\popup\popup.html build\popup.html >nul
copy src\popup\popup.css build\popup.css >nul
copy src\popup\popup.js build\popup.js >nul

REM Copiar iconos (si existen)
if exist "assets\icon16.png" copy assets\icon16.png build\assets\ >nul
if exist "assets\icon32.png" copy assets\icon32.png build\assets\ >nul
if exist "assets\icon48.png" copy assets\icon48.png build\assets\ >nul
if exist "assets\icon128.png" copy assets\icon128.png build\assets\ >nul

REM Si no existen iconos, generar placeholder
if not exist "build\assets\icon128.png" (
    echo NOTA: No se encontraron iconos. Necesitas agregar:
    echo   - assets/icon16.png
    echo   - assets/icon32.png
    echo   - assets/icon48.png
    echo   - assets/icon128.png
    echo.
)

REM Crear README para el build
echo Creando README...
(
echo # Extension de Navegador - Gestor de Contrasenyas
echo.
echo Esta carpeta contiene la extension empaquetada.
echo.
echo ## Instalacion:
echo.
echo 1. Abre Chrome/Edge
echo 2. Ve a chrome://extensions/
echo 3. Activa "Modo de desarrollador"
echo 4. Clic en "Cargar extension sin empaquetar"
echo 5. Selecciona esta carpeta
echo.
echo ## Configuracion:
echo.
echo Despues de instalar, necesitas configurar el native messaging host.
echo Ver INTEGRATION.md para instrucciones completas.
) > build\README.txt

echo.
echo ====================================
echo   Build completado exitosamente!
echo ====================================
echo.
echo Ubicacion: %~dp0build\
echo.
echo Proximos pasos:
echo 1. Generar iconos para la extension
echo 2. Cargar la extension desde chrome://extensions/
echo 3. Configurar native messaging (ver INTEGRATION.md)
echo.
pause
