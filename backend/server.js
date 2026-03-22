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
import { parse } from 'dotenv';

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

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user)
    return res.status(401).json({ error: 'Token invalido' });
  req.user = data.user;
  next();
  // try {
  //   req.user = jwt.verify(token, 'CLAVE_SUPER_SECRETA');
  //   next();
  // } catch {
  //   return res.status(401).json({ error: 'Token inválido' });
  // }
}

async function onlyAdmin(req, res, next) {
  const { data: perfil, error } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', req.user.id)
    .single();

  if (error || !perfil)
    return res.status(403).json({ error: "Perfil no encontrado" });

  if (perfil.rol !== 'admin')
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

  if (password !== user.password) 
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

//CAMBIAR ESTADO DE SOLICITUD
app.put('/api/solicitudes/:id/status', verifyToken, onlyAdmin, async (req, res) => {
  const { status } = req.body;
  const solicitudId = parseInt(req.params.id);

  try {
    const { data: solicitud, error } = await supabase
      .from('loan_requests')
      .select('*')
      .eq('id', solicitudId)
      .single();

    if (error || !solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (status === 'aprobado') {
      for (const mat of solicitud.materials) {
        const nombre = mat.material_name;
        const cantidadSolicitada = parseFloat(mat.cantidad);
        const tipo = mat.tipo || 'material'; // sin tipo → asume material

        if (tipo === 'reactivo') {
          const { data: reactivo, error: reactivoError } = await supabase
            .from('reactivos')
            .select('*')
            .ilike('nombre', nombre)
            .single();

          if (reactivoError || !reactivo)
            return res.status(400).json({ error: `Reactivo no encontrado: ${nombre}` });

          const nuevosFrascos = reactivo.numero_frascos - cantidadSolicitada;
          if (nuevosFrascos < 0)
            return res.status(400).json({ error: `Stock insuficiente para ${nombre}` });

          await supabase
            .from('reactivos')
            .update({ numero_frascos: nuevosFrascos })
            .eq('id', reactivo.id);

        } else {
          const { data: material, error: matError } = await supabase
            .from('Materiales')
            .select('*')
            .ilike('nombre', nombre)
            .single();

          if (matError || !material)
            return res.status(400).json({ error: `Material no encontrado: ${nombre}` });

          const nuevaCantidad = material.cantidad - cantidadSolicitada;
          if (nuevaCantidad < 0)
            return res.status(400).json({ error: `Stock insuficiente para ${nombre}` });

          await supabase
            .from('Materiales')
            .update({ cantidad: nuevaCantidad })
            .eq('id', material.id);
        }
      }
    }

    const { error: updateError } = await supabase
      .from('loan_requests')
      .update({ status })
      .eq('id', solicitudId);

    if (updateError) throw updateError;
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//Devolucion de materiales y reactivos
app.put('/api/solicitudes/:id/devolver', verifyToken, onlyAdmin, async (req, res) => {
  const solicitudId = parseInt(req.params.id);
  const { devoluciones } = req.body;

  try {
    const { data: solicitud, error: solError } = await supabase
      .from('loan_requests')
      .select('*')
      .eq('id', solicitudId)
      .single();
    if (solError || !solicitud) return res.status(400).json({ error: 'Solicitud no encontrada' });
    if (solicitud.status !== 'aprobado') {
      return res.status(400).json({ error: 'Solo se pueden devolver solicitudes que esten aprobadas.' });
    }
    for (const dev of devoluciones) {
      const idBuscado = dev.material_id;
      const tipo = dev.tipo || 'reactivo';

      if (tipo === 'reactivo') {
        const { data: reactivo, error: errorR } = await supabase
          .from('reactivos')
          .select('*')
          .eq('id', idBuscado)
          .single();

        if (errorR || !reactivo) throw new Error(`Reactivo no encontrado en BD`);
        const frascosDevueltos = parseInt(dev.frascos_devueltos) || 0;
        const cantidadConsumida = parseFloat(dev.cantidad_consumida) || 0;
        const nuevosFrascos = reactivo.numero_frascos + frascosDevueltos;
        let nuevaCantidad = reactivo.cantidad_actual - cantidadConsumida;

        if (nuevaCantidad < 0) nuevaCantidad = 0;
        await supabase
          .from('reactivos')
          .update({
            numero_frascos: nuevosFrascos,
            cantidad_actual: nuevaCantidad
          })
          .eq('id', reactivo.id);
      } else if (tipo === 'material') {
        const { data: material, error: errorM } = await supabase
          .from('Materiales')
          .select('*')
          .eq('id', idBuscado)
          .single();
        if (errorM || !material) throw new Error(`Material no encontrado en BD`);
        const piezasDevueltas = parseInt(dev.piezas_devueltas) || 0;
        const nuevaCantidad = material.cantidad + piezasDevueltas;

        await supabase
          .from('Materiales')
          .update({ cantidad: nuevaCantidad })
          .eq('id', material.id);
      }
    }
    const { error: updateError } = await supabase
      .from('loan_requests')
      .update({ status: 'finalizado' })
      .eq('id', solicitudId);

    if (updateError) throw updateError;
    res.json({ sucess: true, message: 'Devolucion registrada y stock actualizado correctamente' });
  } catch (err) {
    console.error('Error en devolucion:', err);
    res.status(500).json({ error: err.message });
  }
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