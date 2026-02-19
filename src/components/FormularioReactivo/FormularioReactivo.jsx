// ============================================
// COMPONENTE: FORMULARIO DE ALTA DE REACTIVOS
// Formulario completo con generación de QR y validaciones
// ============================================

import React, { useState, useEffect } from 'react';
import {
  obtenerClasificaciones,
  registrarReactivo,
  buscarFormulaQuimica
} from '../../services/api.service';
import { generarCodigoQR } from '../../utils/qrCodeUtils';
import { QRCodeSVG } from 'qrcode.react';
import './FormularioReactivo.css';

/**
 * Componente principal del formulario de alta de reactivos
 */
const FormularioReactivo = () => {
  // ============================================
  // ESTADOS DEL COMPONENTE
  // ============================================

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    clasificacion_id: '',
    formula_quimica: '',
    cas_number: '',
    presentacion: 'líquido',
    cantidad_actual: 0,
    unidad_medida: 'ml',
    cantidad_minima: 0,
    ubicacion: '',
    numero_frascos: 1,
    lote: '',
    fecha_caducidad: '',
    fabricante: '',
    proveedor: '',
    observaciones: ''
  });

  // Estado para las clasificaciones disponibles
  const [clasificaciones, setClasificaciones] = useState([]);

  // Estado para la clasificación seleccionada (con información completa)
  const [clasificacionSeleccionada, setClasificacionSeleccionada] = useState(null);

  // Estado del código QR generado
  const [codigoQR, setCodigoQR] = useState('');

  // Estados de UI
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mostrarQR, setMostrarQR] = useState(false);
  const [buscandoFormula, setBuscandoFormula] = useState(false);

  // ============================================
  // EFECTOS
  // ============================================

  /**
   * Efecto para cargar las clasificaciones al montar el componente
   */
  useEffect(() => {
    cargarClasificaciones();
  }, []);

  /**
   * Efecto para actualizar la clasificación seleccionada cuando cambia el ID
   */
  useEffect(() => {
    if (formData.clasificacion_id) {
      const clasificacion = clasificaciones.find(
        c => c.id === parseInt(formData.clasificacion_id)
      );
      setClasificacionSeleccionada(clasificacion);
    } else {
      setClasificacionSeleccionada(null);
    }
  }, [formData.clasificacion_id, clasificaciones]);

  // ============================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================

  /**
   * Carga las clasificaciones disponibles desde la API
   */
  const cargarClasificaciones = async () => {
    try {
      const data = await obtenerClasificaciones();
      setClasificaciones(data);
      console.log('Clasificaciones cargadas:', data); // Para debug
    } catch (error) {
      mostrarMensaje('error', 'Error al cargar clasificaciones: ' + error.message);
      console.error('Error cargando clasificaciones:', error);
    }
  };

  // ============================================
  // MANEJADORES DE EVENTOS
  // ============================================

  /**
   * Maneja los cambios en los campos del formulario
   * @param {Event} e - Evento del input
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Busca la fórmula química del reactivo usando API externa
   */
  const buscarFormula = async () => {
    if (!formData.nombre.trim()) {
      mostrarMensaje('warning', 'Ingresa el nombre del reactivo primero');
      return;
    }

    setBuscandoFormula(true);
    try {
      const resultado = await buscarFormulaQuimica(formData.nombre);

      if (resultado.formula) {
        setFormData(prev => ({
          ...prev,
          formula_quimica: resultado.formula,
          cas_number: resultado.cas_number || prev.cas_number
        }));
        mostrarMensaje('success', '¡Fórmula encontrada!');
      } else {
        mostrarMensaje('info', 'No se encontró la fórmula. Puedes ingresarla manualmente.');
      }
    } catch (error) {
      mostrarMensaje('warning', 'No se pudo buscar la fórmula automáticamente');
    } finally {
      setBuscandoFormula(false);
    }
  };

  /**
   * Valida los campos requeridos del formulario
   * @returns {boolean} true si es válido, false si no
   */
  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      mostrarMensaje('error', 'El nombre del reactivo es obligatorio');
      return false;
    }
    if (formData.cantidad_actual <= 0) {
      mostrarMensaje('error', 'La cantidad actual debe ser mayor a 0');
      return false;
    }


    if (!formData.clasificacion_id) {
      mostrarMensaje('error', 'Debes seleccionar una clasificación');
      return false;
    }

    return true;
  };

  /**
   * Genera un código QR temporal para previsualización
   */
  const generarVistaPrevia = () => {
    if (!validarFormulario()) return;

    // Generar un código temporal (el ID real se asignará al guardar)
    const idTemporal = Date.now() % 100000; // ID temporal basado en timestamp
    const codigoClasificacion = clasificacionSeleccionada?.codigo || 'XXX';
    const codigoGenerado = generarCodigoQR(idTemporal, codigoClasificacion);

    setCodigoQR(codigoGenerado);
    setMostrarQR(true);
  };

  /**
   * Maneja el envío del formulario
   * @param {Event} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      // Preparar datos para enviar
      const reactivo = {
        ...formData,
        cantidad_actual: parseFloat(formData.cantidad_actual) || 0,
        cantidad_minima: parseFloat(formData.cantidad_minima) || 0,
        numero_frascos: parseInt(formData.numero_frascos) || 1,
        clasificacion_id: parseInt(formData.clasificacion_id)
      };

      // Registrar el reactivo
      const resultado = await registrarReactivo(reactivo);

      // Generar código QR con el ID real
      const codigoClasificacion = clasificacionSeleccionada?.codigo || 'XXX';
      const codigoGenerado = generarCodigoQR(resultado.id, codigoClasificacion);
      setCodigoQR(codigoGenerado);

      mostrarMensaje('success', '¡Reactivo registrado exitosamente!');
      setMostrarQR(true);

      // Limpiar formulario después de 3 segundos
      setTimeout(() => {
        limpiarFormulario();
      }, 3000);

    } catch (error) {
      mostrarMensaje('error', 'Error al registrar reactivo: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Limpia el formulario y resetea todos los estados
   */
  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      clasificacion_id: '',
      formula_quimica: '',
      cas_number: '',
      presentacion: 'líquido',
      cantidad_actual: 0,
      unidad_medida: 'ml',
      cantidad_minima: 0,
      ubicacion: '',
      numero_frascos: 1,
      lote: '',
      fecha_caducidad: '',
      fabricante: '',
      proveedor: '',
      observaciones: ''
    });
    setCodigoQR('');
    setMostrarQR(false);
    setMensaje({ tipo: '', texto: '' });
  };

  /**
   * Copia el código QR al portapapeles
   */
  const copiarCodigoQR = () => {
    navigator.clipboard.writeText(codigoQR)
      .then(() => {
        mostrarMensaje('success', '¡Código copiado al portapapeles!');
      })
      .catch(() => {
        mostrarMensaje('error', 'No se pudo copiar el código');
      });
  };

  /**
   * Descarga la imagen QR como PNG
   */
  const descargarQR = () => {
    const svg = document.getElementById('qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_${formData.nombre.replace(/\s+/g, '_')}_${codigoQR}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  /**
   * Muestra un mensaje temporal en la UI
   * @param {string} tipo - Tipo de mensaje (success, error, warning, info)
   * @param {string} texto - Texto del mensaje
   */
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 5000);
  };

  // ============================================
  // RENDER DEL COMPONENTE
  // ============================================

  return (
    <div className="formulario-reactivo-container">
      <div className="formulario-reactivo-card">
        {/* Encabezado */}
        <div className="formulario-header">
          <h1>Alta de Reactivo Químico</h1>
          <p>Registra un nuevo reactivo en el inventario del laboratorio</p>
        </div>

        {/* Mensajes de feedback */}
        {mensaje.texto && (
          <div className={`mensaje mensaje-${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="formulario-reactivo">

          {/* Sección: Información Básica */}
          <div className="seccion-formulario">
            <h2>Información Básica</h2>

            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="nombre">
                  Nombre del Reactivo <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Ácido Sulfúrico, Cloruro de Sodio"
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="clasificacion_id">
                  Clasificación <span className="required">*</span>
                </label>
                <select
                  id="clasificacion_id"
                  name="clasificacion_id"
                  value={formData.clasificacion_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona una clasificación</option>
                  {clasificaciones.map(clasificacion => (
                    <option key={clasificacion.id} value={clasificacion.id}>
                      {clasificacion.nombre} ({clasificacion.codigo})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Indicador visual de clasificación */}
            {clasificacionSeleccionada && (
              <div
                className="clasificacion-badge"
                style={{
                  backgroundColor: clasificacionSeleccionada.color_hex + '20',
                  borderLeft: `4px solid ${clasificacionSeleccionada.color_hex}`
                }}
              >
                <span className="badge-icon"></span>
                <div className="badge-content">
                  <strong>{clasificacionSeleccionada.nombre}</strong>
                  <p>{clasificacionSeleccionada.descripcion}</p>
                  <span className={`nivel-peligro nivel-${clasificacionSeleccionada.nivel_peligro}`}>
                    Nivel de peligro: {clasificacionSeleccionada.nivel_peligro.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="formula_quimica">Fórmula Química</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    id="formula_quimica"
                    name="formula_quimica"
                    value={formData.formula_quimica}
                    onChange={handleChange}
                    placeholder="Ej: H₂SO₄, NaCl, C₆H₁₂O₆"
                  />
                  <button
                    type="button"
                    onClick={buscarFormula}
                    disabled={buscandoFormula}
                    className="btn-buscar"
                  >
                    {buscandoFormula ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
                <small>Puedes buscarla automáticamente o ingresarla manualmente</small>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="cas_number">Número CAS</label>
                <input
                  type="text"
                  id="cas_number"
                  name="cas_number"
                  value={formData.cas_number}
                  onChange={handleChange}
                  placeholder="Ej: 7664-93-9"
                />
              </div>
            </div>
          </div>

          {/* Sección: Presentación y Cantidad */}
          <div className="seccion-formulario">
            <h2>Presentación y Cantidad</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="presentacion">Presentación</label>
                <select
                  id="presentacion"
                  name="presentacion"
                  value={formData.presentacion}
                  onChange={handleChange}
                >
                  <option value="líquido">Líquido</option>
                  <option value="sólido">Sólido (polvo/cristales)</option>
                  <option value="solución">Solución</option>
                  <option value="gas">Gas</option>
                  <option value="suspensión">Suspensión</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="unidad_medida">Unidad de Medida</label>
                <select
                  id="unidad_medida"
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleChange}
                >
                  <option value="ml">ml (mililitros)</option>
                  <option value="L">L (litros)</option>
                  <option value="g">g (gramos)</option>
                  <option value="kg">kg (kilogramos)</option>
                  <option value="mg">mg (miligramos)</option>
                  <option value="unidades">Unidades</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="cantidad_actual">
                  Cantidad actual <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="cantidad_actual"
                  name="cantidad_actual"
                  value={formData.cantidad_actual}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Ej: 500"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="numero_frascos">Número de Frascos/Contenedores</label>
                <input
                  type="number"
                  id="numero_frascos"
                  name="numero_frascos"
                  value={formData.numero_frascos}
                  onChange={handleChange}
                  min="1"
                />
              </div>

              <div className="form-group flex-2">
                <label htmlFor="ubicacion">Ubicación en Laboratorio</label>
                <input
                  type="text"
                  id="ubicacion"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  placeholder="Ej: Estante A3, Refrigerador 2"
                />
              </div>
            </div>
          </div>

          {/* Sección: Información Adicional (Opcional) */}
          <div className="seccion-formulario seccion-opcional">
            <h2>
              Información Adicional (Opcional)
              <span className="badge-opcional">Opcional</span>
            </h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lote">Número de Lote</label>
                <input
                  type="text"
                  id="lote"
                  name="lote"
                  value={formData.lote}
                  onChange={handleChange}
                  placeholder="Ej: L2024-001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fecha_caducidad">Fecha de Caducidad</label>
                <input
                  type="date"
                  id="fecha_caducidad"
                  name="fecha_caducidad"
                  value={formData.fecha_caducidad}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fabricante">Fabricante</label>
                <input
                  type="text"
                  id="fabricante"
                  name="fabricante"
                  value={formData.fabricante}
                  onChange={handleChange}
                  placeholder="Ej: Merck, Sigma-Aldrich"
                />
              </div>

              <div className="form-group">
                <label htmlFor="proveedor">Proveedor</label>
                <input
                  type="text"
                  id="proveedor"
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleChange}
                  placeholder="Ej: Distribuidora Química SA"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="3"
                placeholder="Notas adicionales, precauciones especiales, etc."
              ></textarea>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="botones-formulario">
            <button
              type="button"
              onClick={generarVistaPrevia}
              className="btn btn-secondary"
              disabled={cargando}
            >
              Vista Previa del QR
            </button>

            <button
              type="button"
              onClick={limpiarFormulario}
              className="btn btn-outline"
              disabled={cargando}
            >
              Limpiar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={cargando}
            >
              {cargando ? 'Guardando...' : 'Registrar Reactivo'}
            </button>
          </div>
        </form>

        {/* Sección de código QR */}
        {mostrarQR && codigoQR && (
          <div className="seccion-qr">
            <h2>Código QR Generado</h2>

            <div className="qr-display">
              <div className="qr-code-wrapper">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={codigoQR}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="qr-info">
                <h3>Código del Reactivo</h3>
                <div className="codigo-texto">
                  <code>{codigoQR}</code>
                  <button
                    type="button"
                    onClick={copiarCodigoQR}
                    className="btn-icon"
                    title="Copiar código"
                  >

                  </button>
                </div>

                <div className="qr-acciones">
                  <button
                    type="button"
                    onClick={descargarQR}
                    className="btn btn-primary"
                  >
                    Descargar QR
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-outline"
                  >
                    Imprimir
                  </button>
                </div>

                <p className="qr-descripcion">
                  Este código QR identifica únicamente a este reactivo en el sistema.
                  Puedes imprimirlo y pegarlo en el frasco para un acceso rápido.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormularioReactivo;