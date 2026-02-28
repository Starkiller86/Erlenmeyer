// ============================================
// PÁGINA: INICIO
// Página principal con información del sistema
// ============================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerEstadisticas } from '../services/api.service';
import { FaPlus, FaList, FaQrcode, FaFlask } from 'react-icons/fa';
import './Inicio.css';

/**
 * Componente de página de inicio
 * Muestra información general y accesos rápidos
 */
const Inicio = () => {
  // Estado para las estadísticas
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  /**
   * Efecto para cargar estadísticas al montar el componente
   */
  useEffect(() => {
    cargarEstadisticas();
  }, []);
  
  /**
   * Carga las estadísticas del inventario
   */
  const cargarEstadisticas = async () => {
    try {
      const data = await obtenerEstadisticas();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setCargando(false);
    }
  };
  
  return (
    <div className="inicio-container my-5">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <FaFlask className="hero-icon" />
          <h1>Sistema de Gestión de Inventario</h1>
          <h2>Laboratorio de Nanotecnología</h2>
          <p>Universidad Tecnológica de Querétaro</p>
        </div>
      </div>
      
      {/* Tarjetas de acceso rápido */}
      <div className="accesos-rapidos">
        <h2>Accesos Rápidos</h2>
        
        <div className="cards-grid">
          {/* Tarjeta: Alta de Reactivos */}
          <Link to="/alta" className="card card-primary">
            <div className="card-icon">
              <FaPlus />
            </div>
            <h3>Registrar Reactivo</h3>
            <p>Da de alta un nuevo reactivo químico en el inventario con su código QR único</p>
          </Link>
          
          {/* Tarjeta: Mostrar Reactivos */}
          <Link to="/mostrar" className="card card-secondary">
            <div className="card-icon">
              <FaList />
            </div>
            <h3>Ver Inventario</h3>
            <p>Consulta todos los reactivos registrados con filtros y búsqueda avanzada</p>
          </Link>
          
          {/* Tarjeta: Lector QR */}
          <Link to="/lector" className="card card-accent">
            <div className="card-icon">
              <FaQrcode />
            </div>
            <h3>Escanear QR</h3>
            <p>Lee códigos QR de reactivos para consultar su información rápidamente</p>
          </Link>
        </div>
      </div>
      
      {/* Estadísticas */}
      {!cargando && estadisticas && (
        <div className="estadisticas-section">
          <h2>Estadísticas del Inventario</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{estadisticas.totalReactivos || 0}</div>
              <div className="stat-label">Total de Reactivos</div>
            </div>
            
            <div className="stat-card stat-warning">
              <div className="stat-value">{estadisticas.alertasStockBajo || 0}</div>
              <div className="stat-label">Stock Bajo</div>
            </div>
            
            <div className="stat-card stat-danger">
              <div className="stat-value">{estadisticas.proximosACaducar || 0}</div>
              <div className="stat-label">Próximos a Caducar</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="footer-section">
        <p>
          Sistema desarrollado como parte del Servicio Social<br />
          Universidad Tecnológica de Querétaro - 2026
        </p>
      </div>
    </div>
  );
};

export default Inicio;