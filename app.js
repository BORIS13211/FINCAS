// Variables globales
let incidents = [];
let communities = [];
let industrials = [];
let visits = [];
let nextIncidentId = 1;
let nextCommunityId = 1;
let nextIndustrialId = 1;
let nextVisitId = 1;
let currentUser = null;
let selectedIndustrials = [];

// Google Sheets API Configuration
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbw1kI7k-XYU_DDp_PuioDp5RpG1sUaw03Xu8vb6mft9_AYFSSiKArnciAitO0IfELOQ/exec";
const CSV_RESPONSES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6BgolxU5bORCxziN9HmxhuAsOrHmNMrZikQb6Iea6INDHjCmcxXVLc4FnlG70Dwq0Wql8GBB7-nA6/pub?output=csv";

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
    // Cargar datos desde Google Sheets primero, luego desde localStorage como fallback
    loadDataFromGoogleSheets().then(() => {
        initializeApp();
    }).catch(() => {
        console.warn("No se pudo cargar desde Google Sheets, usando localStorage");
        loadDataFromStorage();
        initializeApp();
    });
});

function initializeApp() {
    document.getElementById("loginForm").addEventListener("submit", handleLogin);
    document.getElementById("incidentForm").addEventListener("submit", handleIncidentSubmit);
    document.getElementById("communityForm").addEventListener("submit", handleCommunitySubmit);
    document.getElementById("industrialForm").addEventListener("submit", handleIndustrialSubmit);
    document.getElementById("scheduleForm").addEventListener("submit", handleScheduleSubmit);
    document.getElementById("updateVisitForm").addEventListener("submit", handleUpdateVisitSubmit);

    // Cerrar dropdown de industriales al hacer clic fuera
    document.addEventListener("click", function (event) {
        const dropdown = document.getElementById("industrialDropdown");
        const header = document.querySelector(".multi-select-header");
        if (dropdown && header && !header.contains(event.target) && !dropdown.contains(event.target)) {
            closeIndustrialDropdown();
        }
    });

    // Cerrar modales con tecla ESC
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeModal();
            closeUpdateModal();
        }
    });

    updateStats();
    loadIncidentsList();
    loadCommunitiesList();
    loadIndustrialsList();
    loadVisitsList();
    loadCommunityOptions();
    loadIndustrialOptions();
    
    // Sincronizar respuestas del formulario
    fetchFormResponses();
    
    // Sincronización automática cada 5 minutos
    setInterval(() => {
        fetchFormResponses();
        syncWithGoogleSheets();
    }, 300000);
}

// ========== GOOGLE SHEETS SYNCHRONIZATION ==========

// Cargar todos los datos desde Google Sheets
async function loadDataFromGoogleSheets() {
    try {
        showNotification("Cargando datos desde la nube...", "info");
        
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAllData`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.success) {
            incidents = data.data.incidents || [];
            communities = data.data.communities || [];
            industrials = data.data.industrials || [];
            visits = data.data.visits || [];
            nextIncidentId = data.data.nextIncidentId || 1;
            nextCommunityId = data.data.nextCommunityId || 1;
            nextIndustrialId = data.data.nextIndustrialId || 1;
            nextVisitId = data.data.nextVisitId || 1;
            
            // También guardar en localStorage como backup
            saveDataToStorage();
            showNotification("Datos cargados desde la nube exitosamente", "success");
        } else {
            throw new Error(data.message || 'Error loading data');
        }
    } catch (error) {
        console.error("Error loading from Google Sheets:", error);
        throw error;
    }
}

// Sincronizar todos los datos con Google Sheets
async function syncWithGoogleSheets() {
    try {
        const dataToSync = {
            incidents,
            communities,
            industrials,
            visits,
            nextIncidentId,
            nextCommunityId,
            nextIndustrialId,
            nextVisitId,
            lastSync: new Date().toISOString()
        };

        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'syncAllData',
                data: dataToSync
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            // También guardar en localStorage como backup
            saveDataToStorage();
            console.log("Sincronización exitosa con Google Sheets");
        } else {
            console.error("Error en sincronización:", result.message);
        }
    } catch (error) {
        console.error("Error al sincronizar con Google Sheets:", error);
        // Fallback a localStorage
        saveDataToStorage();
    }
}

// Sincronizar una incidencia específica
async function syncIncidentToGoogleSheets(incident) {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'addIncident',
                titulo: incident.title,
                prioridad: incident.priority,
                comunidad: incident.community.name,
                direccion: incident.community.address,
                propietario: incident.ownerName,
                telefono: incident.ownerPhone,
                descripcion: incident.description,
                industriales: incident.industrials.map(i => i.name),
                estado: incident.status,
                fecha: incident.createdAt
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            console.log("Incidencia sincronizada exitosamente");
        } else {
            console.error("Error al sincronizar incidencia:", result.message);
        }
    } catch (error) {
        console.error("Error al sincronizar incidencia:", error);
    }
}

// ========== FORM RESPONSES SYNCHRONIZATION ==========

// Obtener respuestas del formulario desde Google Sheets en CSV
async function fetchFormResponses() {
    try {
        const response = await fetch(CSV_RESPONSES_URL);
        const data = await response.text();
        const parsedResponses = parseCSV(data);
        updateVisitsWithResponses(parsedResponses);
    } catch (error) {
        console.error("Error al cargar respuestas del formulario:", error);
    }
}

// Convertir CSV a objetos JavaScript
function parseCSV(csvText) {
    const lines = csvText.split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const entries = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const entry = {};
        headers.forEach((h, i) => entry[h] = values[i] || "");
        return entry;
    });
    return entries;
}

// Buscar y actualizar visitas existentes con las respuestas del formulario
function updateVisitsWithResponses(responses) {
    let updates = 0;
    responses.forEach(resp => {
        const comunidad = resp["Nombre de la comunidad"] || resp["Comunidad"];
        const respuesta = resp["Detalles del trabajo realizado"] || resp["Respuesta"] || "Sin detalles";

        // Buscar visita correspondiente por nombre de comunidad
        const visit = visits.find(v => 
            v.incident && 
            v.incident.community && 
            v.incident.community.name === comunidad &&
            v.status !== "completed"
        );

        if (visit) {
            visit.response = respuesta;
            visit.status = "completed";
            visit.updatedAt = new Date();

            // También actualizar el estado de la incidencia vinculada
            const incident = incidents.find(i => i.id === visit.incidentId);
            if (incident) {
                incident.status = "completed";
                incident.updatedAt = new Date();
            }

            updates++;
        }
    });

    if (updates > 0) {
        syncWithGoogleSheets(); // Sincronizar cambios
        loadVisitsList();
        loadIncidentsList();
        updateStats();
        showNotification(`Se actualizaron ${updates} visitas con respuestas del formulario`, "success");
    }
}

// ========== NOTIFICATION SYSTEM ==========

function showNotification(message, type = "info") {
    const container = document.getElementById("notificationContainer");
    if (!container) return;
    const notif = document.createElement("div");
    notif.className = `notification ${type}`;
    notif.textContent = message;
    container.appendChild(notif);
    setTimeout(() => {
        notif.remove();
    }, 3500);
}

// ========== INDUSTRIAL MULTI-SELECT ==========

function toggleIndustrialDropdown() {
    const dropdown = document.getElementById("industrialDropdown");
    const header = document.querySelector(".multi-select-header");
    if (dropdown && header) {
        dropdown.classList.toggle("active");
        header.classList.toggle("active");
    }
}

function closeIndustrialDropdown() {
    const dropdown = document.getElementById("industrialDropdown");
    const header = document.querySelector(".multi-select-header");
    if (dropdown && header) {
        dropdown.classList.remove("active");
        header.classList.remove("active");
    }
}

function updateIndustrialSelection() {
    const textElement = document.getElementById("industrialSelectText");
    const displayElement = document.getElementById("selectedIndustrialsDisplay");
    if (!textElement || !displayElement) return;
    
    if (selectedIndustrials.length === 0) {
        textElement.textContent = "Seleccionar industriales";
        displayElement.innerHTML = "";
    } else {
        textElement.textContent = `${selectedIndustrials.length} industrial(es) seleccionado(s)`;
        displayElement.innerHTML = selectedIndustrials
            .map(
                (industrial) => `
<div class="selected-industrial-tag">
<span>${industrial.name}</span>
<span class="remove-tag" onclick="removeIndustrial(${industrial.id})">×</span>
</div>
`
            )
            .join("");
    }
}

function toggleIndustrialCheckbox(industrialId) {
    const industrial = industrials.find((i) => i.id === industrialId);
    if (!industrial) return;
    
    const index = selectedIndustrials.findIndex((i) => i.id === industrialId);
    if (index > -1) {
        selectedIndustrials.splice(index, 1);
    } else {
        selectedIndustrials.push(industrial);
    }
    updateIndustrialSelection();
    updateIndustrialCheckboxes();
}

function removeIndustrial(industrialId) {
    selectedIndustrials = selectedIndustrials.filter((i) => i.id !== industrialId);
    updateIndustrialSelection();
    updateIndustrialCheckboxes();
}

function updateIndustrialCheckboxes() {
    const checkboxes = document.querySelectorAll(".industrial-checkbox");
    checkboxes.forEach((checkbox) => {
        const industrialId = parseInt(checkbox.value);
        checkbox.checked = selectedIndustrials.some((i) => i.id === industrialId);
    });
}

function loadIndustrialOptions() {
    const dropdown = document.getElementById("industrialDropdown");
    if (!dropdown) return;
    
    dropdown.innerHTML = "";
    if (industrials.length === 0) {
        dropdown.innerHTML = '<div style="padding: 15px; color: #666;">No hay industriales registrados</div>';
        return;
    }
    industrials.forEach((industrial) => {
        const optionElement = document.createElement("div");
        optionElement.className = "industrial-option";
        optionElement.innerHTML = `
<input type="checkbox" class="industrial-checkbox" value="${industrial.id}"
onchange="toggleIndustrialCheckbox(${industrial.id})">
<label>
<div class="industrial-name">${industrial.name}</div>
<div class="industrial-specialties-mini">${industrial.specialties.join(", ")}</div>
</label>
`;
        dropdown.appendChild(optionElement);
    });
    updateIndustrialCheckboxes();
}

// ========== LOGIN AND LOGOUT ==========

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    if (username && password) {
        currentUser = { username, loginTime: new Date() };
        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        updateStats();
        showNotification("¡Bienvenido!", "success");
        
        // Cargar datos actualizados al hacer login
        loadDataFromGoogleSheets().catch(() => {
            console.warn("No se pudo sincronizar al hacer login");
        });
    } else {
        showNotification("Por favor, ingrese usuario y contraseña", "error");
    }
}

function logout() {
    currentUser = null;
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("loginForm").reset();
    selectedIndustrials = [];
    updateIndustrialSelection();
}

// ========== TABS ==========

function showTab(tabName, event) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach((content) => content.classList.remove("active"));
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => tab.classList.remove("active"));
    
    const targetTab = document.getElementById(tabName);
    if (targetTab) targetTab.classList.add("active");
    if (event) event.target.classList.add("active");
    
    if (tabName === "incidentList") loadIncidentsList();
    else if (tabName === "visitSchedule") loadVisitsList();
    else if (tabName === "communities") loadCommunitiesList();
    else if (tabName === "industrials") loadIndustrialsList();
}

// ========== INDUSTRIALS MANAGEMENT ==========

async function handleIndustrialSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("industrialName").value.trim();
    const phone = document.getElementById("industrialPhone").value.trim();
    const specialtyCheckboxes = document.querySelectorAll('input[name="specialties"]:checked');
    const specialties = Array.from(specialtyCheckboxes).map((cb) => cb.value);
    
    if (specialties.length === 0) {
        showNotification("Por favor, seleccione al menos una especialidad", "error");
        return;
    }
    
    const industrial = {
        id: nextIndustrialId++,
        name,
        phone,
        specialties,
        createdAt: new Date()
    };
    
    industrials.push(industrial);
    
    // Sincronizar con Google Sheets
    await syncWithGoogleSheets();
    
    updateStats();
    loadIndustrialsList();
    loadIndustrialOptions();
    document.getElementById("industrialForm").reset();
    showNotification("Industrial registrado exitosamente", "success");
}

function loadIndustrialsList() {
    const container = document.getElementById("industrialsListContainer");
    if (!container) return;
    
    if (industrials.length === 0) {
        container.innerHTML = '<div class="loading">No hay industriales registrados</div>';
        return;
    }
    container.innerHTML = industrials
        .map(
            (industrial) => `
<div class="industrial-item">
<div>
<div class="industrial-header">
<div>
<div class="industrial-name">👷 ${industrial.name}</div>
<div class="industrial-phone">📞 ${industrial.phone}</div>
</div>
<div class="industrial-actions">
<button class="btn btn-danger" onclick="deleteIndustrial(${industrial.id})">
🗑️ Eliminar
</button>
</div>
</div>
<div class="industrial-specialties">
${industrial.specialties.map((specialty) => `<span class="specialty-badge">${specialty}</span>`).join("")}
</div>
</div>
</div>
`
        )
        .join("");
}

async function deleteIndustrial(id) {
    if (confirm("¿Está seguro de que desea eliminar este industrial?")) {
        industrials = industrials.filter((industrial) => industrial.id !== id);
        selectedIndustrials = selectedIndustrials.filter((industrial) => industrial.id !== id);
        
        // Sincronizar con Google Sheets
        await syncWithGoogleSheets();
        
        updateStats();
        loadIndustrialsList();
        loadIndustrialOptions();
        updateIndustrialSelection();
        showNotification("Industrial eliminado", "success");
    }
}

// ========== INCIDENTS MANAGEMENT ==========

async function handleIncidentSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById("incidentTitle").value.trim();
    const priority = document.getElementById("priority").value;
    const communityId = parseInt(document.getElementById("communitySelect").value);
    const ownerName = document.getElementById("ownerName").value.trim();
    const ownerPhone = document.getElementById("ownerPhone").value.trim();
    const description = document.getElementById("incidentDescription").value.trim();

    if (selectedIndustrials.length === 0) {
        showNotification("Por favor, seleccione al menos un industrial", "error");
        return;
    }

    const community = communities.find((c) => c.id === communityId);

    const incident = {
        id: nextIncidentId++,
        title,
        priority,
        community,
        ownerName,
        ownerPhone,
        industrials: [...selectedIndustrials],
        description,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    incidents.push(incident);

    // Sincronizar con Google Sheets
    await syncIncidentToGoogleSheets(incident);
    await syncWithGoogleSheets();

    updateStats();
    sendIncidentNotificationToIndustrials(incident);
    document.getElementById("incidentForm").reset();
    document.getElementById("communityDataContainer").style.display = "none";
    selectedIndustrials = [];
    updateIndustrialSelection();
    closeIndustrialDropdown();
    showNotification("Incidencia reportada y sincronizada", "success");
}

// WhatsApp al industrial (al crear incidencia) - PRELLENADO DINÁMICO DE COMUNIDAD
function sendIncidentNotificationToIndustrials(incident) {
    incident.industrials.forEach((industrial) => {
        const direccion = encodeURIComponent(incident.community.address);
        const enlaceMaps = `https://www.google.com/maps/search/?api=1&query=${direccion}`;
        // Prellenar el campo Comunidad con el nombre de la comunidad de la incidencia
        const nombreComunidad = encodeURIComponent(incident.community.name);
        const enlaceFormulario = `https://docs.google.com/forms/d/e/1FAIpQLSd-QlupI4sZUl5QXhPiNBzzZcavmyZd2VUq0XqUHXYQC9pzQQ/viewform?usp=pp_url&entry.2092898997=${nombreComunidad}`;

        const message = `🔧 NUEVA INCIDENCIA ASIGNADA

📋 Título: ${incident.title}
⚠️ Prioridad: ${getPriorityText(incident.priority)}
📍 Comunidad: ${incident.community.name}
🏠 Dirección: ${incident.community.address}
🌍 Ver en Google Maps: ${enlaceMaps}
📝 Descripción: ${incident.description}

Por favor, agenda tu visita rellenando este formulario con la fecha y hora:
${enlaceFormulario}

Cuando lo completes, recibiré una notificación automática. ¡Gracias!`;

        const whatsappUrl = `https://wa.me/${industrial.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
        setTimeout(() => {
            window.open(whatsappUrl, "_blank");
        }, incident.industrials.indexOf(industrial) * 1000);
    });
}

function loadIncidentsList() {
    const container = document.getElementById("incidentListContainer");
    if (!container) return;
    
    if (incidents.length === 0) {
        container.innerHTML = '<div class="loading">No hay incidencias registradas</div>';
        return;
    }
    const sortedIncidents = incidents.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    container.innerHTML = sortedIncidents
        .map(
            (incident) => `
<div class="incident-item">
<div class="incident-info">
<h3>${incident.title}</h3>
<p><strong>Comunidad:</strong> ${incident.community.name}</p>
<p><strong>Propietario:</strong> ${incident.ownerName} - ${incident.ownerPhone}</p>
<p><strong>Industrial(es):</strong></p>
<div class="industrials-assigned">
${incident.industrials.map((industrial) => `<span class="industrial-mini-tag">${industrial.name}</span>`).join("")}
</div>
<p><strong>Prioridad:</strong> ${getPriorityText(incident.priority)}</p>
<p><strong>Descripción:</strong> ${incident.description}</p>
<p><strong>Fecha:</strong> ${formatDate(incident.createdAt)}</p>
</div>
<div class="incident-actions">
<span class="status-badge status-${incident.status}">${getStatusText(incident.status)}</span>
${incident.status === "pending"
        ? `<button class="btn btn-primary" onclick="scheduleVisit(${incident.id})">📅 Programar Visita</button>`
        : ""
    }
<button class="btn btn-danger" onclick="deleteIncident(${incident.id})">🗑️ Eliminar</button>
</div>
</div>
`
        )
        .join("");
}

async function deleteIncident(id) {
    if (confirm("¿Está seguro de que desea eliminar esta incidencia?")) {
        incidents = incidents.filter((incident) => incident.id !== id);
        visits = visits.filter((visit) => visit.incidentId !== id);
        
        // Sincronizar con Google Sheets
        await syncWithGoogleSheets();
        
        updateStats();
        loadIncidentsList();
        loadVisitsList();
        showNotification("Incidencia eliminada", "success");
    }
}

// ========== COMMUNITIES MANAGEMENT ==========

async function handleCommunitySubmit(e) {
    e.preventDefault();
    const name = document.getElementById("communityName").value.trim();
    const address = document.getElementById("communityAddress").value.trim();
    const presidentName = document.getElementById("presidentName").value.trim();
    const presidentPhone = document.getElementById("presidentPhone").value.trim();
    
    const community = {
        id: nextCommunityId++,
        name,
        address,
        presidentName,
        presidentPhone,
        createdAt: new Date()
    };
    
    communities.push(community);
    
    // Sincronizar con Google Sheets
    await syncWithGoogleSheets();
    
    updateStats();
    loadCommunitiesList();
    loadCommunityOptions();
    document.getElementById("communityForm").reset();
    showNotification("Comunidad agregada exitosamente", "success");
}

function loadCommunitiesList() {
    const container = document.getElementById("communitiesListContainer");
    if (!container) return;
    
    if (communities.length === 0) {
        container.innerHTML = '<div class="loading">No hay comunidades registradas</div>';
        return;
    }
    container.innerHTML = communities
        .map(
            (community) => `
<div class="incident-item">
<div class="incident-info">
<h3>🏢 ${community.name}</h3>
<p><strong>Dirección:</strong> ${community.address}</p>
<p><strong>Presidente:</strong> ${community.presidentName}</p>
<p><strong>Teléfono:</strong> ${community.presidentPhone}</p>
<p><strong>Fecha de registro:</strong> ${formatDate(community.createdAt)}</p>
</div>
<div class="community-actions">
<button class="btn btn-danger" onclick="deleteCommunity(${community.id})">🗑️ Eliminar</button>
</div>
</div>
`
        )
        .join("");
}

function loadCommunityOptions() {
    const select = document.getElementById("communitySelect");
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar comunidad</option>';
    communities.forEach((community) => {
        const option = document.createElement("option");
        option.value = community.id;
        option.textContent = community.name;
        select.appendChild(option);
    });
}

function loadCommunityData() {
    const communityId = parseInt(document.getElementById("communitySelect").value);
    const container = document.getElementById("communityDataContainer");
    const display = document.getElementById("communityDataDisplay");
    
    if (!communityId || !container || !display) {
        if (container) container.style.display = "none";
        return;
    }
    
    const community = communities.find((c) => c.id === communityId);
    if (community) {
        display.innerHTML = `
<p><strong>Dirección:</strong> ${community.address}</p>
<p><strong>Presidente:</strong> ${community.presidentName}</p>
<p><strong>Teléfono Presidente:</strong> ${community.presidentPhone}</p>
`;
        container.style.display = "block";
    }
}

async function deleteCommunity(id) {
    if (confirm("¿Está seguro de que desea eliminar esta comunidad?")) {
        communities = communities.filter((community) => community.id !== id);
        
        // Sincronizar con Google Sheets
        await syncWithGoogleSheets();
        
        updateStats();
        loadCommunitiesList();
        loadCommunityOptions();
        showNotification("Comunidad eliminada", "success");
    }
}

// ========== VISITS MANAGEMENT ==========

function scheduleVisit(incidentId) {
    document.getElementById("scheduleIncidentId").value = incidentId;
    document.getElementById("scheduleModal").style.display = "block";
    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("visitDate");
    if (dateInput) dateInput.min = today;
}

async function handleScheduleSubmit(e) {
    e.preventDefault();
    const incidentId = parseInt(document.getElementById("scheduleIncidentId").value);
    const visitDate = document.getElementById("visitDate").value;
    const startTime = document.getElementById("visitStartTime").value;
    const endTime = document.getElementById("visitEndTime").value;
    const notes = document.getElementById("visitNotes").value;
    const sendReminder = document.getElementById("sendReminder").checked;
    
    const incident = incidents.find((inc) => inc.id === incidentId);
    
    const visit = {
        id: nextVisitId++,
        incidentId,
        incident,
        date: visitDate,
        startTime,
        endTime,
        notes,
        status: "scheduled",
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    visits.push(visit);
    incident.status = "scheduled";
    incident.updatedAt = new Date();
    
    // Sincronizar con Google Sheets
    await syncWithGoogleSheets();
    
    updateStats();
    loadIncidentsList();
    loadVisitsList();
    sendVisitConfirmationToCommunity(visit); // WhatsApp a la comunidad
    if (sendReminder) sendVisitReminderToPresident(visit);
    closeModal();
    showNotification("Visita programada" + (sendReminder ? " y recordatorio enviado" : ""), "success");
}

// WhatsApp de confirmación a la comunidad (al programar visita)
function sendVisitConfirmationToCommunity(visit) {
    const incident = visit.incident;
    const community = incident.community;
    const industrial = incident.industrials[0];
    const direccion = encodeURIComponent(community.address);
    const enlaceMaps = `https://www.google.com/maps/search/?api=1&query=${direccion}`;
    const message = `✅ INCIDENCIA PROGRAMADA

📋 Título: ${incident.title}
⚠️ Prioridad: ${getPriorityText(incident.priority)}
📍 Comunidad: ${community.name}
🏠 Dirección: ${community.address}
🌍 Ver en Google Maps: ${enlaceMaps}
📝 Descripción: ${incident.description}

👷 Industrial asignado:
Nombre: ${industrial.name}
Teléfono: ${industrial.phone}

📅 Fecha de visita: ${visit.date} de ${visit.startTime} a ${visit.endTime}
${visit.notes ? `📝 Notas: ${visit.notes}` : ""}`;
    const whatsappUrl = `https://wa.me/${community.presidentPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
}

function sendVisitReminderToPresident(visit) {
    const incident = visit.incident;
    const community = incident.community;
    const industrialNames = incident.industrials.map((i) => i.name).join(", ");
    const visitDateTime = new Date(visit.date + " " + visit.startTime);
    const formattedDate = visitDateTime.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    const message = `🏢 RECORDATORIO DE VISITA PROGRAMADA

Estimado/a ${community.presidentName},

Le recordamos que se ha programado una visita para la reparación en su comunidad:

📍 Comunidad: ${community.name}
📋 Incidencia: ${incident.title}
👤 Propietario afectado: ${incident.ownerName} - ${incident.ownerPhone}

📅 Fecha: ${formattedDate}
⏰ Horario: ${visit.startTime} - ${visit.endTime}
👷 Industrial(es): ${industrialNames}

${visit.notes ? `📝 Notas adicionales: ${visit.notes}` : ""}

Por favor, asegúrese de que el acceso esté disponible en el horario programado.

Gracias por su colaboración.`;
    const whatsappUrl = `https://wa.me/${community.presidentPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    showReminderNotification();
    window.open(whatsappUrl, "_blank");
}

function showReminderNotification() {
    showNotification("Recordatorio de visita enviado al presidente por WhatsApp", "info");
}

function loadVisitsList() {
    const container = document.getElementById("visitListContainer");
    if (!container) return;
    
    if (visits.length === 0) {
        container.innerHTML = '<div class="loading">No hay visitas programadas</div>';
        return;
    }
    const sortedVisits = visits.slice().sort(
        (a, b) => new Date(a.date + " " + a.startTime) - new Date(b.date + " " + b.startTime)
    );
    container.innerHTML = sortedVisits
        .map(
            (visit) => `
<div class="incident-item">
<div class="incident-info">
<h3>📅 ${visit.incident.title}</h3>
<p><strong>Comunidad:</strong> ${visit.incident.community.name}</p>
<p><strong>Industrial(es):</strong></p>
<div class="industrials-assigned">
${visit.incident.industrials.map((industrial) => `<span class="industrial-mini-tag">${industrial.name}</span>`).join("")}
</div>
<p><strong>Propietario:</strong> ${visit.incident.ownerName} - ${visit.incident.ownerPhone}</p>
<p><strong>Fecha:</strong> ${formatDate(visit.date)} de ${visit.startTime} a ${visit.endTime}</p>
<p><strong>Notas:</strong> ${visit.notes || "Sin notas"}</p>
${visit.response ? `<p><strong>Respuesta:</strong> ${visit.response}</p>` : ""}
</div>
<div class="incident-actions">
<span class="status-badge status-${visit.status}">${getStatusText(visit.status)}</span>
<button class="btn btn-info" onclick="updateVisitStatus(${visit.id})">✏️ Actualizar Estado</button>
<button class="btn btn-whatsapp" onclick="resendVisitReminder(${visit.id})">📱 Reenviar Recordatorio</button>
<button class="btn btn-danger" onclick="deleteVisit(${visit.id})">🗑️ Eliminar</button>
</div>
</div>
`
        )
        .join("");
}

function resendVisitReminder(visitId) {
    const visit = visits.find((v) => v.id === visitId);
    if (visit) {
        sendVisitReminderToPresident(visit);
        showNotification("Recordatorio reenviado al presidente", "info");
    }
}

function updateVisitStatus(visitId) {
    const visit = visits.find((v) => v.id === visitId);
    if (!visit) return;
    
    document.getElementById("updateVisitId").value = visitId;
    const detailsContainer = document.getElementById("visitDetailsContainer");
    if (detailsContainer) {
        detailsContainer.innerHTML = `
<div class="visit-details">
<h4>📋 Detalles de la Visita</h4>
<p><strong>Incidencia:</strong> ${visit.incident.title}</p>
<p><strong>Fecha:</strong> ${formatDate(visit.date)} de ${visit.startTime} a ${visit.endTime}</p>
<p><strong>Industrial(es):</strong> ${visit.incident.industrials.map((i) => i.name).join(", ")}</p>
<p><strong>Estado actual:</strong> ${getStatusText(visit.status)}</p>
</div>
`;
    }
    
    const statusSelect = document.getElementById("newVisitStatus");
    const responseTextarea = document.getElementById("visitResponse");
    if (statusSelect) statusSelect.value = visit.status;
    if (responseTextarea) responseTextarea.value = visit.response || "";
    
    document.getElementById("updateVisitModal").style.display = "block";
}

async function handleUpdateVisitSubmit(e) {
    e.preventDefault();
    const visitId = parseInt(document.getElementById("updateVisitId").value);
    const newStatus = document.getElementById("newVisitStatus").value;
    const response = document.getElementById("visitResponse").value;
    
    const visit = visits.find((v) => v.id === visitId);
    const incident = incidents.find((inc) => inc.id === visit.incidentId);
    
    visit.status = newStatus;
    visit.response = response;
    visit.updatedAt = new Date();
    incident.status = newStatus;
    incident.updatedAt = new Date();
    
    // Sincronizar con Google Sheets
    await syncWithGoogleSheets();
    
    updateStats();
    loadIncidentsList();
    loadVisitsList();
    
    if (newStatus === "completed") {
        sendVisitCompletionToCommunity(visit); // WhatsApp de cierre a la comunidad
        const ownerInfoContainer = document.getElementById("ownerInfoContainer");
        if (ownerInfoContainer) {
            ownerInfoContainer.innerHTML = `
<h4>👤 Información del Propietario</h4>
<p><strong>Nombre:</strong> ${incident.ownerName}</p>
<p><strong>Teléfono:</strong> ${incident.ownerPhone}</p>
<p><strong>Comunidad:</strong> ${incident.community.name}</p>
`;
        }
        const whatsappSection = document.getElementById("whatsappSection");
        if (whatsappSection) whatsappSection.style.display = "block";
    } else {
        const whatsappSection = document.getElementById("whatsappSection");
        if (whatsappSection) whatsappSection.style.display = "none";
        closeUpdateModal();
    }
    showNotification("Estado de visita actualizado", "success");
}

// WhatsApp de cierre a la comunidad (al completar la visita)
function sendVisitCompletionToCommunity(visit) {
    const incident = visit.incident;
    const community = incident.community;
    const industrial = incident.industrials[0];
    const direccion = encodeURIComponent(community.address);
    const enlaceMaps = `https://www.google.com/maps/search/?api=1&query=${direccion}`;
    const message = `✅ INCIDENCIA COMPLETADA

📋 Título: ${incident.title}
📍 Comunidad: ${community.name}
🏠 Dirección: ${community.address}
🌍 Ver en Google Maps: ${enlaceMaps}
📝 Descripción: ${incident.description}

👷 Industrial que realizó la visita:
Nombre: ${industrial.name}
Teléfono: ${industrial.phone}

📅 Fecha de visita: ${visit.date} de ${visit.startTime} a ${visit.endTime}

${visit.response ? `📝 Detalles del trabajo realizado: ${visit.response}` : ""}

Gracias por su colaboración.`;
    const whatsappUrl = `https://wa.me/${community.presidentPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
}

async function deleteVisit(id) {
    if (confirm("¿Está seguro de que desea eliminar esta visita?")) {
        const visit = visits.find((v) => v.id === id);
        const incident = incidents.find((inc) => inc.id === visit.incidentId);
        visits = visits.filter((visit) => visit.id !== id);
        incident.status = "pending";
        
        // Sincronizar con Google Sheets
        await syncWithGoogleSheets();
        
        updateStats();
        loadIncidentsList();
        loadVisitsList();
        showNotification("Visita eliminada", "success");
    }
}

function sendWhatsAppNotification() {
    const visitId = parseInt(document.getElementById("updateVisitId").value);
    const visit = visits.find((v) => v.id === visitId);
    const incident = visit.incident;
    const message = `Hola ${incident.ownerName}, le informamos que la visita programada para la incidencia "${incident.title}" en ${incident.community.name} ha sido completada.

Detalles del trabajo realizado: ${visit.response}

Gracias por su colaboración.`;
    const whatsappUrl = `https://wa.me/${incident.ownerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    closeUpdateModal();
}

// ========== UTILITIES ==========

function updateStats() {
    const totalIncidentsEl = document.getElementById("totalIncidents");
    const pendingIncidentsEl = document.getElementById("pendingIncidents");
    const assignedIncidentsEl = document.getElementById("assignedIncidents");
    const completedIncidentsEl = document.getElementById("completedIncidents");
    const totalCommunitiesEl = document.getElementById("totalCommunities");
    const totalIndustrialsEl = document.getElementById("totalIndustrials");
    
    if (totalIncidentsEl) totalIncidentsEl.textContent = incidents.length;
    if (pendingIncidentsEl) pendingIncidentsEl.textContent = incidents.filter((inc) => inc.status === "pending").length;
    if (assignedIncidentsEl) assignedIncidentsEl.textContent = incidents.filter((inc) => inc.status === "scheduled").length;
    if (completedIncidentsEl) completedIncidentsEl.textContent = incidents.filter((inc) => inc.status === "completed").length;
    if (totalCommunitiesEl) totalCommunitiesEl.textContent = communities.length;
    if (totalIndustrialsEl) totalIndustrialsEl.textContent = industrials.length;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES");
}

function getPriorityText(priority) {
    const priorities = {
        low: "Baja",
        medium: "Media",
        high: "Alta",
        urgent: "Urgente"
    };
    return priorities[priority] || priority;
}

function getStatusText(status) {
    const statuses = {
        pending: "Pendiente",
        assigned: "Asignada",
        scheduled: "Programada",
        in_progress: "En Progreso",
        completed: "Completada"
    };
    return statuses[status] || status;
}

function closeModal() {
    const scheduleModal = document.getElementById("scheduleModal");
    const scheduleForm = document.getElementById("scheduleForm");
    if (scheduleModal) scheduleModal.style.display = "none";
    if (scheduleForm) scheduleForm.reset();
}

function closeUpdateModal() {
    const updateModal = document.getElementById("updateVisitModal");
    const updateForm = document.getElementById("updateVisitForm");
    const whatsappSection = document.getElementById("whatsappSection");
    
    if (updateModal) updateModal.style.display = "none";
    if (updateForm) updateForm.reset();
    if (whatsappSection) whatsappSection.style.display = "none";
}

// ========== LOCAL STORAGE (FALLBACK) ==========

function saveDataToStorage() {
    const data = {
        incidents,
        communities,
        industrials,
        visits,
        nextIncidentId,
        nextCommunityId,
        nextIndustrialId,
        nextVisitId,
        lastSync: new Date().toISOString()
    };
    localStorage.setItem('incidenciasAppData', JSON.stringify(data));
}

function loadDataFromStorage() {
    const data = localStorage.getItem('incidenciasAppData');
    if (data) {
        const parsed = JSON.parse(data);
        incidents = parsed.incidents || [];
        communities = parsed.communities || [];
        industrials = parsed.industrials || [];
        visits = parsed.visits || [];
        nextIncidentId = parsed.nextIncidentId || 1;
        nextCommunityId = parsed.nextCommunityId || 1;
        nextIndustrialId = parsed.nextIndustrialId || 1;
        nextVisitId = parsed.nextVisitId || 1;
    } else {
        // Datos de ejemplo
        communities = [
            {
                id: 1,
                name: "Residencial Los Jardines",
                address: "Calle Principal 123, Barcelona",
                presidentName: "María García",
                presidentPhone: "+34666123456",
                createdAt: new Date("2024-01-15")
            },
            {
                id: 2,
                name: "Complejo Vista Mar",
                address: "Avenida del Mar 45, Valencia",
                presidentName: "Carlos López",
                presidentPhone: "+34677234567",
                createdAt: new Date("2024-02-20")
            }
        ];
        industrials = [
            {
                id: 1,
                name: "Juan Martínez",
                phone: "+34621072000",
                specialties: ["Fontanería", "Mantenimiento"],
                createdAt: new Date("2024-01-10")
            },
            {
                id: 2,
                name: "Ana Rodríguez",
                phone: "+34622083111",
                specialties: ["Electricidad", "Climatización"],
                createdAt: new Date("2024-01-12")
            },
            {
                id: 3,
                name: "Pedro Sánchez",
                phone: "+34623094222",
                specialties: ["Piscinas", "Jardinería"],
                createdAt: new Date("2024-01-14")
            }
        ];
        nextCommunityId = 3;
        nextIndustrialId = 4;
        nextIncidentId = 1;
        nextVisitId = 1;
    }
}

// ========== EVENT LISTENERS ==========

// Cerrar modales al hacer clic fuera
window.onclick = function (event) {
    const scheduleModal = document.getElementById("scheduleModal");
    const updateModal = document.getElementById("updateVisitModal");
    if (event.target === scheduleModal) {
        closeModal();
    } else if (event.target === updateModal) {
        closeUpdateModal();
    }
};

// ========== MANUAL SYNC BUTTON ==========

async function manualSync() {
    showNotification("Sincronizando datos...", "info");
    try {
        await syncWithGoogleSheets();
        await fetchFormResponses();
        showNotification("Sincronización completada exitosamente", "success");
    } catch (error) {
        console.error("Error en sincronización manual:", error);
        showNotification("Error en la sincronización", "error");
    }
}