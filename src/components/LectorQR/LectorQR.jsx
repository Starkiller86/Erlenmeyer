// ============================================
// COMPONENTE: LECTOR DE CÓDIGOS QR
// Escanea códigos QR usando la cámara del dispositivo
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { obtenerReactivoPorQR } from '../../services/api.service';
import { decodificarCodigoQR, validarFormatoQR } from '../../utils/qrCodeUtils';
import './LectorQR.css';

/**
 * Componente para escanear códigos QR y buscar reactivos
 */
const LectorQR = () => {
  // ============================================
  // ESTADOS DEL COMPONENTE
  // ============================================
  
  // Estado del escáner
  const [escaneando, setEscaneando] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  
  // Estado de la búsqueda
  const [codigoEscaneado, setCodigoEscaneado] = useState('');
  const [reactivo, setReactivo] = useState(null);
  const [buscando, setBuscando] = useState(false);
  
  // Estado de mensajes
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Estado de cámaras disponibles
  const [camarasDisponibles, setCamarasDisponibles] = useState([]);
  const [camaraSeleccionada, setCamaraSeleccionada] = useState('');
  
  // Referencias
  const html5QrCodeRef = useRef(null);
  const scannerContainerRef = useRef(null);
  
  // ============================================
  // EFECTOS
  // ============================================
  
  /**
   * Efecto para obtener las cámaras disponibles al montar el componente
   */
  useEffect(() => {
    obtenerCamarasDisponibles();
    
    // Cleanup al desmontar el componente
    return () => {
      detenerEscaner();
    };
  }, []);
  
  /**
   * Efecto para buscar reactivo cuando se escanea un código
   */
  useEffect(() => {
    if (codigoEscaneado && validarFormatoQR(codigoEscaneado)) {
      buscarReactivo(codigoEscaneado);
    }
  }, [codigoEscaneado]);
  
  // ============================================
  // FUNCIONES DE CÁMARA
  // ============================================
  
  /**
   * Obtiene la lista de cámaras disponibles en el dispositivo
   */
  const obtenerCamarasDisponibles = async () => {
    try {
      const camaras = await Html5Qrcode.getCameras();
      
      if (camaras && camaras.length > 0) {
        setCamarasDisponibles(camaras);
        // Seleccionar la cámara trasera por defecto si está disponible
        const camaraTrasera = camaras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('trasera')
        );
        setCamaraSeleccionada(camaraTrasera?.id || camaras[0].id);
      } else {
        mostrarMensaje('warning', 'No se detectaron cámaras en este dispositivo');
      }
    } catch (error) {
      console.error('Error al obtener cámaras:', error);
      mostrarMensaje('error', 'No se pudo acceder a las cámaras del dispositivo');
    }
  };
  
  // ============================================
  // FUNCIONES DE ESCANEO
  // ============================================
  
  /**
   * Inicia el escáner de códigos QR
   */
  const iniciarEscaner = async () => {
    if (!camaraSeleccionada) {
      mostrarMensaje('error', 'No hay cámara disponible');
      return;
    }
    
    try {
      setEscaneando(true);
      setMensaje({ tipo: '', texto: '' });
      setReactivo(null);
      
      // Crear instancia del escáner si no existe
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }
      
      // Configuración del escáner
      const config = {
        fps: 10, // Cuadros por segundo
        qrbox: { width: 250, height: 250 }, // Área de escaneo
        aspectRatio: 1.0 // Relación de aspecto
      };
      
      // Iniciar el escáner
      await html5QrCodeRef.current.start(
        camaraSeleccionada,
        config,
        onScanSuccess,
        onScanError
      );
      
      setCamaraActiva(true);
      mostrarMensaje('info', 'Escanea el código QR del reactivo');
      
    } catch (error) {
      console.error('Error al iniciar escáner:', error);
      mostrarMensaje('error', 'No se pudo iniciar la cámara. Verifica los permisos.');
      setEscaneando(false);
    }
  };
  
  /**
   * Detiene el escáner de códigos QR
   */
  const detenerEscaner = async () => {
    if (html5QrCodeRef.current && camaraActiva) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        setCamaraActiva(false);
        setEscaneando(false);
        mostrarMensaje('info', 'Escáner detenido');
      } catch (error) {
        console.error('Error al detener escáner:', error);
      }
    }
  };
  
  /**
   * Callback cuando se escanea exitosamente un código QR
   * @param {string} decodedText - Texto decodificado del QR
   */
  const onScanSuccess = (decodedText) => {
    // Solo procesar si es un código válido y diferente al anterior
    if (decodedText !== codigoEscaneado && validarFormatoQR(decodedText)) {
      setCodigoEscaneado(decodedText);
      detenerEscaner(); // Detener escáner después de leer correctamente
      
      // Vibración de feedback (si está disponible)
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  };
  
  /**
   * Callback cuando hay un error en el escaneo
   * @param {string} errorMessage - Mensaje de error
   */
  const onScanError = (errorMessage) => {
    // Ignorar errores comunes de escaneo (no encontrado, etc.)
    // Solo mostrar errores críticos
    if (!errorMessage.includes('No MultiFormat Readers') && 
        !errorMessage.includes('NotFoundException')) {
      console.warn('Error de escaneo:', errorMessage);
    }
  };
  
  // ============================================
  // FUNCIONES DE BÚSQUEDA
  // ============================================
  
  /**
   * Busca un reactivo por su código QR
   * @param {string} codigo - Código QR a buscar
   */
  const buscarReactivo = async (codigo) => {
    setBuscando(true);
    setReactivo(null);
    
    try {
      const data = await obtenerReactivoPorQR(codigo);
      
      if (data) {
        setReactivo(data);
        mostrarMensaje('success', '¡Reactivo encontrado!');
      } else {
        mostrarMensaje('warning', 'No se encontró ningún reactivo con este código');
      }
    } catch (error) {
      console.error('Error al buscar reactivo:', error);
      mostrarMensaje('error', 'Error al buscar el reactivo: ' + error.message);
    } finally {
      setBuscando(false);
    }
  };
  
  /**
   * Búsqueda manual por código QR
   */
  const buscarManualmente = () => {
    const codigo = prompt('Ingresa el código QR del reactivo:');
    
    if (codigo) {
      if (validarFormatoQR(codigo)) {
        setCodigoEscaneado(codigo);
        buscarReactivo(codigo);
      } else {
        mostrarMensaje('error', 'El código ingresado no es válido. Formato: LAB-XXXXX-XXX-YYYY');
      }
    }
  };
  
  /**
   * Reinicia el lector para escanear otro código
   */
  const escanearOtro = () => {
    setCodigoEscaneado('');
    setReactivo(null);
    setMensaje({ tipo: '', texto: '' });
    iniciarEscaner();
  };
  
  // ============================================
  // UTILIDADES
  // ============================================
  
  /**
   * Muestra un mensaje temporal en la UI
   * @param {string} tipo - Tipo de mensaje (success, error, warning, info)
   * @param {string} texto - Texto del mensaje
   */
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      if (tipo !== 'info' || !camaraActiva) {
        setMensaje({ tipo: '', texto: '' });
      }
    }, 5000);
  };
  
  /**
   * Obtiene el ícono emoji según el nivel de peligro
   * @param {string} nivel - Nivel de peligro
   * @returns {string} Emoji correspondiente
   */
  const obtenerIconoPeligro = (nivel) => {
    const iconos = {
      'bajo': '✅',
      'medio': '⚠️',
      'alto': '🔶',
      'muy_alto': '☢️'
    };
    return iconos[nivel] || '⚠️';
  };
  
  // ============================================
  // RENDER DEL COMPONENTE
  // ============================================
  
  return (
    <div className="lector-qr-container">
      <div className="lector-qr-card">
        
        {/* Encabezado */}
        <div className="lector-header">
          <h1>Lector de Códigos QR</h1>
          <p>Escanea el código QR de un reactivo para ver su información</p>
        </div>
        
        {/* Mensajes */}
        {mensaje.texto && (
          <div className={`mensaje mensaje-${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}
        
        {/* Selector de cámara */}
        {camarasDisponibles.length > 1 && !camaraActiva && (
          <div className="selector-camara">
            <label htmlFor="camara-select">Seleccionar cámara:</label>
            <select
              id="camara-select"
              value={camaraSeleccionada}
              onChange={(e) => setCamaraSeleccionada(e.target.value)}
            >
              {camarasDisponibles.map(camara => (
                <option key={camara.id} value={camara.id}>
                  {camara.label || `Cámara ${camara.id}`}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Área del escáner */}
        <div className="scanner-section">
          <div 
            id="qr-reader" 
            ref={scannerContainerRef}
            className={`qr-reader ${camaraActiva ? 'activo' : ''}`}
          ></div>
          
          {!camaraActiva && !reactivo && (
            <div className="scanner-placeholder">
              <div className="scanner-icon">📱</div>
              <p>Presiona "Iniciar Escáner" para comenzar a escanear códigos QR</p>
            </div>
          )}
        </div>
        
        {/* Botones de control */}
        <div className="botones-control">
          {!camaraActiva && !reactivo && (
            <button
              onClick={iniciarEscaner}
              disabled={escaneando || !camaraSeleccionada}
              className="btn btn-primary btn-large"
            >
              Iniciar Escáner
            </button>
          )}
          
          {camaraActiva && (
            <button
              onClick={detenerEscaner}
              className="btn btn-danger btn-large"
            >
              Detener Escáner
            </button>
          )}
          
          <button
            onClick={buscarManualmente}
            disabled={camaraActiva}
            className="btn btn-outline"
          >
            Buscar Manualmente
          </button>
        </div>
        
        {/* Información del código escaneado */}
        {codigoEscaneado && (
          <div className="codigo-info">
            <h3>Código Escaneado:</h3>
            <code>{codigoEscaneado}</code>
            {(() => {
              const info = decodificarCodigoQR(codigoEscaneado);
              return info.esValido && (
                <div className="codigo-detalles">
                  <span>ID: {info.id}</span>
                  <span>Clasificación: {info.clasificacion}</span>
                  <span>Año: {info.year}</span>
                </div>
              );
            })()}
          </div>
        )}
        
        {/* Resultados de búsqueda */}
        {buscando && (
          <div className="loading-reactivo">
            <div className="spinner"></div>
            <p>Buscando reactivo...</p>
          </div>
        )}
        
        {reactivo && (
          <div className="reactivo-resultado">
            <div className="resultado-header">
              <h2>🧪 Información del Reactivo</h2>
              <button
                onClick={escanearOtro}
                className="btn btn-secondary"
              >
                🔄 Escanear Otro
              </button>
            </div>
            
            <div 
              className="reactivo-card"
              style={{
                borderLeftColor: reactivo.color_hex,
                backgroundColor: reactivo.color_hex + '10'
              }}
            >
              {/* Cabecera del reactivo */}
              <div className="reactivo-header-info">
                <h3>{reactivo.nombre}</h3>
                {reactivo.formula_quimica && (
                  <div className="formula">
                    <strong>Fórmula:</strong> {reactivo.formula_quimica}
                  </div>
                )}
              </div>
              
              {/* Clasificación */}
              <div className="reactivo-clasificacion">
                <span 
                  className="badge-clasificacion"
                  style={{ backgroundColor: reactivo.color_hex }}
                >
                  {reactivo.clasificacion}
                </span>
                <span className={`nivel-peligro nivel-${reactivo.nivel_peligro}`}>
                  {obtenerIconoPeligro(reactivo.nivel_peligro)} {reactivo.nivel_peligro.toUpperCase()}
                </span>
              </div>
              
              {/* Información de inventario */}
              <div className="reactivo-detalles">
                <div className="detalle-item">
                  <span className="detalle-label">Cantidad Disponible:</span>
                  <span className="detalle-valor">
                    {reactivo.cantidad_actual} {reactivo.unidad_medida}
                  </span>
                </div>
                
                <div className="detalle-item">
                  <span className="detalle-label">Número de Frascos:</span>
                  <span className="detalle-valor">{reactivo.numero_frascos}</span>
                </div>
                
                {reactivo.ubicacion && (
                  <div className="detalle-item">
                    <span className="detalle-label">Ubicación:</span>
                    <span className="detalle-valor">{reactivo.ubicacion}</span>
                  </div>
                )}
                
                {reactivo.lote && (
                  <div className="detalle-item">
                    <span className="detalle-label">Lote:</span>
                    <span className="detalle-valor">{reactivo.lote}</span>
                  </div>
                )}
                
                {reactivo.fecha_caducidad && (
                  <div className="detalle-item">
                    <span className="detalle-label">Fecha de Caducidad:</span>
                    <span className="detalle-valor">
                      {new Date(reactivo.fecha_caducidad).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                )}
                
                {reactivo.fabricante && (
                  <div className="detalle-item">
                    <span className="detalle-label">Fabricante:</span>
                    <span className="detalle-valor">{reactivo.fabricante}</span>
                  </div>
                )}
              </div>
              
              {/* Estado del inventario */}
              {reactivo.estado_inventario && reactivo.estado_inventario !== 'OK' && (
                <div className={`alerta-inventario alerta-${
                  reactivo.estado_inventario.includes('ALERTA') ? 'danger' :
                  reactivo.estado_inventario.includes('ADVERTENCIA') ? 'warning' :
                  'info'
                }`}>
                  {reactivo.estado_inventario}
                </div>
              )}
              
              {/* Observaciones */}
              {reactivo.observaciones && (
                <div className="reactivo-observaciones">
                  <strong>Observaciones:</strong>
                  <p>{reactivo.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Instrucciones */}
        {!camaraActiva && !reactivo && (
          <div className="instrucciones">
            <h3>¿Cómo usar el lector?</h3>
            <ol>
              <li>Presiona el botón "Iniciar Escáner"</li>
              <li>Permite el acceso a la cámara cuando se solicite</li>
              <li>Apunta la cámara al código QR del reactivo</li>
              <li>El sistema leerá automáticamente el código y mostrará la información</li>
            </ol>
            <p className="nota">
              <strong>Nota:</strong> Si tienes problemas con la cámara, puedes usar la opción 
              "Buscar Manualmente" e ingresar el código QR.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LectorQR;