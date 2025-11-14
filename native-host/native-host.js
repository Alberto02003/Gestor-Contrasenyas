#!/usr/bin/env node

/**
 * Native Messaging Host para Gestor de Contraseñas
 * Maneja la comunicación entre la extensión del navegador y la aplicación Electron
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const API_PORT = 45833;
const VAULT_PATH = path.join(require('os').homedir(), '.password-vault', 'vault.json');

// Logging para debug
function log(message) {
  const logPath = path.join(__dirname, 'native-host.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

log('Native Messaging Host iniciado');

// Lee un mensaje desde stdin (formato Native Messaging)
function readMessage() {
  return new Promise((resolve, reject) => {
    const lengthBuffer = Buffer.alloc(4);
    let bytesRead = 0;

    process.stdin.on('readable', () => {
      if (bytesRead < 4) {
        const chunk = process.stdin.read(4 - bytesRead);
        if (chunk) {
          chunk.copy(lengthBuffer, bytesRead);
          bytesRead += chunk.length;

          if (bytesRead === 4) {
            const messageLength = lengthBuffer.readUInt32LE(0);
            const messageBuffer = Buffer.alloc(messageLength);
            let messageBytesRead = 0;

            const readMessageChunk = () => {
              const chunk = process.stdin.read(messageLength - messageBytesRead);
              if (chunk) {
                chunk.copy(messageBuffer, messageBytesRead);
                messageBytesRead += chunk.length;

                if (messageBytesRead === messageLength) {
                  const message = JSON.parse(messageBuffer.toString('utf8'));
                  resolve(message);
                } else {
                  process.stdin.once('readable', readMessageChunk);
                }
              } else {
                process.stdin.once('readable', readMessageChunk);
              }
            };

            readMessageChunk();
          }
        }
      }
    });

    process.stdin.on('end', () => {
      log('stdin cerrado');
      process.exit(0);
    });

    process.stdin.on('error', (error) => {
      log(`Error en stdin: ${error.message}`);
      reject(error);
    });
  });
}

// Envía un mensaje a stdout (formato Native Messaging)
function sendMessage(message) {
  const buffer = Buffer.from(JSON.stringify(message), 'utf8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(buffer.length, 0);

  process.stdout.write(lengthBuffer);
  process.stdout.write(buffer);

  log(`Mensaje enviado: ${JSON.stringify(message)}`);
}

// Obtiene credenciales desde el archivo vault o vía API
async function getCredentials() {
  try {
    // Primero intentar leer desde el vault local
    if (fs.existsSync(VAULT_PATH)) {
      const vaultData = JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8'));
      if (vaultData.credentials && Array.isArray(vaultData.credentials)) {
        log(`Credenciales leídas desde vault: ${vaultData.credentials.length}`);
        return vaultData.credentials.map(c => ({
          id: c.id,
          title: c.title,
          username: c.username,
          password: c.password,
          url: c.url
        }));
      }
    }

    // Fallback: intentar obtener vía API HTTP local
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${API_PORT}/api/credentials`, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            log(`Credenciales obtenidas vía API: ${parsed.credentials?.length || 0}`);
            resolve(parsed.credentials || []);
          } catch (error) {
            log(`Error parseando respuesta API: ${error.message}`);
            resolve([]);
          }
        });
      });

      req.on('error', (error) => {
        log(`Error conectando con API: ${error.message}`);
        resolve([]);
      });

      req.setTimeout(3000, () => {
        req.abort();
        log('Timeout conectando con API');
        resolve([]);
      });
    });
  } catch (error) {
    log(`Error obteniendo credenciales: ${error.message}`);
    return [];
  }
}

// Procesa mensajes recibidos
async function handleMessage(message) {
  log(`Mensaje recibido: ${JSON.stringify(message)}`);

  if (message.type === 'get-credentials') {
    const credentials = await getCredentials();
    sendMessage({
      type: 'credentials',
      credentials
    });
  } else if (message.type === 'ping') {
    sendMessage({
      type: 'pong',
      timestamp: Date.now()
    });
  } else {
    log(`Tipo de mensaje desconocido: ${message.type}`);
    sendMessage({
      type: 'error',
      message: 'Tipo de mensaje desconocido'
    });
  }
}

// Loop principal
async function main() {
  try {
    while (true) {
      const message = await readMessage();
      await handleMessage(message);
    }
  } catch (error) {
    log(`Error en loop principal: ${error.message}`);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}\n${error.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Iniciar
main();
