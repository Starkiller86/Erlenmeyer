// ============================================
// COMPONENTE PRINCIPAL: APP
// Punto de entrada de la aplicación React
// ============================================

import { BrowserRouter as Router } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import AlertaCaducidad from '../src/components/Alertas/Alerta';


// Importar componentes
import NavBar from './components/Navbar/Navbar';
import AppRoutes from './routes/routes';

function App() {
  return (
    <>
      <AlertaCaducidad/>
      <Router>
        {/* Barra de navegación global */}
        <NavBar />

        {/* Rutas de la aplicación */}
        <AppRoutes />
      </Router>
    </>
  );
}

export default App;
