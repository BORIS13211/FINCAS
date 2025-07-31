// Módulo de mensajería WhatsApp

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