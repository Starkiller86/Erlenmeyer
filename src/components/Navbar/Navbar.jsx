import { Link } from 'react-router-dom';
import { Container, Nav, Navbar, Offcanvas } from 'react-bootstrap';
import { GiChemicalDrop } from 'react-icons/gi';
import { FaHome, FaPlus, FaList, FaQrcode } from 'react-icons/fa';
import './Navbar.css';

const NavBar = () => {
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
            <Offcanvas.Title id="offcanvasNavbarLabel">
              Menú
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body>
            <Nav className="justify-content-end flex-grow-1 pe-3 gap-2">

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

            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default NavBar;
