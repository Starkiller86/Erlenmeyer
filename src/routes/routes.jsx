// ============================================
// CONFIGURACIÓN DE RUTAS
// Define todas las rutas de la aplicación
// ============================================

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importar páginas
import Inicio from '../pages/Inicio';
import AltaReactivo from '../pages/AltaReactivo';
import MostrarReactivos from '../pages/MostrarReactivo';
import LectorQR from '../pages/LectorQR';

/**
 * Componente que define todas las rutas de la aplicación
 * Cada ruta mapea una URL a un componente específico
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Ruta principal - Página de inicio */}
      <Route path="/" element={<Inicio />} />
      
      {/* Ruta para dar de alta nuevos reactivos */}
      <Route path="/alta" element={<AltaReactivo />} />
      
      {/* Ruta para mostrar todos los reactivos */}
      <Route path="/mostrar" element={<MostrarReactivos />} />
      
      {/* Ruta para leer códigos QR */}
      <Route path="/lector" element={<LectorQR />} />
      
      {/* Ruta 404 - No encontrada (opcional) */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default AppRoutes;