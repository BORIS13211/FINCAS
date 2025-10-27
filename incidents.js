// Módulo de gestión de incidencias

function handleIncidentSubmit(e) {
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
    syncIncidentToGoogleSheets(incident);
    
    // Guardar localmente y actualizar interfaz
    saveDataToStorage();
    updateStats();
    sendIncidentNotificationToIndustrials(incident);
    document.getElementById("incidentForm").reset();
    document.getElementById("communityDataContainer").style.display = "none";
    selectedIndustrials = [];
    updateIndustrialSelection();
    closeIndustrialDropdown();
    showNotification("Incidencia reportada y sincronizada", "success");
}

function syncIncidentToGoogleSheets(incident) {
    // URL del script de Google Apps Script (vacía en el código original)
    const googleSheetsUrl = "";
    
    if (!googleSheetsUrl) {
        console.log("URL de Google Sheets no configurada");
        return;
    }
    
    fetch(googleSheetsUrl, {
        method: "POST",
        body: JSON.stringify({
            titulo: incident.title,
            prioridad: incident.priority,
            comunidad: incident.community.name,
            direccion: incident.community.address,
            propietario: incident.ownerName,
            telefono: incident.ownerPhone,
            descripcion: incident.description,
            industriales: incident.industrials.map(i => i.name)
        }),
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.text())
    .then(data => console.log("Sincronización exitosa:", data))
    .catch(error => console.error("Error al sincronizar:", error));
}

function loadIncidentsList() {
    const container = document.getElementById("incidentListContainer");
    
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

function deleteIncident(id) {
    if (confirm("¿Está seguro de que desea eliminar esta incidencia?")) {
        incidents = incidents.filter((incident) => incident.id !== id);
        visits = visits.filter((visit) => visit.incidentId !== id);
        saveDataToStorage();
        updateStats();
        loadIncidentsList();
        loadVisitsList();
        showNotification("Incidencia eliminada", "success");
    }
}