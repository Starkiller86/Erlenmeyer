import { useEffect, useState } from 'react';
import './Alerta.css';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../config/supabaseClient.js';

function AlertaCaducidad() {
  const [show, setShow] = useState(true);
  const [reactivos, setReactivos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerProximosACaducar = async () => {
      try {
        const hoy = new Date();
        const en30dias = new Date();
        en30dias.setDate(hoy.getDate() + 30);

        const { data, error } = await supabase
          .from('reactivos')
          .select('id, nombre, fecha_caducidad')
          .not('fecha_caducidad', 'is', null)
          .lte('fecha_caducidad', en30dias.toISOString().split('T')[0])
          .gte('fecha_caducidad', hoy.toISOString().split('T')[0])
          .order('fecha_caducidad', { ascending: true });

        if (error) throw error;

        // Calcular días restantes para cada reactivo
        const conDias = data.map(r => ({
          ...r,
          dias_restantes: Math.ceil(
            (new Date(r.fecha_caducidad) - hoy) / (1000 * 60 * 60 * 24)
          )
        }));

        setReactivos(conDias);
      } catch (err) {
        console.error('Error al obtener alertas de caducidad:', err.message);
      } finally {
        setLoading(false);
      }
    };

    obtenerProximosACaducar();
  }, []);

  if (loading || reactivos.length === 0 || !show) return null;

  return (
    <div className="alerta-caducidad" style={{marginTop: '60px'}}>
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