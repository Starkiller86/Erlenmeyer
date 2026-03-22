/* src/components/Navbar/Navbar.jsx - MODIFICADO */
import { Link, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Offcanvas, NavDropdown } from 'react-bootstrap';
import { GiChemicalDrop } from 'react-icons/gi';
import { FaHome, FaPlus, FaList, FaQrcode, FaClipboardList, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { FaUsers } from 'react-icons/fa';
import './Navbar.css';
import { useState } from 'react';

const NavBar = () => {
  const { user, logout, perfil } = useAuth();
  const navigate = useNavigate();
  // PARA EL MODAL
  const [showLogoutM, setShowLogoutM] = useState(false);

  // MUESTRA SI QUIERE CERRAR SESIÓN
  const handleLogoutClick = () => {
    setShowLogoutM(true);
  };

  // CONFIRMA
  const handleLogoutConfirm = () => {
    setShowLogoutM(false);
    logout();
    navigate('/login');
  }

  // CANCELA
  const handleLogoutCancel = () => {
    setShowLogoutM(false);
  }


  return (
    <>
      <Navbar expand="lg" className="custom-navbar" fixed="top">
        <Container fluid>
          {/* LOGO */}
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
            <GiChemicalDrop size={25} />
            Inventario de Reactivos
          </Navbar.Brand>

          {/* BOTÓN HAMBURGUESA */}
          <Navbar.Toggle aria-controls="offcanvasNavbar" />

          {/* OFFCANVAS */}
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
                  <NavDropdown.Item as={Link} to="/alta">
                    Alta de Reactivos
                  </NavDropdown.Item>

                  <NavDropdown.Item as={Link} to="/altamat">
                    Alta de Material
                  </NavDropdown.Item>
                </NavDropdown>

                <NavDropdown
                  title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><FaList size={16} />Mostrar</span>}
                  id="mostrar-dropdown"
                  className='btn'>
                  <NavDropdown.Item as={Link} to="/mostrar">
                    Mostrar Reactivos
                  </NavDropdown.Item>

                  <NavDropdown.Item as={Link} to="/mostrarmat">
                    Mostrar Material
                  </NavDropdown.Item>
                </NavDropdown>


                <Nav.Link as={Link} to="/lector" className="btn">
                  <FaQrcode size={16} /> Lector QR
                </Nav.Link>

                {/* ── NUEVO: Solicitud de Material ── */}
                <Nav.Link as={Link} to="/solicitud-material" className="btn btn-solicitud">
                  <FaClipboardList size={16} /> Solicitud de Material
                </Nav.Link>
                {/* Solo visible para admins */}
                {perfil?.rol === 'admin' && (
                  <Nav.Link as={Link} to="/usuarios" className="btn btn-solicitud">
                    <FaUsers size={16} /> Gestión de Usuarios
                  </Nav.Link>
                )}

                {/* ── Separador + usuario + logout ── */}
                <div className="nav-user-section">
                  {user && (
                    <span className="nav-user-label">
                      <FaUserCircle size={14} />
                      {user.nombre_completo?.split(' ')[0] || user.username}
                      {perfil?.rol === 'admin' && <span className="nav-rol-badge">Admin</span>}
                    </span>
                  )}
                  {/* TODA LA LÓGICA PARA QUE SALGA :) */}
                  <button className='btn btn-logout' onClick={handleLogoutClick}>
                    <FaSignOutAlt size={20}> Salir</FaSignOutAlt>
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
            <div className="modal-icon">
              <FaSignOutAlt size={24} />
            </div>
            <h3>¿Cerrar sesión?</h3>
            <p>¿Estás seguro de que desea salir de tu cuenta?</p>
            <div className="modal-actions">
              <button className='btn btn-cancel' onClick={handleLogoutCancel}> Cancelar</button>
              <button className="btn btn-confirm" onClick={handleLogoutConfirm}>Sí, salir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

};

export default NavBar;