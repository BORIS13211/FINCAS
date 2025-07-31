# 🏢 Sistema de Gestión de Incidencias

Sistema completo para la gestión de incidencias en comunidades de propietarios con integración de WhatsApp y Google Forms/Sheets.

## 🚀 Características Principales

- **Gestión de Incidencias**: Crear, asignar y seguir incidencias
- **Gestión de Comunidades**: Administrar comunidades y sus presidentes  
- **Gestión de Industriales**: Registrar industriales con sus especialidades
- **Programación de Visitas**: Agendar y gestionar visitas técnicas
- **Integración WhatsApp**: Notificaciones automáticas a industriales y comunidades
- **Integración Google Forms**: Sincronización automática de respuestas
- **Interfaz Responsive**: Adaptada para móviles y tablets
- **Almacenamiento Local**: Datos persistentes en el navegador

## 📁 Estructura Modular

Este proyecto ha sido refactorizado para separar el código JavaScript monolítico en módulos especializados, mejorando la mantenibilidad y organización del código.

## Estructura de Archivos

### Archivos JavaScript Modulares

1. **`main.js`** - Archivo principal con inicialización y configuración global
   - Variables globales
   - Event listeners principales
   - Inicialización de la aplicación
   - Gestión de tabs y modales

2. **`auth.js`** - Módulo de autenticación
   - Funciones de login y logout
   - Gestión de sesión de usuario

3. **`utils.js`** - Utilidades y funciones auxiliares
   - Formateo de fechas
   - Conversión de texto de prioridades y estados
   - Actualización de estadísticas

4. **`storage.js`** - Gestión de almacenamiento local
   - Guardado y carga de datos en localStorage
   - Datos de ejemplo iniciales

5. **`communities.js`** - Gestión de comunidades
   - CRUD de comunidades
   - Carga de opciones de comunidades
   - Visualización de datos de comunidad

6. **`industrials.js`** - Gestión de industriales
   - CRUD de industriales
   - Sistema de selección múltiple con dropdown
   - Gestión de especialidades

7. **`incidents.js`** - Gestión de incidencias
   - Creación y gestión de incidencias
   - Sincronización con Google Sheets
   - Listado y eliminación de incidencias

8. **`visits.js`** - Gestión de visitas
   - Programación de visitas
   - Actualización de estados
   - Gestión de modales de visitas

9. **`whatsapp.js`** - Integración con WhatsApp
   - Notificaciones a industriales
   - Confirmaciones a comunidades
   - Recordatorios de visitas
   - Mensajes de finalización

10. **`forms.js`** - Integración con Google Forms
    - Sincronización de respuestas desde CSV
    - Parsing de datos del formulario
    - Actualización automática de visitas

### Archivo HTML

- **`index.html`** - Archivo principal que incluye todos los módulos JavaScript en el orden correcto

## Orden de Carga de Scripts

Es importante mantener el siguiente orden de carga para evitar errores de dependencias:

```html
<!-- Utilidades y almacenamiento primero -->
<script src="utils.js"></script>
<script src="storage.js"></script>

<!-- Autenticación -->
<script src="auth.js"></script>

<!-- Módulos de gestión de datos -->
<script src="communities.js"></script>
<script src="industrials.js"></script>
<script src="incidents.js"></script>
<script src="visits.js"></script>

<!-- Integraciones externas -->
<script src="whatsapp.js"></script>
<script src="forms.js"></script>

<!-- Aplicación principal al final -->
<script src="main.js"></script>
```

## Ventajas de la Estructura Modular

1. **Mantenibilidad**: Cada módulo tiene una responsabilidad específica
2. **Legibilidad**: El código es más fácil de entender y navegar
3. **Reutilización**: Los módulos pueden ser reutilizados en otros proyectos
4. **Debugging**: Es más fácil localizar y corregir errores
5. **Colaboración**: Diferentes desarrolladores pueden trabajar en módulos específicos
6. **Testing**: Cada módulo puede ser probado de forma independiente

## Configuración

### Google Sheets Integration
- Actualizar la URL vacía en `incidents.js` línea 47 con tu script de Google Apps Script
- Verificar la URL del CSV en `forms.js` línea 4 para la sincronización de respuestas

### WhatsApp Integration
- Los enlaces de WhatsApp se generan automáticamente
- Verificar el ID del formulario de Google en `whatsapp.js` línea 10

## Uso

1. Incluir todos los archivos JavaScript en tu proyecto
2. Asegurar que el HTML incluya los scripts en el orden especificado
3. El CSS existente (`styles.css`) sigue siendo compatible
4. La funcionalidad permanece idéntica al código original

## Migración desde el Código Original

Si estás migrando desde el archivo JavaScript monolítico:

1. Reemplaza la inclusión del archivo JavaScript único con los módulos
2. Asegúrate de incluir `index.html` o agregar los scripts a tu HTML existente
3. No se requieren cambios en el HTML de la interfaz de usuario
4. No se requieren cambios en el CSS

La aplicación funcionará exactamente igual que antes, pero ahora con mejor organización del código.

## 🎯 Cómo Usar la Aplicación

### 1. **Instalación**
```bash
# Clona o descarga todos los archivos
# Abre index.html en tu navegador web
```

### 2. **Inicio de Sesión**
- Usuario: cualquier texto
- Contraseña: cualquier texto
- Haz clic en "Iniciar Sesión"

### 3. **Gestionar Comunidades**
- Ve a la pestaña "🏢 Comunidades"
- Completa el formulario con:
  - Nombre de la comunidad
  - Dirección completa
  - Nombre del presidente
  - Teléfono del presidente
- Haz clic en "➕ Agregar Comunidad"

### 4. **Registrar Industriales**
- Ve a la pestaña "👷 Industriales"
- Completa el formulario con:
  - Nombre del industrial
  - Teléfono (formato: +34XXXXXXXXX)
  - Especialidades (selecciona una o más)
- Haz clic en "➕ Registrar Industrial"

### 5. **Reportar Incidencia**
- Ve a la pestaña "📝 Reportar Incidencia"
- Completa todos los campos:
  - Título descriptivo
  - Prioridad (Baja, Media, Alta, Urgente)
  - Selecciona la comunidad
  - Datos del propietario afectado
  - Selecciona uno o más industriales
  - Descripción detallada
- Haz clic en "📤 Reportar Incidencia"
- **Se abrirán automáticamente ventanas de WhatsApp** para cada industrial seleccionado

### 6. **Programar Visitas**
- Ve a "📋 Lista de Incidencias"
- Haz clic en "📅 Programar Visita" en una incidencia pendiente
- Selecciona fecha y horario
- Añade notas si es necesario
- Marca "Enviar recordatorio" si quieres notificar al presidente
- **Se abrirá WhatsApp** para confirmar la visita a la comunidad

### 7. **Gestionar Visitas**
- Ve a "📅 Programar Visitas"
- Haz clic en "✏️ Actualizar Estado"
- Cambia el estado y añade detalles del trabajo
- Si marcas como "Completada", se abrirá WhatsApp para notificar

## 📱 Integración WhatsApp

La aplicación genera automáticamente mensajes de WhatsApp para:

### **A Industriales (al crear incidencia):**
- Detalles de la incidencia
- Ubicación con enlace a Google Maps
- Enlace al formulario de Google para agendar visita
- Información de contacto

### **A Comunidades (al programar visita):**
- Confirmación de visita programada
- Datos del industrial asignado
- Fecha y horario
- Información de la incidencia

### **A Comunidades (al completar trabajo):**
- Confirmación de trabajo completado
- Detalles del trabajo realizado
- Datos del industrial

## 🔗 Integración Google Forms/Sheets

### **Configuración:**
1. **Google Sheets URL** (incidents.js línea 47):
   - Reemplaza la URL vacía con tu Google Apps Script
   - Para sincronizar incidencias creadas

2. **Google Forms CSV** (forms.js línea 4):
   - URL del CSV público de respuestas
   - Para sincronizar respuestas de industriales

3. **Google Forms URL** (whatsapp.js línea 10):
   - URL del formulario con campo prellenado
   - Para que industriales agenden visitas

### **Flujo de Trabajo:**
1. Se crea incidencia → Se sincroniza a Google Sheets
2. Industrial recibe WhatsApp con enlace al formulario
3. Industrial completa formulario con fecha/hora
4. Sistema sincroniza respuesta automáticamente
5. Visita se marca como completada

## 💾 Datos de Ejemplo

La aplicación incluye datos de ejemplo:

### **Comunidades:**
- Residencial Los Jardines (Barcelona)
- Complejo Vista Mar (Valencia)

### **Industriales:**
- Juan Martínez (Fontanería, Mantenimiento)
- Ana Rodríguez (Electricidad, Climatización)  
- Pedro Sánchez (Piscinas, Jardinería)

## 🛠️ Personalización

### **Especialidades de Industriales:**
Edita en `index.html` líneas 196-203:
```html
<label><input type="checkbox" name="specialties" value="TuEspecialidad"> Tu Especialidad</label>
```

### **Estados de Incidencias:**
Modifica en `utils.js` la función `getStatusText()`

### **Prioridades:**
Modifica en `utils.js` la función `getPriorityText()`

## 📱 Uso en Móviles

- La interfaz es completamente responsive
- Funciona perfectamente en tablets y móviles
- Los enlaces de WhatsApp se abren directamente en la app
- Formularios optimizados para pantallas táctiles

## 🔧 Solución de Problemas

### **WhatsApp no se abre:**
- Verifica que los números tengan formato +34XXXXXXXXX
- Asegúrate de tener WhatsApp instalado

### **No se sincronizan datos:**
- Verifica las URLs de Google Sheets/Forms
- Comprueba la conexión a internet
- Revisa la consola del navegador (F12)

### **Datos no se guardan:**
- Los datos se guardan en localStorage del navegador
- No borres los datos del navegador
- Para backup, exporta desde Configuración del navegador