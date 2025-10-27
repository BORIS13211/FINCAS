// Módulo de integración con Google Forms

// Función para obtener respuestas del formulario desde Google Sheets en CSV
function fetchFormResponses() {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6BgolxU5bORCxziN9HmxhuAsOrHmNMrZikQb6Iea6INDHjCmcxXVLc4FnlG70Dwq0Wql8GBB7-nA6/pub?output=csv";

    fetch(csvUrl)
        .then(response => response.text())
        .then(data => {
            const parsedResponses = parseCSV(data);
            updateVisitsWithResponses(parsedResponses);
        })
        .catch(error => {
            console.error("Error al cargar respuestas del formulario:", error);
        });
}

// Convertir CSV a objetos JavaScript
function parseCSV(csvText) {
    const lines = csvText.split("\n").filter(line => line.trim() !== "");
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
        const comunidad = resp["Nombre de la comunidad"];
        const respuesta = resp["Detalles del trabajo realizado"] || resp["Respuesta"] || "Sin detalles";

        // Buscar visita correspondiente por nombre de comunidad
        const visit = visits.find(v => v.incident && v.incident.community && v.incident.community.name === comunidad);

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
        saveDataToStorage();
        loadVisitsList();
        loadIncidentsList();
        updateStats();
        showNotification(`Se actualizaron ${updates} visitas con respuestas del formulario`, "success");
    }
}