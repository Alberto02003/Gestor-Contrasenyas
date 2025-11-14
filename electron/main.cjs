const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, nativeTheme, Notification } = require('electron');
const path = require('path');
const os = require('os');
const dgram = require('dgram');
const { randomUUID } = require('crypto');
const net = require('net');

let mainWindow = null;
let tray = null;
let isQuitting = false;
let networkSocket = null;
let presenceInterval = null;
let cleanupInterval = null;
let networkScanInterval = null;

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 600;
const NETWORK_PORT = 45832;
const NETWORK_GROUP = '230.189.10.10';
const PRESENCE_INTERVAL_MS = 3000; // Anunciar cada 3 segundos
const PEER_TTL_MS = 10000; // TTL de 10 segundos
const NETWORK_SCAN_INTERVAL_MS = 2000; // Escanear cada 2 segundos para detección en tiempo real
const PING_TIMEOUT_MS = 500; // Timeout rápido de 500ms para respuesta inmediata
const peerMap = new Map();
const selfId = randomUUID();

// Theme colors
const THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b',
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 350,
    minHeight: 500,
    maxWidth: 500,
    maxHeight: 800,
    frame: true,
    resizable: true,
    autoHideMenuBar: true, // Hide menu bar on Windows/Linux
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
    backgroundColor: '#ffffff',
  });

  // Remove menu completely
  Menu.setApplicationMenu(null);

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, dist/client is copied to dist in the asar
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
    // Open DevTools to debug
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    emitPeerUpdate();
  });

  // Prevent window from closing, minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create a simple icon for the tray (you'll want to replace this with a proper icon)
  const trayIcon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAAn0lEQVQ4jWNgGAWMDAwMDP+J8D8RGBgYmBgYGBgYiNX8nwg9DMQaQIoGRgYGBiZSNDMyMDBg08zIwMDARKwBMBfgMoCJWAPwGcBErAH4DGAi1gCYAWQ5gVgD/v8nTy8DAwMDA8N/MjH5Cv//Jwfw5QJiDP5PioP//yfG4P/EGvyfmLrIxFigmf+J1AsDRDv5/39GBgYGxv9kYAYGBkZGhqHvBACJ8i9t0c6kDAAAAABJRU5ErkJggg=='
  );

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Gestor de Contraseñas',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Gestor de Contraseñas');
  tray.setContextMenu(contextMenu);

  // Show window on tray icon click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
}

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  for (const details of Object.values(interfaces)) {
    if (!details) continue;
    for (const info of details) {
      if (info.family === 'IPv4' && !info.internal) {
        return info.address;
      }
    }
  }
  return '0.0.0.0';
}

function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  for (const details of Object.values(interfaces)) {
    if (!details) continue;
    for (const info of details) {
      if (info.family === 'IPv4' && !info.internal) {
        return {
          ip: info.address,
          netmask: info.netmask,
        };
      }
    }
  }
  return null;
}

function getNetworkRange() {
  const info = getNetworkInfo();
  if (!info) return [];

  const ipParts = info.ip.split('.').map(Number);
  const maskParts = info.netmask.split('.').map(Number);

  // Calcular la dirección de red
  const networkParts = ipParts.map((part, i) => part & maskParts[i]);

  // Calcular el rango de hosts
  const ips = [];
  const baseIP = networkParts.slice(0, 3).join('.');

  // Escanear desde .1 hasta .254 (excluyendo .0 y .255)
  for (let i = 1; i <= 254; i++) {
    const ip = `${baseIP}.${i}`;
    if (ip !== info.ip) { // No incluir la IP propia
      ips.push(ip);
    }
  }

  return ips;
}

function checkIPReachable(ip) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ ip, reachable: false, hasAppPort: false });
    }, PING_TIMEOUT_MS);

    socket.setTimeout(PING_TIMEOUT_MS);

    // Primero intentar conectar al puerto de la app (45832)
    socket.connect(NETWORK_PORT, ip, () => {
      clearTimeout(timeout);
      socket.destroy();
      // Si se conecta al puerto de la app, definitivamente es alcanzable y tiene la app
      resolve({ ip, reachable: true, hasAppPort: true });
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      socket.destroy();
      // Si falla la conexión al puerto de la app, intentar puerto común (445 SMB)
      checkCommonPort(ip).then(reachable => {
        resolve({ ip, reachable, hasAppPort: false });
      });
    });

    socket.on('timeout', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ ip, reachable: false, hasAppPort: false });
    });
  });
}

function checkCommonPort(ip) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 300); // 300ms timeout para puerto común

    socket.setTimeout(300);
    socket.connect(445, ip, () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });

    socket.on('timeout', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });
  });
}

async function scanNetwork() {
  const ips = getNetworkRange();
  console.log(`[network] Escaneando ${ips.length} direcciones IP...`);

  // Escanear en lotes de 50 IPs a la vez para máxima velocidad
  const batchSize = 50;
  const results = [];

  for (let i = 0; i < ips.length; i += batchSize) {
    const batch = ips.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(ip => checkIPReachable(ip)));
    results.push(...batchResults);
  }

  // Actualizar el mapa de peers con las IPs alcanzables
  const now = Date.now();
  let updated = false;

  for (const result of results) {
    if (result.reachable) {
      const existingPeer = peerMap.get(result.ip);
      if (!existingPeer) {
        // Nueva IP detectada
        peerMap.set(result.ip, {
          id: result.ip, // Usar IP como ID para equipos sin app
          name: `Equipo ${result.ip}`,
          ip: result.ip,
          lastSeen: now,
          hasApp: result.hasAppPort, // Si tiene el puerto abierto, probablemente tiene la app
        });
        updated = true;
        if (result.hasAppPort) {
          console.log(`[network] ¡Puerto de app detectado en ${result.ip}!`);
        }
      } else if (!existingPeer.hasApp) {
        // Actualizar lastSeen y hasApp para IPs detectadas por escaneo
        existingPeer.lastSeen = now;
        if (result.hasAppPort && !existingPeer.hasApp) {
          existingPeer.hasApp = true;
          updated = true;
          console.log(`[network] ¡Puerto de app ahora detectado en ${result.ip}!`);
        }
      }
    }
  }

  if (updated) {
    console.log(`[network] Detectados ${results.filter(r => r.reachable).length} equipos en la red`);
    emitPeerUpdate();
  }
}

function getPeers() {
  return Array.from(peerMap.values()).map((peer) => ({
    id: peer.id,
    name: peer.name,
    ip: peer.ip,
    lastSeen: peer.lastSeen,
    hasApp: peer.hasApp || false,
  }));
}

function emitPeerUpdate() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('network:peers-updated', getPeers());
  }
}

function announcePresence() {
  if (!networkSocket) return;
  const myIp = getLocalIPv4();
  const payload = JSON.stringify({
    type: 'presence',
    id: selfId,
    name: os.hostname(),
    ip: myIp,
    timestamp: Date.now(),
  });
  const buffer = Buffer.from(payload);

  console.log(`[network] Anunciando presencia: ${os.hostname()} (${myIp}) ID: ${selfId.slice(-8)}`);

  // Enviar por multicast (por si funciona)
  networkSocket.send(buffer, NETWORK_PORT, NETWORK_GROUP, (err) => {
    if (err) {
      console.error('[network] Error enviando anuncio multicast:', err);
    }
  });

  // TAMBIÉN enviar directamente a todas las IPs detectadas (unicast)
  // Esto asegura que las apps se detecten incluso si multicast está bloqueado
  for (const [id, peer] of peerMap.entries()) {
    if (peer.ip && peer.ip !== myIp && peer.ip !== '0.0.0.0') {
      networkSocket.send(buffer, NETWORK_PORT, peer.ip, (err) => {
        if (err && err.code !== 'EHOSTUNREACH') {
          console.error(`[network] Error enviando anuncio unicast a ${peer.ip}:`, err.code);
        }
      });
    }
  }
}

function cleanupPeers() {
  const now = Date.now();
  let removed = false;
  for (const [key, peer] of peerMap.entries()) {
    if (now - peer.lastSeen > PEER_TTL_MS) {
      peerMap.delete(key);
      removed = true;
    }
  }
  if (removed) {
    emitPeerUpdate();
  }
}

function handlePresencePacket(packet) {
  if (!packet?.id || packet.id === selfId) return;
  console.log(`[network] Presencia recibida de: ${packet.name} (${packet.ip}) ID: ${packet.id.slice(-8)}`);
  const existing = peerMap.get(packet.id);
  const updatedPeer = {
    id: packet.id,
    name: packet.name || `Equipo ${packet.id.slice(-4)}`,
    ip: packet.ip || '0.0.0.0',
    lastSeen: packet.timestamp || Date.now(),
    hasApp: true, // Este equipo tiene la app instalada
  };
  peerMap.set(packet.id, { ...updatedPeer });
  if (!existing || existing.ip !== updatedPeer.ip || existing.hasApp !== updatedPeer.hasApp) {
    console.log(`[network] Peer actualizado/agregado: ${updatedPeer.name} (${updatedPeer.ip})`);
    emitPeerUpdate();
  }
}

function handleSharePacket(packet, remoteAddress) {
  if (!packet || packet.targetId !== selfId) return;
  const shareId = packet.shareId || randomUUID();
  const payload = {
    id: shareId,
    fromName: packet.fromName || 'Equipo desconocido',
    fromIp: packet.fromIp || remoteAddress,
    credentialTitle: packet.credential?.title || 'Contrasena recibida',
    username: packet.credential?.username || '',
    password: packet.credential?.password || '',
    timestamp: packet.timestamp || Date.now(),
  };
  const notification = new Notification({
    title: '🔐 Contraseña compartida',
    body: `${payload.credentialTitle}\nDe: ${payload.fromName} (${payload.fromIp})\nUsuario: ${payload.username}`,
    icon: path.join(__dirname, '../public/icon.png'),
    timeoutType: 'default',
  });
  notification.show();

  // Mostrar la ventana cuando se recibe una contraseña
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('network:password-received', payload);
  }
}

function startNetworkBridge() {
  if (networkSocket) return;
  try {
    networkSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  } catch (error) {
    console.error('[network] Failed to create UDP socket', error);
    return;
  }

  networkSocket.on('error', (error) => {
    console.error('[network] Socket error', error);
  });

  networkSocket.on('message', (msg, rinfo) => {
    try {
      const packet = JSON.parse(msg.toString());
      console.log(`[network] Paquete recibido de ${rinfo?.address}:${rinfo?.port} tipo: ${packet.type}`);
      if (packet.type === 'presence') {
        handlePresencePacket(packet);
      } else if (packet.type === 'share') {
        handleSharePacket(packet, rinfo?.address);
      }
    } catch (error) {
      console.error('[network] Failed to parse packet', error);
    }
  });

  networkSocket.bind(NETWORK_PORT, () => {
    try {
      networkSocket.addMembership(NETWORK_GROUP);
      networkSocket.setBroadcast(true);
      networkSocket.setMulticastTTL(32);
    } catch (error) {
      console.warn('[network] Could not join multicast group', error);
    }
    announcePresence();
    presenceInterval = setInterval(announcePresence, PRESENCE_INTERVAL_MS);
    cleanupInterval = setInterval(cleanupPeers, PRESENCE_INTERVAL_MS);

    // Iniciar escaneo de red
    scanNetwork(); // Escaneo inicial
    networkScanInterval = setInterval(scanNetwork, NETWORK_SCAN_INTERVAL_MS);
  });
}

function stopNetworkBridge() {
  if (presenceInterval) {
    clearInterval(presenceInterval);
    presenceInterval = null;
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  if (networkScanInterval) {
    clearInterval(networkScanInterval);
    networkScanInterval = null;
  }
  if (networkSocket) {
    try {
      networkSocket.dropMembership(NETWORK_GROUP);
    } catch {
      // ignore
    }
    networkSocket.close();
    networkSocket = null;
  }
}

function shareWithPeer(peerId, credential) {
  if (!networkSocket) {
    throw new Error('Servicio de red no disponible');
  }
  const peer = peerMap.get(peerId);
  if (!peer) {
    throw new Error('Equipo no disponible');
  }
  const payload = JSON.stringify({
    type: 'share',
    shareId: randomUUID(),
    id: selfId,
    targetId: peerId,
    fromName: os.hostname(),
    fromIp: getLocalIPv4(),
    credential: {
      title: credential.title,
      username: credential.username,
      password: credential.password,
    },
    timestamp: Date.now(),
  });
  networkSocket.send(Buffer.from(payload), NETWORK_PORT, peer.ip, (err) => {
    if (err) {
      console.error('[network] Failed to deliver share', err);
    } else {
      // Mostrar notificación de éxito al remitente
      const notification = new Notification({
        title: '✅ Contraseña enviada',
        body: `${credential.title} enviada a ${peer.name}\nIP: ${peer.ip}\nUsuario: ${credential.username}`,
        icon: path.join(__dirname, '../public/icon.png'),
        timeoutType: 'default',
      });
      notification.show();
    }
  });
}

// Handle theme change from renderer
ipcMain.on('theme-changed', (event, theme) => {
  if (mainWindow) {
    let bgColor;
    if (theme === 'system') {
      bgColor = nativeTheme.shouldUseDarkColors ? THEME_COLORS.dark : THEME_COLORS.light;
    } else {
      bgColor = THEME_COLORS[theme] || THEME_COLORS.light;
    }
    mainWindow.setBackgroundColor(bgColor);
  }
});

ipcMain.handle('network:list-peers', () => {
  return getPeers();
});

ipcMain.handle('network:share-password', async (_event, payload) => {
  if (!payload || typeof payload.peerId !== 'string' || !payload.credential) {
    throw new Error('Datos de envío inválidos');
  }
  shareWithPeer(payload.peerId, payload.credential);
});

// Listen to system theme changes
nativeTheme.on('updated', () => {
  if (mainWindow) {
    mainWindow.webContents.send('system-theme-changed', nativeTheme.shouldUseDarkColors);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  startNetworkBridge();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('before-quit', () => {
  isQuitting = true;
  stopNetworkBridge();
});
