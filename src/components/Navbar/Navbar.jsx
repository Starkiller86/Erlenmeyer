/* src/components/Navbar/Navbar.jsx */
import { Link, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Offcanvas, NavDropdown } from 'react-bootstrap';
import { GiChemicalDrop } from 'react-icons/gi';
import { FaHome, FaPlus, FaList, FaQrcode, FaClipboardList, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { FaUsers } from 'react-icons/fa';
import './Navbar.css';
import { useState } from 'react';
import { useNuevasSolicitudes } from '../Solicitudes/useNuevasSolicitudes';

const NavBar = () => {
  const { user, logout, perfil } = useAuth();
  const navigate = useNavigate();
  const [showLogoutM, setShowLogoutM] = useState(false);

  //  Solo se activa si es admin o laboratorista
  const { contador } = useNuevasSolicitudes(perfil?.rol);

  const handleLogoutClick = () => setShowLogoutM(true);
  const handleLogoutConfirm = () => {
    setShowLogoutM(false);
    logout();
    navigate('/login');
  };
  const handleLogoutCancel = () => setShowLogoutM(false);

  return (
    <>
      <Navbar expand="lg" className="custom-navbar" fixed="top">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
            <GiChemicalDrop size={25} />
            Inventario de Reactivos
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="offcanvasNavbar" />

          <Navbar.Offcanvas
            id="offcanvasNavbar"
            aria-labelledby="offcanvasNavbarLabel"
            placement="end"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id="offcanvasNavbarLabel">Menú</Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3 gap-2 align-items-center">

                <Nav.Link as={Link} to="/" className="btn">
                  <FaHome size={16} /> Inicio
                </Nav.Link>

                <NavDropdown
                  title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><FaPlus size={16} />Registrar</span>}
                  id="altas-dropdown"
                  className='btn'>
                  <NavDropdown.Item as={Link} to="/alta">Alta de Reactivos</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/altamat">Alta de Material</NavDropdown.Item>
                </NavDropdown>

                <NavDropdown
                  title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><FaList size={16} />Mostrar</span>}
                  id="mostrar-dropdown"
                  className='btn'>
                  <NavDropdown.Item as={Link} to="/mostrar">Mostrar Reactivos</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/mostrarmat">Mostrar Material</NavDropdown.Item>
                </NavDropdown>

                <Nav.Link as={Link} to="/lector" className="btn">
                  <FaQrcode size={16} /> Lector QR
                </Nav.Link>

                {/*  SOLICITUD CON BADGE - solo admins/laboratoristas ven el contador */}
                <Nav.Link
                  as={Link}
                  to="/solicitud-material"
                  className="btn btn-solicitud"
                  style={{ position: 'relative' }}
                >
                  <FaClipboardList size={16} /> Solicitud de Material
                  {/* Badge solo aparece si contador > 0 y el rol tiene permiso */}
                  {contador > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'red',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}>
                      {contador > 9 ? '9+' : contador}
                    </span>
                  )}
                </Nav.Link>

                {perfil?.rol === 'admin' && (
                  <Nav.Link as={Link} to="/usuarios" className="btn btn-solicitud">
                    <FaUsers size={16} /> Gestión de Usuarios
                  </Nav.Link>
                )}

                <div className="nav-user-section">
                  {user && (
                    <span className="nav-user-label">
                      <FaUserCircle size={14} />
                      {user.nombre_completo?.split(' ')[0] || user.username}
                      {perfil?.rol === 'admin' && <span className="nav-rol-badge">Admin</span>}
                    </span>
                  )}
                  <button className='btn btn-logout' onClick={handleLogoutClick}>
                    <FaSignOutAlt size={20} />
                  </button>
                </div>

              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>

      {showLogoutM && (
        <div className="modal-overlay" onClick={handleLogoutCancel}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon"><FaSignOutAlt size={24} /></div>
            <h3>¿Cerrar sesión?</h3>
            <p>¿Estás seguro de que desea salir de tu cuenta?</p>
            <div className="modal-actions">
              <button className='btn btn-cancel' onClick={handleLogoutCancel}>Cancelar</button>
              <button className="btn btn-confirm" onClick={handleLogoutConfirm}>Sí, salir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;