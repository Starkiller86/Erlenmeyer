import { FaBell, FaFlask, FaUser, FaCalendarAlt, FaTimes, FaArrowRight } from 'react-icons/fa';
import './Notificaciones.css';
import { useNavigate } from 'react-router-dom';

const ModalNuevaSolicitud = ({ solicitud, onClose, totalpendientes }) => {
    const navigate = useNavigate();

    if (!solicitud) return null;

    const formatFecha = (fecha) =>      
        new Date(fecha).toLocaleDateString('es-EC', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

    return (
        <div className="notif-overlay" onClick={onClose}>
            <div className="notif-modal" onClick={(e) => e.stopPropagation()}> 

                {/* HEADER */}
                <div className="notif-header">
                    <div className="notif-bell">
                        <FaBell size={20} />
                        <span className="notif-pulse" />
                    </div>
                    <div>
                        <h3>Nueva solicitud de material</h3>
                        <p>{totalpendientes} solicitud(es) pendiente(s)</p>
                    </div>
                    <button className="notif-close" onClick={onClose}>  
                        <FaTimes />
                    </button>
                </div>

                {/* BODY */}
                <div className="notif-body">   
                    <div className="notif-field">  
                        <FaUser size={13} />
                        <div>
                            <span className="notif-label">Solicitante</span>
                            <span className="notif-value">{solicitud.user_nombre_compl}</span>
                        </div>
                    </div>

                    <div className="notif-row">
                        <div className="notif-field">
                            <div>
                                <span className="notif-label">Grupo</span>
                                <span className="notif-value">{solicitud.group_name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="notif-time">  
                        Recibida: {formatFecha(solicitud.created_at)}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="notif-footer">  
                    <button className="btn-notif-secondary" onClick={onClose}>
                        Ignorar por ahora
                    </button>
                    <button
                        className="btn-notif-primary"
                        onClick={() => { onClose(); navigate('/solicitud-material'); }} 
                    >
                        Revisar Solicitud <FaArrowRight size={13} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ModalNuevaSolicitud;