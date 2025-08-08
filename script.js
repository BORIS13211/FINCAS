'use strict';

// Simple data store using localStorage so it works without backend
const storageKeys = {
  currentUser: 'sgi_current_user',
  incidents: 'sgi_incidents',
  industrials: 'sgi_industrials',
  communities: 'sgi_communities'
};

const appState = {
  currentUser: null,
  incidents: [],
  industrials: [],
  communities: [],
  selectedIndustrialIds: new Set(),
  isDropdownOpen: false
};

// Try to init Supabase if keys are present (optional)
let supabaseClient = null;
(function initSupabaseIfAvailable() {
  const url = localStorage.getItem('SB_URL');
  const anon = localStorage.getItem('SB_ANON_KEY');
  if (window.supabase && url && anon) {
    try {
      supabaseClient = window.supabase.createClient(url, anon);
      console.info('[Supabase] Cliente inicializado');
    } catch (e) {
      console.warn('[Supabase] No se pudo inicializar:', e);
    }
  }
})();

function loadFromStorage() {
  try {
    appState.currentUser = JSON.parse(localStorage.getItem(storageKeys.currentUser));
  } catch {}
  try {
    appState.incidents = JSON.parse(localStorage.getItem(storageKeys.incidents)) || [];
  } catch { appState.incidents = []; }
  try {
    appState.industrials = JSON.parse(localStorage.getItem(storageKeys.industrials)) || [];
  } catch { appState.industrials = []; }
  try {
    appState.communities = JSON.parse(localStorage.getItem(storageKeys.communities)) || [];
  } catch { appState.communities = []; }
}

function saveToStorage() {
  localStorage.setItem(storageKeys.incidents, JSON.stringify(appState.incidents));
  localStorage.setItem(storageKeys.industrials, JSON.stringify(appState.industrials));
  localStorage.setItem(storageKeys.communities, JSON.stringify(appState.communities));
}

// Utilities
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

function showNotification(message, type = 'success', timeoutMs = 2500) {
  const container = qs('#notificationContainer');
  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, timeoutMs);
}

function formatPhone(phone) {
  return phone.trim();
}

// Tabs
function setActiveTab(tabId) {
  qsa('.tab').forEach(btn => btn.classList.remove('active'));
  qsa('.tab-content').forEach(c => c.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) {
    target.classList.add('active');
    // activate corresponding tab button
    qsa('.tabs .tab').forEach(btn => {
      if (btn.getAttribute('onclick')?.includes(`"${tabId}"`) || btn.getAttribute('onclick')?.includes(`'${tabId}'`)) {
        btn.classList.add('active');
      }
    });
  }
}

function showTab(tabId, event) {
  if (event) event.preventDefault();
  setActiveTab(tabId);
  if (tabId === 'newIncident') {
    rebuildIndustrialDropdown();
    populateCommunitySelect();
  }
  if (tabId === 'incidentList') {
    renderIncidentList();
  }
  if (tabId === 'industrials') {
    renderIndustrialsList();
  }
  if (tabId === 'communities') {
    renderCommunitiesList();
  }
}

function navigateToTab(tabId) {
  setActiveTab(tabId);
  if (tabId === 'incidentList') renderIncidentList();
  if (tabId === 'industrials') renderIndustrialsList();
  if (tabId === 'communities') renderCommunitiesList();
}

window.showTab = showTab;
window.navigateToTab = navigateToTab;

// Login / Logout
function setupLogin() {
  const loginForm = qs('#loginForm');
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = qs('#username').value.trim();
    const password = qs('#password').value.trim();

    qs('#usernameError').textContent = '';
    qs('#passwordError').textContent = '';

    if (!username) {
      qs('#usernameError').textContent = 'El usuario es obligatorio';
      return;
    }
    if (!password) {
      qs('#passwordError').textContent = 'La contraseña es obligatoria';
      return;
    }

    appState.currentUser = { username };
    localStorage.setItem(storageKeys.currentUser, JSON.stringify(appState.currentUser));
    qs('#currentUserDisplay').textContent = `👋 ${username}`;
    qs('#loginScreen').style.display = 'none';
    qs('#dashboard').style.display = 'block';
    renderAll();
    showNotification('Sesión iniciada');
  });
}

function logout() {
  appState.currentUser = null;
  localStorage.removeItem(storageKeys.currentUser);
  qs('#dashboard').style.display = 'none';
  qs('#loginScreen').style.display = 'grid';
  showNotification('Sesión cerrada', 'success');
}

window.logout = logout;

// Forms
function setupIncidentForm() {
  const form = qs('#incidentForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    // Basic validation
    const title = qs('#incidentTitle').value.trim();
    const priority = qs('#priority').value;
    const communityId = qs('#communitySelect').value;
    const ownerName = qs('#ownerName').value.trim();
    const ownerPhone = formatPhone(qs('#ownerPhone').value);
    const description = qs('#incidentDescription').value.trim();

    qs('#incidentTitleError').textContent = '';
    qs('#priorityError').textContent = '';
    qs('#communitySelectError').textContent = '';
    qs('#ownerNameError').textContent = '';
    qs('#ownerPhoneError').textContent = '';
    qs('#industrialsError').textContent = '';
    qs('#incidentDescriptionError').textContent = '';

    if (!title) { qs('#incidentTitleError').textContent = 'Campo obligatorio'; return; }
    if (!priority) { qs('#priorityError').textContent = 'Seleccione prioridad'; return; }
    if (!communityId) { qs('#communitySelectError').textContent = 'Seleccione una comunidad'; return; }
    if (!ownerName) { qs('#ownerNameError').textContent = 'Campo obligatorio'; return; }
    if (!ownerPhone) { qs('#ownerPhoneError').textContent = 'Campo obligatorio'; return; }
    if (appState.selectedIndustrialIds.size === 0) { qs('#industrialsError').textContent = 'Seleccione al menos un industrial'; return; }
    if (!description) { qs('#incidentDescriptionError').textContent = 'Campo obligatorio'; return; }

    const id = crypto.randomUUID();
    const assignedIndustrialIds = Array.from(appState.selectedIndustrialIds);
    const createdAt = new Date().toISOString();

    const incident = {
      id,
      title,
      priority,
      communityId,
      ownerName,
      ownerPhone,
      industrialIds: assignedIndustrialIds,
      description,
      status: 'pending',
      createdAt,
      updatedAt: createdAt
    };

    appState.incidents.unshift(incident);
    saveToStorage();
    appState.selectedIndustrialIds.clear();
    updateSelectedIndustrialsDisplay();
    form.reset();
    qs('#industrialSelectText').textContent = 'Seleccionar industriales';
    renderAll();
    setActiveTab('incidentList');
    showNotification('Incidencia creada');
  });
}

function setupIndustrialForm() {
  const form = qs('#industrialForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = qs('#industrialName').value.trim();
    const phone = formatPhone(qs('#industrialPhone').value);
    const specialties = Array.from(document.querySelectorAll('input[name="specialties"]:checked')).map(i => i.value);

    qs('#industrialNameError').textContent = '';
    qs('#industrialPhoneError').textContent = '';
    qs('#specialtiesError').textContent = '';

    if (!name) { qs('#industrialNameError').textContent = 'Campo obligatorio'; return; }
    if (!phone) { qs('#industrialPhoneError').textContent = 'Campo obligatorio'; return; }
    if (specialties.length === 0) { qs('#specialtiesError').textContent = 'Seleccione al menos una especialidad'; return; }

    const industrial = {
      id: crypto.randomUUID(),
      name,
      phone,
      specialties
    };

    appState.industrials.unshift(industrial);
    saveToStorage();
    form.reset();
    renderAll();
    rebuildIndustrialDropdown();
    showNotification('Industrial registrado');
  });
}

function setupCommunityForm() {
  const form = qs('#communityForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = qs('#communityName').value.trim();
    const address = qs('#communityAddress').value.trim();
    const presidentName = qs('#presidentName').value.trim();
    const presidentPhone = formatPhone(qs('#presidentPhone').value);

    qs('#communityNameError').textContent = '';
    qs('#communityAddressError').textContent = '';
    qs('#presidentNameError').textContent = '';
    qs('#presidentPhoneError').textContent = '';

    if (!name) { qs('#communityNameError').textContent = 'Campo obligatorio'; return; }
    if (!address) { qs('#communityAddressError').textContent = 'Campo obligatorio'; return; }
    if (!presidentName) { qs('#presidentNameError').textContent = 'Campo obligatorio'; return; }
    if (!presidentPhone) { qs('#presidentPhoneError').textContent = 'Campo obligatorio'; return; }

    const community = {
      id: crypto.randomUUID(),
      name,
      address,
      presidentName,
      presidentPhone
    };

    appState.communities.unshift(community);
    saveToStorage();
    form.reset();
    renderAll();
    showNotification('Comunidad agregada');
  });
}

// Dropdown Industriales
function toggleIndustrialDropdown() {
  const dropdown = qs('#industrialDropdown');
  appState.isDropdownOpen = !appState.isDropdownOpen;
  dropdown.style.display = appState.isDropdownOpen ? 'block' : 'none';
  if (appState.isDropdownOpen) {
    rebuildIndustrialDropdown();
  }
}

function rebuildIndustrialDropdown() {
  const dropdown = qs('#industrialDropdown');
  dropdown.innerHTML = '';
  if (appState.industrials.length === 0) {
    const info = document.createElement('div');
    info.className = 'multi-select-item';
    info.textContent = 'No hay industriales. Registre alguno primero.';
    dropdown.appendChild(info);
    return;
  }
  appState.industrials.forEach(ind => {
    const row = document.createElement('div');
    row.className = 'multi-select-item';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = appState.selectedIndustrialIds.has(ind.id);
    input.addEventListener('change', () => {
      if (input.checked) appState.selectedIndustrialIds.add(ind.id);
      else appState.selectedIndustrialIds.delete(ind.id);
      updateSelectedIndustrialsDisplay();
    });
    const label = document.createElement('label');
    label.textContent = `${ind.name} (${ind.specialties.join(', ')})`;
    row.appendChild(input);
    row.appendChild(label);
    dropdown.appendChild(row);
  });
  updateSelectedIndustrialsDisplay();
}

function updateSelectedIndustrialsDisplay() {
  const container = qs('#selectedIndustrialsDisplay');
  container.innerHTML = '';
  const selected = appState.industrials.filter(i => appState.selectedIndustrialIds.has(i.id));
  if (selected.length === 0) {
    qs('#industrialSelectText').textContent = 'Seleccionar industriales';
    return;
  }
  qs('#industrialSelectText').textContent = `${selected.length} seleccionado(s)`;
  selected.forEach(ind => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `${ind.name} <button class="remove" aria-label="Quitar">✕</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      appState.selectedIndustrialIds.delete(ind.id);
      rebuildIndustrialDropdown();
    });
    container.appendChild(chip);
  });
}

window.toggleIndustrialDropdown = toggleIndustrialDropdown;

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
  const container = e.target.closest('.multi-select-container');
  if (!container) {
    const dropdown = qs('#industrialDropdown');
    dropdown.style.display = 'none';
    appState.isDropdownOpen = false;
  }
});

// Lists renderers
function renderIncidentList() {
  const container = qs('#incidentListContainer');
  const term = (qs('#incidentSearch').value || '').toLowerCase();
  const communitiesById = new Map(appState.communities.map(c => [c.id, c]));
  const industrialsById = new Map(appState.industrials.map(i => [i.id, i]));

  const filtered = appState.incidents.filter(inc => {
    const inTitle = inc.title.toLowerCase().includes(term);
    const inDesc = inc.description.toLowerCase().includes(term);
    const comm = communitiesById.get(inc.communityId)?.name || '';
    const inCommunity = comm.toLowerCase().includes(term);
    return !term || inTitle || inDesc || inCommunity;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="card">Sin incidencias</div>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(inc => {
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = inc.title;

    const subtitle = document.createElement('div');
    subtitle.className = 'card-subtitle';
    const communityName = communitiesById.get(inc.communityId)?.name || '—';
    subtitle.textContent = `${communityName} • ${new Date(inc.createdAt).toLocaleString()}`;

    const row = document.createElement('div');
    row.className = 'card-row';

    const priority = document.createElement('span');
    priority.className = `badge ${inc.priority}`;
    priority.textContent = `Prioridad: ${translatePriority(inc.priority)}`;

    const statusSelect = document.createElement('select');
    statusSelect.className = 'status-select';
    ;['pending','scheduled','completed'].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = translateStatus(s);
      if (inc.status === s) opt.selected = true;
      statusSelect.appendChild(opt);
    });
    statusSelect.addEventListener('change', () => {
      inc.status = statusSelect.value;
      inc.updatedAt = new Date().toISOString();
      saveToStorage();
      renderStats();
    });

    const assignees = document.createElement('div');
    assignees.textContent = 'Asignados: ' + (inc.industrialIds.map(id => industrialsById.get(id)?.name || '—').join(', ') || '—');

    const desc = document.createElement('div');
    desc.textContent = inc.description;

    row.appendChild(priority);
    row.appendChild(statusSelect);

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(row);
    card.appendChild(assignees);
    card.appendChild(desc);

    container.appendChild(card);
  });
}

function translatePriority(p) {
  switch (p) {
    case 'low': return 'Baja';
    case 'medium': return 'Media';
    case 'high': return 'Alta';
    case 'urgent': return 'Urgente';
    default: return p;
  }
}

function translateStatus(s) {
  switch (s) {
    case 'pending': return 'Pendiente';
    case 'scheduled': return 'Programada';
    case 'completed': return 'Completada';
    default: return s;
  }
}

function renderIndustrialsList() {
  const container = qs('#industrialsListContainer');
  const term = (qs('#industrialSearch').value || '').toLowerCase();
  const filtered = appState.industrials.filter(ind =>
    !term || ind.name.toLowerCase().includes(term) || ind.specialties.join(', ').toLowerCase().includes(term)
  );

  if (filtered.length === 0) {
    container.innerHTML = '<div class="card">Sin industriales</div>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(ind => {
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = ind.name;
    const subtitle = document.createElement('div');
    subtitle.className = 'card-subtitle';
    subtitle.textContent = `${ind.phone} • ${ind.specialties.join(', ')}`;

    card.appendChild(title);
    card.appendChild(subtitle);
    container.appendChild(card);
  });
}

function renderCommunitiesList() {
  const container = qs('#communitiesListContainer');
  const term = (qs('#communitySearch').value || '').toLowerCase();
  const filtered = appState.communities.filter(c => !term || c.name.toLowerCase().includes(term) || c.address.toLowerCase().includes(term));

  if (filtered.length === 0) {
    container.innerHTML = '<div class="card">Sin comunidades</div>';
    return;
  }

  container.innerHTML = '';
  filtered.forEach(c => {
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = c.name;
    const subtitle = document.createElement('div');
    subtitle.className = 'card-subtitle';
    subtitle.textContent = `${c.address} • Presidente: ${c.presidentName} (${c.presidentPhone})`;
    card.appendChild(title);
    card.appendChild(subtitle);
    container.appendChild(card);
  });
}

function renderStats() {
  const total = appState.incidents.length;
  const pending = appState.incidents.filter(i => i.status === 'pending').length;
  const scheduled = appState.incidents.filter(i => i.status === 'scheduled').length;
  const completed = appState.incidents.filter(i => i.status === 'completed').length;

  qs('#totalIncidents').textContent = String(total);
  qs('#pendingIncidents').textContent = String(pending);
  qs('#scheduledIncidents').textContent = String(scheduled);
  qs('#completedIncidents').textContent = String(completed);
  qs('#totalCommunities').textContent = String(appState.communities.length);
  qs('#totalIndustrials').textContent = String(appState.industrials.length);
}

function populateCommunitySelect() {
  const select = qs('#communitySelect');
  if (!select) return;
  const prev = select.value;
  select.innerHTML = '<option value="">Seleccionar comunidad</option>';
  appState.communities.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
  // keep value if exists
  if (prev) select.value = prev;
}

function renderAll() {
  renderStats();
  populateCommunitySelect();
  renderIncidentList();
  renderIndustrialsList();
  renderCommunitiesList();
}

function setupSearches() {
  qs('#incidentSearch')?.addEventListener('input', renderIncidentList);
  qs('#industrialSearch')?.addEventListener('input', renderIndustrialsList);
  qs('#communitySearch')?.addEventListener('input', renderCommunitiesList);
}

function bootstrap() {
  loadFromStorage();
  setupLogin();
  setupIncidentForm();
  setupIndustrialForm();
  setupCommunityForm();
  setupSearches();

  if (appState.currentUser) {
    qs('#currentUserDisplay').textContent = `👋 ${appState.currentUser.username}`;
    qs('#loginScreen').style.display = 'none';
    qs('#dashboard').style.display = 'block';
    renderAll();
  } else {
    qs('#loginScreen').style.display = 'grid';
    qs('#dashboard').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);