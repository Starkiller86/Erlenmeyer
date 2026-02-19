// ============================================
// PÁGINA: LECTOR DE QR
// Página wrapper para el componente LectorQR
// ============================================

import React from 'react';
import LectorQRComponent from '../components/LectorQR/LectorQR';

/**
 * Componente de página para leer códigos QR
 * Renderiza el lector de QR con cámara
 */
const LectorQR = () => {
  return (
    <div className="page-container">
      <LectorQRComponent />
    </div>
  );
};

export default LectorQR;