// src/pages/SolicitudMaterial.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient.js';
import { FaPlus, FaTrash, FaFilePdf, FaPaperPlane, FaClipboardList } from 'react-icons/fa';
import './SolicitudMaterial.css';

const emptyMaterial = () => ({ cantidad: 1, unidad: 'pza', material_id: '', material_name: '', tipo: '', observaciones: '' });

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
  doc.text('EA-F-13', W - M, 15, { align: 'right' });
  doc.text('Rev. 01', W - M, 19, { align: 'right' });
  doc.text('Fecha: 31-may-2021', W - M, 23, { align: 'right' });

  // Helper para imprimir label + valor
  const f = (label, value, lx, vx, yy) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(label, lx, yy);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || ''), vx, yy);
  };

  let y = 40;
  f('FOLIO:', `#${request.id}`, M, 35, y); y += 7;

  //  Fecha y hora en la misma línea —
  f('FECHA DE SOLICITUD:', String(request.request_date || ''), M, 58, y);
  f('HORA:', String(request.request_time || ''), 120, 133, y); y += 7;

  f('LABORATORIO:', 'Laboratorio de Nanotecnología', M, 45, y); y += 7;
  f('NOMBRE DE LA PRÁCTICA:', String(request.practice_name || ''), M, 72, y); y += 7;
  f('ASIGNATURA:', String(request.subject || ''), M, 42, y); y += 7;

  //  Grupo, Horario y Fecha práctica — c
  f('GRUPO:', String(request.group_name || ''), M, 30, y);
  f('HORARIO:', String(request.schedule || ''), 70, 88, y);
  f('FECHA PRÁCTICA:', String(request.practice_date || ''), 128, 158, y); y += 10;

  doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text('LLENAR DE ACUERDO AL TIPO DE USUARIO', W / 2, y, { align: 'center' }); y += 7;

  f('Docente:', 'Dr. Juan Enrique Serrano', M, 30, y); y += 7;
  f('Usuario:', String(request.user_nombre_completo || ''), M, 30, y); y += 5;

  // Limpiar el nombre del material (quitar " (Disp:X frascos/pzas)")
  const limpiarNombre = (nombre) => {
    return (nombre || '').replace(/\s*\(Disp:?.*?\)/gi, '').replace(/^\[(Reactivo|Material)\]\s*/i, '').trim();
  };

  const tableData = (request.materials || []).map((m, i) => [
    i + 1,
    m.cantidad,
    m.unidad,
    limpiarNombre(m.material_name),
    '', '',
    m.observaciones || '',
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
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 70 },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 40 },
    },
    margin: { left: M, right: M },
  });

  const sigY = doc.lastAutoTable.finalY + 20;
  doc.line(M, sigY + 2, M + 50, sigY + 2);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('Nombre', M + 25, sigY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Profesor Responsable', M + 25, sigY + 12, { align: 'center' });

  const rc = W - M - 25;
  doc.line(W - M - 50, sigY + 2, W - M, sigY + 2);
  doc.setFont('helvetica', 'bold');
  doc.text('Nombre', rc, sigY + 7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Laboratorista', rc, sigY + 12, { align: 'center' });

  doc.save(`vale_prestamo_${request.id}.pdf`);
};

// ── Status config ──────────────────────────────────────────────────────────
const STATUS = {
  pendiente: { label: 'Pendiente', cls: 'badge-pendiente' },
  aprobado: { label: 'Aprobado', cls: 'badge-aprobado' },
  rechazado: { label: 'Rechazado', cls: 'badge-rechazado' },
  finalizado: { label: 'Finalizado', cls: 'badge-finalizado' },
};

// ── Componente principal ───────────────────────────────────────────────────
export default function SolicitudMaterial() {
  const { user, isAdmin, perfil } = useAuth();

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
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [inventario, setInventario] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [devolucionOpen, setDevolucionOpen] = useState(false);
  const [devolucionForm, setDevolucionForm] = useState([]);
  const [nuevasIds, setNuevasIds] = useState([]);
  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // ── Cargar solicitudes ─────────────────────────────────────────────────
  const loadRequests = async (admin = false) => {
    setLoadingList(true);
    try {
      let query = supabase
        .from('loan_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!admin) query = query.eq('user_id', user.id);
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
    if (t === 'mis') loadRequests(false);
    if (t === 'admin') loadRequests(true);
  };

  const updateField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updateMat = (i, k, v) => setMaterials(p => p.map((m, j) => j === i ? { ...m, [k]: v } : m));
  const addMat = () => setMaterials(p => [...p, emptyMaterial()]);
  const removeMat = (i) => setMaterials(p => p.filter((_, j) => j !== i));

  // ── Enviar solicitud ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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
          user_nombre_completo: perfil?.nombre_completo || user?.email, // ✅ corregido
          ...form,
          materials,
          status: 'pendiente',
          request_date: new Date().toISOString().split('T')[0],
          request_time: new Date().toTimeString().split(' ')[0],
        }]);

      if (error) throw error;
      showMsg('success', '¡Solicitud enviada correctamente!');
      setForm({ practice_name: '', subject: '', group_name: '', schedule: '', practice_date: '' });
      setScheduleStart('');
      setScheduleEnd('');
      setMaterials([emptyMaterial()]);
    } catch (err) {
      showMsg('danger', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  // ── Cambiar estado ─────────────────────────────────────────────────────
  const handleStatus = async (id, status) => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3001/api/solicitudes/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMsg('success', `Estado actualizado: ${status}`);
      loadRequests(true);
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    } catch (err) {
      showMsg('danger', err.message);
    }
  };

  // ── Devolución ─────────────────────────────────────────────────────────
  const abrirModalDevolucion = (req) => {
    setSelected(req);
    const initialForm = (req.materials || []).map(m => ({
      material_id: m.material_id,
      material_name: m.material_name,
      tipo: m.tipo || 'material',
      frascos_devueltos: m.cantidad,
      cantidad_consumida: 0,
      piezas_devueltas: m.cantidad
    }));
    setDevolucionForm(initialForm);
    setDevolucionOpen(true);
  };

  const updateDevolucion = (idx, field, value) => {
    setDevolucionForm(p => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const submitDevolucion = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3001/api/solicitudes/${selected.id}/devolver`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ devoluciones: devolucionForm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMsg('success', 'Devolución registrada correctamente');
      setDevolucionOpen(false);
      setSelected(null);
      loadRequests(true);
    } catch (err) {
      showMsg('danger', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Cargar inventario ──────────────────────────────────────────────────
  useEffect(() => {
    const cargarInventario = async () => {
      const { data: reactivos, error: errorR } = await supabase
        .from('reactivos')
        .select('id, nombre, numero_frascos')
        .gt('numero_frascos', 0);

      const { data: materiales, error: errorM } = await supabase
        .from('Materiales')
        .select('id, nombre, cantidad')
        .gt('cantidad', 0);

      if (!errorR && !errorM) {
        const reactivosFormateados = (reactivos || []).map(r => ({
          id_unico: `R-${r.id}`,
          db_id: r.id,
          nombre: `[Reactivo] ${r.nombre} (Disp:${r.numero_frascos} frascos)`,
          tipo: 'reactivo'
        }));
        const materialesFormateados = (materiales || []).map(m => ({
          id_unico: `M-${m.id}`,
          db_id: m.id,
          nombre: `[Material] ${m.nombre} (Disp: ${m.cantidad} pzas)`,
          tipo: 'material'
        }));
        setInventario([...reactivosFormateados, ...materialesFormateados]);
      }
    };
    cargarInventario();
  }, []);
  // ── Realtime: solicitudes en vivo (tab admin) ──────────────────────────
  useEffect(() => {
    if (tab !== 'admin') return;

    const channel = supabase
      .channel('admin-solicitudes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'loan_requests' },
        (payload) => {
          console.log(' Nueva solicitud recibida:', payload.new);
          setRequests(prev => [payload.new, ...prev]);
          setNuevasIds(prev => [...prev, payload.new.id]);
          setTimeout(() => {
            setNuevasIds(prev => prev.filter(id => id !== payload.new.id));
          }, 3000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'loan_requests' },
        (payload) => {
          setRequests(prev =>
            prev.map(r => r.id === payload.new.id ? payload.new : r)
          );
          if (selected?.id === payload.new.id) {
            setSelected(payload.new);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tab]); //  se activa/limpia al cambiar de tab

  const filtrarSolicitudes = requests.filter(req => {
    if (!filtroFecha) return true;
    return req.practice_date === filtroFecha;
  });

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="solicitud-page" style={{ marginTop: '80px' }}>

      {/* Encabezado */}
      <div className="solicitud-header">
        <div className="solicitud-header-icon"><FaClipboardList size={22} /></div>
        <div>
          <h1>Solicitud de Material</h1>
          <p>Laboratorio de Nanotecnología — {perfil?.nombre_completo || user?.email}</p>
        </div>
      </div>

      {/* Toast */}
      {msg && <div className={`solicitud-toast alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Tabs */}
      <div className="solicitud-tabs">
        <button className={tab === 'nueva' ? 'active' : ''} onClick={() => handleTabChange('nueva')}>Nueva Solicitud</button>
        <button className={tab === 'mis' ? 'active' : ''} onClick={() => handleTabChange('mis')}>Mis Solicitudes</button>
        {isAdmin && (
          <button className={tab === 'admin' ? 'active' : ''} onClick={() => handleTabChange('admin')}>Administrar</button>
        )}
      </div>

      {/* Filtro fecha */}
      {(tab === 'mis' || tab === 'admin') && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', background: '#070757', padding: '1rem', borderRadius: '8px' }}>
          <div className="sol-field" style={{ flex: 1, margin: 0 }}>
            <label style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '0.4rem', display: 'block' }}>
              Filtrar por fecha de práctica
            </label>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #fff', background: '#fff', color: '#000' }} />
          </div>
          <button type="button" className="sol-btn-eye" onClick={() => setFiltroFecha('')}>Limpiar filtro</button>
        </div>
      )}

      {/* ══ TAB: NUEVA SOLICITUD ══ */}
      {tab === 'nueva' && (
        <form onSubmit={handleSubmit} className="solicitud-form" style={{ overflow: 'visible' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="time" value={scheduleStart} onChange={e => { setScheduleStart(e.target.value); updateField('schedule', `${e.target.value}-${scheduleEnd}`); }} required style={{ flex: 1 }} />
                    <span style={{ color: '#aaa', fontWeight: 600 }}>—</span>
                    <input type="time" value={scheduleEnd} onChange={e => { setScheduleEnd(e.target.value); updateField('schedule', `${scheduleStart}-${e.target.value}`); }} required style={{ flex: 1 }} />
                  </div>
                </div>
                <div className="sol-field">
                  <label>Fecha de práctica</label>
                  <input type="date" value={form.practice_date} onChange={e => updateField('practice_date', e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          {/* Materiales */}
          <div className="sol-card" style={{ overflow: 'visible' }}>
            <div className="sol-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Materiales Solicitados</span>
              <button type="button" className="sol-btn-add" onClick={addMat}><FaPlus size={12} /> Agregar</button>
            </div>
            <div className="sol-card-body" style={{ overflow: 'visible' }}>
              {materials.map((mat, idx) => (
                <div key={idx} className="sol-material-row" style={{ position: 'relative', zIndex: 100 - idx }}>
                  <div className="sol-field" style={{ flex: '0 0 70px' }}>
                    <label>Cant.</label>
                    <input type="number" min={1} value={mat.cantidad} onChange={e => updateMat(idx, 'cantidad', parseInt(e.target.value))} />
                  </div>
                  <div className="sol-field" style={{ flex: '0 0 80px' }}>
                    <label>Unidad</label>
                    <input value={mat.unidad} onChange={e => updateMat(idx, 'unidad', e.target.value)} placeholder="pza" />
                  </div>
                  <div className="sol-field" style={{ flex: 1, overflow: 'visible', minWidth: 0 }}>
                    <label>Equipo / Material</label>
                    <BuscadorInventario
                      inventario={inventario}
                      valorSeleccionado={mat.material_id ? `${mat.tipo === 'reactivo' ? 'R' : 'M'}-${mat.material_id}` : ''}
                      onSelect={(valorSeleccionado) => {
                        if (!valorSeleccionado) {
                          updateMat(idx, 'material_id', '');
                          updateMat(idx, 'material_name', '');
                          updateMat(idx, 'tipo', '');
                          return;
                        }
                        const selectedItem = inventario.find(i => i.id_unico === valorSeleccionado);
                        updateMat(idx, 'material_id', selectedItem.db_id);
                        updateMat(idx, 'material_name', selectedItem.nombre);
                        updateMat(idx, 'tipo', selectedItem.tipo);
                      }}
                    />
                  </div>
                  <div className="sol-field" style={{ flex: '0 0 160px' }}>
                    <label>Observaciones</label>
                    <input value={mat.observaciones} onChange={e => updateMat(idx, 'observaciones', e.target.value)} />
                  </div>
                  <div className="sol-field" style={{ flex: '0 0 36px', marginTop: '1.3rem' }}>
                    {materials.length > 1 && (
                      <button type="button" className="sol-btn-remove" onClick={() => removeMat(idx)}><FaTrash size={12} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sol-actions">
            <button type="button" className="sol-btn-submit" disabled={loading} onClick={() => setConfirmOpen(true)}>
              <FaPaperPlane size={13} /> Enviar Solicitud
            </button>
          </div>
        </form>
      )}

      {/* Modal confirmar envío */}
      {confirmOpen && (
        <div className="sol-modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="sol-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="sol-modal-header">
              <span>Confirmar envío</span>
              <button onClick={() => setConfirmOpen(false)}>✕</button>
            </div>
            <div className="sol-modal-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <FaPaperPlane size={28} style={{ color: 'var(--primary, #a78bfa)', marginBottom: '1rem' }} />
              <p style={{ marginBottom: '1.5rem' }}>
                ¿Enviar la solicitud para <strong>{form.practice_name}</strong>?
              </p>
              <div className="sol-modal-actions">
                <button className="sol-btn-approve" disabled={loading} onClick={() => { setConfirmOpen(false); handleSubmit(); }}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <FaPaperPlane size={12} />}
                  {loading ? 'Enviando...' : ' Confirmar'}
                </button>
                <button className="sol-btn-eye" onClick={() => setConfirmOpen(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: MIS SOLICITUDES ══ */}
      {tab === 'mis' && (
        <div className="sol-list">
          {loadingList ? (
            <div className="sol-loading"><div className="spinner-border text-light" /></div>
          ) : filtrarSolicitudes.length === 0 ? (
            <div className="sol-empty">No tienes solicitudes registradas.</div>
          ) : filtrarSolicitudes.map(req => (
            <div key={req.id} className={`sol-item ${nuevasIds.includes(req.id) ? 'sol-item-nueva' : ''}`}>
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

      {/* ══ TAB: ADMIN ══ */}
      {tab === 'admin' && (
        <div className="sol-list">
          {loadingList ? (
            <div className="sol-loading"><div className="spinner-border text-light" /></div>
          ) : filtrarSolicitudes.length === 0 ? (
            <div className="sol-empty">No hay solicitudes.</div>
          ) : filtrarSolicitudes.map(req => (
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
                    <button className="sol-btn-reject" onClick={() => handleStatus(req.id, 'rechazado')}>Rechazar</button>
                  </>
                )}
                {req.status === 'aprobado' && (
                  <>
                    <button className="sol-btn-approve" style={{ backgroundColor: '#060c53', color: '#fff', border: 'none' }} onClick={() => abrirModalDevolucion(req)}>
                      Registrar devolución
                    </button>
                    <button className="sol-btn-reject" onClick={() => handleStatus(req.id, 'rechazado')}>Cancelar préstamo</button>
                  </>
                )}
                {(req.status === 'aprobado' || req.status === 'finalizado') && (
                  <button className="sol-btn-pdf" onClick={() => generarPDF(req)}>
                    <FaFilePdf size={12} /> PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal detalle ──────────────────────────────────────────── */}
      {selected && !devolucionOpen && (
        <div className="sol-modal-overlay" onClick={() => setSelected(null)}>
          <div className="sol-modal" onClick={e => e.stopPropagation()}>
            <div className="sol-modal-header">
              <span>Solicitud #{selected.id}</span>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="sol-modal-body">
              {/*  Grid corregido */}
              <div className="sol-detail-grid">
                {[
                  ['Solicitante', selected.user_nombre_completo],
                  ['Práctica', selected.practice_name],
                  ['Asignatura', selected.subject],
                  ['Grupo', selected.group_name],
                  ['Horario', selected.schedule],
                  ['Fecha práctica', selected.practice_date],
                  ['Fecha solicitud', selected.request_date],
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
                      <td>{(m.material_name || '').replace(/\s*\(Disp:?.*?\)/gi, '').replace(/^\[(Reactivo|Material)\]\s*/i, '').trim()}</td><td>{m.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="sol-modal-actions">
                {selected.status === 'pendiente' && (
                  <>
                    <button className="sol-btn-approve" onClick={() => handleStatus(selected.id, 'aprobado')}>Aprobar</button>
                    <button className="sol-btn-reject" onClick={() => handleStatus(selected.id, 'rechazado')}>Rechazar</button>
                  </>
                )}
                {selected.status === 'aprobado' && (
                  <>
                    <button className="sol-btn-reject" onClick={() => handleStatus(selected.id, 'rechazado')}>Cambiar a Rechazado</button>
                    <button className="sol-btn-pdf" onClick={() => generarPDF(selected)}><FaFilePdf size={12} /> Descargar PDF</button>
                  </>
                )}
                {selected.status === 'rechazado' && (
                  <button className="sol-btn-approve" onClick={() => handleStatus(selected.id, 'aprobado')}>Cambiar a Aprobado</button>
                )}
                <button className="sol-btn-eye" onClick={() => setSelected(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal devolución ───────────────────────────────────────── */}
      {devolucionOpen && selected && (
        <div className="sol-modal-overlay" onClick={() => setDevolucionOpen(false)}>
          <div className="sol-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="sol-modal-header">
              <span>Registrar devolución — Solicitud #{selected.id}</span>
              <button onClick={() => setDevolucionOpen(false)}>✕</button>
            </div>
            <div className="sol-modal-body">
              <p style={{ marginBottom: '1rem', color: '#555' }}>
                Registra el consumo de reactivos y las piezas devueltas.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {devolucionForm.map((item, idx) => (
                  <div key={idx} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '6px', background: '#f8f9fa' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#333' }}>{item.material_name}</h4>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {item.tipo === 'reactivo' ? (
                        <>
                          <div className="sol-field" style={{ flex: 1, margin: 0 }}>
                            <label style={{ color: '#000' }}>Frascos devueltos:</label>
                            <input type="number" min="0" value={item.frascos_devueltos}
                              onChange={e => updateDevolucion(idx, 'frascos_devueltos', parseInt(e.target.value))}
                              style={{ border: '1px solid #ccc' }} />
                          </div>
                          <div className="sol-field" style={{ flex: 1, margin: 0 }}>
                            <label style={{ color: '#000' }}>Consumo total (g/ml):</label>
                            <input type="number" value={item.cantidad_consumida}
                              onChange={e => updateDevolucion(idx, 'cantidad_consumida', parseFloat(e.target.value))}
                              style={{ border: '1px solid #ccc' }} />
                          </div>
                        </>
                      ) : (
                        <div className="sol-field" style={{ flex: 1, margin: 0 }}>
                          <label style={{ color: '#000' }}>Piezas buenas devueltas:</label>
                          <input type="number" min="0" value={item.piezas_devueltas}
                            onChange={e => updateDevolucion(idx, 'piezas_devueltas', parseInt(e.target.value))}
                            style={{ border: '1px solid #ccc' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="sol-modal-actions" style={{ marginTop: '1.5rem' }}>
                <button className="sol-btn-approve" style={{ backgroundColor: '#220776', color: '#fff', border: 'none' }}
                  disabled={loading} onClick={submitDevolucion}>
                  {loading ? 'Procesando...' : 'Confirmar devolución'}
                </button>
                <button className="sol-btn-eye" onClick={() => setDevolucionOpen(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Buscador de inventario ─────────────────────────────────────────────────
const BuscadorInventario = ({ inventario, valorSeleccionado, onSelect }) => {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);
  const itemSeleccionado = inventario.find(i => i.id_unico === valorSeleccionado);

  const normalizarTexto = (texto) =>
    texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filtrados = inventario.filter(item =>
    normalizarTexto(item.nombre).includes(normalizarTexto(busqueda))
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div onClick={() => setAbierto(true)} style={{
        padding: '8px', border: '1px solid #ccc', borderRadius: '4px',
        background: '#fff', color: '#333', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '40px'
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {itemSeleccionado ? itemSeleccionado.nombre : 'Seleccionar o buscar material...'}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>▼</span>
      </div>

      {abierto && (
        <>
          <div onClick={() => setAbierto(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
            background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
            maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', marginTop: '4px'
          }}>
            <div style={{ padding: '8px', position: 'sticky', top: 0, background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
              <input type="text" autoFocus placeholder="Escribe para buscar..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', color: '#333' }} />
            </div>
            {filtrados.length === 0 ? (
              <div style={{ padding: '10px', color: '#888', textAlign: 'center' }}>No se encontraron resultados</div>
            ) : filtrados.map(item => (
              <div key={item.id_unico}
                onClick={() => { onSelect(item.id_unico); setAbierto(false); setBusqueda(''); }}
                style={{ padding: '10px 8px', cursor: 'pointer', color: '#333', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e9ecef'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {item.nombre}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};