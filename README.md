# Sistema de Gestión de Incidencias con Sincronización Google Sheets

Este sistema permite gestionar incidencias de mantenimiento en comunidades con sincronización automática a Google Sheets para acceso desde cualquier dispositivo.

## 🚀 Características

- **Sincronización en la nube**: Datos almacenados en Google Sheets para acceso desde cualquier ordenador
- **Gestión completa de incidencias**: Crear, asignar, programar y completar incidencias
- **Integración WhatsApp**: Notificaciones automáticas a industriales y presidentes de comunidades
- **Formularios Google**: Respuestas automáticas de industriales
- **Dashboard en tiempo real**: Estadísticas y seguimiento de estados
- **Interfaz responsive**: Funciona en móviles, tablets y ordenadores

## 📋 Requisitos Previos

1. Cuenta de Google (Gmail)
2. Acceso a Google Sheets y Google Apps Script
3. Navegador web moderno
4. Conexión a internet

## 🛠️ Configuración Paso a Paso

### Paso 1: Configurar Google Apps Script

1. **Crear el proyecto de Apps Script**:
   - Ve a [script.google.com](https://script.google.com)
   - Haz clic en "Nuevo proyecto"
   - Nombra el proyecto: "Incident Management Backend"

2. **Copiar el código backend**:
   - Borra el código por defecto
   - Copia todo el contenido de `google-apps-script.js`
   - Pégalo en el editor

3. **Configurar las hojas de cálculo**:
   ```javascript
   const SHEETS_CONFIG = {
     MAIN_DATA_SHEET_ID: 'TU_ID_HOJA_PRINCIPAL', // Reemplazar
     INCIDENTS_SHEET_ID: 'TU_ID_HOJA_INCIDENCIAS', // Reemplazar  
     FORM_RESPONSES_SHEET_ID: 'TU_ID_HOJA_RESPUESTAS' // Reemplazar
   };
   ```

4. **Crear las hojas de cálculo**:
   - Crea una nueva hoja de Google Sheets llamada "Gestión de Incidencias - Datos"
   - Copia su ID desde la URL (la parte entre `/d/` y `/edit`)
   - Repite para crear hojas adicionales si es necesario

5. **Desplegar como aplicación web**:
   - Haz clic en "Desplegar" > "Nueva implementación"
   - Tipo: "Aplicación web"
   - Ejecutar como: "Yo"
   - Acceso: "Cualquier usuario"
   - Haz clic en "Desplegar"
   - Copia la URL proporcionada

### Paso 2: Configurar el Frontend

1. **Actualizar la URL de Google Apps Script**:
   En `app.js`, línea 13:
   ```javascript
   const GOOGLE_SHEETS_URL = "TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUÍ";
   ```

2. **Configurar la URL del CSV de respuestas**:
   En `app.js`, línea 14:
   ```javascript
   const CSV_RESPONSES_URL = "TU_URL_CSV_DE_RESPUESTAS_AQUÍ";
   ```

### Paso 3: Configurar el Formulario de Google

1. **Crear formulario**:
   - Ve a [forms.google.com](https://forms.google.com)
   - Crea un nuevo formulario: "Respuesta de Visita - Industrial"

2. **Agregar campos**:
   - Campo 1: "Nombre de la comunidad" (Respuesta corta)
   - Campo 2: "Fecha de la visita" (Fecha)
   - Campo 3: "Detalles del trabajo realizado" (Párrafo)

3. **Obtener URL prellenada**:
   - Haz clic en los tres puntos > "Obtener vínculo rellenado previamente"
   - Llena el campo "Nombre de la comunidad" con "TEST"
   - Haz clic en "Obtener vínculo"
   - Reemplaza "TEST" con `${nombreComunidad}` en el código

4. **Configurar respuestas CSV**:
   - Ve a "Respuestas" > Icono de Google Sheets
   - Crea una nueva hoja de cálculo
   - Publica la hoja: Archivo > Publicar en la web > CSV
   - Copia la URL generada

### Paso 4: Estructura de Archivos

```
incident-management/
├── index.html          # Interfaz principal
├── app.js              # Lógica del frontend con sincronización
├── google-apps-script.js # Backend para Google Apps Script
└── README.md           # Esta guía
```

## 🔧 Configuración Avanzada

### Variables de Configuración

En `google-apps-script.js`:

```javascript
// IDs de las hojas de cálculo
const SHEETS_CONFIG = {
  MAIN_DATA_SHEET_ID: 'ID_de_tu_hoja_principal',
  INCIDENTS_SHEET_ID: 'ID_de_tu_hoja_de_incidencias', 
  FORM_RESPONSES_SHEET_ID: 'ID_de_tu_hoja_de_respuestas'
};

// Nombres de las pestañas
const SHEET_NAMES = {
  INCIDENTS: 'Incidencias',
  COMMUNITIES: 'Comunidades',
  INDUSTRIALS: 'Industriales', 
  VISITS: 'Visitas',
  MAIN_DATA: 'DatosGenerales'
};
```

### Funciones de Sincronización

El sistema incluye:

- **Sincronización automática**: Cada 5 minutos
- **Sincronización manual**: Botón "🔄 Sincronizar" 
- **Sincronización al login**: Carga datos actualizados
- **Fallback local**: localStorage como respaldo

## 📱 Uso del Sistema

### 1. Acceso Inicial
- Abre `index.html` en cualquier navegador
- Ingresa usuario y contraseña (cualquier valor)
- El sistema cargará datos desde Google Sheets

### 2. Gestión de Comunidades
- Pestaña "🏢 Comunidades"
- Agregar nuevas comunidades con datos del presidente
- Los datos se sincronizan automáticamente

### 3. Gestión de Industriales  
- Pestaña "👷 Industriales"
- Registrar industriales con especialidades
- Teléfonos para notificaciones WhatsApp

### 4. Reportar Incidencias
- Pestaña "📝 Reportar Incidencia"
- Seleccionar comunidad e industriales
- El sistema envía WhatsApp automáticamente

### 5. Programar Visitas
- Desde la lista de incidencias
- Botón "📅 Programar Visita"
- Notificaciones automáticas a presidentes

### 6. Seguimiento
- Pestaña "📅 Programación de Visitas"
- Actualizar estados de visitas
- Respuestas automáticas desde formularios

## 🔄 Sincronización Cross-Device

### Cómo Funciona
1. **Al cargar**: Los datos se obtienen de Google Sheets
2. **Al modificar**: Los cambios se envían a Google Sheets
3. **Respaldo local**: localStorage mantiene copia local
4. **Sincronización automática**: Cada 5 minutos
5. **Sincronización manual**: Botón disponible siempre

### Acceso desde Múltiples Dispositivos
- **Oficina**: Accede desde tu ordenador principal
- **Casa**: Usa cualquier navegador con la URL
- **Móvil**: Interfaz responsive para smartphones
- **Tablet**: Optimizado para pantallas medianas

## 🚨 Solución de Problemas

### Error: "No se pudo cargar desde Google Sheets"
- Verifica que la URL de Google Apps Script sea correcta
- Asegúrate de que el script esté desplegado como "aplicación web"
- Revisa los permisos de acceso

### Error: "Sincronización fallida"
- Comprueba la conexión a internet
- Verifica que los IDs de las hojas sean correctos
- Revisa la consola del navegador para más detalles

### Los datos no se actualizan entre dispositivos
- Usa el botón "🔄 Sincronizar" manualmente
- Verifica que ambos dispositivos estén conectados a internet
- Cierra y vuelve a abrir la aplicación

### Formulario de respuestas no funciona
- Verifica que la URL del CSV sea correcta
- Asegúrate de que la hoja esté publicada como CSV
- Comprueba que los nombres de columnas coincidan

## 📊 Estructura de Datos

### Google Sheets - Hoja Principal
```
| timestamp | version | jsonData |
| --------- | ------- | -------- |
| 2024-01-15T10:30:00Z | 1.0 | {"incidents":[],"communities":[],...} |
```

### Hojas Individuales
- **Incidencias**: ID, Título, Prioridad, Comunidad, Estado, etc.
- **Comunidades**: ID, Nombre, Dirección, Presidente, Teléfono
- **Industriales**: ID, Nombre, Teléfono, Especialidades
- **Visitas**: ID, Fecha, Horario, Estado, Respuesta

## 🔐 Seguridad

- Los datos se almacenan en tu cuenta de Google
- Acceso controlado por permisos de Google Apps Script
- No se almacenan credenciales sensibles
- Comunicación HTTPS con Google Sheets

## 🎯 Próximas Mejoras

- [ ] Autenticación real con Google OAuth
- [ ] Notificaciones push
- [ ] Reportes y analytics
- [ ] Integración con calendario
- [ ] App móvil nativa
- [ ] Roles y permisos de usuario

## 📞 Soporte

Para problemas o preguntas:
1. Revisa esta documentación
2. Verifica la consola del navegador
3. Comprueba los logs de Google Apps Script
4. Asegúrate de que todas las URLs estén correctas

## 📄 Licencia

Este proyecto es de código abierto. Puedes modificarlo según tus necesidades.

---

**¡Tu sistema de gestión de incidencias está listo para usar desde cualquier ordenador! 🎉**