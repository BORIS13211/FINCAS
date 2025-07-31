// Módulo de gestión de industriales

// Selección múltiple de industriales
function toggleIndustrialDropdown() {
    const dropdown = document.getElementById("industrialDropdown");
    const header = document.querySelector(".multi-select-header");
    dropdown.classList.toggle("active");
    header.classList.toggle("active");
}

function closeIndustrialDropdown() {
    const dropdown = document.getElementById("industrialDropdown");
    const header = document.querySelector(".multi-select-header");
    dropdown.classList.remove("active");
    header.classList.remove("active");
}

function updateIndustrialSelection() {
    const textElement = document.getElementById("industrialSelectText");
    const displayElement = document.getElementById("selectedIndustrialsDisplay");
    
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

// Gestión de industriales
function handleIndustrialSubmit(e) {
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
    saveDataToStorage();
    updateStats();
    loadIndustrialsList();
    loadIndustrialOptions();
    document.getElementById("industrialForm").reset();
    showNotification("Industrial registrado exitosamente", "success");
}

function loadIndustrialsList() {
    const container = document.getElementById("industrialsListContainer");
    
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

function deleteIndustrial(id) {
    if (confirm("¿Está seguro de que desea eliminar este industrial?")) {
        industrials = industrials.filter((industrial) => industrial.id !== id);
        selectedIndustrials = selectedIndustrials.filter((industrial) => industrial.id !== id);
        saveDataToStorage();
        updateStats();
        loadIndustrialsList();
        loadIndustrialOptions();
        updateIndustrialSelection();
        showNotification("Industrial eliminado", "success");
    }
}