// ============================================
// UTILIDAD PARA GENERACIÓN DE CÓDIGOS QR
// Funciones para crear y gestionar códigos QR únicos
// ============================================

/**
 * NOMENCLATURA DE CÓDIGOS QR:
 * Formato: LAB-{ID}-{CLASIFICACION}-{AÑO}
 * 
 * Ejemplo: LAB-00042-ACD-2026
 * - LAB: Prefijo del laboratorio
 * - 00042: ID del reactivo (5 dígitos con ceros a la izquierda)
 * - ACD: Código de clasificación (3 letras)
 * - 2026: Año de registro
 * 
 * Esta nomenclatura permite:
 * - Identificación única del reactivo
 * - Trazabilidad por clasificación
 * - Organización temporal
 * - Fácil lectura visual
 */

/**
 * Genera un código QR único para un reactivo
 * @param {number} id - ID del reactivo en la base de datos
 * @param {string} codigoClasificacion - Código de la clasificación (3 letras)
 * @param {string} formulaQuimica - Fórmula química (opcional, ya no se usa en el código)
 * @returns {string} Código QR generado
 */
export const generarCodigoQR = (id, codigoClasificacion, formulaQuimica = '') => {
  // Obtener año actual
  const year = new Date().getFullYear();
  
  // Formatear ID con 5 dígitos (ej: 42 -> 00042)
  const idFormateado = String(id).padStart(5, '0');
  
  // Asegurar que el código de clasificación sea de 3 letras en mayúsculas
  const clasificacionFormateada = codigoClasificacion.toUpperCase().substring(0, 3).padEnd(3, 'X');
  
  // Generar código con el formato: LAB-{ID}-{CLASIFICACION}-{AÑO}
  const codigoQR = `LAB-${idFormateado}-${clasificacionFormateada}-${year}`;
  
  return codigoQR;
};

/**
 * Extrae información del código QR
 * @param {string} codigoQR - Código QR a decodificar
 * @returns {Object} Objeto con la información extraída
 */
export const decodificarCodigoQR = (codigoQR) => {
  try {
    // Separar las partes del código
    const partes = codigoQR.split('-');
    
    if (partes.length !== 4 || partes[0] !== 'LAB') {
      throw new Error('Formato de código QR inválido');
    }
    
    return {
      prefijo: partes[0],        // LAB
      id: parseInt(partes[1]),   // ID numérico
      clasificacion: partes[2],  // Código de clasificación
      year: parseInt(partes[3]), // Año de registro
      esValido: true
    };
  } catch (error) {
    return {
      esValido: false,
      error: error.message
    };
  }
};

/**
 * Valida si un código QR tiene el formato correcto
 * @param {string} codigoQR - Código QR a validar
 * @returns {boolean} true si es válido, false si no
 */
export const validarFormatoQR = (codigoQR) => {
  // Patrón regex para el formato LAB-XXXXX-XXX-YYYY
  const patron = /^LAB-\d{5}-[A-Z]{3}-\d{4}$/;
  return patron.test(codigoQR);
};

/**
 * Genera un nombre de archivo único para la imagen QR
 * @param {string} codigoQR - Código QR
 * @returns {string} Nombre de archivo
 */
export const generarNombreArchivoQR = (codigoQR) => {
  // Reemplazar guiones por underscores para el nombre de archivo
  const nombreBase = codigoQR.replace(/-/g, '_');
  return `${nombreBase}.png`;
};

/**
 * Genera múltiples códigos QR de prueba (para desarrollo/testing)
 * @param {number} cantidad - Cantidad de códigos a generar
 * @returns {Array<string>} Array de códigos QR
 */
export const generarCodigosQRPrueba = (cantidad = 10) => {
  const codigos = [];
  const clasificaciones = ['ACD', 'BAS', 'OXI', 'DIS', 'TOX'];
  
  for (let i = 1; i <= cantidad; i++) {
    const clasificacionAleatoria = clasificaciones[Math.floor(Math.random() * clasificaciones.length)];
    const codigo = generarCodigoQR(i, clasificacionAleatoria);
    codigos.push(codigo);
  }
  
  return codigos;
};

/**
 * Obtiene el siguiente ID disponible (útil antes de insertar en BD)
 * Esta función debe usarse en conjunto con la base de datos
 * @param {Function} queryFunction - Función de consulta a la BD
 * @returns {Promise<number>} Siguiente ID disponible
 */
export const obtenerSiguienteID = async (queryFunction) => {
  try {
    const result = await queryFunction('SELECT MAX(id) as maxId FROM reactivos');
    const maxId = result[0].maxId || 0;
    return maxId + 1;
  } catch (error) {
    console.error('Error al obtener siguiente ID:', error);
    throw error;
  }
};

/**
 * Genera información completa para un nuevo reactivo
 * Incluye el código QR y el nombre de archivo
 * @param {number} id - ID del reactivo
 * @param {string} codigoClasificacion - Código de clasificación
 * @param {string} formulaQuimica - Fórmula química (opcional)
 * @returns {Object} Objeto con código QR y nombre de archivo
 */
export const generarInfoQRCompleta = (id, codigoClasificacion, formulaQuimica = '') => {
  const codigoQR = generarCodigoQR(id, codigoClasificacion, formulaQuimica);
  const nombreArchivo = generarNombreArchivoQR(codigoQR);
  
  return {
    codigoQR,
    nombreArchivo,
    rutaCompleta: `/qr-codes/${nombreArchivo}`,
    valido: validarFormatoQR(codigoQR),
    info: decodificarCodigoQR(codigoQR)
  };
};

/**
 * Formatea un código QR para mostrar de manera legible
 * @param {string} codigoQR - Código QR
 * @returns {string} Código formateado con espacios
 */
export const formatearCodigoQRDisplay = (codigoQR) => {
  const info = decodificarCodigoQR(codigoQR);
  if (!info.esValido) return codigoQR;
  
  return `${info.prefijo} ${info.id.toString().padStart(5, '0')} ${info.clasificacion} ${info.year}`;
};

export default {
  generarCodigoQR,
  decodificarCodigoQR,
  validarFormatoQR,
  generarNombreArchivoQR,
  generarCodigosQRPrueba,
  obtenerSiguienteID,
  generarInfoQRCompleta,
  formatearCodigoQRDisplay
};