// Módulo de gestión de comunidades

function handleCommunitySubmit(e) {
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
    saveDataToStorage();
    updateStats();
    loadCommunitiesList();
    loadCommunityOptions();
    document.getElementById("communityForm").reset();
    showNotification("Comunidad agregada exitosamente", "success");
}

function loadCommunitiesList() {
    const container = document.getElementById("communitiesListContainer");
    
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
    
    if (!communityId) {
        container.style.display = "none";
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

function deleteCommunity(id) {
    if (confirm("¿Está seguro de que desea eliminar esta comunidad?")) {
        communities = communities.filter((community) => community.id !== id);
        saveDataToStorage();
        updateStats();
        loadCommunitiesList();
        loadCommunityOptions();
        showNotification("Comunidad eliminada", "success");
    }
}