import { supabase } from "../config/supabaseClient.js";

// ==============================
// CLASIFICACIONES
// ==============================

export const getClasificaciones = async () => {
  const { data, error } = await supabase
    .from('clasificaciones')
    .select('id, nombre, codigo, color_hex, nivel_peligro,descripcion,icono')
    .order('nombre');
  if (error) throw error;
  return data;
};

// ====================================
// REACTIVOS
// ====================================

export const insertReactivo = async (reactivo, userId) => {
  const { data, error } = await supabase
    .from('reactivos')
    .insert({
      ...reactivo,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ===================================
// OBTENER REACTIVOS
// ===================================

export const getReactivos = async (filtros = {}) => {
  let query = supabase
    .from('vista_reactivos_completa')
    .select('*')
    .order('nombre');

  if (filtros.nombre)
    query = query.ilike('nombre', `%${filtros.nombre}%`);

  if (filtros.clasificacion_id)
    query = query.eq('clasificacion_id', filtros.clasificacion_id);

  if (filtros.estado)
    query = query.eq('estado', filtros.estado);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// =============================================
// OBTENER REACTIVO POR QR
// ==========================================

export const getReactivoByQR = async (codigoQR) => {
  const { data, error } = await supabase
    .from('vista_reactivos_completa')
    .select('*')
    .eq('codigo_qr', codigoQR)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// ==============================================
// OBTENER REACTIVO POR ID
// =============================================

export const getReactivosById = async (id) => {
  const { data, error } = supabase
    .from('vista_reactivos_completa')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// =================================================
// VER SI EXISTE EL CÓDIGO QR
// =================================================

export const existeCodigoQR = async (codigoQR) => {
  const { count, error } = await supabase
    .from('reactivos')
    .select('*', { count: 'exact', head: true })
    .eq('codigo_qr', codigoQR);

  if (error) throw error;
  return count > 0;
};

// =====================================
// ACTUALIZAR LA CANTIDAD DE REACTIVOS
// ====================================

export const updateCantidadReactivo = async (
  id, cantidad, motivo, responsable
) => {
  const { error } = await supabase.rpc('registrar_movimiento', {
    p_reactivo_id: id,
    p_tipo_movimiento: 'ajuste',
    p_cantidad: cantidad,
    p_motivo: motivo,
    p_responsable: responsable
  });

  if (error) throw error;
  return { success: true };
};

// =======================================
// OBTENER ESTADISTICAS
// ======================================

export const getEstadisticas = async () => {
  const { data: porClasificacion } = await
    supabase.from('vista_estadisticas').select('*');

  const { count: totalReactivos } =
    await supabase.from('reactivos').select('*',
      { count: 'exact', head: true }
    );

  const { count: alertasStockBajo } =
    await supabase
      .from('reactivos')
      .select('*', { count: 'exact', head: true })
      .lte('cantidad_actual', 'cantidad_minima');

  const { count: proximosACaducar } =
    await supabase
      .from('vista_alertas_caducidad')
      .select('*', { count: 'exact', head: true });

  return {
    porClasificacion,
    totalReactivos,
    alertasStockBajo,
    proximosACaducar
  };
};

