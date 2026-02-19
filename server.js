// ============================================
// SERVIDOR BACKEND - API REST
// Node.js + Express + MySQL
// ============================================

import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import mysql from 'mysql2/promise';
import { dbConfig, serverConfig } from './src/config/database.config.js';

const app = express();

// ============================================
// MIDDLEWARES - CONFIGURACIÓN DE CORS
// ============================================

// IMPORTANTE: Configurar CORS ANTES de las demás configuraciones
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));

// Pool de conexiones MySQL
let pool;

// Inicializar base de datos
async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('Conectado a MySQL');
    connection.release();
  } catch (error) {
    console.error('Error conectando a MySQL:', error.message);
    process.exit(1);
  }
}

// ============================================
// RUTA RAÍZ - Información del API
// ============================================

app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Inventario de Reactivos - Laboratorio de Nanotecnología UTQ',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      clasificaciones: 'GET /api/clasificaciones - Obtener todas las clasificaciones',
      reactivos: {
        listar: 'GET /api/reactivos - Listar reactivos (con filtros opcionales)',
        crear: 'POST /api/reactivos - Crear nuevo reactivo',
        obtenerPorId: 'GET /api/reactivos/:id - Obtener reactivo por ID',
        obtenerPorQR: 'GET /api/reactivos/qr/:codigo - Obtener reactivo por código QR'
      },
      qr: 'GET /api/qr/generar/:codigo - Generar imagen QR',
      estadisticas: 'GET /api/estadisticas - Obtener estadísticas del inventario',
      quimica: 'GET /api/quimica/buscar?nombre=XXX - Buscar fórmula química',
      health: 'GET /api/health - Verificar estado del servidor'
    },
    documentacion: 'Consulta el README.md para más información'
  });
});

// ============================================
// RUTAS - CLASIFICACIONES
// ============================================

app.get('/api/clasificaciones', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, codigo, color_hex, nivel_peligro, descripcion, icono FROM clasificaciones ORDER BY nombre'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS - REACTIVOS
// ============================================

app.get('/api/reactivos', async (req, res) => {
  try {
    const { nombre, clasificacion_id, estado } = req.query;
    let sql = 'SELECT * FROM vista_reactivos_completa WHERE 1=1';
    const params = [];

    if (nombre) {
      sql += ' AND nombre LIKE ?';
      params.push(`%${nombre}%`);
    }
    if (clasificacion_id) {
      sql += ' AND clasificacion_id = ?';
      params.push(parseInt(clasificacion_id,10));
    }
    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }
    console.log('SQL generado:',sql);
    
    sql += ' ORDER BY nombre';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reactivos', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Generar código QR
    const [maxResult] = await connection.query('SELECT MAX(id) as maxId FROM reactivos');
    const nextId = (maxResult[0].maxId || 0) + 1;
    
    const [clasificacion] = await connection.query('SELECT codigo FROM clasificaciones WHERE id = ?', [req.body.clasificacion_id]);
    const codigoClasif = clasificacion[0]?.codigo || 'XXX';
    const year = new Date().getFullYear();
    const codigoQR = `LAB-${String(nextId).padStart(5, '0')}-${codigoClasif}-${year}`;
    const qrPath = `/qr-codes/QR_${codigoQR}.png`;

    // Generar imagen QR
    await QRCode.toFile(`./public${qrPath}`, codigoQR, { width: 300 });

    // Insertar reactivo
    const sql = `INSERT INTO reactivos (
      nombre, formula_quimica, clasificacion_id, cas_number, presentacion,
      cantidad_actual, unidad_medida, cantidad_minima, ubicacion, numero_frascos,
      lote, fecha_caducidad, fabricante, proveedor, precio_unitario,
      observaciones, codigo_qr, qr_imagen_path, estado, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      req.body.nombre,
      req.body.formula_quimica || null,
      req.body.clasificacion_id,
      req.body.cas_number || null,
      req.body.presentacion || 'líquido',
      req.body.cantidad_actual || 0,
      req.body.unidad_medida || 'ml',
      req.body.cantidad_minima || 0,
      req.body.ubicacion || null,
      req.body.numero_frascos || 1,
      req.body.lote || null,
      req.body.fecha_caducidad || null,
      req.body.fabricante || null,
      req.body.proveedor || null,
      req.body.precio_unitario || null,
      req.body.observaciones || null,
      codigoQR,
      qrPath,
      'activo',
      req.body.created_by || 'SISTEMA'
    ];

    const [result] = await connection.query(sql, params);
    await connection.commit();

    res.json({ 
      success: true, 
      id: result.insertId, 
      codigo_qr: codigoQR,
      qr_path: qrPath,
      message: 'Reactivo registrado exitosamente' 
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/reactivos/qr/:codigo', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vista_reactivos_completa WHERE codigo_qr = ?',
      [req.params.codigo]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reactivo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reactivos/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vista_reactivos_completa WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reactivo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS - CÓDIGOS QR
// ============================================

app.get('/api/qr/generar/:codigo', async (req, res) => {
  try {
    const qrBuffer = await QRCode.toBuffer(req.params.codigo, { width: 300 });
    res.set('Content-Type', 'image/png');
    res.send(qrBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS - ESTADÍSTICAS
// ============================================

app.get('/api/estadisticas', async (req, res) => {
  try {
    const [stats] = await pool.query('SELECT * FROM vista_estadisticas');
    const [total] = await pool.query('SELECT COUNT(*) as total FROM reactivos');
    const [stockBajo] = await pool.query('SELECT COUNT(*) as total FROM reactivos WHERE cantidad_actual <= cantidad_minima');
    const [caducar] = await pool.query(
      'SELECT COUNT(*) as total FROM reactivos WHERE fecha_caducidad <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND fecha_caducidad >= CURDATE()'
    );

    res.json({
      porClasificacion: stats,
      totalReactivos: total[0].total,
      alertasStockBajo: stockBajo[0].total,
      proximosACaducar: caducar[0].total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RUTA PARA LAS ALERTAS (STOCK APUNTO DE CADUCAR)

app.get('/api/alertas/caducidad', async ( req, res) => {
  try{
    const [rows] = await pool.query(
      `Select id, nombre, fecha_caducidad, dias_restantes, clasificacion, color_hex from
      vista_alertas_caducidad
      order by dias_restantes asc `
    );
    res.json(rows);
  }
  catch ( error){
    console.error('Error alertas caducidad: ', error.message);
    res.status(500).json({
      error: 'Error al obtener las alertas de caducidad'
    });
  }
});
// ============================================
// RUTA - BÚSQUEDA DE FÓRMULA QUÍMICA (PubChem API)
// ============================================

app.get('/api/quimica/buscar', async (req, res) => {
  try {
    const { nombre } = req.query;
    const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(nombre)}/property/MolecularFormula,IUPACName/JSON`);
    
    if (!response.ok) {
      return res.json({ formula: null, message: 'No encontrado' });
    }

    const data = await response.json();
    const compound = data.PropertyTable.Properties[0];
    
    res.json({
      formula: compound.MolecularFormula,
      iupac_name: compound.IUPACName
    });
  } catch (error) {
    res.json({ formula: null, error: error.message });
  }
});

// ============================================
// RUTA - HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// ============================================

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    message: `La ruta ${req.method} ${req.url} no existe`,
    endpoints_disponibles: 'Visita http://localhost:3001/ para ver todos los endpoints'
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

async function start() {
  await initDB();
  app.listen(serverConfig.port, () => {
    console.log(`Servidor corriendo en http://localhost:${serverConfig.port}`);
    console.log(`Documentación: http://localhost:${serverConfig.port}/`);
    console.log(`Health Check: http://localhost:${serverConfig.port}/api/health`);
  });
}

start();