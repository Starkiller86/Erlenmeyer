// ============================================
// PÁGINA: MOSTRAR REACTIVOS
// Lista todos los reactivos con búsqueda y filtros
// ============================================

import React, { useState, useEffect } from 'react';
import {
  obtenerReactivos,
  obtenerClasificaciones,
  descargarQRDirecto
} from '../services/api.service';
import { QRCodeSVG } from 'qrcode.react';
import './MostrarReactivo.css';

const MostrarReactivos = () => {
  const [reactivos, setReactivos] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [filtros, setFiltros] = useState({
    nombre: '',
    clasificacion_id: '',
    estado: ''
  });
  const [cargando, setCargando] = useState(true);
  const [reactivoSeleccionado, setReactivoSeleccionado] = useState(null);

  useEffect(() => {
    const cargarClasificaciones = async () => {
      try {
        const data = await obtenerClasificaciones();
        setClasificaciones(data);
      } catch (error) {
        console.error('Error al cargar clasificaciones ', error);
      }
    };
    cargarClasificaciones();
  }, []);

  useEffect(() => {
    buscarConFiltros();
  }, [filtros]);

  const buscarConFiltros = async () => {
    setCargando(true);
    try {
      const filtrosNormalizados = {};
      if (filtros.nombre.trim())
        filtrosNormalizados.nombre = filtros.nombre.trim();
      if (filtros.clasificacion_id)
        filtrosNormalizados.clasificacion_id = Number(filtros.clasificacion_id);
      if (filtros.estado)
        filtrosNormalizados.estado = filtros.estado;

      const data = await obtenerReactivos(filtrosNormalizados);
      setReactivos(data);
    } catch (error) {
      console.error('Error al filtrar reactivos:', error);
    } finally {
      setCargando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      nombre: '',
      clasificacion_id: '',
      estado: ''
    });
  };

  /**
   * Obtiene el nombre de la clasificación de un reactivo
   * Busca en múltiples posibles campos donde puede venir el dato
   */
  const obtenerNombreClasificacion = (reactivo) => {
    // Opción 1: viene directo como string en el campo 'clasificacion'
    if (reactivo.clasificacion && typeof reactivo.clasificacion === 'string')
      return reactivo.clasificacion;

    // Opción 2: viene como objeto anidado { nombre: '...' }
    if (reactivo.clasificacion && typeof reactivo.clasificacion === 'object')
      return reactivo.clasificacion.nombre || '—';

    // Opción 3: viene como 'clasificacion_nombre' (alias de JOIN)
    if (reactivo.clasificacion_nombre)
      return reactivo.clasificacion_nombre;

    // Opción 4: buscar por clasificacion_id en el array de clasificaciones
    if (reactivo.clasificacion_id) {
      const encontrada = clasificaciones.find(
        (c) => c.id === reactivo.clasificacion_id
      );
      if (encontrada) return encontrada.nombre;
    }

    return '—';
  };

  /**
   * Obtiene el color hex de la clasificación de un reactivo
   */
  const obtenerColorClasificacion = (reactivo) => {
    if (reactivo.color_hex) return reactivo.color_hex;

    if (reactivo.clasificacion && typeof reactivo.clasificacion === 'object')
      return reactivo.clasificacion.color_hex || '#888';

    if (reactivo.clasificacion_id) {
      const encontrada = clasificaciones.find(
        (c) => c.id === reactivo.clasificacion_id
      );
      if (encontrada) return encontrada.color_hex || '#888';
    }

    return '#888';
  };

  return (
    <div className="mostrar-reactivos-container" style={{
      marginTop: '80px'
    }}>
      <div className="mostrar-header">
        <h1>Inventario de Reactivos</h1>
        <p>Consulta y gestiona todos los reactivos registrados</p>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtros-grid">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtros.nombre}
            onChange={(e) => setFiltros({ ...filtros, nombre: e.target.value })}
          />

          <select
            value={filtros.clasificacion_id}
            onChange={(e) =>
              setFiltros({
                ...filtros,
                clasificacion_id: e.target.value ? Number(e.target.value) : ''
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

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="agotado">Agotado</option>
          </select>

          <button onClick={limpiarFiltros} className="btn btn-outline">
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista de reactivos */}
      {cargando ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando reactivos...</p>
        </div>
      ) : (
        <div className="reactivos-grid">
          {reactivos.length === 0 ? (
            <div className="no-resultados">
              <p>No se encontraron reactivos</p>
            </div>
          ) : (
            reactivos.map((reactivo) => {
              const colorHex = obtenerColorClasificacion(reactivo);
              const nombreClasificacion = obtenerNombreClasificacion(reactivo);

              return (
                <div
                  key={reactivo.id}
                  className="reactivo-card"
                  style={{ borderLeftColor: colorHex }}
                  onClick={() => setReactivoSeleccionado(reactivo)}
                >
                  <div className="reactivo-header">
                    <h3>{reactivo.nombre}</h3>
                    {reactivo.formula_quimica && (
                      <span className="formula">{reactivo.formula_quimica}</span>
                    )}
                  </div>

                  <div className="reactivo-info">
                    <span className="badge" style={{ backgroundColor: colorHex }}>
                      {nombreClasificacion}
                    </span>
                    <span className={`estado-badge estado-${reactivo.estado}`}>
                      {reactivo.estado}
                    </span>
                  </div>

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

                  <div className="reactivo-codigo">
                    <code>{reactivo.codigo_qr}</code>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal */}
      {reactivoSeleccionado && (
        <div className="modal-overlay" onClick={() => setReactivoSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setReactivoSeleccionado(null)}
            >
              ✕
            </button>

            <h2>{reactivoSeleccionado.nombre}</h2>

            <div className="modal-body">
              {/* QR */}
              <div className="modal-qr">
                <QRCodeSVG value={reactivoSeleccionado.codigo_qr} size={150} />
                <code>{reactivoSeleccionado.codigo_qr}</code>
              </div>

              {/* Info */}
              <div className="modal-info">
                {reactivoSeleccionado.formula_quimica && (
                  <p>
                    <strong>Fórmula:</strong> {reactivoSeleccionado.formula_quimica}
                  </p>
                )}

                {/* ← FIX: usa la función helper en lugar de .clasificacion directo */}
                <p>
                  <strong>Clasificación:</strong>{' '}
                  {obtenerNombreClasificacion(reactivoSeleccionado)}
                </p>

                <p>
                  <strong>Cantidad:</strong> {reactivoSeleccionado.cantidad_actual}{' '}
                  {reactivoSeleccionado.unidad_medida}
                </p>
                <p>
                  <strong>Frascos:</strong> {reactivoSeleccionado.numero_frascos}
                </p>
                {reactivoSeleccionado.ubicacion && (
                  <p>
                    <strong>Ubicación:</strong> {reactivoSeleccionado.ubicacion}
                  </p>
                )}
                {reactivoSeleccionado.observaciones && (
                  <p>
                    <strong>Observaciones:</strong> {reactivoSeleccionado.observaciones}
                  </p>
                )}
              </div>
            </div>

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

export default MostrarReactivos;