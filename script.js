// Configuración de Supabase
const SUPABASE_URL = 'https://yncwsfolvwosftuglpcf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluY3dzZm9sdndvc2Z0dWdscGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTA2NTksImV4cCI6MjA3MDA2NjY1OX0.BbOv0BG6YdPZ9miPqHhLQbXodF5CiRiIMgot4HnO148';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado global de la aplicación
let currentUser = null;
let selectedIndustrials = [];
let incidents = [];
let communities = [];
let industrials = [];

// Estados de incidencias
const INCIDENT_STATES = {
    created: 'creada',
    notified_industrial: 'notificada_industrial',
    notified_president: 'notificada_presidente',
    completed: 'completada'
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando aplicación...');
    
    if (typeof window.supabase === 'undefined') {
        console.error('❌ ERROR CRÍTICO: Supabase no está cargado');
        showNotification('Error: Supabase no está disponible', 'error');
        return;
    }
    
    if (!supabase) {
        console.error('❌ ERROR CRÍTICO: Cliente Supabase no se pudo crear');
        showNotification('Error: No se pudo conectar a la base de datos', 'error');
        return;
    }
    
    console.log('✅ Supabase inicializado correctamente');
    setupEventListeners();
    loadAllData();
    console.log('✅ Aplicación inicializada completamente');
});

// Event Listeners
function setupEventListeners() {
    const forms = ['loginForm', 'incidentForm', 'communityForm', 'industrialForm'];
    const handlers = [handleLogin, handleIncidentSubmit, handleCommunitySubmit, handleIndustrialSubmit];
    
    forms.forEach((formId, index) => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', handlers[index]);
            console.log(`✅ ${formId} listener añadido`);
        } else {
            console.error(`❌ ${formId} no encontrado`);
        }
    });
    
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('industrialDropdown');
        const header = document.querySelector('.multi-select-header');
        if (!header?.contains(e.target) && !dropdown?.contains(e.target)) {
            closeIndustrialDropdown();
        }
    });
    
    console.log('✅ Todos los event listeners configurados');
}

// Autenticación
async function handleLogin(e) {
    e.preventDefault();
    clearAllErrors();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!validateCredentials(username, password)) return;
    
    if (username === 'admin' && password === 'admin') {
        currentUser = { username, loginTime: new Date() };
        showDashboard();
        await loadAllData();
        showNotification('¡Bienvenido!', 'success');
    } else {
        showFieldError('password', ['Credenciales incorrectas']);
    }
}

function validateCredentials(username, password) {
    let hasErrors = false;
    
    if (!username || username.length < 2) {
        showFieldError('username', ['Usuario requerido']);
        hasErrors = true;
    }
    
    if (!password || password.length < 2) {
        showFieldError('password', ['Contraseña requerida']);
        hasErrors = true;
    }
    
    return !hasErrors;
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('currentUserDisplay').textContent = `Bienvenido, ${currentUser.username}`;
}

function logout() {
    currentUser = null;
    selectedIndustrials = [];
    document.getElementById('loginScreen').style.display = 'grid';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginForm').reset();
    clearAllErrors();
}

// Gestión de Comunidades
async function handleCommunitySubmit(e) {
    e.preventDefault();
    clearAllErrors();
    
    const data = {
        name: document.getElementById('communityName').value.trim(),
        address: document.getElementById('communityAddress').value.trim(),
        president_name: document.getElementById('presidentName').value.trim(),
        president_phone: document.getElementById('presidentPhone').value.trim()
    };
    
    if (!validateCommunityData(data)) return;
    
    try {
        const { error } = await supabase.from('comunidades').insert([data]);
        if (error) throw error;
        
        document.getElementById('communityForm').reset();
        showNotification('Comunidad guardada correctamente', 'success');
        await loadCommunities();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al guardar comunidad', 'error');
    }
}

function validateCommunityData(data) {
    const errors = [];
    
    if (data.name.length < 2) errors.push(['communityName', 'Nombre muy corto']);
    if (data.address.length < 5) errors.push(['communityAddress', 'Dirección muy corta']);
    if (data.president_name.length < 2) errors.push(['presidentName', 'Nombre muy corto']);
    if (!validatePhone(data.president_phone)) errors.push(['presidentPhone', 'Teléfono inválido']);
    
    errors.forEach(([field, msg]) => showFieldError(field, [msg]));
    return errors.length === 0;
}

async function deleteCommunity(id) {
    if (!confirm('¿Eliminar esta comunidad?')) return;
    
    try {
        const { error } = await supabase.from('comunidades').delete().eq('id', id);
        if (error) throw error;
        showNotification('Comunidad eliminada', 'success');
        await loadCommunities();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar', 'error');
    }
}

// Gestión de Industriales
async function handleIndustrialSubmit(e) {
    e.preventDefault();
    clearAllErrors();
    
    const name = document.getElementById('industrialName').value.trim();
    const phone = document.getElementById('industrialPhone').value.trim();
    const specialties = Array.from(document.querySelectorAll('input[name="specialties"]:checked')).map(cb => cb.value);
    
    if (!validateIndustrialData(name, phone, specialties)) return;
    
    try {
        const { error } = await supabase.from('industriales').insert([{
            name, phone, specialties: specialties.join(', ')
        }]);
        
        if (error) throw error;
        
        document.getElementById('industrialForm').reset();
        showNotification('Industrial registrado correctamente', 'success');
        await loadIndustrials();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al registrar industrial', 'error');
    }
}

function validateIndustrialData(name, phone, specialties) {
    const errors = [];
    
    if (name.length < 2) errors.push(['industrialName', 'Nombre muy corto']);
    if (!validatePhone(phone)) errors.push(['industrialPhone', 'Teléfono inválido']);
    if (specialties.length === 0) errors.push(['specialties', 'Seleccione al menos una especialidad']);
    
    errors.forEach(([field, msg]) => showFieldError(field, [msg]));
    return errors.length === 0;
}

async function deleteIndustrial(id) {
    if (!confirm('¿Eliminar este industrial?')) return;
    
    try {
        const { error } = await supabase.from('industriales').delete().eq('id', id);
        if (error) throw error;
        showNotification('Industrial eliminado', 'success');
        await loadIndustrials();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar', 'error');
    }
}

// Gestión de Incidencias
async function handleIncidentSubmit(e) {
    e.preventDefault();
    clearAllErrors();
    
    console.log('🔍 Iniciando creación de incidencia...');
    
    const elements = ['incidentTitle', 'priority', 'communitySelect', 'incidentDescription']
        .map(id => ({ id, el: document.getElementById(id) }));
    
    if (elements.some(({ el, id }) => !el && console.error(`❌ ${id} no encontrado`))) {
        showNotification('Error: Formulario incompleto', 'error');
        return;
    }
    
    // Owner data comes from selected community (president)
    const selectedCommunityId = parseInt(elements[2].el.value) || null;
    const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

    const data = {
        title: elements[0].el.value.trim(),
        priority: elements[1].el.value,
        community_id: selectedCommunityId,
        owner_name: selectedCommunity ? selectedCommunity.president_name : '',
        owner_phone: selectedCommunity ? selectedCommunity.president_phone : '',
        description: elements[3].el.value.trim(),
        assigned_industrials: selectedIndustrials.map(i => i.id),
        status: INCIDENT_STATES.created
    };
    
    console.log('📝 Datos de la incidencia:', data);
    
    if (!validateIncidentData(data)) return;
    
    try {
        console.log('💾 Insertando en Supabase...');
        
        const { error } = await supabase.from('incidencias').insert([data]);
        if (error) throw error;
        
        console.log('✅ Incidencia creada exitosamente');
        
        // Limpiar formulario
        document.getElementById('incidentForm').reset();
        selectedIndustrials = [];
        updateIndustrialSelection();
        closeIndustrialDropdown();
        
        showNotification('Incidencia reportada exitosamente', 'success');
        await loadIncidents();
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        showNotification(`Error al reportar incidencia: ${error.message}`, 'error');
    }
}

function validateIncidentData(data) {
    const validations = [
        [!data.title || data.title.length < 3, 'incidentTitle', 'Título muy corto (mínimo 3 caracteres)'],
        [!data.priority, 'priority', 'Seleccione prioridad'],
        [!data.community_id || isNaN(data.community_id), 'communitySelect', 'Seleccione comunidad'],
        [!selectedIndustrials || selectedIndustrials.length === 0, 'industrials', 'Seleccione al menos un industrial'],
        [!data.description || data.description.length < 5, 'incidentDescription', 'Descripción muy corta (mínimo 5 caracteres)']
    ];
    
    const errors = validations.filter(([condition]) => condition).map(([, field, msg]) => [field, msg]);
    
    errors.forEach(([field, msg]) => showFieldError(field, [msg]));
    
    return errors.length === 0;
}

// ✅ FUNCIÓN CORREGIDA: Notificar al Propietario (no al industrial)
async function notifyIndustrial(id) {
    try {
        console.log('🔔 Notificando propietario para incidencia:', id);
        
        const { data: incidentData, error: selectError } = await supabase
            .from('incidencias')
            .select('*, comunidades(name, address)')
            .eq('id', id)
            .single();

        if (selectError) {
            console.error('Error al obtener incidencia:', selectError);
            throw selectError;
        }

        console.log('📋 Datos incidencia obtenidos:', incidentData);

        // Actualizar estado a notificado industrial
        const { error: updateError } = await supabase
            .from('incidencias')
            .update({ status: INCIDENT_STATES.notified_industrial })
            .eq('id', id);

        if (updateError) {
            console.error('Error al actualizar estado:', updateError);
            throw updateError;
        }

        console.log('✅ Estado actualizado correctamente');

        // ✅ CORREGIDO: Enviar notificación al PROPIETARIO (no al industrial)
        sendOwnerNotification(incidentData);
        
        showNotification('Propietario notificado correctamente', 'success');
        await loadIncidents();

    } catch (error) {
        console.error('❌ Error completo al notificar:', error);
        showNotification(`Error al notificar: ${error.message}`, 'error');
    }
}

// ✅ NUEVA FUNCIÓN: Notificar al propietario
function sendOwnerNotification(incident) {
    const phone = incident.owner_phone.replace(/[^0-9]/g, '');
    const community = incident.comunidades?.name || 'Comunidad';
    const address = incident.comunidades?.address || '';
    
    const content = `📋 CONFIRMACIÓN DE INCIDENCIA RECIBIDA

Estimado/a ${incident.owner_name},

Hemos recibido su reporte de incidencia y ya estamos gestionando la solución:

📋 Título: ${incident.title}
📍 Comunidad: ${community}
🏠 Dirección: ${address}
⚠️ Prioridad: ${getPriorityText(incident.priority)}
📝 Descripción: ${incident.description}

Nuestro equipo técnico especializado se pondrá en contacto con usted próximamente para coordinar la intervención.

Le mantendremos informado del progreso.`;

    const message = createWhatsAppMessage(content);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ✅ FUNCIÓN CORREGIDA: Notificar a los industriales cuando se notifica al presidente
async function notifyPresident(id) {
    try {
        console.log('🔔 Notificando presidente e industriales para incidencia:', id);
        
        const { data: incidentData, error: selectError } = await supabase
            .from('incidencias')
            .select('*, comunidades(name, address, president_name, president_phone)')
            .eq('id', id)
            .single();

        if (selectError) {
            console.error('Error al obtener incidencia:', selectError);
            throw selectError;
        }

        console.log('📋 Datos incidencia obtenidos:', incidentData);

        // Actualizar estado a notificado presidente
        const { error: updateError } = await supabase
            .from('incidencias')
            .update({ status: INCIDENT_STATES.notified_president })
            .eq('id', id);

        if (updateError) {
            console.error('Error al actualizar estado:', updateError);
            throw updateError;
        }

        console.log('✅ Estado actualizado correctamente');

        // Enviar notificación al presidente
        sendPresidentNotification(incidentData);
        
        // ✅ AHORA SÍ: Notificar a los industriales para que vayan a trabajar
        sendIndustrialsWorkNotification(incidentData);
        
        showNotification('Presidente e industriales notificados', 'success');
        await loadIncidents();

    } catch (error) {
        console.error('❌ Error completo al notificar:', error);
        showNotification(`Error al notificar: ${error.message}`, 'error');
    }
}

// ✅ FUNCIÓN ACTUALIZADA: Cambio de estado manual
async function updateIncidentStatus(id, status) {
    try {
        const { data: incidentData, error: selectError } = await supabase
            .from('incidencias')
            .select('*, comunidades(name, address, president_name, president_phone)')
            .eq('id', id)
            .single();

        if (selectError) throw selectError;

        const { error: updateError } = await supabase
            .from('incidencias')
            .update({ status })
            .eq('id', id);

        if (updateError) throw updateError;

        showNotification('Estado actualizado', 'success');
        await loadIncidents();

        // Enviar reporte de finalización si se completa
        if (status === INCIDENT_STATES.completed) {
            sendCompletionReportToOwner(incidentData);
        }
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al actualizar', 'error');
    }
}

async function deleteIncident(id) {
    if (!confirm('¿Eliminar esta incidencia?')) return;
    
    try {
        const { error } = await supabase.from('incidencias').delete().eq('id', id);
        if (error) throw error;
        showNotification('Incidencia eliminada', 'success');
        await loadIncidents();
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar', 'error');
    }
}

// Funciones de carga de datos desde Supabase
async function loadAllData() {
    await Promise.all([loadCommunities(), loadIndustrials(), loadIncidents()]);
    updateStats();
}

async function loadCommunities() {
    try {
        const { data, error } = await supabase.from('comunidades').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        communities = data || [];
        loadCommunityOptions();
        loadCommunitiesList();
        updateStats();
    } catch (error) {
        console.error('Error loading communities:', error);
    }
}

async function loadIndustrials() {
    try {
        const { data, error } = await supabase.from('industriales').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        industrials = data || [];
        loadIndustrialOptions();
        loadIndustrialsList();
        updateStats();
    } catch (error) {
        console.error('Error loading industrials:', error);
    }
}

async function loadIncidents() {
    try {
        const { data, error } = await supabase
            .from('incidencias')
            .select(`*, comunidades(name, address), assigned_industrials`)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        incidents = data || [];
        loadIncidentsList();
        updateStats();
    } catch (error) {
        console.error('Error loading incidents:', error);
    }
}

// Funciones UI optimizadas
function loadCommunityOptions() {
    const select = document.getElementById('communitySelect');
    select.innerHTML = '<option value="">Seleccionar comunidad</option>' + 
        communities.map(community => `<option value="${community.id}">${community.name}</option>`).join('');
}

function loadCommunitiesList() {
    const container = document.getElementById('communitiesListContainer');
    
    if (communities.length === 0) {
        container.innerHTML = '<div class="loading">No hay comunidades registradas</div>';
        return;
    }
    
    container.innerHTML = communities.map(community => `
        <div class="incident-item">
            <div class="incident-info">
                <h3>🏢 ${community.name}</h3>
                <p><strong>Dirección:</strong> ${community.address}</p>
                <p><strong>Presidente:</strong> ${community.president_name}</p>
                <p><strong>Teléfono:</strong> ${community.president_phone}</p>
                <p><strong>Fecha:</strong> ${formatDate(community.created_at)}</p>
            </div>
            <div class="incident-actions">
                <button class="btn btn-danger" onclick="deleteCommunity(${community.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

function loadIndustrialOptions() {
    const dropdown = document.getElementById('industrialDropdown');
    
    if (industrials.length === 0) {
        dropdown.innerHTML = '<div style="padding: 15px; color: #666;">No hay industriales registrados</div>';
        return;
    }
    
    dropdown.innerHTML = industrials.map(industrial => `
        <div class="industrial-option">
            <input type="checkbox" class="industrial-checkbox" value="${industrial.id}"
                   onchange="toggleIndustrialCheckbox(${industrial.id})">
            <label>
                <div style="font-weight: 500;">${industrial.name}</div>
                <div style="font-size: 12px; color: #666;">${industrial.specialties}</div>
            </label>
        </div>
    `).join('');
    
    updateIndustrialCheckboxes();
}

function loadIndustrialsList() {
    const container = document.getElementById('industrialsListContainer');
    
    if (industrials.length === 0) {
        container.innerHTML = '<div class="loading">No hay industriales registrados</div>';
        return;
    }
    
    container.innerHTML = industrials.map(industrial => `
        <div class="incident-item">
            <div class="incident-info">
                <h3>👷 ${industrial.name}</h3>
                <p><strong>Teléfono:</strong> ${industrial.phone}</p>
                <p><strong>Especialidades:</strong> ${industrial.specialties}</p>
                <p><strong>Fecha:</strong> ${formatDate(industrial.created_at)}</p>
            </div>
            <div class="incident-actions">
                <button class="btn btn-danger" onclick="deleteIndustrial(${industrial.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

// ✅ FUNCIÓN ACTUALIZADA: Lista de incidencias con nuevos estados y botones
function loadIncidentsList() {
    const container = document.getElementById('incidentListContainer');
    
    if (incidents.length === 0) {
        container.innerHTML = '<div class="loading">No hay incidencias registradas</div>';
        return;
    }
    
    container.innerHTML = incidents.map(incident => {
        const communityName = incident.comunidades?.name || 'Comunidad no encontrada';
        const assignedIndustrials = getAssignedIndustrialsNames(incident.assigned_industrials);
        
        return `
            <div class="incident-item">
                <div class="incident-info">
                    <h3>${incident.title}</h3>
                    <p><strong>Comunidad:</strong> ${communityName}</p>
                    <p><strong>Propietario:</strong> ${incident.owner_name} - ${incident.owner_phone}</p>
                    <p><strong>Industrial(es):</strong> ${assignedIndustrials}</p>
                    <p><strong>Prioridad:</strong> ${getPriorityText(incident.priority)}</p>
                    <p><strong>Descripción:</strong> ${incident.description}</p>
                    <p><strong>Fecha:</strong> ${formatDate(incident.created_at)}</p>
                </div>
                <div class="incident-actions" style="display: flex; flex-direction: column; gap: 10px;">
                    <span class="status-badge status-${incident.status}">${getStatusText(incident.status)}</span>
                    ${getActionButtons(incident)}
                    <button class="btn btn-whatsapp" onclick="sendFollowUpMessage(${incident.id})">📱 Seguimiento</button>
                    <button class="btn btn-danger" onclick="deleteIncident(${incident.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function getAssignedIndustrialsNames(assignedIds) {
    if (!assignedIds || assignedIds.length === 0) return 'Sin asignar';
    
    return assignedIds.map(id => {
        const industrial = industrials.find(i => i.id === id);
        return industrial ? industrial.name : 'Desconocido';
    }).join(', ');
}

// ✅ FUNCIÓN ACTUALIZADA: Botones según el estado CORREGIDO
function getActionButtons(incident) {
    switch (incident.status) {
        case INCIDENT_STATES.created:
            return `<button class="btn btn-primary" onclick="notifyIndustrial(${incident.id})">📧 Notificar Propietario</button>`;
        
        case INCIDENT_STATES.notified_industrial:
            return `<button class="btn btn-info" onclick="notifyPresident(${incident.id})">📧 Notificar Presidente</button>`;
        
        case INCIDENT_STATES.notified_president:
            return `<button class="btn btn-success" onclick="updateIncidentStatus(${incident.id}, '${INCIDENT_STATES.completed}')">✅ Marcar Completada</button>`;
        
        case INCIDENT_STATES.completed:
            return `<span style="color: #28a745; font-weight: bold;">✅ Incidencia Completada</span>`;
        
        default:
            return `<button class="btn btn-primary" onclick="notifyIndustrial(${incident.id})">📧 Notificar Propietario</button>`;
    }
}

// Funciones Multi-select para Industriales
function toggleIndustrialDropdown() {
    document.getElementById('industrialDropdown').classList.toggle('active');
}

function closeIndustrialDropdown() {
    document.getElementById('industrialDropdown').classList.remove('active');
}

function toggleIndustrialCheckbox(industrialId) {
    const industrial = industrials.find(i => i.id === industrialId);
    const index = selectedIndustrials.findIndex(i => i.id === industrialId);
    
    if (index > -1) {
        selectedIndustrials.splice(index, 1);
    } else {
        selectedIndustrials.push(industrial);
    }
    
    updateIndustrialSelection();
    updateIndustrialCheckboxes();
}

function removeIndustrial(industrialId) {
    selectedIndustrials = selectedIndustrials.filter(i => i.id !== industrialId);
    updateIndustrialSelection();
    updateIndustrialCheckboxes();
}

function updateIndustrialSelection() {
    const textElement = document.getElementById('industrialSelectText');
    const displayElement = document.getElementById('selectedIndustrialsDisplay');
    
    if (selectedIndustrials.length === 0) {
        textElement.textContent = 'Seleccionar industriales';
        displayElement.innerHTML = '';
    } else {
        textElement.textContent = `${selectedIndustrials.length} industrial(es) seleccionado(s)`;
        displayElement.innerHTML = selectedIndustrials.map(industrial => `
            <div class="selected-industrial-tag">
                <span>${industrial.name}</span>
                <span class="remove-tag" onclick="removeIndustrial(${industrial.id})">×</span>
            </div>
        `).join('');
    }
}

function updateIndustrialCheckboxes() {
    document.querySelectorAll('.industrial-checkbox').forEach(checkbox => {
        const industrialId = parseInt(checkbox.value);
        checkbox.checked = selectedIndustrials.some(i => i.id === industrialId);
    });
}

// WhatsApp Integration
function createWhatsAppMessage(content) {
    return `🏢 *FINCAS TOMÁS*\n\n${content}\n\n---\nContacto: Fincas Tomás\nGestión Profesional de Comunidades`;
}

// ✅ NUEVA FUNCIÓN: Notificar a los industriales para trabajar
function sendIndustrialsWorkNotification(incidentData) {
    const community = communities.find(c => c.id === incidentData.community_id);
    
    // Obtener los industriales asignados para esta incidencia
    const assignedIndustrials = incidentData.assigned_industrials.map(id => 
        industrials.find(i => i.id === id)
    ).filter(Boolean);
    
    console.log('👷 Notificando a industriales:', assignedIndustrials);
    
    assignedIndustrials.forEach((industrial, index) => {
        setTimeout(() => {
            const direccion = encodeURIComponent(community.address);
            const mapsLink = `https://www.google.com/maps/search/?api=1&query=${direccion}`;
            
            const content = `🔧 TRABAJO APROBADO - PROCEDER CON REPARACIÓN

📋 Título: ${incidentData.title}
⚠️ Prioridad: ${getPriorityText(incidentData.priority)}
📍 Comunidad: ${community.name}
🏠 Dirección: ${community.address}
🌍 Ver en Google Maps: ${mapsLink}
👤 Propietario: ${incidentData.owner_name} - ${incidentData.owner_phone}
📝 Descripción: ${incidentData.description}

✅ El presidente de la comunidad ha sido informado.
🔧 Puede proceder con la reparación.

Por favor, confirme cuando comience el trabajo.`;

            const message = createWhatsAppMessage(content);
            const whatsappUrl = `https://wa.me/${industrial.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }, index * 1000);
    });
}

// ✅ NUEVA FUNCIÓN: Notificar al presidente
function sendPresidentNotification(incident) {
    const phone = incident.comunidades.president_phone.replace(/[^0-9]/g, '');
    const community = incident.comunidades?.name || 'Comunidad';
    const address = incident.comunidades?.address || '';
    
    const content = `📋 INFORME DE INCIDENCIA EN SU COMUNIDAD

Estimado/a Presidente/a,

Le informamos sobre una incidencia reportada en su comunidad:

📋 Título: ${incident.title}
📍 Comunidad: ${community}
🏠 Dirección: ${address}
👤 Propietario: ${incident.owner_name} - ${incident.owner_phone}
📝 Descripción: ${incident.description}
⚠️ Prioridad: ${getPriorityText(incident.priority)}

Ya hemos notificado a nuestro equipo técnico para proceder con la reparación.

Le mantendremos informado del progreso.`;

    const message = createWhatsAppMessage(content);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ✅ NUEVA FUNCIÓN: Notificar finalización al propietario
function sendCompletionReportToOwner(incident) {
    const phone = incident.owner_phone.replace(/[^0-9]/g, '');
    const community = incident.comunidades?.name || 'Comunidad';
    const address = incident.comunidades?.address || '';
    
    const completionDate = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const content = `✅ INCIDENCIA COMPLETADA

Estimado/a ${incident.owner_name},

Su incidencia "${incident.title}" ha sido completada satisfactoriamente.

📍 Comunidad: ${community}
🏠 Dirección: ${address}
📝 Descripción original: ${incident.description}
🗓 Fecha de finalización: ${completionDate}

El trabajo ha sido realizado por nuestro equipo técnico especializado.

Si tiene alguna duda o consulta adicional, no dude en contactarnos.

¡Gracias por confiar en nosotros!`;

    const message = createWhatsAppMessage(content);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

async function sendFollowUpMessage(incidentId) {
    const incident = incidents.find(inc => inc.id === incidentId);
    if (!incident) return;
    
    const assignedIndustrials = incident.assigned_industrials.map(id => 
        industrials.find(i => i.id === id)
    ).filter(Boolean);
    
    const content = `📋 SEGUIMIENTO DE INCIDENCIA

Título: ${incident.title}
Comunidad: ${incident.comunidades?.name}
Estado actual: ${getStatusText(incident.status)}

¿Hay alguna actualización sobre esta incidencia?`;

    const message = createWhatsAppMessage(content);

    assignedIndustrials.forEach((industrial, index) => {
        setTimeout(() => {
            const whatsappUrl = `https://wa.me/${industrial.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }, index * 500);
    });
    
    showNotification('Mensajes de seguimiento enviados', 'info');
}

// Estadísticas clickeables
function updateStats() {
    const stats = {
        total: incidents.length,
        pending: incidents.filter(inc => inc.status === INCIDENT_STATES.created).length,
        scheduled: incidents.filter(inc => inc.status === INCIDENT_STATES.notified_industrial).length,
        completed: incidents.filter(inc => inc.status === INCIDENT_STATES.completed).length,
        communities: communities.length,
        industrials: industrials.length
    };
    
    const elements = [
        ['totalIncidents', stats.total],
        ['pendingIncidents', stats.pending],
        ['scheduledIncidents', stats.scheduled],
        ['completedIncidents', stats.completed],
        ['totalCommunities', stats.communities],
        ['totalIndustrials', stats.industrials]
    ];
    
    elements.forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    });
}

function navigateToTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
        
        const navButtons = {
            'incidentList': 'Lista de Incidencias',
            'communities': 'Comunidades', 
            'industrials': 'Industriales'
        };
        
        document.querySelectorAll('.tab').forEach(tab => {
            if (tab.textContent.trim() === navButtons[tabName]) {
                tab.classList.add('active');
            }
        });
        
        const loaders = {
            'incidentList': loadIncidentsList,
            'communities': loadCommunitiesList,
            'industrials': loadIndustrialsList
        };
        
        if (loaders[tabName]) loaders[tabName]();
        
        console.log(`📍 Navegando a: ${tabName}`);
    }
}

// Utilidades
function validatePhone(phone) {
    return /^(\+34|0034|34)?[6-9]\d{8}$/.test(phone.replace(/\s/g, ''));
}

function showFieldError(fieldId, errors) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    const formGroup = field?.closest('.form-group');
    
    if (formGroup && errorElement) {
        formGroup.classList.add('error');
        errorElement.textContent = errors[0];
        errorElement.style.display = 'block';
    }
}

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getPriorityText(priority) {
    const priorities = {
        low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente'
    };
    return priorities[priority] || priority;
}

function getStatusText(status) {
    const statuses = {
        [INCIDENT_STATES.created]: 'Creada',
        [INCIDENT_STATES.notified_industrial]: 'Notificada Industrial',
        [INCIDENT_STATES.notified_president]: 'Notificada Presidente',
        [INCIDENT_STATES.completed]: 'Completada',
        // Mantener compatibilidad con estados anteriores
        pending: 'Pendiente',
        scheduled: 'Programada',
        completed: 'Completada'
    };
    return statuses[status] || status;
}

// Gestión de pestañas
function showTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    if (event) event.target.classList.add('active');
    
    const loaders = {
        'incidentList': loadIncidentsList,
        'communities': loadCommunitiesList,
        'industrials': loadIndustrialsList
    };
    
    if (loaders[tabName]) loaders[tabName]();
}

// Exponer funciones al ámbito global para uso en atributos onclick
window.logout = logout;
window.showTab = showTab;
window.navigateToTab = navigateToTab;
window.toggleIndustrialDropdown = toggleIndustrialDropdown;
window.toggleIndustrialCheckbox = toggleIndustrialCheckbox;
window.removeIndustrial = removeIndustrial;
window.notifyIndustrial = notifyIndustrial;
window.notifyPresident = notifyPresident;
window.updateIncidentStatus = updateIncidentStatus;
window.deleteIncident = deleteIncident;
window.sendFollowUpMessage = sendFollowUpMessage;
window.deleteIndustrial = deleteIndustrial;
window.deleteCommunity = deleteCommunity;