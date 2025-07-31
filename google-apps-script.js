/**
 * Google Apps Script Backend for Incident Management System
 * This script handles data synchronization with Google Sheets
 * Deploy this as a web app with execution permissions for "Anyone"
 */

// Configuration - Update these with your actual Google Sheets IDs
const SHEETS_CONFIG = {
  MAIN_DATA_SHEET_ID: 'YOUR_MAIN_DATA_SHEET_ID', // Replace with your main data sheet ID
  INCIDENTS_SHEET_ID: 'YOUR_INCIDENTS_SHEET_ID', // Replace with your incidents sheet ID
  FORM_RESPONSES_SHEET_ID: 'YOUR_FORM_RESPONSES_SHEET_ID' // Replace with your form responses sheet ID
};

// Sheet names
const SHEET_NAMES = {
  INCIDENTS: 'Incidencias',
  COMMUNITIES: 'Comunidades', 
  INDUSTRIALS: 'Industriales',
  VISITS: 'Visitas',
  MAIN_DATA: 'DatosGenerales'
};

/**
 * Main function to handle all HTTP requests
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getAllData':
        return ContentService
          .createTextOutput(JSON.stringify(getAllData()))
          .setMimeType(ContentService.MimeType.JSON)
          .setHeaders({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          });
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: 'Invalid action for GET request'
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    switch (action) {
      case 'syncAllData':
        result = syncAllData(data.data);
        break;
      case 'addIncident':
        result = addIncidentToSheet(data);
        break;
      default:
        result = { success: false, message: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

/**
 * Get all data from sheets
 */
function getAllData() {
  try {
    const mainSheet = getOrCreateSheet(SHEETS_CONFIG.MAIN_DATA_SHEET_ID, SHEET_NAMES.MAIN_DATA);
    
    // Try to get data from the main data sheet first
    const dataRange = mainSheet.getDataRange();
    if (dataRange.getNumRows() > 1) {
      const values = dataRange.getValues();
      const headers = values[0];
      const dataRow = values[1];
      
      if (headers.includes('jsonData') && dataRow[headers.indexOf('jsonData')]) {
        const jsonData = JSON.parse(dataRow[headers.indexOf('jsonData')]);
        return {
          success: true,
          data: jsonData,
          source: 'sheets'
        };
      }
    }
    
    // If no data found, return default structure
    return {
      success: true,
      data: {
        incidents: [],
        communities: [],
        industrials: [],
        visits: [],
        nextIncidentId: 1,
        nextCommunityId: 1,
        nextIndustrialId: 1,
        nextVisitId: 1
      },
      source: 'default'
    };
    
  } catch (error) {
    Logger.log('Error in getAllData: ' + error.toString());
    throw new Error('Failed to load data: ' + error.toString());
  }
}

/**
 * Sync all data to sheets
 */
function syncAllData(data) {
  try {
    // Save to main data sheet as JSON
    const mainSheet = getOrCreateSheet(SHEETS_CONFIG.MAIN_DATA_SHEET_ID, SHEET_NAMES.MAIN_DATA);
    
    // Clear existing data
    mainSheet.clear();
    
    // Set headers
    mainSheet.getRange(1, 1, 1, 3).setValues([['timestamp', 'version', 'jsonData']]);
    
    // Save data as JSON
    const timestamp = new Date().toISOString();
    const jsonData = JSON.stringify(data);
    mainSheet.getRange(2, 1, 1, 3).setValues([[timestamp, '1.0', jsonData]]);
    
    // Also save to individual sheets for better readability
    syncIncidentsToSheet(data.incidents || []);
    syncCommunitiesToSheet(data.communities || []);
    syncIndustrialsToSheet(data.industrials || []);
    syncVisitsToSheet(data.visits || []);
    
    return {
      success: true,
      message: 'Data synchronized successfully',
      timestamp: timestamp
    };
    
  } catch (error) {
    Logger.log('Error in syncAllData: ' + error.toString());
    return {
      success: false,
      message: 'Failed to sync data: ' + error.toString()
    };
  }
}

/**
 * Add incident to incidents sheet
 */
function addIncidentToSheet(incidentData) {
  try {
    const sheet = getOrCreateSheet(SHEETS_CONFIG.INCIDENTS_SHEET_ID, SHEET_NAMES.INCIDENTS);
    
    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 10).setValues([[
        'Fecha', 'Título', 'Prioridad', 'Comunidad', 'Dirección', 
        'Propietario', 'Teléfono', 'Descripción', 'Industriales', 'Estado'
      ]]);
    }
    
    // Add new incident
    const newRow = [
      incidentData.fecha || new Date(),
      incidentData.titulo || '',
      incidentData.prioridad || '',
      incidentData.comunidad || '',
      incidentData.direccion || '',
      incidentData.propietario || '',
      incidentData.telefono || '',
      incidentData.descripcion || '',
      Array.isArray(incidentData.industriales) ? incidentData.industriales.join(', ') : '',
      incidentData.estado || 'pending'
    ];
    
    sheet.appendRow(newRow);
    
    return {
      success: true,
      message: 'Incident added successfully'
    };
    
  } catch (error) {
    Logger.log('Error in addIncidentToSheet: ' + error.toString());
    return {
      success: false,
      message: 'Failed to add incident: ' + error.toString()
    };
  }
}

/**
 * Sync incidents to dedicated sheet
 */
function syncIncidentsToSheet(incidents) {
  try {
    const sheet = getOrCreateSheet(SHEETS_CONFIG.INCIDENTS_SHEET_ID, SHEET_NAMES.INCIDENTS);
    
    // Clear existing data
    sheet.clear();
    
    // Set headers
    sheet.getRange(1, 1, 1, 12).setValues([[
      'ID', 'Fecha Creación', 'Título', 'Prioridad', 'Comunidad', 'Dirección',
      'Propietario', 'Teléfono', 'Descripción', 'Industriales', 'Estado', 'Última Actualización'
    ]]);
    
    // Add incidents data
    if (incidents.length > 0) {
      const rows = incidents.map(incident => [
        incident.id || '',
        incident.createdAt || '',
        incident.title || '',
        incident.priority || '',
        incident.community ? incident.community.name : '',
        incident.community ? incident.community.address : '',
        incident.ownerName || '',
        incident.ownerPhone || '',
        incident.description || '',
        incident.industrials ? incident.industrials.map(i => i.name).join(', ') : '',
        incident.status || '',
        incident.updatedAt || ''
      ]);
      
      sheet.getRange(2, 1, rows.length, 12).setValues(rows);
    }
    
  } catch (error) {
    Logger.log('Error in syncIncidentsToSheet: ' + error.toString());
  }
}

/**
 * Sync communities to dedicated sheet
 */
function syncCommunitiesToSheet(communities) {
  try {
    const sheet = getOrCreateSheet(SHEETS_CONFIG.MAIN_DATA_SHEET_ID, SHEET_NAMES.COMMUNITIES);
    
    // Clear existing data
    sheet.clear();
    
    // Set headers
    sheet.getRange(1, 1, 1, 6).setValues([[
      'ID', 'Nombre', 'Dirección', 'Presidente', 'Teléfono Presidente', 'Fecha Creación'
    ]]);
    
    // Add communities data
    if (communities.length > 0) {
      const rows = communities.map(community => [
        community.id || '',
        community.name || '',
        community.address || '',
        community.presidentName || '',
        community.presidentPhone || '',
        community.createdAt || ''
      ]);
      
      sheet.getRange(2, 1, rows.length, 6).setValues(rows);
    }
    
  } catch (error) {
    Logger.log('Error in syncCommunitiesToSheet: ' + error.toString());
  }
}

/**
 * Sync industrials to dedicated sheet
 */
function syncIndustrialsToSheet(industrials) {
  try {
    const sheet = getOrCreateSheet(SHEETS_CONFIG.MAIN_DATA_SHEET_ID, SHEET_NAMES.INDUSTRIALS);
    
    // Clear existing data
    sheet.clear();
    
    // Set headers
    sheet.getRange(1, 1, 1, 5).setValues([[
      'ID', 'Nombre', 'Teléfono', 'Especialidades', 'Fecha Creación'
    ]]);
    
    // Add industrials data
    if (industrials.length > 0) {
      const rows = industrials.map(industrial => [
        industrial.id || '',
        industrial.name || '',
        industrial.phone || '',
        Array.isArray(industrial.specialties) ? industrial.specialties.join(', ') : '',
        industrial.createdAt || ''
      ]);
      
      sheet.getRange(2, 1, rows.length, 5).setValues(rows);
    }
    
  } catch (error) {
    Logger.log('Error in syncIndustrialsToSheet: ' + error.toString());
  }
}

/**
 * Sync visits to dedicated sheet
 */
function syncVisitsToSheet(visits) {
  try {
    const sheet = getOrCreateSheet(SHEETS_CONFIG.MAIN_DATA_SHEET_ID, SHEET_NAMES.VISITS);
    
    // Clear existing data
    sheet.clear();
    
    // Set headers
    sheet.getRange(1, 1, 1, 10).setValues([[
      'ID', 'ID Incidencia', 'Título Incidencia', 'Comunidad', 'Fecha Visita', 
      'Hora Inicio', 'Hora Fin', 'Notas', 'Estado', 'Respuesta'
    ]]);
    
    // Add visits data
    if (visits.length > 0) {
      const rows = visits.map(visit => [
        visit.id || '',
        visit.incidentId || '',
        visit.incident ? visit.incident.title : '',
        visit.incident && visit.incident.community ? visit.incident.community.name : '',
        visit.date || '',
        visit.startTime || '',
        visit.endTime || '',
        visit.notes || '',
        visit.status || '',
        visit.response || ''
      ]);
      
      sheet.getRange(2, 1, rows.length, 10).setValues(rows);
    }
    
  } catch (error) {
    Logger.log('Error in syncVisitsToSheet: ' + error.toString());
  }
}

/**
 * Get or create a sheet
 */
function getOrCreateSheet(spreadsheetId, sheetName) {
  try {
    let spreadsheet;
    
    if (spreadsheetId && spreadsheetId !== 'YOUR_MAIN_DATA_SHEET_ID') {
      spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } else {
      // Create a new spreadsheet if no ID provided
      spreadsheet = SpreadsheetApp.create('Incident Management Data');
      Logger.log('Created new spreadsheet: ' + spreadsheet.getId());
    }
    
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }
    
    return sheet;
    
  } catch (error) {
    Logger.log('Error in getOrCreateSheet: ' + error.toString());
    // Fallback to active spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('Incident Management Data');
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }
    
    return sheet;
  }
}

/**
 * Initialize sheets with proper structure
 */
function initializeSheets() {
  try {
    // Initialize main data sheet
    const mainSheet = getOrCreateSheet(SHEETS_CONFIG.MAIN_DATA_SHEET_ID, SHEET_NAMES.MAIN_DATA);
    
    // Initialize other sheets
    syncIncidentsToSheet([]);
    syncCommunitiesToSheet([]);
    syncIndustrialsToSheet([]);
    syncVisitsToSheet([]);
    
    return {
      success: true,
      message: 'Sheets initialized successfully'
    };
    
  } catch (error) {
    Logger.log('Error in initializeSheets: ' + error.toString());
    return {
      success: false,
      message: 'Failed to initialize sheets: ' + error.toString()
    };
  }
}

/**
 * Test function to verify the setup
 */
function testSetup() {
  try {
    const testData = {
      incidents: [],
      communities: [
        {
          id: 1,
          name: "Test Community",
          address: "Test Address",
          presidentName: "Test President",
          presidentPhone: "+34123456789",
          createdAt: new Date()
        }
      ],
      industrials: [],
      visits: [],
      nextIncidentId: 1,
      nextCommunityId: 2,
      nextIndustrialId: 1,
      nextVisitId: 1
    };
    
    const syncResult = syncAllData(testData);
    const loadResult = getAllData();
    
    Logger.log('Sync result: ' + JSON.stringify(syncResult));
    Logger.log('Load result: ' + JSON.stringify(loadResult));
    
    return {
      syncResult: syncResult,
      loadResult: loadResult
    };
    
  } catch (error) {
    Logger.log('Error in testSetup: ' + error.toString());
    return {
      error: error.toString()
    };
  }
}

/**
 * Get form responses from the connected Google Form
 * This function can be called periodically to sync form responses
 */
function getFormResponses() {
  try {
    // If you have a specific form responses sheet, you can read from it here
    // This is an example implementation
    
    const sheet = getOrCreateSheet(SHEETS_CONFIG.FORM_RESPONSES_SHEET_ID, 'Form Responses');
    const dataRange = sheet.getDataRange();
    
    if (dataRange.getNumRows() <= 1) {
      return {
        success: true,
        responses: []
      };
    }
    
    const values = dataRange.getValues();
    const headers = values[0];
    const responses = values.slice(1).map(row => {
      const response = {};
      headers.forEach((header, index) => {
        response[header] = row[index] || '';
      });
      return response;
    });
    
    return {
      success: true,
      responses: responses
    };
    
  } catch (error) {
    Logger.log('Error in getFormResponses: ' + error.toString());
    return {
      success: false,
      message: error.toString(),
      responses: []
    };
  }
}