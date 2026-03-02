// ============================================
// SERVICIO DE REACTIVOS - SUPABASE
// Reemplazo TOTAL del api.service anterior
// ============================================

import { supabase, SupabaseAdmin} from '../config/supabaseClient.js';

// ============================================
// CLASIFICACIONES
// ============================================

export const obtenerClasificaciones = async () => {
  const { data, error } = await supabase
    .from('clasificaciones')
    .select('*')
    .order('nombre');

  if (error) throw error;
  return data;
};

// ============================================
// REACTIVOS
// ============================================

export const registrarReactivo = async (reactivo) => {
  const { data, error } = await supabase
    .from('reactivos')
    .insert([reactivo])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const obtenerReactivos = async (filtros = {}) => {
  let query = supabase
    .from('reactivos')
    .select(`
      *,
      clasificaciones ( id, nombre )
    `);

  if (filtros.nombre?.trim()) {
    query = query.ilike('nombre', `%${filtros.nombre.trim()}%`);
  }

  if (filtros.clasificacion_id) {
    query = query.eq('clasificacion_id', filtros.clasificacion_id);
  }

  if (filtros.estado) {
    query = query.eq('estado', filtros.estado);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
export const actualizarCodigoQR = async (id, codigoQR) => {
  const { data, error } = await supabase
    .from('reactivos')
    .update({ codigo_qr: codigoQR })
    .eq('id', id);

  if (error) throw new Error(error.message);
  return data;
};
export const obtenerReactivoPorId = async (id) => {
  const { data, error } = await supabase
    .from('reactivos')
    .select(`
      *,
      clasificaciones ( id, nombre )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const obtenerReactivoPorQR = async (codigoQR) => {
  const { data, error } = await supabase
    .from('reactivos')
    .select('*')
    .eq('codigo_qr', codigoQR)
    .single();

  if (error) throw error;
  return data;
};

export const actualizarReactivo = async (id, datos) => {
  const { data, error } = await supabase
    .from('reactivos')
    .update(datos)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const actualizarCantidadReactivo = async (id, nuevaCantidad) => {
  const { data, error } = await supabase
    .from('reactivos')
    .update({ cantidad_actual: nuevaCantidad })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const eliminarReactivo = async (id) => {
  const { error } = await supabase
    .from('reactivos')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

// ============================================
// ESTADÍSTICAS
// ============================================

export const obtenerEstadisticas = async () => {
  const { data, error } = await supabase
    .rpc('estadisticas_inventario');

  if (error) throw error;
  return data;
};

// ============================================
// BÚSQUEDA
// ============================================

export const buscarPorFormula = async (formula) => {
  const { data, error } = await supabase
    .from('reactivos')
    .select('*')
    .ilike('formula_quimica', `%${formula}%`);

  if (error) throw error;
  return data;
};

// ============================================
// QR (NO SE GENERA EN SUPABASE)
// ============================================

export const descargarImagenQR = () => {
  throw new Error('La generación de QR se hace en frontend o backend externo');
};

export const descargarQRDirecto = () => {
  throw new Error('La generación de QR se hace en frontend o backend externo');
};


// =======================================
// BUSCAR POR FORMULA
// =======================================
export const buscarFormulaQuimica = async (nombre) => {
  // TRADUCIR
  let nombreIngles = nombre;
  try {
    const tradRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(nombre)}`);
    const tradJson = await tradRes.json();
    nombreIngles = tradJson[0][0][0];
    console.log(`Traducido: "${nombre}" → "${nombreIngles}"`);
  } catch {
    console.log('No se pudo traducir');
  }

  // BUSCAR EN PUBCHEM
  const searchRes = await fetch(
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(nombreIngles)}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`
  );
  if (!searchRes.ok) throw new Error('No encontrado');
  const json = await searchRes.json();
  const props = json.PropertyTable.Properties[0];
  const cid = props.CID; 

  // BUSCAR CAS NUMBER
  let cas_number = '';
  try {
    const casRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`);
    const casJson = await casRes.json();
    const sinonimos = casJson.InformationList.Information[0].Synonym;
    cas_number = sinonimos.find(s => /^\d{2,7}-\d{2}-\d$/.test(s)) || '';
  } catch {}

  // BUSCAR CLASIFICACIÓN GHS
 // BUSCAR CLASIFICACIÓN GHS
let clasificacion_codigo = null;
try {
  const ghsRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`);
  const ghsJson = await ghsRes.json();
  
  const pictogramas = [];

  const buscarPictogramas = (obj) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(buscarPictogramas);
    } else if (typeof obj === 'object') {
      
      if (obj.URL && obj.URL.includes('/ghs/GHS')) {
        const match = obj.URL.match(/GHS\d{2}/);
        if (match) pictogramas.push(match[0]);
      }
      Object.values(obj).forEach(buscarPictogramas);
    }
  };

  buscarPictogramas(ghsJson);
  console.log('Pictogramas encontrados:', pictogramas);

  const prioridad = ['GHS06', 'GHS01', 'GHS05', 'GHS02', 'GHS03', 'GHS08', 'GHS07', 'GHS04', 'GHS09'];
  clasificacion_codigo = prioridad.find(p => pictogramas.includes(p)) || pictogramas[0] || null;
  console.log('Clasificación seleccionada:', clasificacion_codigo);
} catch (e) {
  console.log('Error GHS:', e.message);
}
  
  return {
    formula: props.MolecularFormula,
    peso_molecular: props.MolecularWeight,
    cas_number,
    clasificacion_codigo 
  };
};

// OBTENER TODOS LOS PERFILES 

export const obtenerUsuarios = async () =>{
  const {data, error} = await supabase
  .from('perfiles')
  .select('*')
  .order('created_at', {ascending: false});

  if(error) throw error;
  return data;
};

// ACTUALIZAR PERFIL EXISTENTE
export const actualizarUsuario = async (id, datos) =>{
  const {data, error} = await supabase.from('perfiles')
  .update(datos)
  .eq('id', id)
  .select()
  .single();

  if(error) throw error;
  return data;
}
// CREAR USUARIO
export const crearUsuario = async ({email, password, nombre_completo, rol}) =>{

    const {data, error} = await supabase.auth.signUp({
      email, 
      password,
      options: {
        data: { nombre_completo, rol}
      }
    });

    if(error) throw error;
    return data.user;
}

// ============================================
// SALUD
// ============================================

export const verificarConexionAPI = async () => {
  const { error } = await supabase.from('reactivos').select('id').limit(1);
  return error
    ? { status: 'error', message: error.message }
    : { status: 'ok', message: 'Conectado a Supabase' };
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
  obtenerEstadisticas,
  buscarPorFormula,
  verificarConexionAPI,
  crearUsuario,
  obtenerUsuarios,
  actualizarUsuario
};