/* src/components/Navbar/Navbar.jsx - MODIFICADO */
import { Link, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Offcanvas } from 'react-bootstrap';
import { GiChemicalDrop } from 'react-icons/gi';
import { FaHome, FaPlus, FaList, FaQrcode, FaClipboardList, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { FaUsers } from 'react-icons/fa';
import './Navbar.css';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
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

              <Nav.Link as={Link} to="/alta" className="btn">
                <FaPlus size={16} /> Alta de Reactivos
              </Nav.Link>

              <Nav.Link as={Link} to="/mostrar" className="btn">
                <FaList size={16} /> Mostrar Reactivos
              </Nav.Link>

              <Nav.Link as={Link} to="/lector" className="btn">
                <FaQrcode size={16} /> Lector QR
              </Nav.Link>

              {/* ── NUEVO: Solicitud de Material ── */}
              <Nav.Link as={Link} to="/solicitud-material" className="btn btn-solicitud">
                <FaClipboardList size={16} /> Solicitud de Material
              </Nav.Link>

              {/* ── Separador + usuario + logout ── */}
              <div className="nav-user-section">
                {user && (
                  <span className="nav-user-label">
                    <FaUserCircle size={14} />
                    {user.nombre_completo?.split(' ')[0] || user.username}
                    {user.rol === 'admin' && <span className="nav-rol-badge">Admin</span>}
                  </span>
                )}
                <button className="btn btn-logout" onClick={handleLogout}>
                  <FaSignOutAlt size={14} /> Salir
                </button>
              </div>

              {/* Solo visible para admins */}
              {user?.rol === 'admin' && (
                <Nav.Link as={Link} to="/usuarios" className="btn btn-solicitud">
                  <FaUsers size={16} /> Gestión de Usuarios
                </Nav.Link>
              )}

            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default NavBar;