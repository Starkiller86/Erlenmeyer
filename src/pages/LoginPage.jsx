// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GiChemicalDrop } from 'react-icons/gi';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(form.username, form.password);
      // Redirigir según rol
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0533 0%, #2d1052 40%, #4a1a7a 70%, #6b35a8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>
        {/* Header con logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#fff' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', border: '2px solid rgba(255,255,255,0.3)',
          }}>
            <GiChemicalDrop size={36} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.3px' }}>
            Inventario de Reactivos
          </h1>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', opacity: 0.75 }}>
            Laboratorio de Nanotecnología — UTEQ
          </p>
        </div>

        {/* Card del formulario */}
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#1a0533', textAlign: 'center' }}>
            Iniciar Sesión
          </h2>

          {error && (
            <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Usuario */}
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem', color: '#374151' }}>
                Usuario
              </label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f3f0ff', border: '1px solid #d1c4e9', color: '#5e35b1' }}>
                  <FaUser size={13} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tu nombre de usuario"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  required
                  autoFocus
                  style={{ borderLeft: 'none' }}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.85rem', color: '#374151' }}>
                Contraseña
              </label>
              <div className="input-group">
                <span className="input-group-text" style={{ background: '#f3f0ff', border: '1px solid #d1c4e9', color: '#5e35b1' }}>
                  <FaLock size={13} />
                </span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{ borderLeft: 'none' }}
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="btn w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #5e35b1, #7b1fa2)',
                color: '#fff',
                border: 'none',
                padding: '0.65rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                <FaSignInAlt size={15} />
              )}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
          Sistema desarrollado como parte del Servicio Social — UTEQ 2026
        </p>
      </div>
    </div>
  );
}