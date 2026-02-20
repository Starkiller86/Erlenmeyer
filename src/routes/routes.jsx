// src/routes/routes.jsx - MODIFICADO
// Cambio: + import SolicitudMaterial + ruta /solicitud-material

import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Inicio from '../pages/Inicio';
import AltaReactivo from '../pages/AltaReactivo';
import MostrarReactivos from '../pages/MostrarReactivo';
import LectorQR from '../pages/LectorQR';
import SolicitudMaterial from '../pages/SolicitudMaterial'; // ← NUEVO
import GestionUsuarios from '../pages/GestionUsuarios';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/alta" element={<AltaReactivo />} />
      <Route path="/mostrar" element={<MostrarReactivos />} />
      <Route path="/lector" element={<LectorQR />} />
      <Route path="/solicitud-material" element={<SolicitudMaterial />} /> {/* ← NUEVO */}
      <Route path="/usuarios" element={<GestionUsuarios />} />
    </Routes>
  );
};

export default AppRoutes;