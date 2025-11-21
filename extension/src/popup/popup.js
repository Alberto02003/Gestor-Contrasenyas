// Popup minimalista - Solo muestra estado de conexión
const states = {
  loading: document.getElementById('loading'),
  connected: document.getElementById('connected'),
  disconnected: document.getElementById('disconnected'),
  locked: document.getElementById('locked')
};

function showState(state) {
  Object.keys(states).forEach(key => {
    states[key].style.display = key === state ? 'flex' : 'none';
  });
}

async function checkStatus() {
  showState('loading');

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_VAULT_STATUS' });

    if (response.error || response.isUnlocked === undefined) {
      showState('disconnected');
      return;
    }

    if (!response.isUnlocked) {
      showState('locked');
      return;
    }

    // Obtener cantidad de credenciales
    const credResponse = await chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' });
    const count = credResponse.credentials?.length || 0;

    document.getElementById('count').textContent =
      count === 1 ? '1 contraseña' : `${count} contraseñas`;

    showState('connected');

  } catch (error) {
    console.error('Error:', error);
    showState('disconnected');
  }
}

// Inicializar
checkStatus();
