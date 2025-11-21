@echo off
echo Instalando native messaging host para Chrome/Edge...

REM Obtener la ruta absoluta del directorio actual
set SCRIPT_DIR=%~dp0
set MANIFEST_PATH=%SCRIPT_DIR%native-host-manifest.json

REM Registrar en el registro de Windows para Chrome
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.gestor.contrasenyas" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f

REM Registrar para Edge
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.gestor.contrasenyas" /ve /t REG_SZ /d "%MANIFEST_PATH%" /f

echo.
echo Instalacion completada!
echo Manifest path: %MANIFEST_PATH%
echo.
echo Ahora carga la extension desde chrome://extensions/ (modo desarrollador)
pause
