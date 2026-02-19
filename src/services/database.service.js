// ============================================
// SERVICIO DE BASE DE DATOS
// Maneja la conexión y operaciones con MySQL
// ============================================

import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database.config.js';

/**
 * Pool de conexiones a la base de datos MySQL
 * Utiliza un pool para manejar múltiples conexiones de manera eficiente
 */
let pool = null;

/**
 * Inicializa el pool de conexiones a la base de datos
 * @returns {Promise<mysql.Pool>} Pool de conexiones
 */
export const initDatabase = async () => {
  try {
    // Crear el pool de conexiones
    pool = mysql.createPool(dbConfig);
    
    // Verificar la conexión
    const connection = await pool.getConnection();
    console.log('Conexión a MySQL establecida correctamente');
    connection.release();
    
    return pool;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    throw error;
  }
};

/**
 * Obtiene el pool de conexiones actual
 * @returns {mysql.Pool} Pool de conexiones
 */
export const getPool = () => {
  if (!pool) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return pool;
};

/**
 * Ejecuta una consulta SQL con parámetros
 * @param {string} sql - Consulta SQL a ejecutar
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Array>} Resultados de la consulta
 */
export const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando consulta:', error.message);
    throw error;
  }
};

/**
 * Ejecuta una transacción con múltiples consultas
 * @param {Function} callback - Función que recibe la conexión y ejecuta las consultas
 * @returns {Promise<any>} Resultado de la transacción
 */
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  
  try {
    // Iniciar transacción
    await connection.beginTransaction();
    
    // Ejecutar las operaciones
    const result = await callback(connection);
    
    // Confirmar transacción
    await connection.commit();
    
    return result;
  } catch (error) {
    // Revertir transacción en caso de error
    await connection.rollback();
    console.error('Error en transacción:', error.message);
    throw error;
  } finally {
    // Liberar la conexión
    connection.release();
  }
};

/**
 * Cierra el pool de conexiones
 */
export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    console.log('Conexión a la base de datos cerrada');
  }
};

// ============================================
// FUNCIONES ESPECÍFICAS PARA REACTIVOS
// ============================================

/**
 * Obtiene todas las clasificaciones disponibles
 * @returns {Promise<Array>} Array de clasificaciones
 */
export const getClasificaciones = async () => {
  const sql = `
    SELECT id, nombre, codigo, color_hex, nivel_peligro, descripcion, icono
    FROM clasificaciones
    ORDER BY nombre
  `;
  return await query(sql);
};

/**
 * Inserta un nuevo reactivo en la base de datos
 * @param {Object} reactivo - Datos del reactivo
 * @returns {Promise<Object>} Resultado de la inserción con el ID generado
 */
export const insertReactivo = async (reactivo) => {
  const sql = `
    INSERT INTO reactivos (
      nombre, 
      formula_quimica, 
      clasificacion_id, 
      cas_number,
      presentacion, 
      cantidad_actual, 
      unidad_medida,
      cantidad_minima,
      ubicacion,
      numero_frascos,
      lote,
      fecha_caducidad,
      fabricante,
      proveedor,
      precio_unitario,
      observaciones,
      codigo_qr,
      qr_imagen_path,
      estado,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    reactivo.nombre,
    reactivo.formula_quimica || null,
    reactivo.clasificacion_id,
    reactivo.cas_number || null,
    reactivo.presentacion || null,
    reactivo.cantidad_actual || 0,
    reactivo.unidad_medida || 'ml',
    reactivo.cantidad_minima || 0,
    reactivo.ubicacion || null,
    reactivo.numero_frascos || 1,
    reactivo.lote || null,
    reactivo.fecha_caducidad || null,
    reactivo.fabricante || null,
    reactivo.proveedor || null,
    reactivo.precio_unitario || null,
    reactivo.observaciones || null,
    reactivo.codigo_qr,
    reactivo.qr_imagen_path || null,
    reactivo.estado || 'activo',
    reactivo.created_by || 'SISTEMA'
  ];
  
  const result = await query(sql, params);
  return {
    success: true,
    id: result.insertId,
    message: 'Reactivo registrado exitosamente'
  };
};

/**
 * Obtiene todos los reactivos con información completa
 * @param {Object} filtros - Filtros opcionales para la búsqueda
 * @returns {Promise<Array>} Array de reactivos
 */
export const getReactivos = async (filtros = {}) => {
  let sql = `
    SELECT * FROM vista_reactivos_completa
    WHERE 1=1
  `;
  const params = [];
  
  // Aplicar filtros si existen
  if (filtros.nombre) {
    sql += ` AND nombre LIKE ?`;
    params.push(`%${filtros.nombre}%`);
  }
  
  if (filtros.clasificacion_id) {
    sql += ` AND clasificacion_id = ?`;
    params.push(filtros.clasificacion_id);
  }
  
  if (filtros.estado) {
    sql += ` AND estado = ?`;
    params.push(filtros.estado);
  }
  
  sql += ` ORDER BY nombre ASC`;
  
  return await query(sql, params);
};

/**
 * Obtiene un reactivo por su código QR
 * @param {string} codigoQR - Código QR del reactivo
 * @returns {Promise<Object|null>} Datos del reactivo o null si no existe
 */
export const getReactivoByQR = async (codigoQR) => {
  const sql = `
    SELECT * FROM vista_reactivos_completa
    WHERE codigo_qr = ?
  `;
  const results = await query(sql, [codigoQR]);
  return results.length > 0 ? results[0] : null;
};

/**
 * Obtiene un reactivo por su ID
 * @param {number} id - ID del reactivo
 * @returns {Promise<Object|null>} Datos del reactivo o null si no existe
 */
export const getReactivoById = async (id) => {
  const sql = `
    SELECT * FROM vista_reactivos_completa
    WHERE id = ?
  `;
  const results = await query(sql, [id]);
  return results.length > 0 ? results[0] : null;
};

/**
 * Actualiza la cantidad de un reactivo
 * @param {number} id - ID del reactivo
 * @param {number} nuevaCantidad - Nueva cantidad
 * @returns {Promise<Object>} Resultado de la actualización
 */
export const updateCantidadReactivo = async (id, nuevaCantidad) => {
  const sql = `
    UPDATE reactivos 
    SET cantidad_actual = ?,
        estado = CASE WHEN ? <= 0 THEN 'agotado' ELSE estado END
    WHERE id = ?
  `;
  await query(sql, [nuevaCantidad, nuevaCantidad, id]);
  return { success: true, message: 'Cantidad actualizada' };
};

/**
 * Verifica si un código QR ya existe en la base de datos
 * @param {string} codigoQR - Código QR a verificar
 * @returns {Promise<boolean>} true si existe, false si no
 */
export const existeCodigoQR = async (codigoQR) => {
  const sql = `SELECT COUNT(*) as count FROM reactivos WHERE codigo_qr = ?`;
  const results = await query(sql, [codigoQR]);
  return results[0].count > 0;
};

/**
 * Obtiene estadísticas generales del inventario
 * @returns {Promise<Object>} Objeto con estadísticas
 */
export const getEstadisticas = async () => {
  const sql = `SELECT * FROM vista_estadisticas`;
  const stats = await query(sql);
  
  // Consultas adicionales para estadísticas generales
  const totalReactivos = await query('SELECT COUNT(*) as total FROM reactivos');
  const stockBajo = await query('SELECT COUNT(*) as total FROM reactivos WHERE cantidad_actual <= cantidad_minima');
  const proximosCaducar = await query(`
    SELECT COUNT(*) as total 
    FROM reactivos 
    WHERE fecha_caducidad <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    AND fecha_caducidad >= CURDATE()
  `);
  
  return {
    porClasificacion: stats,
    totalReactivos: totalReactivos[0].total,
    alertasStockBajo: stockBajo[0].total,
    proximosACaducar: proximosCaducar[0].total
  };
};

export default {
  initDatabase,
  getPool,
  query,
  transaction,
  closeDatabase,
  getClasificaciones,
  insertReactivo,
  getReactivos,
  getReactivoByQR,
  getReactivoById,
  updateCantidadReactivo,
  existeCodigoQR,
  getEstadisticas
};