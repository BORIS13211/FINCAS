// Módulo de almacenamiento local

function saveDataToStorage() {
    const data = {
        incidents,
        communities,
        industrials,
        visits,
        nextIncidentId,
        nextCommunityId,
        nextIndustrialId,
        nextVisitId
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