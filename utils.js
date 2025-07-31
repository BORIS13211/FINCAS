// Módulo de utilidades

function updateStats() {
    document.getElementById("totalIncidents").textContent = incidents.length;
    document.getElementById("pendingIncidents").textContent = incidents.filter((inc) => inc.status === "pending").length;
    document.getElementById("assignedIncidents").textContent = incidents.filter((inc) => inc.status === "scheduled").length;
    document.getElementById("completedIncidents").textContent = incidents.filter((inc) => inc.status === "completed").length;
    document.getElementById("totalCommunities").textContent = communities.length;
    document.getElementById("totalIndustrials").textContent = industrials.length;
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