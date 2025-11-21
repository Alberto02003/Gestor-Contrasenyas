// Background Service Worker - Comunicación via HTTP con la app Electron
const API_URL = 'http://localhost:45833';

// Estado de conexión
let isConnected = false;

// Verificar conexión con la app
async function checkConnection() {
  try {
    const response = await fetch(`${API_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      isConnected = true;
      console.log('[Background] Conectado a la app:', data);
      return data;
    }
  } catch (error) {
    isConnected = false;
    console.log('[Background] App no disponible');
  }
  return { isUnlocked: false };
}

// Obtener estado de la vault
async function getVaultStatus() {
  try {
    const response = await fetch(`${API_URL}/status`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('[Background] Error obteniendo estado:', error);
  }
  return { isUnlocked: false, error: 'No conectado' };
}

// Obtener credenciales
async function getCredentials(url = '') {
  try {
    const endpoint = url
      ? `${API_URL}/credentials?url=${encodeURIComponent(url)}`
      : `${API_URL}/credentials`;
    const response = await fetch(endpoint);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('[Background] Error obteniendo credenciales:', error);
  }
  return { credentials: [], error: 'No conectado' };
}

// Buscar credenciales
async function searchCredentials(query = '') {
  try {
    const response = await fetch(`${API_URL}/credentials?search=${encodeURIComponent(query)}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('[Background] Error buscando credenciales:', error);
  }
  return { credentials: [], error: 'No conectado' };
}

// Manejar mensajes de content scripts y popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Mensaje recibido:', message);

  switch (message.type) {
    case 'CONNECT':
    case 'CONNECT_NATIVE':
      checkConnection().then(status => sendResponse(status));
      return true;

    case 'GET_VAULT_STATUS':
      getVaultStatus().then(status => sendResponse(status));
      return true;

    case 'GET_CREDENTIALS':
      getCredentials(message.url || '').then(response => sendResponse(response));
      return true;

    case 'SEARCH_CREDENTIALS':
      searchCredentials(message.query || '').then(response => sendResponse(response));
      return true;

    case 'AUTOFILL_CREDENTIAL':
      // Enviar credencial al content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'FILL_FORM',
            credential: message.credential
          });
          sendResponse({ success: true });
        } else {
          sendResponse({ error: 'No active tab' });
        }
      });
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// Detectar cambios de URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.tabs.sendMessage(tabId, {
      type: 'URL_CHANGED',
      url: tab.url
    }).catch(() => {});
  }
});

// Verificar conexión periódicamente
setInterval(() => {
  checkConnection();
}, 5000);

// Verificar al iniciar
checkConnection();

console.log('[Background] Service worker iniciado - usando HTTP API en puerto 45833');
