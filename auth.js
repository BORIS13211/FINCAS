// Módulo de autenticación

// Login y logout
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