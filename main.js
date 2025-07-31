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

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
    loadDataFromStorage();

    // Event listeners para formularios
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
        if (!header.contains(event.target) && !dropdown.contains(event.target)) {
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

    // Inicializar interfaz
    updateStats();
    loadIncidentsList();
    loadCommunitiesList();
    loadIndustrialsList();
    loadVisitsList();
    loadCommunityOptions();
    loadIndustrialOptions();
    
    // Sincronizar respuestas del formulario al iniciar
    fetchFormResponses();
});

// Notificaciones visuales
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

// Tabs
function showTab(tabName, event) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach((content) => content.classList.remove("active"));
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => tab.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");
    if (event) event.target.classList.add("active");
    if (tabName === "incidentList") loadIncidentsList();
    else if (tabName === "visitSchedule") loadVisitsList();
    else if (tabName === "communities") loadCommunitiesList();
    else if (tabName === "industrials") loadIndustrialsList();
}

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