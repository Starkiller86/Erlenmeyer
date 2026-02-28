// ============================================
// SERVIDOR BACKEND - API REST
// Node.js + Express + Supabase
// ============================================

import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';
import { supabase } from './config/database.config.js';

const app = express();

// ============================================
// MIDDLEWARES
// ============================================

app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(express.static('public'));

// ============================================
// AUTH MIDDLEWARES
// ============================================

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, 'CLAVE_SUPER_SECRETA');
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function onlyAdmin(req, res, next) {
  if (req.user.rol !== 'admin')
    return res.status(403).json({ error: 'Solo administradores' });
  next();
}

// ============================================
// RUTA RAÍZ
// ============================================

app.get('/', (req, res) => {
  res.json({ status: 'online', api: 'Inventario Reactivos' });
});

// ============================================
// CLASIFICACIONES
// ============================================

app.get('/api/clasificaciones', async (req, res) => {
  const { data, error } = await supabase
    .from('clasificaciones')
    .select('*')
    .order('nombre');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ============================================
// REACTIVOS (TODOS PUEDEN INSERTAR)
// ============================================

app.get('/api/reactivos', async (req, res) => {
  const { nombre, clasificacion_id, estado } = req.query;

  let query = supabase.from('reactivos').select('*');

  if (nombre) query = query.ilike('nombre', `%${nombre}%`);
  if (clasificacion_id) query = query.eq('clasificacion_id', clasificacion_id);
  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query.order('nombre');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/reactivos', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const codigoQR = `LAB-${Date.now()}-${year}`;
    const qrPath = `/qr-codes/QR_${codigoQR}.png`;

    await QRCode.toFile(`./public${qrPath}`, codigoQR);

    const { data, error } = await supabase
      .from('reactivos')
      .insert([{
        ...req.body,
        codigo_qr: codigoQR,
        qr_imagen_path: qrPath,
        estado: 'activo'
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, reactivo: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reactivos/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('reactivos')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'No encontrado' });
  res.json(data);
});

// ============================================
// QR
// ============================================

app.get('/api/qr/generar/:codigo', async (req, res) => {
  const buffer = await QRCode.toBuffer(req.params.codigo);
  res.set('Content-Type', 'image/png');
  res.send(buffer);
});

// ============================================
// AUTH
// ============================================

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('username', username)
    .eq('activo', true)
    .single();

  if (error || !user)
    return res.status(401).json({ error: 'Usuario no válido' });

  if (password !== user.password) // ⚠️ aquí puedes meter bcrypt después
    return res.status(401).json({ error: 'Contraseña incorrecta' });

  const token = jwt.sign(
    { id: user.id, rol: user.rol },
    'CLAVE_SUPER_SECRETA',
    { expiresIn: '8h' }
  );

  res.json({ token, user });
});

// ============================================
// USUARIOS (SOLO ADMIN)
// ============================================

app.get('/api/usuarios', verifyToken, onlyAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, username, email, nombre_completo, rol, activo');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ALERTAS
// ============================================
// ALERTAS
// ============================================

app.get('/api/alertas/caducidad', async (req, res) => {
  const { data, error } = await supabase
    .from('vista_alertas_caducidad')
    .select('*');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});


// ============================================
// HEALTH
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});