// Content Script - Autocompletar credenciales en formularios de login
let detectedForms = [];
let credentialsCache = [];

// Obtener hostname de la URL actual
function getHostname() {
  return window.location.hostname.replace('www.', '');
}

// Detectar campos de login en la página
function detectLoginFields() {
  // Buscar todos los campos de contraseña
  const passwordFields = document.querySelectorAll('input[type="password"]');

  passwordFields.forEach((passwordField, index) => {
    // Evitar duplicados
    if (passwordField.dataset.gestorProcessed) return;
    passwordField.dataset.gestorProcessed = 'true';

    // Buscar campo de usuario cercano
    const form = passwordField.closest('form') || passwordField.parentElement;
    const usernameField = form?.querySelector(
      'input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], ' +
      'input[type="text"][name*="login"], input[type="text"][id*="user"], input[type="text"][id*="email"], ' +
      'input[autocomplete="username"], input[autocomplete="email"]'
    );

    detectedForms.push({
      passwordField,
      usernameField,
      form,
      index
    });

    // Añadir botón de autofill
    addAutofillButton(passwordField, index);

    // Verificar si hay credenciales para esta URL
    checkCredentialsForSite();
  });
}

// Verificar si hay credenciales disponibles para este sitio
async function checkCredentialsForSite() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_CREDENTIALS',
      url: getHostname()
    });

    if (response?.credentials?.length > 0) {
      credentialsCache = response.credentials;
      console.log(`[Gestor] ${credentialsCache.length} credencial(es) disponible(s) para ${getHostname()}`);
    }
  } catch (e) {
    // App no disponible
  }
}

// Añadir botón de autofill al campo de contraseña
function addAutofillButton(passwordField, formIndex) {
  // Verificar si ya existe
  if (passwordField.parentElement?.querySelector('.gestor-btn')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gestor-btn';
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>`;
  btn.title = 'Autocompletar';

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showCredentialPicker(formIndex);
  });

  // Posicionar el botón
  const wrapper = document.createElement('div');
  wrapper.className = 'gestor-wrapper';
  passwordField.parentNode.insertBefore(wrapper, passwordField);
  wrapper.appendChild(passwordField);
  wrapper.appendChild(btn);
}

// Mostrar selector de credenciales
async function showCredentialPicker(formIndex) {
  // Cerrar picker existente
  document.querySelector('.gestor-picker')?.remove();

  // Obtener credenciales actualizadas
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_CREDENTIALS',
      url: getHostname()
    });

    const credentials = response?.credentials || [];

    if (credentials.length === 0) {
      showToast('No hay credenciales para este sitio');
      return;
    }

    // Si solo hay una credencial, autocompletar directamente
    if (credentials.length === 1) {
      fillCredential(credentials[0], formIndex);
      return;
    }

    // Mostrar picker para múltiples credenciales
    const picker = document.createElement('div');
    picker.className = 'gestor-picker';
    picker.innerHTML = `
      <div class="gestor-picker-header">Seleccionar cuenta</div>
      ${credentials.map((cred, i) => `
        <div class="gestor-picker-item" data-index="${i}">
          <div class="gestor-picker-title">${escapeHtml(cred.title)}</div>
          <div class="gestor-picker-user">${escapeHtml(cred.username)}</div>
        </div>
      `).join('')}
    `;

    document.body.appendChild(picker);

    // Posicionar cerca del campo
    const formData = detectedForms[formIndex];
    if (formData?.passwordField) {
      const rect = formData.passwordField.getBoundingClientRect();
      picker.style.top = `${rect.bottom + window.scrollY + 4}px`;
      picker.style.left = `${rect.left + window.scrollX}px`;
    }

    // Event listeners
    picker.querySelectorAll('.gestor-picker-item').forEach((item, i) => {
      item.addEventListener('click', () => {
        fillCredential(credentials[i], formIndex);
        picker.remove();
      });
    });

    // Cerrar al hacer clic fuera
    setTimeout(() => {
      document.addEventListener('click', function close(e) {
        if (!picker.contains(e.target)) {
          picker.remove();
          document.removeEventListener('click', close);
        }
      });
    }, 50);

  } catch (e) {
    showToast('Error conectando con la app');
  }
}

// Rellenar formulario con credencial
function fillCredential(credential, formIndex) {
  const formData = detectedForms[formIndex];
  if (!formData) return;

  // Rellenar usuario
  if (formData.usernameField && credential.username) {
    setInputValue(formData.usernameField, credential.username);
  }

  // Rellenar contraseña
  if (formData.passwordField && credential.password) {
    setInputValue(formData.passwordField, credential.password);
  }

  showToast('Credenciales completadas');
}

// Establecer valor en input disparando eventos correctos
function setInputValue(input, value) {
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

// Mostrar notificación toast
function showToast(message) {
  const existing = document.querySelector('.gestor-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'gestor-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 200);
  }, 2000);
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Escuchar mensajes del background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FILL_FORM' && message.credential) {
    fillCredential(message.credential, 0);
    sendResponse({ success: true });
  }
  return true;
});

// Detectar formularios al cargar
detectLoginFields();

// Observer para formularios dinámicos (SPA)
const observer = new MutationObserver(() => {
  detectLoginFields();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('[Gestor] Content script cargado');
