# Sistema de Gestión de Incidencias 🏢

Una aplicación web completa para gestionar incidencias en comunidades residenciales, con integración de WhatsApp y Google Sheets.

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- Login seguro con usuario y contraseña
- Sesión persistente durante el uso

### 📋 Gestión de Incidencias
- Reportar nuevas incidencias con prioridades
- Asignación múltiple de industriales
- Seguimiento del estado (Pendiente → Programada → Completada)
- Integración automática con Google Sheets

### 🏢 Gestión de Comunidades
- Registro de comunidades residenciales
- Información de presidentes y contactos
- Direcciones para integración con Google Maps

### 👷 Gestión de Industriales
- Registro de profesionales por especialidades
- Múltiples especialidades: Fontanería, Electricidad, Climatización, etc.
- Contacto directo vía WhatsApp

### 📅 Programación de Visitas
- Calendario de visitas técnicas
- Notificaciones automáticas por WhatsApp
- Recordatorios a presidentes de comunidad
- Confirmaciones de trabajo completado

### 📱 Integración WhatsApp
- Notificaciones automáticas a industriales
- Enlaces preconfigurados a Google Maps
- Formularios prellenados para respuestas
- Confirmaciones a comunidades

### 📊 Dashboard y Estadísticas
- Panel de control con métricas en tiempo real
- Contadores de incidencias por estado
- Estadísticas de comunidades e industriales

## 🚀 Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet para integraciones externas

### Instalación
1. Descarga todos los archivos del proyecto
2. Coloca los archivos en una carpeta
3. Abre `index.html` en tu navegador web

### Estructura de Archivos
```
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── app.js             # Lógica de la aplicación
└── README.md          # Este archivo
```

## 🔧 Configuración

### Google Sheets Integration
Para habilitar la sincronización con Google Sheets:

1. **Crear Google Apps Script:**
   - Ve a [script.google.com](https://script.google.com)
   - Crea un nuevo proyecto
   - Pega el código del webhook (contacta al desarrollador)
   - Despliega como aplicación web
   - Copia la URL generada

2. **Actualizar la URL en el código:**
   ```javascript
   // En app.js, línea ~320
   const googleSheetsUrl = "TU_URL_AQUÍ";
   ```

### Google Forms Integration
Para recibir respuestas de industriales:

1. **Configurar CSV público:**
   - Abre tu Google Sheet de respuestas
   - Ve a Archivo → Publicar en la web
   - Selecciona formato CSV
   - Copia la URL generada

2. **Actualizar la URL en el código:**
   ```javascript
   // En app.js, línea ~650
   const csvUrl = "TU_URL_CSV_AQUÍ";
   ```

## 📱 Uso de la Aplicación

### 1. Login
- Usuario: cualquier nombre
- Contraseña: cualquier contraseña
- Presiona "Iniciar Sesión"

### 2. Gestionar Comunidades
- Ve a la pestaña "🏢 Comunidades"
- Completa el formulario con los datos
- Incluye teléfono del presidente (formato: +34XXXXXXXXX)

### 3. Registrar Industriales
- Ve a la pestaña "👷 Industriales"
- Añade nombre, teléfono y especialidades
- Teléfono debe incluir código de país

### 4. Reportar Incidencias
- Pestaña "📋 Reportar Incidencia"
- Selecciona comunidad (se mostrarán los datos automáticamente)
- Asigna uno o varios industriales
- Define prioridad y descripción

### 5. Programar Visitas
- En "📝 Lista de Incidencias", haz clic en "📅 Programar Visita"
- Selecciona fecha y horario
- Añade notas si es necesario
- Opción de enviar recordatorio al presidente

### 6. Actualizar Estados
- En "📅 Visitas Programadas", usa "✏️ Actualizar Estado"
- Cambia el estado según el progreso
- Al marcar como "Completada", se envían notificaciones automáticas

## 🔄 Flujo de Trabajo

```
1. Reportar Incidencia
   ↓
2. Se notifica a industriales vía WhatsApp
   ↓
3. Industrial completa formulario Google
   ↓
4. Sistema programa visita automáticamente
   ↓
5. Se confirma con la comunidad
   ↓
6. Visita realizada → Estado actualizado
   ↓
7. Notificación final a propietario
```

## 📊 Características Técnicas

### Almacenamiento
- **Local Storage:** Todos los datos se guardan en el navegador
- **Persistencia:** Los datos se mantienen entre sesiones
- **Backup:** Exporta/importa datos manualmente si es necesario

### Responsive Design
- ✅ Móviles (320px+)
- ✅ Tablets (768px+)
- ✅ Desktop (1024px+)

### Navegadores Compatibles
- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+

## 🛠️ Personalización

### Especialidades de Industriales
Edita en `app.js` o `index.html`:
```html
<label><input type="checkbox" name="specialties" value="Nueva Especialidad"> Nueva Especialidad</label>
```

### Prioridades de Incidencias
Modifica en `index.html`:
```html
<option value="critical">Crítica</option>
```

### Colores y Estilos
Personaliza variables CSS en `styles.css`:
```css
:root {
    --primary-color: #tu-color;
    --success-color: #tu-color;
}
```

## 🔒 Seguridad y Privacidad

- **Datos locales:** Toda la información se almacena en el navegador del usuario
- **No hay servidor:** No se envían datos a servidores externos (excepto integraciones)
- **WhatsApp:** Solo se abren enlaces, no se envían mensajes automáticamente
- **Google Sheets:** Solo se envían datos si está configurado

## 🐛 Solución de Problemas

### La aplicación no carga
- Verifica que todos los archivos estén en la misma carpeta
- Abre la consola del navegador (F12) para ver errores

### WhatsApp no se abre
- Verifica que los números tengan el formato correcto (+34XXXXXXXXX)
- Asegúrate de tener WhatsApp instalado o usar WhatsApp Web

### Google Sheets no sincroniza
- Verifica que la URL del script esté configurada correctamente
- Comprueba que el script esté desplegado como aplicación web
- Revisa la consola del navegador para errores de CORS

### Los datos se pierden
- Los datos se guardan en Local Storage del navegador
- No borres los datos del navegador
- Considera hacer backups regulares exportando los datos

## 📞 Soporte

Para soporte técnico o consultas:
- Revisa la consola del navegador (F12) para errores
- Verifica que todas las URLs de integración estén configuradas
- Asegúrate de que los formatos de teléfono sean correctos

## 🔄 Actualizaciones

### Versión 1.0
- ✅ Sistema completo de gestión de incidencias
- ✅ Integración WhatsApp
- ✅ Sincronización Google Sheets
- ✅ Diseño responsive
- ✅ Notificaciones en tiempo real

### Próximas versiones
- 🔄 Exportación de reportes
- 🔄 Filtros avanzados
- 🔄 Notificaciones push
- 🔄 Modo offline

---

**Desarrollado con ❤️ para la gestión eficiente de comunidades residenciales**