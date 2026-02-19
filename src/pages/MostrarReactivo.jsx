// ============================================
// PÁGINA: MOSTRAR REACTIVOS
// Lista todos los reactivos con búsqueda y filtros
// ============================================

// Importaciones necesarias para el componente:
// - React y hooks para manejo de estado y efectos
// - Servicios de API para obtener datos y descargar QR
// - Componente para generar códigos QR
// - Estilos CSS del componente
import React, { useState, useEffect } from 'react';
import {
  obtenerReactivos,
  obtenerClasificaciones,
  descargarQRDirecto
} from '../services/api.service';
import { QRCodeSVG } from 'qrcode.react';
import './MostrarReactivo.css';

// Definición del componente funcional MostrarReactivos
// Este componente muestra una lista de reactivos químicos con opciones de filtrado y búsqueda
const MostrarReactivos = () => {
  // Estados del componente:
  // - reactivos: Array que almacena la lista de reactivos obtenidos de la API
  // - clasificaciones: Array de clasificaciones disponibles para filtrar
  // - filtros: Objeto con los criterios de filtrado actuales (nombre, clasificacion_id, estado)
  // - cargando: Booleano que indica si se están cargando datos
  // - reactivoSeleccionado: Objeto del reactivo seleccionado para mostrar en modal
  const [reactivos, setReactivos] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [filtros, setFiltros] = useState({
    nombre: '',
    clasificacion_id: '',
    estado: ''
  });
  const [cargando, setCargando] = useState(true);
  const [reactivoSeleccionado, setReactivoSeleccionado] = useState(null);

  // Código comentado: Hook original para carga inicial (ahora dividido en dos useEffect)

  // Hook useEffect para cargar las clasificaciones al montar el componente
  // Se ejecuta solo una vez al inicio
  useEffect(()=>{
    const cargarClasificaciones=async()=>{
      try{
        const data = await obtenerClasificaciones();
        setClasificaciones(data);
      }catch(error){
        console.error("Error al cargar clasificaciones ", error);
      }
    };
    cargarClasificaciones();
  },[]);

  // Hook useEffect para filtrar reactivos automáticamente cuando cambian los filtros
  // Se ejecuta cada vez que el estado 'filtros' cambia
  useEffect(() => {
    buscarConFiltros();
  }, [filtros]);
  // Función comentada: cargarDatosIniciales (reemplazada por hooks separados)

  // Función asíncrona para buscar reactivos aplicando los filtros actuales
  // Normaliza los filtros y llama a la API, actualizando el estado de reactivos
  const buscarConFiltros = async () => {
    setCargando(true);
    try {
      const filtrosNormalizados = {};
      if(filtros.nombre.trim())
        filtrosNormalizados.nombre=filtros.nombre.trim();
      if(filtros.clasificacion_id)
        filtrosNormalizados.clasificacion_id=Number(filtros.clasificacion_id);
      if(filtros.estado)
        filtrosNormalizados.estado=filtros.estado;

      const data = await obtenerReactivos(filtrosNormalizados);
      setReactivos(data);
    } catch (error) {
      console.error('Error al filtrar reactivos:', error);
    } finally {
      setCargando(false);
    }
  };

  // Función para limpiar todos los filtros, restableciendo el estado de filtros a valores vacíos
  const limpiarFiltros = () => {
    setFiltros({
      nombre: '',
      clasificacion_id: '',
      estado: ''
    });
  };

  // Renderizado del componente: devuelve el JSX que representa la interfaz de usuario
  return (
    // Contenedor principal del componente con clases CSS para estilos
    <div className="mostrar-reactivos-container">
      {/* // Encabezado de la página con título y descripción */}
      <div className="mostrar-header">
        <h1>Inventario de Reactivos</h1>
        <p>Consulta y gestiona todos los reactivos registrados</p>
      </div>

      {/* Sección de filtros para buscar y filtrar reactivos */}
      <div className="filtros-section">
        {/* // Grid de filtros con inputs para nombre, clasificación, estado y botón de limpiar */}
        <div className="filtros-grid">
          {/* // Input de texto para filtrar por nombre del reactivo */}
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtros.nombre}
            onChange={(e) =>
              setFiltros({ ...filtros, nombre: e.target.value })
            }
          />

          {/* // Select para filtrar por clasificación, mapeando las clasificaciones obtenidas */}
          <select
            value={filtros.clasificacion_id}
            onChange={(e) =>
              setFiltros({
                ...filtros,
                clasificacion_id: e.target.value
                  ? Number(e.target.value)
                  : ''
              })
            }
          >
            <option value="">Todas las clasificaciones</option>
            {clasificaciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          {/* //Select para filtrar por estado del reactivo (activo o agotado) */}
          <select
            value={filtros.estado}
            onChange={(e) =>
              setFiltros({ ...filtros, estado: e.target.value })
            }
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="agotado">Agotado</option>
          </select>

          {/* // Botón para limpiar todos los filtros aplicados */}
          <button onClick={limpiarFiltros} className="btn btn-outline">
            Limpiar
          </button>
        </div>
      </div>

      {/* Sección de listado de reactivos, condicional según estado de carga */}
      {cargando ? (
        // Indicador de carga mientras se obtienen los datos
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando reactivos...</p>
        </div>
      ) : (
        // Grid de reactivos una vez cargados
        <div className="reactivos-grid">
          {/* // Mensaje si no hay reactivos que coincidan con los filtros */}
          {reactivos.length === 0 ? (
            <div className="no-resultados">
              <p>No se encontraron reactivos</p>
            </div>
          ) : (
            // Mapeo de cada reactivo a una tarjeta (card) con información clave
            reactivos.map((reactivo) => (
              // Tarjeta individual para cada reactivo, con borde de color según clasificación
              <div
                key={reactivo.id}
                className="reactivo-card"
                style={{ borderLeftColor: reactivo.color_hex }}
                onClick={() => setReactivoSeleccionado(reactivo)}
              >
                {/* // Encabezado de la tarjeta con nombre y fórmula química si existe */}
                <div className="reactivo-header">
                  <h3>{reactivo.nombre}</h3>
                  {reactivo.formula_quimica && (
                    <span className="formula">
                      {reactivo.formula_quimica}
                    </span>
                  )}
                </div>

                {/* // Información adicional: badge de clasificación y estado */}
                <div className="reactivo-info">
                  <span
                    className="badge"
                    style={{ backgroundColor: reactivo.color_hex }}
                  >
                    {reactivo.clasificacion}
                  </span>
                  <span
                    className={`estado-badge estado-${reactivo.estado}`}
                  >
                    {reactivo.estado}
                  </span>
                </div>

                {/* // Detalles del reactivo: cantidad, frascos y ubicación si existe */}
                <div className="reactivo-detalles">
                  <div>
                    <strong>Cantidad:</strong> {reactivo.cantidad_actual}{' '}
                    {reactivo.unidad_medida}
                  </div>
                  <div>
                    <strong>Frascos:</strong> {reactivo.numero_frascos}
                  </div>
                  {reactivo.ubicacion && (
                    <div>
                      <strong>Ubicación:</strong> {reactivo.ubicacion}
                    </div>
                  )}
                </div>

                {/* // Código QR del reactivo */}
                <div className="reactivo-codigo">
                  <code>{reactivo.codigo_qr}</code>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal para mostrar detalles del reactivo seleccionado */}
      {reactivoSeleccionado && (
        // Overlay del modal que cierra al hacer clic fuera
        <div
          className="modal-overlay"
          onClick={() => setReactivoSeleccionado(null)}
        >
          {/* // Contenido del modal, previene cierre al hacer clic dentro */}
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* // Botón para cerrar el modal */}
            <button
              className="modal-close"
              onClick={() => setReactivoSeleccionado(null)}
            >
              ✕
            </button>

            {/* // Título del modal con el nombre del reactivo */}
            <h2>{reactivoSeleccionado.nombre}</h2>

            {/* // Cuerpo del modal dividido en QR y información */}
            <div className="modal-body">
              {/* // Sección del código QR generado */}
              <div className="modal-qr">
                <QRCodeSVG
                  value={reactivoSeleccionado.codigo_qr}
                  size={150}
                />
                <code>{reactivoSeleccionado.codigo_qr}</code>
              </div>

              {/* // Sección de información detallada del reactivo */}
              <div className="modal-info">
                {/* Muestra fórmula química si existe */}
                {reactivoSeleccionado.formula_quimica && (
                  <p>
                    <strong>Fórmula:</strong>{' '}
                    {reactivoSeleccionado.formula_quimica}
                  </p>
                )}
                {/* // Clasificación del reactivo */}
                <p>
                  <strong>Clasificación:</strong>{' '}
                  {reactivoSeleccionado.clasificacion}
                </p>
                {/* // Cantidad actual con unidad de medida */}
                <p>
                  <strong>Cantidad:</strong>{' '}
                  {reactivoSeleccionado.cantidad_actual}{' '}
                  {reactivoSeleccionado.unidad_medida}
                </p>
                {/* // Número de frascos */}
                <p>
                  <strong>Frascos:</strong>{' '}
                  {reactivoSeleccionado.numero_frascos}
                </p>
                {/* // Ubicación si existe */}
                {reactivoSeleccionado.ubicacion && (
                  <p>
                    <strong>Ubicación:</strong>{' '}
                    {reactivoSeleccionado.ubicacion}
                  </p>
                )}
                {/* // Observaciones si existen */}
                {reactivoSeleccionado.observaciones && (
                  <p>
                    <strong>Observaciones:</strong>{' '}
                    {reactivoSeleccionado.observaciones}
                  </p>
                )}
              </div>
            </div>

            {/* // Botón para descargar el código QR del reactivo */}
            <button
              className="btn btn-primary"
              onClick={() =>
                descargarQRDirecto(
                  reactivoSeleccionado.codigo_qr,
                  reactivoSeleccionado.nombre
                )
              }
            >
              Descargar QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Exportación del componente para ser usado en otras partes de la aplicación
export default MostrarReactivos;
