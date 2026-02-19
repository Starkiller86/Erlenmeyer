// ============================================
// PÁGINA: ALTA DE REACTIVO
// Página wrapper para el componente FormularioReactivo
// ============================================

import React from 'react';
import FormularioReactivo from '../components/FormularioReactivo/FormularioReactivo';

/**
 * Componente de página para dar de alta reactivos
 * Renderiza el formulario completo de registro
 */
const AltaReactivo = () => {
  return (
    <div className="page-container">
      <FormularioReactivo />
    </div>
  );
};

export default AltaReactivo;