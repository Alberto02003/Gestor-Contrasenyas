@echo off
REM Native Messaging Host para Gestor de Contraseñas
REM Este script inicia el servidor Node.js que maneja la comunicación

cd /d "%~dp0"
node native-host.js
