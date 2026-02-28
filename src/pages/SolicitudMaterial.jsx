// src/pages/SolicitudMaterial.jsx
// Página de solicitud de préstamo de material - integrada en y_app_reactivos
// Usa el mismo estilo visual (morado/dark) del proyecto existente
// ✅ MIGRADO: usa Supabase directamente (eliminado localhost:3001)

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient.js';
import { FaPlus, FaTrash, FaFilePdf, FaPaperPlane, FaClipboardList } from 'react-icons/fa';
import './SolicitudMaterial.css';

const emptyMaterial = () => ({ cantidad: 1, unidad: 'pza', material_name: '', observaciones: '' });

// ── Generación de PDF ──────────────────────────────────────────────────────
const generarPDF = async (request) => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF('p', 'mm', 'letter');
  const W = doc.internal.pageSize.getWidth();
  const M = 15;

  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text('VALE PARA PRÉSTAMO DE EQUIPO ESPECIALIZADO, EQUIPO DE CÓMPUTO,', W / 2, 20, { align: 'center' });
  doc.text('HERRAMIENTA Y/O CONSUMIBLES', W / 2, 26, { align: 'center' });
  doc.setFontSize(9);
  doc.text('SUBDIRECCIÓN DE LABORATORIOS', W / 2, 32, { align: 'center' });
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('EA-F-13', W - M, 15); doc.text('Rev. 01', W - M, 19); doc.text('Fecha: 31-may-2021', W - M, 23);

  let y = 40;
  const f = (label, value, lx, vx, yy) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(label, lx, yy);
    doc.setFont('helvetica', 'normal'); doc.text(value || '', vx, yy);
  };
  f('FOLIO:', `#${request.id}`, M, 40, y); y += 7;
  f('FECHA DE SOLICITUD:', request.request_date, M, 55, y);
  f('HORA:', request.request_time, W / 2 + 10, W / 2 + 42, y); y += 7;
  f('LABORATORIO:', 'Laboratorio de Nanotecnología', M, 45, y); y += 7;
  f('NOMBRE DE LA PRÁCTICA:', request.practice_name, M, 70, y); y += 7;
  f('ASIGNATURA:', request.subject, M, 40, y); y += 7;
  f('GRUPO:', request.group_name, M, 35, y);
  f('HORARIO:', request.schedule, 80, 105, y);
  f('FECHA PRÁCTICA:', request.practice_date, W / 2 + 10, W / 2 + 45, y); y += 10;

  doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text('LLENAR DE ACUERDO AL TIPO DE USUARIO', W / 2, y, { align: 'center' }); y += 7;
  f('Docente:', 'Dr. Juan Enrique Serrano', M, 30, y); y += 7;
  f('Usuario:', request.user_nombre_completo || '', M, 30, y); y += 5;

  const tableData = (request.materials || []).map((m, i) => [
    i + 1, m.cantidad, m.unidad, m.material_name, '', '', m.observaciones || '',
  ]);
  while (tableData.length < 25) tableData.push(['', '', '', '', '', '', '']);

  autoTable(doc, {
    startY: y + 2,
    head: [['NO.', 'CANTIDAD', 'UNIDAD', 'EQUIPO / MATERIAL / CONSUMIBLE', 'B', 'R', 'OBSERVACIONES']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' }, 3: { cellWidth: 70 },
      4: { cellWidth: 10, halign: 'center' }, 5: { cellWidth: 10, halign: 'center' }, 6: { cellWidth: 40 },
    },
    margin: { left: M, right: M },
  });

  const sigY = doc.lastAutoTable.finalY + 20;
  doc.line(M, sigY + 2, M + 50, sigY + 2);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('Nombre', M + 25, sigY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.text('Profesor Responsable', M + 25, sigY + 12, { align: 'center' });
  const rc = W - M - 25;
  doc.line(W - M - 50, sigY + 2, W - M, sigY + 2);
  doc.setFont('helvetica', 'bold'); doc.text('Nombre', rc, sigY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.text('Laboratorista', rc, sigY + 12, { align: 'center' });

  doc.save(`vale_prestamo_${request.id}.pdf`);
};

// ── Componente principal ───────────────────────────────────────────────────
const STATUS = {
  pendiente: { label: 'Pendiente', cls: 'badge-pendiente' },
  aprobado:  { label: 'Aprobado',  cls: 'badge-aprobado'  },
  rechazado: { label: 'Rechazado', cls: 'badge-rechazado' },
};

export default function SolicitudMaterial() {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState('nueva');
  const [form, setForm] = useState({
    practice_name: '', subject: '', group_name: '', schedule: '', practice_date: ''
  });
  const [materials, setMaterials] = useState([emptyMaterial()]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState(null);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // ── Cargar solicitudes desde Supabase ──────────────────────────────────
  const loadRequests = async (admin = false) => {
    setLoadingList(true);
    try {
      let query = supabase
        .from('loan_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Si no es admin, filtrar solo las del usuario actual
      if (!admin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data);
    } catch (err) {
      showMsg('danger', err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'mis')   loadRequests(false);
    if (t === 'admin') loadRequests(true);
  };

  const updateField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updateMat   = (i, k, v) => setMaterials(p => p.map((m, j) => j === i ? { ...m, [k]: v } : m));
  const addMat      = () => setMaterials(p => [...p, emptyMaterial()]);
  const removeMat   = (i) => setMaterials(p => p.filter((_, j) => j !== i));

  // ── Enviar nueva solicitud a Supabase ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (materials.some(m => !m.material_name.trim())) {
      showMsg('warning', 'Todos los materiales deben tener nombre.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('loan_requests')
        .insert([{
          user_id: user.id,
          user_nombre_completo: user.nombre_completo,
          ...form,
          materials,  // se guarda como JSONB
          status: 'pendiente',
          request_date: new Date().toISOString().split('T')[0],
          request_time: new Date().toTimeString().split(' ')[0],
        }]);

      if (error) throw error;

      showMsg('success', '¡Solicitud enviada correctamente!');
      setForm({ practice_name: '', subject: '', group_name: '', schedule: '', practice_date: '' });
      setMaterials([emptyMaterial()]);
    } catch (err) {
      showMsg('danger', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Cambiar estado de una solicitud (admin) ────────────────────────────
  const handleStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('loan_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      showMsg('success', `Solicitud ${status}`);
      loadRequests(true);
      if (selected?.id === id) setSelected(p => ({ ...p, status }));
    } catch (err) {
      showMsg('danger', err.message);
    }
  };

  return (
    <div className="solicitud-page" style={{ marginTop: '80px' }}>
      {/* ── Encabezado ─────────────────────────────────────────────── */}
      <div className="solicitud-header">
        <div className="solicitud-header-icon">
          <FaClipboardList size={22} />
        </div>
        <div>
          <h1>Solicitud de Material</h1>
          <p>Laboratorio de Nanotecnología — {user?.nombre_completo}</p>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {msg && (
        <div className={`solicitud-toast alert alert-${msg.type}`}>
          {msg.text}
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="solicitud-tabs">
        <button className={tab === 'nueva' ? 'active' : ''} onClick={() => handleTabChange('nueva')}>
          Nueva Solicitud
        </button>
        <button className={tab === 'mis' ? 'active' : ''} onClick={() => handleTabChange('mis')}>
          Mis Solicitudes
        </button>
        {isAdmin && (
          <button className={tab === 'admin' ? 'active' : ''} onClick={() => handleTabChange('admin')}>
            Administrar
          </button>
        )}
      </div>

      {/* ════════════════ TAB: NUEVA SOLICITUD ════════════════════════ */}
      {tab === 'nueva' && (
        <form onSubmit={handleSubmit} className="solicitud-form">
          <div className="sol-card">
            <div className="sol-card-header">Datos de la Práctica</div>
            <div className="sol-card-body">
              <div className="sol-grid-2">
                <div className="sol-field sol-full">
                  <label>Nombre de la práctica</label>
                  <input value={form.practice_name} onChange={e => updateField('practice_name', e.target.value)} required placeholder="Ej: Determinación de pH" />
                </div>
                <div className="sol-field sol-full">
                  <label>Asignatura</label>
                  <input value={form.subject} onChange={e => updateField('subject', e.target.value)} required placeholder="Ej: Química Orgánica" />
                </div>
                <div className="sol-field">
                  <label>Grupo</label>
                  <input value={form.group_name} onChange={e => updateField('group_name', e.target.value)} required placeholder="Ej: LINT004" />
                </div>
                <div className="sol-field">
                  <label>Horario</label>
                  <input value={form.schedule} onChange={e => updateField('schedule', e.target.value)} required placeholder="Ej: 13:00-15:00" />
                </div>
                <div className="sol-field">
                  <label>Fecha de práctica</label>
                  <input type="date" value={form.practice_date} onChange={e => updateField('practice_date', e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          {/* Materiales */}
          <div className="sol-card">
            <div className="sol-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Materiales Solicitados</span>
              <button type="button" className="sol-btn-add" onClick={addMat}>
                <FaPlus size={12} /> Agregar
              </button>
            </div>
            <div className="sol-card-body">
              {materials.map((mat, idx) => (
                <div key={idx} className="sol-material-row">
                  <div className="sol-field" style={{ flex: '0 0 70px' }}>
                    <label>Cant.</label>
                    <input type="number" min={1} value={mat.cantidad} onChange={e => updateMat(idx, 'cantidad', parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="sol-field" style={{ flex: '0 0 80px' }}>
                    <label>Unidad</label>
                    <input value={mat.unidad} onChange={e => updateMat(idx, 'unidad', e.target.value)} placeholder="pza" />
                  </div>
                  <div className="sol-field" style={{ flex: 1 }}>
                    <label>Equipo / Material</label>
                    <input value={mat.material_name} onChange={e => updateMat(idx, 'material_name', e.target.value)} required placeholder="Ej: Tubos de ensayo" />
                  </div>
                  <div className="sol-field" style={{ flex: '0 0 160px' }}>
                    <label>Observaciones</label>
                    <input value={mat.observaciones} onChange={e => updateMat(idx, 'observaciones', e.target.value)} />
                  </div>
                  <div className="sol-field" style={{ flex: '0 0 36px', marginTop: '1.3rem' }}>
                    {materials.length > 1 && (
                      <button type="button" className="sol-btn-remove" onClick={() => removeMat(idx)}>
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sol-actions">
            <button type="submit" className="sol-btn-submit" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <FaPaperPlane size={13} />}
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      )}

      {/* ════════════════ TAB: MIS SOLICITUDES ═══════════════════════ */}
      {tab === 'mis' && (
        <div className="sol-list">
          {loadingList ? (
            <div className="sol-loading"><div className="spinner-border text-light" /></div>
          ) : requests.length === 0 ? (
            <div className="sol-empty">No tienes solicitudes registradas.</div>
          ) : requests.map(req => (
            <div key={req.id} className="sol-item">
              <div className="sol-item-main">
                <span className="sol-item-title">{req.practice_name}</span>
                <span className={`sol-badge ${STATUS[req.status]?.cls}`}>{STATUS[req.status]?.label}</span>
              </div>
              <div className="sol-item-meta">
                <span>{req.subject}</span>
                <span>Grupo: {req.group_name}</span>
                <span>Fecha: {req.practice_date}</span>
                <span>{Array.isArray(req.materials) ? req.materials.length : 0} material(es)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════ TAB: ADMIN ══════════════════════════════════ */}
      {tab === 'admin' && (
        <div className="sol-list">
          {loadingList ? (
            <div className="sol-loading"><div className="spinner-border text-light" /></div>
          ) : requests.length === 0 ? (
            <div className="sol-empty">No hay solicitudes.</div>
          ) : requests.map(req => (
            <div key={req.id} className="sol-item">
              <div className="sol-item-main">
                <span className="sol-item-title">{req.practice_name}</span>
                <span className={`sol-badge ${STATUS[req.status]?.cls}`}>{STATUS[req.status]?.label}</span>
              </div>
              <div className="sol-item-meta">
                <span>{req.user_nombre_completo}</span>
                <span>{req.subject}</span>
                <span>Grupo: {req.group_name}</span>
                <span>Fecha: {req.practice_date}</span>
              </div>
              <div className="sol-item-actions">
                <button className="sol-btn-eye" onClick={() => setSelected(req)}>Ver</button>
                {req.status === 'pendiente' && (
                  <>
                    <button className="sol-btn-approve" onClick={() => handleStatus(req.id, 'aprobado')}>Aprobar</button>
                    <button className="sol-btn-reject"  onClick={() => handleStatus(req.id, 'rechazado')}>Rechazar</button>
                  </>
                )}
                {req.status === 'aprobado' && (
                  <button className="sol-btn-pdf" onClick={() => generarPDF(req)}>
                    <FaFilePdf size={12} /> PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal detalle ─────────────────────────────────────────── */}
      {selected && (
        <div className="sol-modal-overlay" onClick={() => setSelected(null)}>
          <div className="sol-modal" onClick={e => e.stopPropagation()}>
            <div className="sol-modal-header">
              <span>Solicitud #{selected.id}</span>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="sol-modal-body">
              <div className="sol-detail-grid">
                {[
                  ['Solicitante',    selected.user_nombre_completo],
                  ['Práctica',       selected.practice_name],
                  ['Asignatura',     selected.subject],
                  ['Grupo',          selected.group_name],
                  ['Horario',        selected.schedule],
                  ['Fecha práctica', selected.practice_date],
                  ['Fecha solicitud',selected.request_date],
                  ['Estado', <span className={`sol-badge ${STATUS[selected.status]?.cls}`}>{STATUS[selected.status]?.label}</span>],
                ].map(([k, v]) => (
                  <div key={k} className="sol-detail-item">
                    <span className="sol-detail-label">{k}</span>
                    <span className="sol-detail-value">{v}</span>
                  </div>
                ))}
              </div>
              <table className="sol-table">
                <thead>
                  <tr><th>#</th><th>Cant.</th><th>Unidad</th><th>Material</th><th>Obs.</th></tr>
                </thead>
                <tbody>
                  {(selected.materials || []).map((m, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td><td>{m.cantidad}</td><td>{m.unidad}</td>
                      <td>{m.material_name}</td><td>{m.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sol-modal-actions">
                {selected.status === 'pendiente' && (
                  <>
                    <button className="sol-btn-approve" onClick={() => handleStatus(selected.id, 'aprobado')}>Aprobar</button>
                    <button className="sol-btn-reject"  onClick={() => handleStatus(selected.id, 'rechazado')}>Rechazar</button>
                  </>
                )}
                {selected.status === 'aprobado' && (
                  <button className="sol-btn-pdf" onClick={() => generarPDF(selected)}>
                    <FaFilePdf size={12} /> Descargar PDF
                  </button>
                )}
                <button className="sol-btn-eye" onClick={() => setSelected(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}