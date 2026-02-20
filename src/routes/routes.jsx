// src/routes/routes.jsx - MODIFICADO
// Cambio: + import SolicitudMaterial + ruta /solicitud-material

import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Inicio from '../pages/Inicio';
import AltaReactivo from '../pages/AltaReactivo';
import MostrarReactivos from '../pages/MostrarReactivo';
import LectorQR from '../pages/LectorQR';
import SolicitudMaterial from '../pages/SolicitudMaterial'; // ← NUEVO

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/alta" element={<AltaReactivo />} />
      <Route path="/mostrar" element={<MostrarReactivos />} />
      <Route path="/lector" element={<LectorQR />} />
      <Route path="/solicitud-material" element={<SolicitudMaterial />} /> {/* ← NUEVO */}
    </Routes>
  );
};

export default AppRoutes;