// ============================================
// SERVIDOR BACKEND - API REST
// Node.js + Express + MySQL
// ============================================

import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import mysql from 'mysql2/promise';
import { dbConfig, serverConfig } from './src/config/database.config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

const app = express();

// ============================================
// MIDDLEWARES
// ============================================

app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));

let pool;

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
// MIDDLEWARES - AUTH
// ============================================

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, 'CLAVE_SUPER_SECRETA');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function onlyAdmin(req, res, next) {
  if (req.user.rol !== 'admin')
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  next();
}

// ============================================
// RUTA RAÍZ
// ============================================

app.get('/', (req, res) => {
  res.json({ message: 'API de Inventario de Reactivos', status: 'online' });
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

    if (nombre) { sql += ' AND nombre LIKE ?'; params.push(`%${nombre}%`); }
    if (clasificacion_id) { sql += ' AND clasificacion_id = ?'; params.push(parseInt(clasificacion_id, 10)); }
    if (estado) { sql += ' AND estado = ?'; params.push(estado); }

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

    const [maxResult] = await connection.query('SELECT MAX(id) as maxId FROM reactivos');
    const nextId = (maxResult[0].maxId || 0) + 1;

    const [clasificacion] = await connection.query('SELECT codigo FROM clasificaciones WHERE id = ?', [req.body.clasificacion_id]);
    const codigoClasif = clasificacion[0]?.codigo || 'XXX';
    const year = new Date().getFullYear();
    const codigoQR = `LAB-${String(nextId).padStart(5, '0')}-${codigoClasif}-${year}`;
    const qrPath = `/qr-codes/QR_${codigoQR}.png`;

    await QRCode.toFile(`./public${qrPath}`, codigoQR, { width: 300 });

    const sql = `INSERT INTO reactivos (
      nombre, formula_quimica, clasificacion_id, cas_number, presentacion,
      cantidad_actual, unidad_medida, cantidad_minima, ubicacion, numero_frascos,
      lote, fecha_caducidad, fabricante, proveedor, precio_unitario,
      observaciones, codigo_qr, qr_imagen_path, estado, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      req.body.nombre, req.body.formula_quimica || null, req.body.clasificacion_id,
      req.body.cas_number || null, req.body.presentacion || 'líquido',
      req.body.cantidad_actual || 0, req.body.unidad_medida || 'ml',
      req.body.cantidad_minima || 0, req.body.ubicacion || null,
      req.body.numero_frascos || 1, req.body.lote || null,
      req.body.fecha_caducidad || null, req.body.fabricante || null,
      req.body.proveedor || null, req.body.precio_unitario || null,
      req.body.observaciones || null, codigoQR, qrPath, 'activo',
      req.body.created_by || 'SISTEMA'
    ];

    const [result] = await connection.query(sql, params);
    await connection.commit();

    res.json({ success: true, id: result.insertId, codigo_qr: codigoQR, qr_path: qrPath });
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
    if (rows.length === 0) return res.status(404).json({ error: 'Reactivo no encontrado' });
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
    if (rows.length === 0) return res.status(404).json({ error: 'Reactivo no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS - QR
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

app.get('/api/alertas/caducidad', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, fecha_caducidad, dias_restantes, clasificacion, color_hex FROM vista_alertas_caducidad ORDER BY dias_restantes ASC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las alertas de caducidad' });
  }
});

// ============================================
// RUTA - BÚSQUEDA QUÍMICA (PubChem)
// ============================================

app.get('/api/quimica/buscar', async (req, res) => {
  try {
    const { nombre } = req.query;
    const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(nombre)}/property/MolecularFormula,IUPACName/JSON`);
    if (!response.ok) return res.json({ formula: null, message: 'No encontrado' });
    const data = await response.json();
    const compound = data.PropertyTable.Properties[0];
    res.json({ formula: compound.MolecularFormula, iupac_name: compound.IUPACName });
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
// RUTAS - AUTH
// ============================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE username = ? AND activo = 1',
      [username]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });

    const user = rows[0];
    const passwordValida = await bcrypt.compare(password, user.password_hash);
    if (!passwordValida)
      return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      'CLAVE_SUPER_SECRETA',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, nombre_completo: user.nombre_completo, rol: user.rol }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, username, nombre_completo, rol FROM usuarios WHERE id = ?',
    [req.user.id]
  );
  res.json(rows[0]);
});

// ============================================
// RUTAS - CRUD USUARIOS (SOLO ADMIN)
// ============================================

app.get('/api/usuarios', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, nombre_completo, rol, activo, created_at FROM usuarios ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const { username, email, nombre_completo, password, rol } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'username, email y password son requeridos' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO usuarios (username, email, nombre_completo, password_hash, rol) VALUES (?, ?, ?, ?, ?)',
      [username, email, nombre_completo || '', hash, rol || 'usuario']
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'El username o email ya existe' });
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/usuarios/:id', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const { username, email, nombre_completo, rol, activo, password } = req.body;
    const { id } = req.params;

    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 12);
      await pool.query(
        'UPDATE usuarios SET username=?, email=?, nombre_completo=?, rol=?, activo=?, password_hash=? WHERE id=?',
        [username, email, nombre_completo, rol, activo, hash, id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET username=?, email=?, nombre_completo=?, rol=?, activo=? WHERE id=?',
        [username, email, nombre_completo, rol, activo, id]
      );
    }
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ error: 'El username o email ya existe' });
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/usuarios/:id', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id)
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });

    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RUTAS - LOAN REQUESTS
// ============================================

app.post('/api/loan-requests', verifyToken, async (req, res) => {
  try {
    const { user_id, practice_name, subject, group_name, schedule, practice_date, materials } = req.body;

    const [result] = await pool.query(
      `INSERT INTO loan_requests (user_id, practice_name, subject, group_name, schedule, practice_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
      [user_id, practice_name, subject, group_name, schedule, practice_date]
    );

    const requestId = result.insertId;

    if (Array.isArray(materials)) {
      for (const mat of materials) {
        await pool.query(
          `INSERT INTO loan_request_materials (loan_request_id, cantidad, unidad, material_name, observaciones)
           VALUES (?, ?, ?, ?, ?)`,
          [requestId, mat.cantidad, mat.unidad, mat.material_name, mat.observaciones || null]
        );
      }
    }

    res.json({ message: 'Solicitud creada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET loan-requests — incluye materiales de cada solicitud
app.get('/api/loan-requests', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.query;
    let sql = `SELECT lr.*, u.nombre_completo AS user_nombre_completo
               FROM loan_requests lr
               INNER JOIN usuarios u ON lr.user_id = u.id`;
    const params = [];
    if (user_id) { sql += ' WHERE lr.user_id = ?'; params.push(user_id); }
    sql += ' ORDER BY lr.id DESC';

    const [rows] = await pool.query(sql, params);

    for (const row of rows) {
      const [mats] = await pool.query(
        'SELECT * FROM loan_request_materials WHERE loan_request_id = ?',
        [row.id]
      );
      row.materials = mats;
    }

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH estado — solo admin
app.patch('/api/loan-requests/:id/status', verifyToken, onlyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['pendiente', 'aprobado', 'rechazado'].includes(status))
      return res.status(400).json({ error: 'Estado inválido' });

    const [result] = await pool.query(
      'UPDATE loan_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Solicitud no encontrada' });

    res.json({ success: true, message: 'Estado actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET materiales de una solicitud
app.get('/api/loan-requests/:id/materials', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM loan_request_materials WHERE loan_request_id = ?',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST agregar material a solicitud
app.post('/api/loan-request-materials', async (req, res) => {
  try {
    const { loan_request_id, cantidad, unidad, material_name, observaciones } = req.body;
    const [result] = await pool.query(
      `INSERT INTO loan_request_materials (loan_request_id, cantidad, unidad, material_name, observaciones)
       VALUES (?, ?, ?, ?, ?)`,
      [loan_request_id, cantidad, unidad, material_name, observaciones]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GENERAR PDF DE SOLICITUD
// ============================================

app.get('/api/loan-requests/:id/pdf', verifyToken, async (req, res) => {
  try {
    const requestId = req.params.id;

    const [requests] = await pool.query(
      'SELECT lr.*, u.nombre_completo FROM loan_requests lr INNER JOIN usuarios u ON lr.user_id = u.id WHERE lr.id = ?',
      [requestId]
    );
    if (!requests.length) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const request = requests[0];
    const [materials] = await pool.query(
      'SELECT * FROM loan_request_materials WHERE loan_request_id = ?',
      [requestId]
    );

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=vale_${requestId}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).text('VALE DE PRÉSTAMO', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Folio: ${request.id}`);
    doc.text(`Usuario: ${request.nombre_completo}`);
    doc.text(`Práctica: ${request.practice_name}`);
    doc.text(`Materia: ${request.subject}`);
    doc.text(`Grupo: ${request.group_name}`);
    doc.text(`Fecha práctica: ${request.practice_date}`);
    doc.text(`Estado: ${request.status}`);
    doc.moveDown();
    doc.text('Materiales:', { underline: true });
    doc.moveDown();
    materials.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.material_name} - ${item.cantidad} ${item.unidad}`);
    });
    doc.moveDown();
    const qrBuffer = await QRCode.toBuffer(`FOLIO-${request.id}`);
    doc.image(qrBuffer, { fit: [100, 100] });
    doc.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 404
// ============================================

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

async function start() {
  await initDB();
  app.listen(serverConfig.port, () => {
    console.log(`Servidor corriendo en http://localhost:${serverConfig.port}`);
  });
}

start();