import { useEffect, useState } from 'react';
import './Alerta.css';
import { AlertTriangle } from 'lucide-react';

function AlertaCaducidad() {
  const [show, setShow] = useState(true);
  const [reactivos, setReactivos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/alertas/caducidad')
      .then(res => res.json())
      .then(data => {
        setReactivos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || reactivos.length === 0 || !show) return null;

  return (
    <div className="alerta-caducidad">
      <div className="alerta-contenido">
        <AlertTriangle size={20} />
        <span>
          <strong>Reactivos próximos a caducar:</strong>
          {reactivos.map(r => (
            <span key={r.id} className="item">
              {r.nombre} ({r.dias_restantes} días)
            </span>
          ))}
        </span>
      </div>

      <button onClick={() => setShow(false)}>Cerrar</button>
    </div>
  );
}

export default AlertaCaducidad;
