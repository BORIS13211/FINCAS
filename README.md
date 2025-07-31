# Sistema de Gestión de Incidencias - Estructura Modular

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