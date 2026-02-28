// src/App.jsx - MODIFICADO
// Cambios: + AuthProvider + ProtectedRoute + ruta /login + ruta /solicitud-material
// Todo lo demás permanece igual.

import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AlertaCaducidad from './components/Alertas/Alerta';
import NavBar from './components/Navbar/Navbar';
import AppRoutes from './routes/routes';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <>
    
      <AuthProvider>
        <Router>
          <Routes>
            {/* ── Ruta pública: Login ────────────────────────────── */}
            <Route path="/login" element={<LoginPage />} />

            {/* ── Rutas protegidas: todo el sistema existente ────── */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <>
                    <AlertaCaducidad/>
                    <NavBar />
                    <AppRoutes />
                  </>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;