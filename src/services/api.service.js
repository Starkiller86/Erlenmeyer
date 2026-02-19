// ============================================
// SERVICIO API PARA REACTIVOS
// Funciones para comunicación entre frontend y backend
// ============================================

/**
 * URL base de la API
 * En desarrollo usa localhost, en producción debe ser la URL del servidor
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Función auxiliar para hacer peticiones fetch con manejo de errores
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones para fetch
 * @returns {Promise<Object>} Respuesta de la API
 */
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Configuración por defecto
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    
    const response = await fetch(url, config);
    
    // Si la respuesta no es exitosa, lanzar error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en petición API:', error);
    throw error;
  }
};

// ============================================
// ENDPOINTS DE CLASIFICACIONES
// ============================================

/**
 * Obtiene todas las clasificaciones disponibles
 * @returns {Promise<Array>} Array de clasificaciones
 */
export const obtenerClasificaciones = async () => {
  return await fetchAPI('/clasificaciones');
};

// ============================================
// ENDPOINTS DE REACTIVOS
// ============================================

/**
 * Registra un nuevo reactivo en el sistema
 * @param {Object} reactivo - Datos del reactivo a registrar
 * @returns {Promise<Object>} Respuesta con el reactivo creado
 */
export const registrarReactivo = async (reactivo) => {
  return await fetchAPI('/reactivos', {
    method: 'POST',
    body: JSON.stringify(reactivo),
  });
};

/**
 * Obtiene todos los reactivos con filtros opcionales
 * @param {Object} filtros - Filtros para la búsqueda
 * @returns {Promise<Array>} Array de reactivos
 */
export const obtenerReactivos = async (filtros = {}) => {
  // Construir query string con los filtros
  const queryParams = new URLSearchParams();
  
  if (filtros.nombre && filtros.nombre.trim() !== ''){
    queryParams.append('nombre', filtros.nombre.trim());
  } 
  if (filtros.clasificacion_id !== '' && filtros.clasificacion_id !==null && filtros.clasificacion_id !== undefined){
    queryParams.append('clasificacion_id', filtros.clasificacion_id);
  } 
  if (filtros.estado && filtros.estado !== ''){
    queryParams.append('estado', filtros.estado);
  } 
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/reactivos?${queryString}` : '/reactivos';
  console.log('URL generada:', endpoint);
  return await fetchAPI(endpoint);
};

/**
 * Obtiene un reactivo por su ID
 * @param {number} id - ID del reactivo
 * @returns {Promise<Object>} Datos del reactivo
 */
export const obtenerReactivoPorId = async (id) => {
  return await fetchAPI(`/reactivos/${id}`);
};

/**
 * Obtiene un reactivo por su código QR
 * @param {string} codigoQR - Código QR del reactivo
 * @returns {Promise<Object>} Datos del reactivo
 */
export const obtenerReactivoPorQR = async (codigoQR) => {
  return await fetchAPI(`/reactivos/qr/${encodeURIComponent(codigoQR)}`);
};

/**
 * Actualiza los datos de un reactivo
 * @param {number} id - ID del reactivo
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Reactivo actualizado
 */
export const actualizarReactivo = async (id, datos) => {
  return await fetchAPI(`/reactivos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
};

/**
 * Actualiza solo la cantidad de un reactivo
 * @param {number} id - ID del reactivo
 * @param {number} nuevaCantidad - Nueva cantidad
 * @returns {Promise<Object>} Respuesta de la actualización
 */
export const actualizarCantidadReactivo = async (id, nuevaCantidad) => {
  return await fetchAPI(`/reactivos/${id}/cantidad`, {
    method: 'PATCH',
    body: JSON.stringify({ cantidad: nuevaCantidad }),
  });
};

/**
 * Elimina un reactivo del sistema
 * @param {number} id - ID del reactivo
 * @returns {Promise<Object>} Respuesta de la eliminación
 */
export const eliminarReactivo = async (id) => {
  return await fetchAPI(`/reactivos/${id}`, {
    method: 'DELETE',
  });
};

// ============================================
// ENDPOINTS DE CÓDIGOS QR
// ============================================

/**
 * Genera y descarga la imagen QR de un reactivo
 * @param {string} codigoQR - Código QR del reactivo
 * @returns {Promise<Blob>} Imagen QR como blob
 */
export const descargarImagenQR = async (codigoQR) => {
  const url = `${API_BASE_URL}/qr/generar/${encodeURIComponent(codigoQR)}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Error al generar código QR');
  }
  
  return await response.blob();
};

/**
 * Descarga la imagen QR directamente al navegador
 * @param {string} codigoQR - Código QR
 * @param {string} nombreReactivo - Nombre del reactivo (para el nombre del archivo)
 */
export const descargarQRDirecto = async (codigoQR, nombreReactivo = 'reactivo') => {
  try {
    const blob = await descargarImagenQR(codigoQR);
    
    // Crear URL temporal para el blob
    const url = window.URL.createObjectURL(blob);
    
    // Crear enlace temporal y hacer click para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${nombreReactivo.replace(/\s+/g, '_')}_${codigoQR}.png`;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'QR descargado exitosamente' };
  } catch (error) {
    console.error('Error al descargar QR:', error);
    throw error;
  }
};

// ============================================
// ENDPOINTS DE ESTADÍSTICAS
// ============================================

/**
 * Obtiene estadísticas generales del inventario
 * @returns {Promise<Object>} Objeto con estadísticas
 */
export const obtenerEstadisticas = async () => {
  return await fetchAPI('/estadisticas');
};

// ============================================
// ENDPOINTS DE BÚSQUEDA AVANZADA
// ============================================

/**
 * Busca reactivos por fórmula química
 * @param {string} formula - Fórmula química a buscar
 * @returns {Promise<Array>} Array de reactivos coincidentes
 */
export const buscarPorFormula = async (formula) => {
  return await fetchAPI(`/reactivos/buscar/formula?q=${encodeURIComponent(formula)}`);
};

/**
 * Busca información de fórmula química usando API externa (PubChem)
 * @param {string} nombreReactivo - Nombre del reactivo
 * @returns {Promise<Object>} Información química del reactivo
 */
export const buscarFormulaQuimica = async (nombreReactivo) => {
  return await fetchAPI(`/quimica/buscar?nombre=${encodeURIComponent(nombreReactivo)}`);
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Valida que la conexión con la API esté funcionando
 * @returns {Promise<Object>} Estado de la API
 */
export const verificarConexionAPI = async () => {
  try {
    return await fetchAPI('/health');
  } catch (error) {
    return { 
      status: 'error', 
      message: 'No se puede conectar con la API',
      error: error.message 
    };
  }
};

export default {
  obtenerClasificaciones,
  registrarReactivo,
  obtenerReactivos,
  obtenerReactivoPorId,
  obtenerReactivoPorQR,
  actualizarReactivo,
  actualizarCantidadReactivo,
  eliminarReactivo,
  descargarImagenQR,
  descargarQRDirecto,
  obtenerEstadisticas,
  buscarPorFormula,
  buscarFormulaQuimica,
  verificarConexionAPI,
};