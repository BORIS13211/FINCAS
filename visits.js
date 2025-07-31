// Módulo de gestión de visitas

function scheduleVisit(incidentId) {
    document.getElementById("scheduleIncidentId").value = incidentId;
    document.getElementById("scheduleModal").style.display = "block";
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("visitDate").min = today;
}

function handleScheduleSubmit(e) {
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
    
    saveDataToStorage();
    updateStats();
    loadIncidentsList();
    loadVisitsList();
    
    sendVisitConfirmationToCommunity(visit); // WhatsApp a la comunidad
    if (sendReminder) sendVisitReminderToPresident(visit);
    
    closeModal();
    showNotification("Visita programada" + (sendReminder ? " y recordatorio enviado" : ""), "success");
}

function loadVisitsList() {
    const container = document.getElementById("visitListContainer");
    
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
    document.getElementById("updateVisitId").value = visitId;
    document.getElementById("visitDetailsContainer").innerHTML = `
<div class="visit-details">
<h4>📋 Detalles de la Visita</h4>
<p><strong>Incidencia:</strong> ${visit.incident.title}</p>
<p><strong>Fecha:</strong> ${formatDate(visit.date)} de ${visit.startTime} a ${visit.endTime}</p>
<p><strong>Industrial(es):</strong> ${visit.incident.industrials.map((i) => i.name).join(", ")}</p>
<p><strong>Estado actual:</strong> ${getStatusText(visit.status)}</p>
</div>
`;
    document.getElementById("newVisitStatus").value = visit.status;
    document.getElementById("visitResponse").value = visit.response || "";
    document.getElementById("updateVisitModal").style.display = "block";
}

function handleUpdateVisitSubmit(e) {
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
    
    saveDataToStorage();
    updateStats();
    loadIncidentsList();
    loadVisitsList();
    
    if (newStatus === "completed") {
        sendVisitCompletionToCommunity(visit); // WhatsApp de cierre a la comunidad
        document.getElementById("ownerInfoContainer").innerHTML = `
<h4>👤 Información del Propietario</h4>
<p><strong>Nombre:</strong> ${incident.ownerName}</p>
<p><strong>Teléfono:</strong> ${incident.ownerPhone}</p>
<p><strong>Comunidad:</strong> ${incident.community.name}</p>
`;
        document.getElementById("whatsappSection").style.display = "block";
    } else {
        document.getElementById("whatsappSection").style.display = "none";
        closeUpdateModal();
    }
    
    showNotification("Estado de visita actualizado", "success");
}

function deleteVisit(id) {
    if (confirm("¿Está seguro de que desea eliminar esta visita?")) {
        const visit = visits.find((v) => v.id === id);
        const incident = incidents.find((inc) => inc.id === visit.incidentId);
        
        visits = visits.filter((visit) => visit.id !== id);
        incident.status = "pending";
        
        saveDataToStorage();
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

function closeModal() {
    document.getElementById("scheduleModal").style.display = "none";
    document.getElementById("scheduleForm").reset();
}

function closeUpdateModal() {
    document.getElementById("updateVisitModal").style.display = "none";
    document.getElementById("updateVisitForm").reset();
    document.getElementById("whatsappSection").style.display = "none";
}