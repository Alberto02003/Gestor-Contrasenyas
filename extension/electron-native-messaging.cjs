// Native Messaging Handler para Electron
// Este módulo maneja la comunicación entre la extensión del navegador y la app Electron

const { ipcMain } = require('electron');

// Estado de la vault (se sincroniza con el renderer)
let vaultState = {
  isUnlocked: false,
  credentials: []
};

// Configurar stdio para native messaging
function setupNativeMessaging(mainWindow) {
  // Verificar si se inició con parámetro --native-messaging
  if (!process.argv.includes('--native-messaging')) {
    return; // No es modo native messaging
  }

  console.log('[NativeMessaging] Modo activado');

  // Configurar streams para mensajes de Chrome Native Messaging
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  let messageBuffer = '';
  let messageLength = null;

  process.stdin.on('data', (chunk) => {
    messageBuffer += chunk;

    while (messageBuffer.length > 0) {
      // Leer longitud del mensaje (4 bytes)
      if (messageLength === null) {
        if (messageBuffer.length < 4) break;

        messageLength = 0;
        for (let i = 0; i < 4; i++) {
          messageLength |= (messageBuffer.charCodeAt(i) << (i * 8));
        }
        messageBuffer = messageBuffer.substring(4);
      }

      // Leer mensaje completo
      if (messageBuffer.length < messageLength) break;

      const messageText = messageBuffer.substring(0, messageLength);
      messageBuffer = messageBuffer.substring(messageLength);
      messageLength = null;

      try {
        const message = JSON.parse(messageText);
        handleNativeMessage(message, mainWindow);
      } catch (error) {
        console.error('[NativeMessaging] Error parsing message:', error);
      }
    }
  });

  process.stdin.on('end', () => {
    console.log('[NativeMessaging] Stream cerrado');
    process.exit(0);
  });
}

// Enviar mensaje a la extensión
function sendNativeMessage(message) {
  const messageText = JSON.stringify(message);
  const messageLength = Buffer.byteLength(messageText, 'utf8');

  // Escribir longitud (4 bytes little-endian)
  const lengthBuffer = Buffer.allocUnsafe(4);
  lengthBuffer.writeUInt32LE(messageLength, 0);

  process.stdout.write(lengthBuffer);
  process.stdout.write(messageText, 'utf8');
}

// Manejar mensajes de la extensión
async function handleNativeMessage(message, mainWindow) {
  console.log('[NativeMessaging] Mensaje recibido:', message);

  const { action, messageId } = message;
  let response = { messageId };

  try {
    switch (action) {
      case 'getVaultStatus':
        response.isUnlocked = vaultState.isUnlocked;
        break;

      case 'getCredentials':
        if (!vaultState.isUnlocked) {
          response.error = 'Vault bloqueada';
        } else {
          // Filtrar credenciales por URL
          const url = message.url;
          const filtered = vaultState.credentials.filter(cred => {
            if (!cred.url) return false;
            return cred.url.includes(url) || url.includes(cred.url);
          });
          response.credentials = filtered;
        }
        break;

      case 'searchCredentials':
        if (!vaultState.isUnlocked) {
          response.error = 'Vault bloqueada';
        } else {
          const query = (message.query || '').toLowerCase();
          const filtered = query
            ? vaultState.credentials.filter(cred =>
                cred.title.toLowerCase().includes(query) ||
                cred.username.toLowerCase().includes(query)
              )
            : vaultState.credentials;
          response.credentials = filtered;
        }
        break;

      case 'unlockVault':
        // Delegar desbloqueo al renderer
        mainWindow.webContents.send('extension-unlock-request', {
          password: message.password
        });
        // Esperar respuesta del renderer
        response = await waitForRendererResponse('unlock-response');
        response.messageId = messageId;
        break;

      default:
        response.error = 'Acción desconocida';
    }
  } catch (error) {
    console.error('[NativeMessaging] Error manejando mensaje:', error);
    response.error = error.message;
  }

  sendNativeMessage(response);
}

// Esperar respuesta del renderer
function waitForRendererResponse(channel, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ipcMain.removeListener(channel, listener);
      reject(new Error('Timeout'));
    }, timeout);

    const listener = (event, data) => {
      clearTimeout(timer);
      ipcMain.removeListener(channel, listener);
      resolve(data);
    };

    ipcMain.once(channel, listener);
  });
}

// Configurar IPC handlers para sincronizar estado
function setupVaultSync(mainWindow) {
  // Actualizar estado cuando la vault cambie
  ipcMain.on('vault-state-changed', (event, state) => {
    vaultState.isUnlocked = state.isUnlocked;
    vaultState.credentials = state.credentials || [];

    console.log('[NativeMessaging] Estado actualizado:', {
      isUnlocked: vaultState.isUnlocked,
      credentialsCount: vaultState.credentials.length
    });

    // Notificar a la extensión si está en modo native messaging
    if (process.argv.includes('--native-messaging')) {
      sendNativeMessage({
        action: 'vaultUpdated',
        isUnlocked: vaultState.isUnlocked
      });
    }
  });

  // Handler para obtener estado desde el renderer
  ipcMain.handle('get-vault-state', () => {
    return vaultState;
  });
}

module.exports = {
  setupNativeMessaging,
  setupVaultSync,
  sendNativeMessage
};
